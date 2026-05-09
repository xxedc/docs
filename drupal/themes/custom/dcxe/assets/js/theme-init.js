(function () {
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

  var theme = getStoredTheme() || getSystemTheme();
  document.documentElement.setAttribute('data-theme', theme);
})();
