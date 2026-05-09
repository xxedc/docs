/**
 * theme-toggle.js — 两种主题切换（Light / Soft Dark）
 * 规则：用户选择 > 系统设置 > 默认 light
 */
(function (Drupal) {
  'use strict';

  var STORAGE_KEY = 'xedc-theme';
  var THEME_ICONS = { light: '☀️', dark: '🌙' };

  // ── 读取保存的偏好 ──
  function getSaved() {
    try {
      var v = localStorage.getItem(STORAGE_KEY) || '';
      return (v === 'light' || v === 'dark') ? v : '';
    } catch (e) {
      return '';
    }
  }

  // ── 保存偏好 ──
  function setSaved(theme) {
    try {
      if (theme === 'light' || theme === 'dark') {
        localStorage.setItem(STORAGE_KEY, theme);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch (e) {}
  }

  // ── 获取系统主题 ──
  function getSystemTheme() {
    return window.matchMedia &&
           window.matchMedia('(prefers-color-scheme: dark)').matches
           ? 'dark' : 'light';
  }

  // ── 实际应用的主题（未保存 → 跟随系统）──
  function resolveTheme(saved) {
    if (saved === 'light' || saved === 'dark') return saved;
    return getSystemTheme();
  }

  // ── 应用主题到 <html> ──
  function applyTheme(saved) {
    var html = document.documentElement;
    var resolved = resolveTheme(saved);

    // 加过渡类
    html.classList.add('theme-transitioning');

    html.setAttribute('data-theme', resolved);

    // 300ms 后移除过渡类
    setTimeout(function () {
      html.classList.remove('theme-transitioning');
    }, 300);

    // 更新所有切换器 UI
    updateAllToggles(saved, resolved);
  }

  // ── 更新所有主题切换器的 UI 状态 ──
  function updateAllToggles(saved, resolved) {
    var icons = document.querySelectorAll('[data-xedc-theme-icon]');
    icons.forEach(function (el) {
      el.textContent = THEME_ICONS[resolved] || '🌙';
      el.setAttribute('aria-label', resolved === 'dark' ? '当前：夜间模式，点击切换到日间模式' : '当前：日间模式，点击切换到夜间模式');
      el.setAttribute('data-xedc-theme-active', resolved);
      el.setAttribute('data-xedc-theme-saved', saved ? saved : 'system');
    });
  }

  // ── 初始化单个切换器 DOM ──
  function initToggle(wrapper) {
    if (wrapper.dataset.xedcThemeInit) return;
    wrapper.dataset.xedcThemeInit = '1';

    var btn = wrapper.querySelector('[data-xedc-theme-icon]');
    if (!btn) return;

    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var saved = getSaved();
      var current = resolveTheme(saved);
      var next = current === 'dark' ? 'light' : 'dark';
      setSaved(next);
      applyTheme(next);
    });

    // 更新初始状态
    var savedInit = getSaved();
    updateAllToggles(savedInit, resolveTheme(savedInit));
  }

  // ── 监听系统主题变化（未保存偏好时自动切换）──
  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-color-scheme: dark)');
    var handler = function () {
      if (!getSaved()) {
        applyTheme('');
      }
    };
    if (mq.addEventListener) mq.addEventListener('change', handler);
    else if (mq.addListener) mq.addListener(handler);
  }

  // ── Drupal behaviors 钩子 ──
  Drupal.behaviors.xedcThemeToggle = {
    attach: function (context) {
      var wrappers = context.querySelectorAll
        ? context.querySelectorAll('[data-xedc-theme-toggle]')
        : [];
      Array.prototype.forEach.call(wrappers, initToggle);

      // 初始应用一次
      applyTheme(getSaved());
    }
  };

})(Drupal);
