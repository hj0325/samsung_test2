import Script from "next/script";
import Head from "next/head";
import CameraDotTransition from "../components/prototype/CameraDotTransition";

export default function ThemePage() {
  return (
    <>
      <Head>
        <style>{`
          :root { --page-bg: #D1D1D6; --pg-bg: #D1D1D6; }
          html, body { background: #D1D1D6 !important; overflow: hidden !important; height: 100% !important; }
        `}</style>
      </Head>
      <span id="active-pill" style={{ display: "none" }}></span>

      <div style={{ display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
        <div className="toolbar">
          <a href="/" className="toolbar-back" title="Go back to Home">
            ← Home
          </a>
          <label>Theme</label>
          <select id="theme-select" className="theme-select"></select>
          <div className="flat-scheme-toggle" id="flat-scheme-toggle" aria-label="Flat theme color scheme">
            <span className="scheme-label">Flat</span>
            <button type="button" className="flat-scheme-btn" data-flat-scheme="dark" aria-pressed="true">
              블랙 배경
            </button>
            <button type="button" className="flat-scheme-btn" data-flat-scheme="light" aria-pressed="false">
              화이트 배경
            </button>
          </div>
          <div className="preview-bg-swatches" id="preview-bg-swatches" aria-label="Preview background colors" style={{ display: 'none' }}>
            {/* Swatches disabled per user request */}
          </div>
          <span className="spacer"></span>
          <button type="button" id="btn-normal" className="secondary" title="Original preview data">
            normal
          </button>
          <button type="button" id="btn-dot" className="secondary" title="New input data">
            dot
          </button>
          <span id="unsaved-pill" style={{ display: "none", padding: "4px 10px", borderRadius: "999px", background: "rgba(245,166,35,0.18)", color: "#F5A623", fontSize: "11.5px", fontWeight: 600 }}>
            Unsaved changes
          </span>
        </div>

        <main className="theme-main" style={{ flex: 1, overflow: "hidden", padding: 0, maxWidth: "none", margin: 0 }}>
          <div className="layout-row" id="theme-layout-row" style={{ height: "100%" }}>
            {/* Left Column: Detail / Animation Test (Black Background) */}
            <div className="detail-col" id="detail-col">
              <div style={{ padding: "0 0 14px" }}>
                <CameraDotTransition
                  ensureCameraDot={async () => {
                    if (typeof document === "undefined") return;
                    // Ensure Dot dataset + Cards mode so the camera card exists in preview grid.
                    const btnDot = document.getElementById("btn-dot");
                    if (btnDot) btnDot.click();
                    const btnCards = document.querySelector('.preview-mode-btn[data-mode="cards"]');
                    if (btnCards) btnCards.click();
                    await new Promise((r) => setTimeout(r, 80));
                    const cam = document.querySelector("#preview-grid .dot-cam");
                    if (cam && cam.scrollIntoView) {
                      cam.scrollIntoView({ block: "center", inline: "center", behavior: "instant" });
                    }
                    await new Promise((r) => setTimeout(r, 50));
                  }}
                  targetSelector="#preview-grid .dot-cam"
                />
              </div>
              <div className="detail-view" id="detail-view">
                <div className="detail-stage-container">
                  <div className="detail-stage" id="detail-stage">
                    <div style={{ color: "var(--text-3)", fontSize: "14px" }}>Select a card to test animation</div>
                  </div>
                </div>
                <div className="detail-controls" id="detail-controls" style={{ display: "none" }}></div>
              </div>
            </div>

            {/* Right Column: Full Preview Grid (Mint Background) */}
            <div className="preview-col" id="preview-col">
              <h2 id="preview-mode-title" style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-3)", textTransform: "uppercase", letterSpacing: "0.5px", margin: "12px 0 16px" }}>
                Live preview · all themed cards
              </h2>

              <div className="preview-theme-scope" id="preview-theme-scope">
                <div className="preview-grid" id="preview-grid"></div>
                
                <div className="preview-screen-wrap" id="preview-screen-wrap" style={{ display: "none" }}>
                  <div className="preview-screen-grid" id="preview-screen-grid"></div>
                  <div className="preview-screen-hint">
                    6 scenarios · S26 aspect (19.5:9) · each phone mixes 1-col and 2-col groups so the same card type renders in both contexts. Uses your <code>--screen-padding-*</code>, <code>--gap-screen</code>, <code>--gap-cards</code>, <code>--screen-grid-columns</code> tokens.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      <div className="toast" id="toast">
        Saved · theme applied
      </div>

      <Script src="/typography-rules.js" strategy="beforeInteractive" />
      <Script src="/app/atomics.js" strategy="beforeInteractive" />
      <Script src="/app/surface-layout.js?v=runpanel-dot-level-1" strategy="beforeInteractive" />
      <Script src="/datasets/normalPreviewCards.js" strategy="beforeInteractive" />
      <Script src="/datasets/dotPreviewCards.js?v=runpanel-frames-3" strategy="beforeInteractive" />
      <Script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js" strategy="beforeInteractive" />
      <Script src="/theme-logic.js" strategy="lazyOnload" />
    </>
  );
}
