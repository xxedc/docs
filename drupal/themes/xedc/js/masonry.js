/**
 * masonry.js — CSS Grid 瀑布流布局
 * 用 CSS column 实现，JS 处理懒加载
 */
(function (Drupal) {
  'use strict';

  function initMasonry() {
    var container = document.getElementById('xedc-masonry');
    if (!container || container.dataset.masonryInit) return;
    container.dataset.masonryInit = '1';

    // ── IntersectionObserver 懒加载 ──
    var images = container.querySelectorAll('img[loading="lazy"], img:not([loading])');
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            var img = entry.target;
            if (img.dataset.src) {
              img.src = img.dataset.src;
              img.removeAttribute('data-src');
            }
            img.style.opacity = '0';
            img.addEventListener('load', function () {
              img.style.transition = 'opacity 0.3s ease';
              img.style.opacity = '1';
            }, { once: true });
            io.unobserve(img);
          }
        });
      }, { rootMargin: '200px' });

      images.forEach(function (img) { io.observe(img); });
    }

    // ── 响应式列数（data-cols 属性驱动）──
    var resizeObserver = new ResizeObserver(function () {
      updateLayout();
    });
    resizeObserver.observe(container);

    function updateLayout() {
      // 由 CSS 的 column-count 驱动，data-cols 属性控制
      var cols = parseInt(container.getAttribute('data-cols') || '3');
      container.style.columnCount = cols;
    }

    updateLayout();
  }

  Drupal.behaviors.xedcMasonry = {
    attach: function () {
      initMasonry();
    }
  };

})(Drupal);
