
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
