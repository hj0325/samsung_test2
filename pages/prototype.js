import Head from "next/head";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import DotRunningCoach from "../components/cards/DotRunningCoach";
import CameraDotTransition from "../components/prototype/CameraDotTransition";

export default function PrototypePage() {
  const [mounted, setMounted] = useState(false);
  const [viewMode, setViewMode] = useState("normal"); // "normal" | "dot"
  const [activeDot, setActiveDot] = useState(null);
  const [prompt, setPrompt] = useState("");
  const [scenario, setScenario] = useState("home"); // "lock" | "home"
  const [scale, setScale] = useState(1);
  const rightRef = useRef(null);

  const LOCK_BG = "/assets/bg-new.png";
  const HOME_BG = "/assets/bg-new.png?v=2";
  const PHONE_OFFSET_Y = 36; // push device slightly downward
  const PHONE_W = 388;
  const PHONE_H = 880;
  const PHONE_RADIUS = 30;

  const handleTileClick = (title) => {
    if (title === "health") {
      goHealth();
      return;
    }
    if (title === "lock") {
      goLock();
      return;
    }
    if (title === "home") {
      goHome();
      return;
    }
    if (viewMode === "normal") {
      if (typeof window !== "undefined" && window.pipelineGenerate) {
        window.pipelineGenerate(title);
      }
    } else {
      setActiveDot(title);
    }
  };

  useEffect(() => {
    setMounted(true);
    if (typeof window === "undefined") return;

    const handleResize = () => {
      // Compute from the real container size (no hardcoded sidebars).
      const rect = rightRef.current ? rightRef.current.getBoundingClientRect() : null;
      const availableWidth = (rect ? rect.width : window.innerWidth) - 48; // breathing room
      const availableHeight = (rect ? rect.height : window.innerHeight) - 48 - PHONE_OFFSET_Y;
      
      const phoneHeight = PHONE_H; 
      const phoneWidth = PHONE_W;

      const scaleH = availableHeight / phoneHeight;
      const scaleW = availableWidth / phoneWidth;
      
      let newScale = Math.min(scaleH, scaleW);
      if (newScale > 1) newScale = 1;
      if (newScale < 0.1) newScale = 0.1; 
      
      setScale(newScale);
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    // Also react to layout shifts that don't fire window resize
    // (e.g. devtools, font load, flex changes).
    let ro = null;
    if (typeof ResizeObserver !== "undefined" && rightRef.current) {
      ro = new ResizeObserver(() => handleResize());
      ro.observe(rightRef.current);
    }

    // Ensure the phone has a base screen on load.
    let tries = 0;
    const t = setInterval(() => {
      tries++;
      if (typeof window.generateSurfaceScenario === "function") {
        window.generateSurfaceScenario("tab-root");
        clearInterval(t);
      }
      if (tries > 40) clearInterval(t);
    }, 80);
    return () => {
      clearInterval(t);
      window.removeEventListener("resize", handleResize);
      if (ro) {
        try { ro.disconnect(); } catch (e) {}
      }
    };
  }, []);

  const generateFromPrompt = () => {
    alert("현재 사용 불가한 기능입니다.");
    return;
  };

  const goLock = () => {
    setScenario("lock");
    if (typeof window !== "undefined" && typeof window.generateSurfaceScenario === "function") {
      window.generateSurfaceScenario("lockscreen");
    }
  };

  const goLockDot = () => {
    setScenario("lockscreen-persona2");
    if (typeof window !== "undefined" && typeof window.generateSurfaceScenario === "function") {
      window.generateSurfaceScenario("lockscreen-persona2");
    }
  };

  const goHome = () => {
    setScenario("home");
    if (typeof window !== "undefined" && typeof window.generateSurfaceScenario === "function") {
      window.generateSurfaceScenario("tab-root");
    }
  };

  const goHealth = () => {
    setScenario("health");
    if (typeof window !== "undefined" && typeof window.generateSurfaceScenario === "function") {
      window.generateSurfaceScenario("health-mlp");
    }
  };

  return (
    <>
      <Head>
        <title>GenUI - Samsung One UI 8.5 Design Builder</title>
        <style>{`
          body {
            background: #0b0b0e !important;
            overflow: hidden !important;
            margin: 0 !important;
          }
          .app-shell {
            padding: 0 !important;
            max-width: none !important;
            width: 100% !important;
            margin: 0 !important;
            position: relative !important;
            height: 100vh !important;
            background: #0b0b0e !important;
          }
          .page-nav {
            position: absolute !important;
            top: 24px !important;
            left: 0 !important;
            right: 0 !important;
            padding: 0 40px !important;
            display: flex !important;
            justify-content: space-between !important;
            align-items: center !important;
            z-index: 2000 !important;
            pointer-events: none !important;
          }
          .nav-btn {
            pointer-events: auto !important;
            background: rgba(255, 255, 255, 0.08) !important;
            border: 1px solid rgba(255, 255, 255, 0.15) !important;
            color: #fff !important;
            padding: 8px 24px !important;
            border-radius: 999px !important;
            font-size: 14px !important;
            font-weight: 500 !important;
            cursor: pointer !important;
            transition: all 0.2s ease !important;
            backdrop-filter: blur(10px) !important;
            text-decoration: none !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          .nav-btn:hover {
            background: rgba(255, 255, 255, 0.15) !important;
            transform: translateY(-2px) !important;
            border-color: rgba(255, 255, 255, 0.3) !important;
          }
          .mlp-workspace {
            display: flex !important;
            flex-direction: row !important;
            justify-content: center !important;
            align-items: center !important;
            padding: 0 !important;
            width: 100% !important;
            height: 100vh !important;
            box-sizing: border-box !important;
            overflow: hidden !important;
            background: #0b0b0e !important;
            position: relative !important;
          }
          .mlp-left {
            width: 140px !important;
            flex-shrink: 0 !important;
            display: flex !important;
            flex-direction: column !important;
            gap: 32px !important;
            align-items: center !important;
            justify-content: center !important;
            position: absolute !important;
            left: 80px !important;
            top: 0 !important;
            bottom: 0 !important;
            z-index: 10 !important;
          }
          .persona-circle {
            width: 100px !important;
            height: 100px !important;
            border-radius: 50% !important;
            overflow: hidden !important;
            border: 2px solid rgba(255,255,255,0.1) !important;
            box-shadow: 0 8px 20px rgba(0,0,0,0.4) !important;
            transition: all 0.3s ease !important;
            background: #1a1a1e !important;
          }
          .persona-circle:hover {
            transform: scale(1.1) !important;
            border-color: #64e9e3 !important;
          }
          .persona-circle:active {
            transform: scale(0.95) !important;
          }
          .persona-img {
            width: 100% !important;
            height: 100% !important;
            object-fit: cover !important;
            display: block !important;
          }
          .mlp-right {
            flex-grow: 1 !important;
            height: 100% !important;
            min-width: 0 !important;
            display: flex !important;
            justify-content: center !important;
            align-items: center !important;
            padding-right: 0 !important;
          }
          .canvas-wrap {
            width: calc(${PHONE_W}px * var(--scale, 1)) !important;
            height: calc(${PHONE_H}px * var(--scale, 1)) !important;
            flex-shrink: 0 !important;
            position: relative !important;
            transition: width 0.2s ease-out, height 0.2s ease-out !important;
            margin: 0 auto !important;
            transform: translateY(var(--offsetY, 0px)) !important;
          }
          .canvas-frame.mlp-phone {
            width: ${PHONE_W}px !important;
            height: ${PHONE_H}px !important;
            transform: scale(var(--scale, 1)) !important;
            transform-origin: top left !important;
            border-radius: ${PHONE_RADIUS}px !important;
            overflow: hidden !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            box-shadow: 0 30px 80px rgba(0,0,0,0.9) !important;
            background: #000 !important;
            transition: transform 0.2s ease-out !important;
          }
          .canvas-frame.mlp-phone .canvas-inner {
            border-radius: ${PHONE_RADIUS}px !important;
          }
          .canvas-inner {
            padding: 0 !important;
            width: 100% !important;
            height: 100% !important;
            position: absolute !important;
            top: 0 !important;
            left: 0 !important;
            overflow: hidden !important;
            zoom: 1 !important;
            transform: none !important;
          }
        `}</style>
      </Head>

      <main className="app-shell">
        <nav className="page-nav">
          <a href="/" className="nav-btn">← Back</a>
          <a href="/theme" className="nav-btn">Theme →</a>
        </nav>

        <div className="mlp-workspace">
          <aside className="mlp-left">
            <div className="persona-circle" onClick={goHome} style={{ cursor: 'pointer' }}>
              <img src="/assets/persona-1.png" alt="Persona 1" className="persona-img" />
            </div>
            <div className="persona-circle" onClick={goLockDot} style={{ cursor: 'pointer', border: scenario === 'lockscreen-persona2' ? '3px solid #fff' : 'none' }}>
              <img src="/assets/persona-2.png" alt="Persona 2" className="persona-img" />
            </div>
            <div className="persona-circle" onClick={goHealth} style={{ cursor: 'pointer' }}>
              <img src="/assets/persona-3.png" alt="Persona 3" className="persona-img" />
            </div>
          </aside>

          <section className="mlp-right" ref={rightRef}>
            {mounted && (viewMode === "normal" ? (
              <div className="canvas-wrap" id="canvasWrap" style={{ '--scale': scale, '--offsetY': `${PHONE_OFFSET_Y}px` }}>
                <div className="canvas-frame mlp-phone" id="canvasFrame">
                  <div
                    className="canvas-inner"
                    id="canvas"
                    style={{
                      backgroundColor: "transparent",
                      backgroundImage: `url(${HOME_BG})`,
                      backgroundSize: "cover",
                      backgroundPosition: "center",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "stretch",
                      justifyContent: "flex-start"
                    }}
                  >
                  </div>
                </div>
                <div id="pipelineOutput" style={{ display: "none" }}></div>
              </div>
            ) : (
              <div className="canvas-wrap" style={{ '--scale': scale, '--offsetY': `${PHONE_OFFSET_Y}px` }}>
                <div className="canvas-frame mlp-phone">
                  <div className="canvas-inner" style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "#5974B2", backgroundImage: `url(${HOME_BG})`, backgroundSize: "cover", overflow: "hidden" }}>
                    {activeDot === "dot-running" && <DotRunningCoach />}
                    {activeDot && activeDot !== "dot-running" && (
                      <div
                        id="dot-detail-preview"
                        style={{ zoom: 0.8 }}
                        dangerouslySetInnerHTML={{
                          __html:
                            typeof window !== "undefined" && typeof window.renderAtomicForRole === "function"
                              ? window.renderAtomicForRole({ role: activeDot }, { w: 310, h: 165 })
                              : "",
                        }}
                      />
                    )}
                    {!activeDot && <div style={{ color: "#999" }}>좌측에서 컴포넌트를 선택해주세요.</div>}
                  </div>
                </div>
              </div>
            ))}
          </section>
        </div>
      </main>

      {/* Load all required scripts for the prototype */}
      <Script src="https://cdn.jsdelivr.net/npm/html-to-image@1.11.13/dist/html-to-image.js" strategy="beforeInteractive" />
      <Script src="/ui-state.js" strategy="beforeInteractive" />
      <Script src="/figma-refs/icon_library.js" strategy="beforeInteractive" />
      <Script src="/typography-rules.js" strategy="beforeInteractive" />
      <Script src="/generator.js" strategy="beforeInteractive" />
      <Script src="/design_memory.js" strategy="beforeInteractive" />
      <Script src="/app/state.js?v=2" strategy="beforeInteractive" />
      <Script src="/app/agent.js?v=2" strategy="beforeInteractive" />
      <Script src="/app/templates.js?v=2" strategy="beforeInteractive" />
      <Script src="/app/atomics.js?v=4" strategy="beforeInteractive" />
      <Script src="/app/design-doc.js?v=2" strategy="beforeInteractive" />
      <Script src="/app/interaction-state.js?v=2" strategy="beforeInteractive" />
      <Script src="/app/surface-layout.js?v=runpanel-dot-level-33" strategy="beforeInteractive" />
      <Script src="/app/settings.js?v=2" strategy="beforeInteractive" />
      <Script src="/app/canvas.js?v=2" strategy="beforeInteractive" />
      <Script src="/app/rules-renderer.js?v=2" strategy="beforeInteractive" />
      <Script src="/app/scenes.js?v=2" strategy="beforeInteractive" />
      <Script src="/app/scene-inspector.js?v=2" strategy="beforeInteractive" />
      <Script src="/app/cached-screens.js?v=2" strategy="beforeInteractive" />
      <Script src="/app/ui-panels.js?v=2" strategy="beforeInteractive" />
      <Script src="/app/main.js?v=2" strategy="beforeInteractive" />
      <Script src="/prototype-logic.js?v=18" strategy="lazyOnload" />
    </>
  );
}
