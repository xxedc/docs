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

    var io;
    function markLoaded(img) {
      img.classList.add('is-loaded');
    }

    function observeImages(root) {
      var images = (root || container).querySelectorAll('img');
      if (!images.length) return;

      images.forEach(function (img) {
        if (!img.getAttribute('loading')) {
          img.setAttribute('loading', 'lazy');
        }
        if (img.complete && img.naturalWidth > 0) {
          markLoaded(img);
        }
      });

      if (!('IntersectionObserver' in window)) {
        images.forEach(function (img) { markLoaded(img); });
        return;
      }

      if (!io) {
        io = new IntersectionObserver(function (entries) {
          entries.forEach(function (entry) {
            if (!entry.isIntersecting) return;
            var img = entry.target;
            if (img.complete && img.naturalWidth > 0) {
              markLoaded(img);
              io.unobserve(img);
              return;
            }
            img.addEventListener('load', function () {
              markLoaded(img);
            }, { once: true });
            io.unobserve(img);
          });
        }, { rootMargin: '220px' });
      }

      images.forEach(function (img) {
        if (img.classList.contains('is-loaded')) return;
        io.observe(img);
      });
    }

    observeImages(container);

    var resizeObserver = new ResizeObserver(function () {
      updateLayout();
    });
    resizeObserver.observe(container);

    function clamp(v, min, max) {
      return Math.max(min, Math.min(max, v));
    }

    function updateLayout() {
      var autocols = container.getAttribute('data-autocols') === '1';
      var explicitCols = parseInt(container.getAttribute('data-cols') || '', 10);
      var vw = window.innerWidth || 1200;

      if (!autocols && explicitCols) {
        container.style.columnCount = String(explicitCols);
        return;
      }

      if (vw <= 640) {
        container.style.columnCount = '2';
        container.setAttribute('data-cols', '2');
        return;
      }
      if (vw <= 960) {
        container.style.columnCount = '3';
        container.setAttribute('data-cols', '3');
        return;
      }

      var width = container.clientWidth || 1200;
      var cardMin = 260;
      var cols = clamp(Math.floor(width / cardMin), 4, 6);
      container.style.columnCount = String(cols);
      container.setAttribute('data-cols', String(cols));
    }

    updateLayout();

    var mo = new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        m.addedNodes.forEach(function (n) {
          if (n && n.querySelectorAll) {
            observeImages(n);
          }
        });
      });
    });
    mo.observe(container, { childList: true, subtree: true });
  }

  Drupal.behaviors.xedcMasonry = {
    attach: function () {
      initMasonry();
    }
  };

})(Drupal);
