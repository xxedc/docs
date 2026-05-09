/**
 * theme-toggle.js — 单按钮切换 light / dark
 */
(function (Drupal) {
  'use strict';

  var STORAGE_KEY = 'xedc-theme';

  function getSaved() {
    try { return localStorage.getItem(STORAGE_KEY) || ''; } catch (e) { return ''; }
  }

  function setSaved(theme) {
    try { localStorage.setItem(STORAGE_KEY, theme); } catch (e) {}
  }

  function getSystemTheme() {
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  function resolveTheme(pref) {
    if (pref === 'dark') return 'dark';
    if (pref === 'light') return 'light';
    return getSystemTheme();
  }

  function applyTheme(pref) {
    var html = document.documentElement;
    var resolved = resolveTheme(pref);
    html.classList.add('theme-transitioning');
    html.setAttribute('data-theme', resolved);

    var meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) meta.setAttribute('content', resolved === 'dark' ? 'dark' : 'light dark');

    setTimeout(function () { html.classList.remove('theme-transitioning'); }, 200);
    updateAllToggles(resolved);
  }

  function renderIcon(btn, resolved) {
    var icon = resolved === 'dark'
      ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>'
      : '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5"/><path d="M12 2v2.2M12 19.8V22M2 12h2.2M19.8 12H22M4.9 4.9l1.6 1.6M17.5 17.5l1.6 1.6M19.1 4.9l-1.6 1.6M6.5 17.5l-1.6 1.6"/></svg>';
    btn.innerHTML = '<span class="xedc-theme-toggle__icon">' + icon + '</span>';
    btn.setAttribute('aria-label', resolved === 'dark' ? '当前为夜间模式，点击切换到日间模式' : '当前为日间模式，点击切换到夜间模式');
  }

  function updateAllToggles(resolved) {
    var buttons = document.querySelectorAll('[data-xedc-theme-toggle-btn]');
    buttons.forEach(function (btn) { renderIcon(btn, resolved); });
  }

  function initToggle(wrapper) {
    if (wrapper.dataset.xedcThemeInit) return;
    wrapper.dataset.xedcThemeInit = '1';

    var btn = wrapper.querySelector('[data-xedc-theme-toggle-btn]');
    if (!btn) return;

    btn.addEventListener('click', function () {
      var current = document.documentElement.getAttribute('data-theme') === 'dark' ? 'dark' : 'light';
      var next = current === 'dark' ? 'light' : 'dark';
      setSaved(next);
      applyTheme(next);
    });

    updateAllToggles(resolveTheme(getSaved()));
  }

  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
      if (!getSaved()) applyTheme('');
    });
  }

  Drupal.behaviors.xedcThemeToggle = {
    attach: function (context) {
      var wrappers = context.querySelectorAll ? context.querySelectorAll('[data-xedc-theme-toggle]') : [];
      Array.prototype.forEach.call(wrappers, initToggle);
      applyTheme(getSaved());
    }
  };

})(Drupal);
