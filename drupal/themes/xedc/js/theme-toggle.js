/**
 * theme-toggle.js — 三色模式切换完整逻辑
 * defer 加载，负责 UI 交互和 system 模式监听
 */
(function (Drupal) {
  'use strict';

  var STORAGE_KEY = 'xedc-theme';
  var THEMES = ['system', 'light', 'dark', 'midnight'];
  var THEME_LABELS = {
    system:   '跟随系统',
    light:    '日间',
    dark:     '夜间',
    midnight: '深夜'
  };
  var THEME_ICONS = {
    system:   '🖥️',
    light:    '☀️',
    dark:     '🌙',
    midnight: '⚫'
  };

  // ── 读取保存的偏好 ──
  function getSaved() {
    try {
      return localStorage.getItem(STORAGE_KEY) || 'system';
    } catch (e) {
      return 'system';
    }
  }

  // ── 保存偏好 ──
  function setSaved(theme) {
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (e) {}
  }

  // ── 获取系统主题 ──
  function getSystemTheme() {
    return window.matchMedia &&
           window.matchMedia('(prefers-color-scheme: dark)').matches
           ? 'dark' : 'light';
  }

  // ── 实际应用的主题（system → 解析为 light/dark）──
  function resolveTheme(pref) {
    if (pref === 'system') return getSystemTheme();
    return pref;
  }

  // ── 应用主题到 <html> ──
  function applyTheme(pref) {
    var html = document.documentElement;
    var resolved = resolveTheme(pref);

    // 加过渡类
    html.classList.add('theme-transitioning');

    html.setAttribute('data-theme', resolved);

    // 更新 color-scheme meta
    var meta = document.querySelector('meta[name="color-scheme"]');
    if (meta) {
      meta.setAttribute('content',
        resolved === 'midnight' ? 'dark' :
        resolved === 'dark' ? 'dark' : 'light dark'
      );
    }

    // 200ms 后移除过渡类
    setTimeout(function () {
      html.classList.remove('theme-transitioning');
    }, 200);

    // 更新所有切换器 UI
    updateAllToggles(pref);
  }

  // ── 更新所有主题切换器的 UI 状态 ──
  function updateAllToggles(activePref) {
    // 更新图标按钮
    var icons = document.querySelectorAll('[data-xedc-theme-icon]');
    icons.forEach(function (el) {
      var resolved = resolveTheme(activePref);
      el.textContent = THEME_ICONS[resolved] || '🌙';
      el.setAttribute('aria-label', '当前主题：' + THEME_LABELS[activePref] + '，点击切换');
    });

    // 更新下拉菜单选中状态
    var items = document.querySelectorAll('[data-xedc-theme-option]');
    items.forEach(function (el) {
      var val = el.getAttribute('data-xedc-theme-option');
      el.setAttribute('aria-checked', val === activePref ? 'true' : 'false');
      el.classList.toggle('is-active', val === activePref);
    });
  }

  // ── 初始化单个切换器 DOM ──
  function initToggle(wrapper) {
    if (wrapper.dataset.xedcThemeInit) return;
    wrapper.dataset.xedcThemeInit = '1';

    var saved = getSaved();

    // 图标按钮
    var btn = wrapper.querySelector('[data-xedc-theme-icon]');
    if (!btn) return;

    // 下拉菜单
    var dropdown = wrapper.querySelector('[data-xedc-theme-dropdown]');
    if (!dropdown) return;

    // 点击图标按钮 → 展开/收起下拉
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = dropdown.classList.toggle('is-open');
      dropdown.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // 点击选项
    var items = dropdown.querySelectorAll('[data-xedc-theme-option]');
    items.forEach(function (item) {
      item.addEventListener('click', function (e) {
        e.stopPropagation();
        var pref = this.getAttribute('data-xedc-theme-option');
        setSaved(pref);
        applyTheme(pref);
        dropdown.classList.remove('is-open');
        dropdown.setAttribute('aria-hidden', 'true');
        btn.setAttribute('aria-expanded', 'false');
      });
    });

    // 更新初始状态
    updateAllToggles(saved);
  }

  // ── 监听系统主题变化（system 模式下自动切换）──
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)')
      .addEventListener('change', function () {
        if (getSaved() === 'system') {
          applyTheme('system');
        }
      });
  }

  // ── 点击外部关闭下拉 ──
  document.addEventListener('click', function () {
    var dropdowns = document.querySelectorAll('[data-xedc-theme-dropdown].is-open');
    dropdowns.forEach(function (d) {
      d.classList.remove('is-open');
      d.setAttribute('aria-hidden', 'true');
    });
  });

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
