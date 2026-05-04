/**
 * infinite-scroll.js — 无限滚动加载 + 回到顶部
 */
(function (Drupal) {
  'use strict';

  // ── 回到顶部 ──
  function initBackToTop() {
    var btn = document.getElementById('xedc-back-to-top');
    if (!btn) return;

    window.addEventListener('scroll', function () {
      if (window.scrollY > 400) {
        btn.classList.add('is-visible');
      } else {
        btn.classList.remove('is-visible');
      }
    }, { passive: true });

    btn.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // ── 无限滚动（监听分页链接）──
  function initInfiniteScroll() {
    var pager = document.querySelector('.xedc-pager .pager__item--next a');
    if (!pager) return;

    var loading = false;
    var container = document.querySelector('[data-view-container]');
    if (!container) return;

    // 创建加载指示器
    var indicator = document.createElement('div');
    indicator.className = 'xedc-loading-more';
    indicator.innerHTML = '<div class="xedc-spinner"></div>';
    indicator.style.display = 'none';
    container.after(indicator);

    // IntersectionObserver 监听分页按钮
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !loading) {
          loadMore();
        }
      });
    }, { rootMargin: '200px' });

    observer.observe(pager.closest('.pager__item--next'));

    function loadMore() {
      var nextUrl = pager.getAttribute('href');
      if (!nextUrl || loading) return;
      loading = true;
      indicator.style.display = 'flex';

      fetch(nextUrl, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
        .then(function (r) { return r.text(); })
        .then(function (html) {
          var parser = new DOMParser();
          var doc = parser.parseFromString(html, 'text/html');
          var newItems = doc.querySelectorAll('[data-view-container] > *');
          newItems.forEach(function (item) { container.appendChild(item); });

          // 更新下一页链接
          var newPager = doc.querySelector('.pager__item--next a');
          if (newPager) {
            pager.setAttribute('href', newPager.getAttribute('href'));
          } else {
            observer.disconnect();
            pager.closest('.pager__item--next').remove();
          }
          loading = false;
          indicator.style.display = 'none';
        })
        .catch(function () {
          loading = false;
          indicator.style.display = 'none';
        });
    }
  }

  Drupal.behaviors.xedcInfiniteScroll = {
    attach: function () {
      initBackToTop();
      initInfiniteScroll();
    }
  };

})(Drupal);
