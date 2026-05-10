/**
 * theme-toggle.js — 点击切换 light / dark 主题
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
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark' : 'light';
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
    if (meta) {
      meta.setAttribute('content', resolved === 'dark' ? 'dark' : 'light dark');
    }

    setTimeout(function () { html.classList.remove('theme-transitioning'); }, 200);
  }

  function initToggle(btn) {
    if (btn.dataset.xedcThemeInit) return;
    btn.dataset.xedcThemeInit = '1';

    btn.addEventListener('click', function () {
      var current = resolveTheme(getSaved());
      var next = current === 'dark' ? 'light' : 'dark';
      setSaved(next);
      applyTheme(next);
    });
  }

  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function () {
      if (!getSaved()) applyTheme('');
    });
  }

  Drupal.behaviors.xedcThemeToggle = {
    attach: function (context) {
      var btns = context.querySelectorAll
        ? context.querySelectorAll('[data-xedc-theme-toggle]')
        : [];
      Array.prototype.forEach.call(btns, initToggle);
      applyTheme(getSaved());
    }
  };

})(Drupal);
