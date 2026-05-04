/**
 * gallery-carousel.js — 图片画廊轮播 + 代码块复制
 */
(function (Drupal) {
  'use strict';

  // ── 轮播 ──
  function initCarousels() {
    document.querySelectorAll('[data-xedc-carousel]').forEach(function (carousel) {
      if (carousel.dataset.carouselInit) return;
      carousel.dataset.carouselInit = '1';

      var track = carousel.querySelector('.xedc-gallery-carousel__track');
      var slides = carousel.querySelectorAll('.xedc-gallery-carousel__slide');
      var prevBtn = carousel.querySelector('.xedc-gallery-carousel__btn--prev');
      var nextBtn = carousel.querySelector('.xedc-gallery-carousel__btn--next');
      var current = 0;

      function go(index) {
        current = (index + slides.length) % slides.length;
        track.style.transform = 'translateX(-' + (current * 100) + '%)';
      }

      if (prevBtn) prevBtn.addEventListener('click', function () { go(current - 1); });
      if (nextBtn) nextBtn.addEventListener('click', function () { go(current + 1); });
    });
  }

  // ── 代码块复制按钮 ──
  function initCodeCopy() {
    document.querySelectorAll('.xedc-code__copy').forEach(function (btn) {
      if (btn.dataset.copyInit) return;
      btn.dataset.copyInit = '1';

      btn.addEventListener('click', function () {
        var code = btn.closest('.xedc-code__wrap').querySelector('code');
        if (!code) return;
        navigator.clipboard.writeText(code.textContent).then(function () {
          btn.setAttribute('title', '已复制！');
          setTimeout(function () { btn.setAttribute('title', '复制'); }, 2000);
        });
      });
    });
  }

  Drupal.behaviors.xedcGallery = {
    attach: function () {
      initCarousels();
      initCodeCopy();
    }
  };

})(Drupal);
