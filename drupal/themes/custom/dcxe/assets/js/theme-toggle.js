(function (Drupal, once) {
  var STORAGE_KEY = 'dcxe-theme';
  var THEMES = { light: 'light', dark: 'dark' };

  function getSystemTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return THEMES.dark;
    return THEMES.light;
  }

  function getStoredTheme() {
    try {
      var v = localStorage.getItem(STORAGE_KEY);
      return v === THEMES.dark || v === THEMES.light ? v : null;
    } catch (e) {
      return null;
    }
  }

  function setStoredTheme(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {}
  }

  function setHtmlTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  function enableThemeAnim() {
    var root = document.documentElement;
    root.setAttribute('data-theme-anim', '1');
    window.setTimeout(function () {
      root.removeAttribute('data-theme-anim');
    }, 350);
  }

  function setLabel(theme) {
    var label = document.querySelector('[data-theme-label]');
    if (!label) return;
    label.textContent = theme === THEMES.dark ? 'Dark' : 'Light';
  }

  function applyThemeFromPriority() {
    var stored = getStoredTheme();
    var theme = stored || getSystemTheme();
    setHtmlTheme(theme);
    setLabel(theme);
  }

  function toggleTheme() {
    var current = document.documentElement.getAttribute('data-theme') || THEMES.light;
    var next = current === THEMES.dark ? THEMES.light : THEMES.dark;
    setStoredTheme(next);
    enableThemeAnim();
    setHtmlTheme(next);
    setLabel(next);
  }

  Drupal.behaviors.dcxeThemeToggle = {
    attach: function (context) {
      once('dcxeThemeInit', 'html', context).forEach(function () {
        applyThemeFromPriority();
        var mql = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
        if (mql && mql.addEventListener) {
          mql.addEventListener('change', function () {
            if (!getStoredTheme()) applyThemeFromPriority();
          });
        }
      });

      once('dcxeThemeToggle', '[data-theme-toggle]', context).forEach(function (btn) {
        btn.addEventListener('click', toggleTheme);
      });
    }
  };
})(Drupal, once);
