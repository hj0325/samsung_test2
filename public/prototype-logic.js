
  // Theme system ·boot apply + Generate-panel picker + cross-window
  // sync. The customize page (/customize) is the editor; this block
  // handles the active-theme apply + the small Generate-panel dropdown
  // that lets the user fast-switch presets without leaving the page.
  // BroadcastChannel keeps the two windows in sync ·saving a theme
  // on /customize broadcasts a 'theme-saved' message that this window
  // listens for to refresh its dropdown options.
  (function _themeBoot() {
    const STYLE_EL_ID = 'theme-vars';
    const SELECT_ID   = 'themePickerSelect';
    let CACHED_THEMES = null;

    function applyVarsToRoot(vars) {
      var raw = vars || {};
      // Document globals: surface renderer reads `--oneui-theme-style` /
      // chroma from :root (`getComputedStyle(document.documentElement)`).
      // Palette tokens (`--text-primary`, surfaces, QS chips, · live on the
      // device frames only so Neon black ink does not recolor sidebar/topbar.
      var DOC_KEYS = new Set(['--oneui-theme-style', '--oneui-chroma']);
      var rootLines = [];
      var frameLines = [];
      Object.keys(raw).forEach(function (key) {
        var v = raw[key];
        var line = '  ' + key + ': ' + v + ';';
        if (DOC_KEYS.has(key)) rootLines.push(line);
        else frameLines.push(line);
      });
      var css = '';
      if (rootLines.length) {
        css += ':root {\n' + rootLines.join('\n') + '\n}\n';
      }
      if (frameLines.length) {
        css += '#canvasFrame, #canvasFrameB {\n' + frameLines.join('\n') + '\n}\n';
      }
      const style = document.getElementById(STYLE_EL_ID);
      if (style) style.textContent = css;
    }

    function populatePicker(themes, activeId) {
      const sel = document.getElementById(SELECT_ID);
      if (!sel) return;
      const prev = sel.value;
      sel.innerHTML = themes.map(t =>
        '<option value="' + t.id + '"' + (t.id === activeId ? ' selected' : '') + '>' + t.name + '</option>'
      ).join('');
      // Restore prior selection if the active id changed but the
      // previously-selected theme is still in the list.
      if (prev && themes.find(t => t.id === prev)) sel.value = prev;
    }

    function loadAndApply(opts) {
      return fetch('/api/themes', { cache: 'no-store' })
        .then(r => r.json())
        .then(data => {
          if (!data || !data.themes) return;
          CACHED_THEMES = data.themes;
          const activeId = (opts && opts.forceId) || data._active;
          const active = data.themes.find(t => t.id === activeId) || data.themes[0];
          if (active && active.vars) applyVarsToRoot(active.vars);
          window.__activeTheme = active && active.id;
          // Wait one tick ·the picker element may not exist yet at
          // boot time (it's later in the DOM than this <head> script).
          setTimeout(function () {
            populatePicker(data.themes, active && active.id);
            if (typeof window.refreshCanvasForTheme === 'function') {
              window.refreshCanvasForTheme();
            }
          }, 0);
        })
        .catch(() => {});
    }

    // Called by the dropdown's onchange. Applies vars locally + POSTs
    // active id so the change persists across reloads.
    window.applyThemeFromPicker = function applyThemeFromPicker(id) {
      if (!id || !CACHED_THEMES) return;
      const theme = CACHED_THEMES.find(t => t.id === id);
      if (!theme) return;
      applyVarsToRoot(theme.vars || {});
      window.__activeTheme = id;
      fetch('/api/themes/active', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      }).catch(() => {});
      requestAnimationFrame(function () {
        if (typeof window.refreshCanvasForTheme === 'function') {
          window.refreshCanvasForTheme();
        }
      });
    };

    // Cross-window sync ·listens for 'theme-saved' broadcasts from
    // the /customize editor (which posts whenever a theme is created
    // or the active theme changes). On receive, we re-fetch the list
    // and update the dropdown so newly-saved custom themes show up
    // immediately without a manual refresh.
    if (typeof BroadcastChannel === 'function') {
      const ch = new BroadcastChannel('oneui-themes');
      ch.addEventListener('message', (ev) => {
        if (!ev || !ev.data) return;
        if (ev.data.type === 'theme-saved' || ev.data.type === 'theme-active-changed') {
          loadAndApply({ forceId: ev.data.activeId });
        }
      });
      window.__themeChannel = ch;
    }

    loadAndApply();
  })();

  // Mock pipelineGenerate for prototype page
  window.pipelineGenerate = function(title) {
    console.log('Mock pipelineGenerate called with:', title);
    if (typeof window.generateSurfaceScenario === 'function') {
      let surfaceType = 'first-depth-list'; // default
      
      const titleLower = title.toLowerCase();
      if (titleLower.includes('lock')) surfaceType = 'lockscreen';
      else if (titleLower.includes('quick')) surfaceType = 'quick-settings';
      else if (titleLower.includes('notif')) surfaceType = 'notification-shade';
      else if (titleLower.includes('list')) surfaceType = 'first-depth-list';
      else if (titleLower.includes('detail')) surfaceType = 'second-depth-detail';
      else if (titleLower.includes('tab')) surfaceType = 'tab-root';
      else if (titleLower.includes('dialog') && titleLower.includes('bottom')) surfaceType = 'dialog-bottom';
      else if (titleLower.includes('dialog')) surfaceType = 'dialog-center';
      
      window.generateSurfaceScenario(surfaceType);
    } else {
      console.warn('generateSurfaceScenario not found');
    }
  };

  // -------------------------------------------------------------------------
  // Persona 1 interaction: tap Music → expand to the right, temporarily
  // hide the right widgets (steps/jogging) with a press-like collapse.
  // -------------------------------------------------------------------------
  (function _persona1MusicExpand() {
    function onReady(fn) {
      if (document.readyState === 'complete' || document.readyState === 'interactive') fn();
      else document.addEventListener('DOMContentLoaded', fn, { once: true });
    }

    onReady(function () {
      var canvas = document.getElementById('canvas');
      if (!canvas) return;

      var isAnimating = false;

      function toggle() {
        if (isAnimating) return;
        isAnimating = true;
        canvas.classList.toggle('p1-music-expanded');
        // release lock after transition window
        setTimeout(function () { isAnimating = false; }, 520);
      }

      // Delegated: the surface items exist after generateSurfaceScenario()
      document.addEventListener('click', function (e) {
        var t = e.target;
        if (!t) return;
        var el = t.closest && t.closest('#p1-music');
        if (!el) return;
        toggle();
      }, true);
    });
  })();

  // -------------------------------------------------------------------------
  // Persona 2 interaction: tap left STAR → start voice input →
  // update the dark result card text (Image2 style).
  // Uses Web Speech API when available; falls back to prompt() for dev.
  // -------------------------------------------------------------------------
  (function _persona2VoiceStar() {
    function onReady(fn) {
      if (document.readyState === 'complete' || document.readyState === 'interactive') fn();
      else document.addEventListener('DOMContentLoaded', fn, { once: true });
    }

    // Server resolver: sends the user's request and returns theme + component
    // selection. Falls back to a local default on failure.
    async function resolveFromApi(text) {
      try {
        var res = await fetch('/api/p2/resolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: text })
        });
        if (!res.ok) throw new Error('bad status');
        return await res.json();
      } catch (e) {
        return {
          themeKey: 'lavender',
          component: {
            role: 'dot-schedule-2x2',
            variant: {
              date: 'Today',
              items: [
                { text: '준비된 일정이 없습니다', tone: 'muted' },
                { text: '새로운 하루를 시작해보세요', tone: 'accent' }
              ],
            }
          }
        };
      }
    }

    function applyTheme(themeKey) {
      var root = document.documentElement;
      if (!root) return;
      var THEMES = {
        lavender: { lav: '#B9A6FF', soft: '#E7E0FF', black: 'rgba(16,16,18,0.90)' },
        purple:   { lav: '#A78BFA', soft: '#E9D5FF', black: 'rgba(16,16,18,0.90)' },
        blue:     { lav: '#7AA7FF', soft: '#D6E4FF', black: 'rgba(16,16,18,0.90)' },
        mint:     { lav: '#5CE1D6', soft: '#CFF7F2', black: 'rgba(16,16,18,0.90)' },
        amber:    { lav: '#FFB01C', soft: '#FFE7B0', black: 'rgba(16,16,18,0.90)' }
      };
      var t = THEMES[themeKey] || THEMES.lavender;
      root.style.setProperty('--p2-lavender', t.lav);
      root.style.setProperty('--p2-lavender-soft', t.soft);
      root.style.setProperty('--p2-black', t.black);
    }

    function applyBackgroundMood(canvas, key) {
      if (!canvas) return;
      var cls = ['p2-bg-clear','p2-bg-cloudy','p2-bg-rain','p2-bg-snow','p2-bg-night'];
      cls.forEach(function (c) { canvas.classList.remove(c); });
      if (!key) return;
      var map = {
        clear: 'p2-bg-clear',
        cloudy: 'p2-bg-cloudy',
        rain: 'p2-bg-rain',
        snow: 'p2-bg-snow',
        night: 'p2-bg-night'
      };
      var c = map[key];
      if (c) canvas.classList.add(c);
    }

    function mountResolvedComponent(component, attempt) {
      var slot = document.getElementById('p2-slot');
      var result = document.getElementById('p2-result');
      if (!slot || !result) return;

      // If atomics haven't loaded yet (first render race), retry briefly.
      attempt = attempt || 0;
      if (typeof window.renderAtomicForRole !== 'function') {
        if (attempt < 30) {
          setTimeout(function () { mountResolvedComponent(component, attempt + 1); }, 50);
        }
        return;
      }

      var role = component && component.role;
      var variant = (component && component.variant) || {};
      // Black card slot is 100% size. We render at the canonical sizes for the
      // chosen role, then CSS scales/centers it inside the slot.
      var sizeMap = {
        'dot-schedule-2x2': { w: 168, h: 168 },
        'dot-weather-2x1-v1-1': { w: 168, h: 82 },
        'dot-gallery-frame1': { w: 168, h: 168 },
        'dot-gallery-frame3': { w: 162, h: 218 },
        'dot-gallery-img': { w: 168, h: 168 }
      };
      var sz = sizeMap[role] || { w: 340, h: 168 };
      var html = '';
      try {
        html = window.renderAtomicForRole({ role: role, variant: variant }, { w: sz.w, h: sz.h }) || '';
      } catch (e) {
        html = '';
      }

      if (html) {
        // Entry animation: start from scaled down + transparent
        slot.style.transition = 'none';
        slot.style.opacity = '0';
        slot.style.transform = 'scale(0.8) translateY(20px)';
        
        slot.innerHTML = html;
        
        // Trigger reflow
        void slot.offsetWidth;
        
        // Final state
        slot.style.transition = 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)';
        slot.style.opacity = '1';
        slot.style.transform = 'scale(1) translateY(0)';
        
        result.classList.add('has-swap');
      } else {
        slot.innerHTML = '';
        slot.style.opacity = '0';
        result.classList.remove('has-swap');
      }
    }

    async function setResultFromUtterance(utt) {
      var el = document.getElementById('p2-result');
      if (!el) return;
      var slot = document.getElementById('p2-slot');
      var canvas = document.getElementById('canvas');
      var userText = String(utt || '').trim();
      if (!userText) return;

      // Reset visual state so we never end up with an empty black card.
      el.classList.remove('has-swap');
      if (slot) { 
        slot.style.transition = 'opacity 0.3s ease';
        slot.style.opacity = '0';
        setTimeout(function(){ slot.innerHTML = ''; }, 300);
      }

      // optimistic UI: show "thinking" state
      var titleWrap = el.querySelector('.p2-result-title');
      var subWrap = el.querySelector('.p2-result-sub');
      if (titleWrap) titleWrap.innerHTML = '상황에 맞는 UI를<br>구성하는 중…';
      if (subWrap) subWrap.textContent = '“' + userText.slice(0, 20) + '”';
      el.classList.add('is-loading');

      try {
        var resolved = await resolveFromApi(userText);
        
        // Brief pause for dramatic "UI Reconstruction" effect
        await new Promise(resolve => setTimeout(resolve, 800));

        applyTheme(resolved && resolved.themeKey);
        // Weather-like requests can also shift the wallpaper mood.
        applyBackgroundMood(canvas, resolved && resolved.backgroundKey);
        
        if (resolved && resolved.component) {
          // Update text label (secondary) to reflect the request summary,
          // but the primary UI should be the swapped component.
          if (titleWrap) titleWrap.innerHTML = '최적의 화면을<br>찾았어요';
          if (subWrap) subWrap.textContent = '생성된 컴포넌트로 전환합니다';
          
          mountResolvedComponent(resolved.component);
        }
      } catch (e) {
        console.error('setResultFromUtterance failed:', e);
      } finally {
        setTimeout(function() {
          el.classList.remove('is-loading');
        }, 1200);
      }
    }

    onReady(function () {
      var canvas = document.getElementById('canvas');
      if (!canvas) return;

      var Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      var rec = null;
      var listening = false;

      function stopListening() {
        listening = false;
        canvas.classList.remove('p2-listening');
        try { rec && rec.stop && rec.stop(); } catch (e) {}
      }

      function startListening() {
        if (listening) return;
        listening = true;
        canvas.classList.add('p2-listening');

        if (Recognition) {
          try {
            rec = new Recognition();
            rec.lang = 'ko-KR';
            rec.interimResults = true;
            rec.maxAlternatives = 1;
            rec.continuous = false;

            var finalText = '';

            rec.onresult = function (ev) {
              var txt = '';
              for (var i = ev.resultIndex; i < ev.results.length; i++) {
                var r = ev.results[i];
                if (r && r[0] && r[0].transcript) txt += r[0].transcript;
                if (r.isFinal) finalText = txt;
              }
            };

            rec.onerror = function () {
              stopListening();
              // fallback: prompt for demo on blocked mic permission
              var p = window.prompt('음성 대신 텍스트로 입력해 주세요');
              setResultFromUtterance(p);
            };

            rec.onend = function () {
              // If end happens without any final result, prompt fallback.
              var utt = finalText;
              stopListening();
              if (!utt) {
                utt = window.prompt('말씀하실 내용을 입력해 주세요');
              }
              setResultFromUtterance(utt);
            };

            rec.start();
          } catch (e) {
            stopListening();
            var p2 = window.prompt('음성 대신 텍스트로 입력해 주세요');
            setResultFromUtterance(p2);
          }
        } else {
          // No SpeechRecognition (or unsupported browser) — demo via prompt.
          var p3 = window.prompt('음성 인식 미지원: 텍스트로 입력해 주세요');
          stopListening();
          setResultFromUtterance(p3);
        }
      }

      // Delegated: these nodes mount after generateSurfaceScenario()
      document.addEventListener('click', function (e) {
        var t = e.target;
        if (!t) return;
        var star = t.closest && t.closest('#p2-star');
        var arrow = t.closest && t.closest('#p2-arrow');
        if (!star && !arrow) return;
        startListening();
      }, true);

      // ESC to cancel listening quickly
      document.addEventListener('keydown', function (e) {
        if (e && e.key === 'Escape') stopListening();
      }, true);
    });
  })();

  // -------------------------------------------------------------------------
  // Persona 1: live-ish micro updates until reload
  //  1) Total steps slowly increases
  //  2) Music progress bar advances like playing
  //  3) Time-matrix occasionally swaps to an orange running-dot motion
  //  4) Jogging time increases
  // Scope: prototype-only DOM updates (no data persistence).
  // -------------------------------------------------------------------------
  (function _persona1LiveTicks() {
    function onReady(fn) {
      if (document.readyState === 'complete' || document.readyState === 'interactive') fn();
      else document.addEventListener('DOMContentLoaded', fn, { once: true });
    }

    function qs(sel, root) { return (root || document).querySelector(sel); }
    function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }

    function parseIntLoose(s) {
      var n = parseInt(String(s || '').replace(/[^\d]/g, ''), 10);
      return isNaN(n) ? 0 : n;
    }
    function formatComma(n) {
      try { return Number(n).toLocaleString('en-US'); } catch (e) { return String(n); }
    }
    function parseTimeToSec(str) {
      var s = String(str || '').trim();
      var neg = false;
      if (s[0] === '-') { neg = true; s = s.slice(1); }
      var parts = s.split(':').map(function (p) { return parseInt(p, 10); });
      if (!parts.length || parts.some(function (x) { return isNaN(x); })) return null;
      var sec = 0;
      if (parts.length === 2) sec = parts[0] * 60 + parts[1];
      else if (parts.length === 3) sec = parts[0] * 3600 + parts[1] * 60 + parts[2];
      else return null;
      return neg ? -sec : sec;
    }
    function formatSecToMSS(sec) {
      sec = Math.max(0, Math.floor(sec));
      var m = Math.floor(sec / 60);
      var s = sec % 60;
      return m + ':' + (s < 10 ? '0' + s : String(s));
    }

    function ensureRunOverlay(timematEl) {
      if (!timematEl) return null;
      var existing = qs('.p1-timemat-run-overlay', timematEl);
      if (existing) return existing;

      // Build a lightweight runner+trail overlay. Uses existing .dot-run2-frame
      // keyframes from theme-page.css.
      var overlay = document.createElement('div');
      overlay.className = 'p1-timemat-run-overlay';
      overlay.setAttribute('aria-hidden', 'true');
      overlay.innerHTML =
        '<div class="p1-timemat-run-row">' +
          '<svg class="p1-runner" width="28" height="36" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg">' +
            '<g class="dot-run2-frame dot-run2-frame--a">' +
              '<circle cx="14" cy="4" r="1.8" fill="#FF7F24"/><circle cx="17" cy="4" r="1.8" fill="#FF7F24"/><circle cx="14" cy="7" r="1.8" fill="#FF7F24"/><circle cx="17" cy="7" r="1.8" fill="#FF7F24"/>' +
              '<circle cx="11" cy="10" r="1.8" fill="#FF7F24"/><circle cx="14" cy="10" r="1.8" fill="#FF7F24"/><circle cx="11" cy="13" r="1.8" fill="#FF7F24"/><circle cx="14" cy="13" r="1.8" fill="#FF7F24"/>' +
              '<circle cx="11" cy="16" r="1.8" fill="#FF7F24"/><circle cx="14" cy="16" r="1.8" fill="#FF7F24"/><circle cx="11" cy="19" r="1.8" fill="#FF7F24"/><circle cx="14" cy="19" r="1.8" fill="#FF7F24"/>' +
              '<circle cx="17" cy="10" r="1.8" fill="#FF7F24"/><circle cx="20" cy="13" r="1.8" fill="#FF7F24"/><circle cx="23" cy="13" r="1.8" fill="#FF7F24"/>' +
              '<circle cx="8" cy="10" r="1.8" fill="#FF7F24"/><circle cx="5" cy="13" r="1.8" fill="#FF7F24"/>' +
              '<circle cx="11" cy="22" r="1.8" fill="#FF7F24"/><circle cx="8" cy="25" r="1.8" fill="#FF7F24"/><circle cx="5" cy="25" r="1.8" fill="#FF7F24"/>' +
              '<circle cx="14" cy="22" r="1.8" fill="#FF7F24"/><circle cx="17" cy="25" r="1.8" fill="#FF7F24"/><circle cx="20" cy="28" r="1.8" fill="#FF7F24"/>' +
            '</g>' +
            '<g class="dot-run2-frame dot-run2-frame--b">' +
              '<circle cx="14" cy="4" r="1.8" fill="#FF7F24"/><circle cx="17" cy="4" r="1.8" fill="#FF7F24"/><circle cx="14" cy="7" r="1.8" fill="#FF7F24"/><circle cx="17" cy="7" r="1.8" fill="#FF7F24"/>' +
              '<circle cx="11" cy="10" r="1.8" fill="#FF7F24"/><circle cx="14" cy="10" r="1.8" fill="#FF7F24"/><circle cx="11" cy="13" r="1.8" fill="#FF7F24"/><circle cx="14" cy="13" r="1.8" fill="#FF7F24"/>' +
              '<circle cx="11" cy="16" r="1.8" fill="#FF7F24"/><circle cx="14" cy="16" r="1.8" fill="#FF7F24"/><circle cx="11" cy="19" r="1.8" fill="#FF7F24"/><circle cx="14" cy="19" r="1.8" fill="#FF7F24"/>' +
              '<circle cx="17" cy="10" r="1.8" fill="#FF7F24"/><circle cx="19" cy="12" r="1.8" fill="#FF7F24"/><circle cx="21" cy="12" r="1.8" fill="#FF7F24"/>' +
              '<circle cx="8" cy="10" r="1.8" fill="#FF7F24"/><circle cx="10" cy="12" r="1.8" fill="#FF7F24"/><circle cx="12" cy="12" r="1.8" fill="#FF7F24"/>' +
              '<circle cx="11" cy="22" r="1.8" fill="#FF7F24"/><circle cx="14" cy="25" r="1.8" fill="#FF7F24"/><circle cx="17" cy="28" r="1.8" fill="#FF7F24"/>' +
              '<circle cx="14" cy="22" r="1.8" fill="#FF7F24"/><circle cx="16" cy="24" r="1.8" fill="#FF7F24"/><circle cx="18" cy="26" r="1.8" fill="#FF7F24"/>' +
            '</g>' +
            '<g class="dot-run2-frame dot-run2-frame--c">' +
              '<circle cx="14" cy="4" r="1.8" fill="#FF7F24"/><circle cx="17" cy="4" r="1.8" fill="#FF7F24"/><circle cx="14" cy="7" r="1.8" fill="#FF7F24"/><circle cx="17" cy="7" r="1.8" fill="#FF7F24"/>' +
              '<circle cx="11" cy="10" r="1.8" fill="#FF7F24"/><circle cx="14" cy="10" r="1.8" fill="#FF7F24"/><circle cx="11" cy="13" r="1.8" fill="#FF7F24"/><circle cx="14" cy="13" r="1.8" fill="#FF7F24"/>' +
              '<circle cx="11" cy="16" r="1.8" fill="#FF7F24"/><circle cx="14" cy="16" r="1.8" fill="#FF7F24"/><circle cx="11" cy="19" r="1.8" fill="#FF7F24"/><circle cx="14" cy="19" r="1.8" fill="#FF7F24"/>' +
              '<circle cx="17" cy="10" r="1.8" fill="#FF7F24"/><circle cx="20" cy="12" r="1.8" fill="#FF7F24"/><circle cx="22" cy="12" r="1.8" fill="#FF7F24"/>' +
              '<circle cx="8" cy="10" r="1.8" fill="#FF7F24"/><circle cx="6" cy="12" r="1.8" fill="#FF7F24"/><circle cx="4" cy="12" r="1.8" fill="#FF7F24"/>' +
              '<circle cx="11" cy="22" r="1.8" fill="#FF7F24"/><circle cx="13" cy="25" r="1.8" fill="#FF7F24"/><circle cx="15" cy="28" r="1.8" fill="#FF7F24"/>' +
              '<circle cx="14" cy="22" r="1.8" fill="#FF7F24"/><circle cx="12" cy="25" r="1.8" fill="#FF7F24"/><circle cx="10" cy="28" r="1.8" fill="#FF7F24"/>' +
            '</g>' +
            '<g class="dot-run2-frame dot-run2-frame--d">' +
              '<circle cx="14" cy="4" r="1.8" fill="#FF7F24"/><circle cx="17" cy="4" r="1.8" fill="#FF7F24"/><circle cx="14" cy="7" r="1.8" fill="#FF7F24"/><circle cx="17" cy="7" r="1.8" fill="#FF7F24"/>' +
              '<circle cx="11" cy="10" r="1.8" fill="#FF7F24"/><circle cx="14" cy="10" r="1.8" fill="#FF7F24"/><circle cx="11" cy="13" r="1.8" fill="#FF7F24"/><circle cx="14" cy="13" r="1.8" fill="#FF7F24"/>' +
              '<circle cx="11" cy="16" r="1.8" fill="#FF7F24"/><circle cx="14" cy="16" r="1.8" fill="#FF7F24"/><circle cx="11" cy="19" r="1.8" fill="#FF7F24"/><circle cx="14" cy="19" r="1.8" fill="#FF7F24"/>' +
              '<circle cx="17" cy="10" r="1.8" fill="#FF7F24"/><circle cx="20" cy="13" r="1.8" fill="#FF7F24"/><circle cx="23" cy="13" r="1.8" fill="#FF7F24"/>' +
              '<circle cx="8" cy="10" r="1.8" fill="#FF7F24"/><circle cx="7" cy="12" r="1.8" fill="#FF7F24"/><circle cx="6" cy="14" r="1.8" fill="#FF7F24"/>' +
              '<circle cx="11" cy="22" r="1.8" fill="#FF7F24"/><circle cx="9" cy="25" r="1.8" fill="#FF7F24"/><circle cx="7" cy="27" r="1.8" fill="#FF7F24"/>' +
              '<circle cx="14" cy="22" r="1.8" fill="#FF7F24"/><circle cx="17" cy="25" r="1.8" fill="#FF7F24"/><circle cx="20" cy="28" r="1.8" fill="#FF7F24"/>' +
            '</g>' +
          '</svg>' +
          '<div class="p1-runtrail" aria-hidden="true">' +
            '<span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span>' +
          '</div>' +
        '</div>';

      timematEl.appendChild(overlay);
      return overlay;
    }

    function ensureWeatherOverlay(timematEl) {
      if (!timematEl) return null;
      var existing = qs('.p1-timemat-weather-overlay', timematEl);
      if (existing) return existing;
      var overlay = document.createElement('div');
      overlay.className = 'p1-timemat-weather-overlay';
      overlay.setAttribute('aria-hidden', 'true');
      // Weather card (existing atomic) — sized as 2x1 pill for readability.
      overlay.innerHTML =
        (window.renderAtomicForRole
          ? window.renderAtomicForRole(
              { role: 'dot-weather-2x1-v1-1', variant: { location: 'Seoul', weather: 'Sunny', theme: 'light' } },
              { w: 168, h: 82 }
            )
          : '');
      timematEl.appendChild(overlay);
      return overlay;
    }

    function sparkSomeDots(timematEl) {
      if (!timematEl) return;
      var svg = qs('svg', timematEl);
      if (!svg) return;
      var dots = qsa('.dot-timemat__dot', svg);
      if (!dots.length) return;
      // Pick a small handful per burst.
      var count = 8;
      for (var i = 0; i < count; i++) {
        var d = dots[Math.floor(Math.random() * dots.length)];
        if (!d) continue;
        d.classList.remove('p1-spark-dot');
        // restart animation
        // eslint-disable-next-line no-unused-expressions
        d.offsetWidth;
        d.classList.add('p1-spark-dot');
        (function (el) {
          setTimeout(function () { try { el.classList.remove('p1-spark-dot'); } catch (e) {} }, 620);
        })(d);
      }
    }

    onReady(function () {
      var canvas = document.getElementById('canvas');
      if (!canvas) return;

      var running = false;
      var timers = { steps: null, jog: null, music: null, runFlip: null, runFlipDelay: null, modeLoop: null, retry: null };

      function clearTimers() {
        Object.keys(timers).forEach(function (k) {
          if (timers[k]) { clearInterval(timers[k]); clearTimeout(timers[k]); }
          timers[k] = null;
        });
      }

      function startIfReady() {
        var stepsWrap = document.getElementById('p1-steps');
        var jogWrap   = document.getElementById('p1-run');
        var musicWrap = document.getElementById('p1-music');
        var timeWrap  = document.getElementById('p1-timemat');

        if (!stepsWrap || !jogWrap || !musicWrap || !timeWrap) return false;
        if (running) return true;

        running = true;

        // 1) Total steps
        var stepsEl = qs('.dot-steps21__count', stepsWrap) || qs('.dot-steps21__count', document);
        var steps = parseIntLoose(stepsEl && stepsEl.textContent);
        timers.steps = setInterval(function () {
          // small random walk upward
          steps += 1 + Math.floor(Math.random() * 3);
          if (stepsEl) stepsEl.textContent = formatComma(steps);
        }, 1100);

        // 4) Jogging time
        var jogTimeEl = qs('.dot-running2__time', jogWrap);
        var jogSec = parseTimeToSec(jogTimeEl && jogTimeEl.textContent);
        if (jogSec == null) jogSec = 10 * 60 + 35;
        timers.jog = setInterval(function () {
          jogSec += 1;
          if (jogTimeEl) jogTimeEl.textContent = formatSecToMSS(jogSec);
        }, 1000);

        // 2) Music progress
        var bar = qs('.dot-music__bar', musicWrap);
        var curEl = qs('.dot-music__time--current', musicWrap);
        var remEl = qs('.dot-music__time--remaining', musicWrap);
        var curSec = parseTimeToSec(curEl && curEl.textContent);
        var remSec = parseTimeToSec(remEl && remEl.textContent);
        if (curSec == null) curSec = 40;
        if (remSec == null) remSec = -70;
        var dur = Math.max(20, curSec + Math.abs(remSec));
        var barW = 120;
        try {
          var cs = window.getComputedStyle(bar);
          var bw = cs && cs.getPropertyValue('--bar-w');
          if (bw) barW = parseFloat(String(bw).replace('px','')) || barW;
        } catch (e) {}
        var tickMs = 500;
        timers.music = setInterval(function () {
          curSec += tickMs / 1000;
          if (curSec > dur) curSec = 0;
          var progress = Math.max(0, Math.min(1, curSec / dur));
          var px = Math.max(0, Math.min(barW, progress * barW));
          if (bar) bar.style.setProperty('--bar-track', px.toFixed(2) + 'px');
          if (curEl) curEl.textContent = formatSecToMSS(curSec);
          if (remEl) remEl.textContent = '-' + formatSecToMSS(Math.max(0, dur - curSec));
        }, tickMs);

        // 3) Time-matrix occasional running overlay
        var overlay = ensureRunOverlay(timeWrap);
        var wOverlay = ensureWeatherOverlay(timeWrap);

        function showRun() {
          if (!overlay) return;
          timeWrap.classList.add('p1-run-mode');
          overlay.classList.add('is-on');
          setTimeout(function () {
            overlay.classList.remove('is-on');
            timeWrap.classList.remove('p1-run-mode');
          }, 1600);
        }

        function showWeather() {
          if (!wOverlay) return;
          timeWrap.classList.add('p1-weather-mode');
          wOverlay.classList.add('is-on');
          setTimeout(function () {
            wOverlay.classList.remove('is-on');
            timeWrap.classList.remove('p1-weather-mode');
          }, 1800);
        }

        function showSparkBurst() {
          sparkSomeDots(timeWrap);
        }

        // Mode loop: TIME → SPARK → WEATHER → SPARK → RUN (repeat)
        var phase = 0;
        function step() {
          // 0 time (idle), 1 spark, 2 weather, 3 spark, 4 run
          if (phase === 1 || phase === 3) showSparkBurst();
          if (phase === 2) showWeather();
          if (phase === 4) showRun();
          phase = (phase + 1) % 5;
        }

        // initial kick + loop
        timers.runFlipDelay = setTimeout(function () {
          step();
          timers.modeLoop = setInterval(step, 4500);
        }, 2200);

        return true;
      }

      function stopIfGone() {
        var stepsWrap = document.getElementById('p1-steps');
        if (stepsWrap) return;
        if (!running) return;
        running = false;
        clearTimers();
      }

      // Observe canvas updates when switching personas/scenarios.
      var mo = new MutationObserver(function () {
        if (!running) startIfReady();
        else stopIfGone();
      });
      try { mo.observe(canvas, { childList: true, subtree: true }); } catch (e) {}

      // also try once at boot
      startIfReady();
    });
  })();

  // -------------------------------------------------------------------------
  // Persona 3 interactions: press feedback + simple state toggles
  // - Tap ingredient rows to toggle "done" look (local only)
  // - Tap CTA to show a short "connecting…" state
  // -------------------------------------------------------------------------
  (function _persona3CookingInteractions() {
    function onReady(fn) {
      if (document.readyState === 'complete' || document.readyState === 'interactive') fn();
      else document.addEventListener('DOMContentLoaded', fn, { once: true });
    }

    onReady(function () {
      var canvas = document.getElementById('canvas');
      if (!canvas) return;

      var ctaLock = false;

      document.addEventListener('click', function (e) {
        var t = e.target;
        if (!t) return;

        // Ingredient row toggle
        var row = t.closest && t.closest('.p3-ing-row');
        if (row && canvas.contains(row)) {
          row.classList.toggle('is-done');
          // optional: subtle swap of bg via inline filter only (avoid rerender)
          return;
        }

        // CTA loading state
        var send = t.closest && t.closest('#p3-send');
        if (send && canvas.contains(send)) {
          if (ctaLock) return;
          ctaLock = true;
          send.classList.add('is-loading');
          var label = send.querySelector('div');
          var prev = label ? label.textContent : '';
          if (label) label.textContent = '연동 중…';
          setTimeout(function () {
            if (label) label.textContent = prev || '인덕션 연동 및 조리 시작';
            send.classList.remove('is-loading');
            ctaLock = false;
          }, 1200);
        }
      }, true);
    });
  })();
