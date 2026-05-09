/**
 * theme-init.js — 防 FOUC 初始化脚本
 * 必须在 <head> 同步执行，不能 defer/async
 * 在页面渲染前就设置好正确的 data-theme
 */
(function () {
  // localStorage key
  var STORAGE_KEY = 'xedc-theme';

  // 读取已保存的主题偏好（仅 light / dark）
  var saved = '';
  try {
    saved = localStorage.getItem(STORAGE_KEY) || '';
  } catch (e) {
    saved = '';
  }

  // 判断系统深色模式
  function getSystemTheme() {
    return window.matchMedia &&
           window.matchMedia('(prefers-color-scheme: dark)').matches
           ? 'dark' : 'light';
  }

  // 决定实际应用的主题
  var applied;
  if (saved === '') {
    applied = getSystemTheme();
  } else {
    applied = saved === 'dark' ? 'dark' : 'light';
  }

  // 立即设置 html[data-theme]（同步，无闪烁）
  document.documentElement.setAttribute('data-theme', applied);
})();
