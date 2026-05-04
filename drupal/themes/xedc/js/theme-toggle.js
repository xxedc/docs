/**
 * 三色模式引擎核心
 * 立即执行函数 (IIFE)：在 HTML 渲染前执行，杜绝 FOUC 闪白现象。
 */
(() => {
  const root = document.documentElement;
  const storedTheme = localStorage.getItem('xedc-theme') || 'system';

  const applyTheme = (themeName) => {
    if (themeName === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', themeName);
    }
  };

  // 页面加载时立即应用缓存的主题
  applyTheme(storedTheme);

  // 监听系统级颜色模式变化
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (localStorage.getItem('xedc-theme') === 'system') {
      root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
    }
  });

  // 暴露给外部组件调用的方法 (如 SDC 的 dropdown)
  window.xedcSetTheme = (newTheme) => {
    root.classList.add('theme-transitioning');
    localStorage.setItem('xedc-theme', newTheme);
    applyTheme(newTheme);
    
    // 200ms 后移除过渡类，避免影响日常交互动画
    setTimeout(() => {
      root.classList.remove('theme-transitioning');
    }, 200);

    // 触发一个自定义事件，方便其他组件监听
    window.dispatchEvent(new CustomEvent('xedc-theme-changed', { detail: newTheme }));
  };
})();
