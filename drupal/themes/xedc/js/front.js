/**
 * front.js — 首页交互：左侧抽屉导航、Banner 轮播
 */
(function (Drupal) {
  'use strict';

  // ── 抽屉导航 ──────────────────────────────────────────────────

  window.xedcOpenDrawer = function () {
    var sidebar = document.getElementById('xedc-lsidebar');
    var overlay = document.getElementById('xedc-drawer-overlay');
    if (sidebar) sidebar.classList.add('is-open');
    if (overlay) overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  };

  window.xedcCloseDrawer = function () {
    var sidebar = document.getElementById('xedc-lsidebar');
    var overlay = document.getElementById('xedc-drawer-overlay');
    if (sidebar) sidebar.classList.remove('is-open');
    if (overlay) overlay.classList.remove('is-open');
    document.body.style.overflow = '';
  };

  // ── Banner 轮播（移动端）────────────────────────────────────────

  var bannerIndex = 0;

  function getBannerTrack() {
    return document.getElementById('xedc-banner-track');
  }

  function getBannerSlides() {
    var track = getBannerTrack();
    return track ? track.querySelectorAll('.xedc-banner__slide') : [];
  }

  function getBannerDots() {
    return document.querySelectorAll('#xedc-banner .xedc-banner__dot');
  }

  function scrollToBannerSlide(index) {
    var track = getBannerTrack();
    var slides = getBannerSlides();
    if (!track || !slides.length) return;

    var total = slides.length;
    bannerIndex = ((index % total) + total) % total;

    var slideWidth = slides[0].offsetWidth;
    track.scrollTo({ left: bannerIndex * slideWidth, behavior: 'smooth' });

    var dots = getBannerDots();
    dots.forEach(function (dot, i) {
      dot.classList.toggle('is-active', i === bannerIndex);
    });
  }

  window.xedcBannerPrev = function () {
    scrollToBannerSlide(bannerIndex - 1);
  };

  window.xedcBannerNext = function () {
    scrollToBannerSlide(bannerIndex + 1);
  };

  // ── Drupal behaviors ──────────────────────────────────────────

  Drupal.behaviors.xedcFront = {
    attach: function (context, settings) {
      // 点击遮罩关闭抽屉
      var overlay = context.getElementById
        ? context.getElementById('xedc-drawer-overlay')
        : context.querySelector('#xedc-drawer-overlay');
      if (overlay && !overlay.dataset.xedcFrontInit) {
        overlay.dataset.xedcFrontInit = '1';
        overlay.addEventListener('click', window.xedcCloseDrawer);
      }

      // Banner 滚动时同步指示点
      var track = context.getElementById
        ? context.getElementById('xedc-banner-track')
        : context.querySelector('#xedc-banner-track');
      if (track && !track.dataset.xedcFrontInit) {
        track.dataset.xedcFrontInit = '1';
        track.addEventListener('scroll', function () {
          var slides = getBannerSlides();
          if (!slides.length) return;
          var slideWidth = slides[0].offsetWidth || 1;
          var nearest = Math.round(track.scrollLeft / slideWidth);
          if (nearest !== bannerIndex) {
            bannerIndex = nearest;
            var dots = getBannerDots();
            dots.forEach(function (dot, i) {
              dot.classList.toggle('is-active', i === bannerIndex);
            });
          }
        }, { passive: true });
      }
    }
  };

})(Drupal);
