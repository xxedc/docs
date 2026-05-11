/**
 * video-list.js — 视频列表页交互
 * 1. 回到顶部按钮显隐
 * 2. 视图模式切换（网格 / 列表）
 * 3. Banner 轮播占位（可扩展）
 */
(function (Drupal) {
  'use strict';

  Drupal.behaviors.xedcVideoList = {
    attach(context) {
      // ── 回到顶部 ──
      const backBtn = context.querySelector('#xedc-back-to-top')
        || document.getElementById('xedc-back-to-top');
      if (backBtn && !backBtn.dataset.bound) {
        backBtn.dataset.bound = '1';
        const onScroll = () => {
          backBtn.classList.toggle('is-visible', window.scrollY > 320);
        };
        window.addEventListener('scroll', onScroll, { passive: true });
        backBtn.addEventListener('click', () => {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
      }

      // ── 视图模式切换 ──
      const switchWrap = context.querySelector('[data-xedc-view-mode="video-list"]')
        || document.querySelector('[data-xedc-view-mode="video-list"]');
      if (switchWrap && !switchWrap.dataset.bound) {
        switchWrap.dataset.bound = '1';
        const grid = document.querySelector('[data-view-container="video-list"]');
        const btns = switchWrap.querySelectorAll('[data-mode]');
        // 读取本地偏好
        const saved = localStorage.getItem('xedc-video-view') || 'grid';
        if (grid && saved !== 'grid') {
          grid.setAttribute('data-mode', saved);
          btns.forEach(b => b.classList.toggle('is-active', b.dataset.mode === saved));
        }
        btns.forEach(btn => {
          btn.addEventListener('click', () => {
            const mode = btn.dataset.mode;
            btns.forEach(b => b.classList.toggle('is-active', b === btn));
            if (grid) {
              grid.setAttribute('data-mode', mode);
              localStorage.setItem('xedc-video-view', mode);
            }
          });
        });
      }

      // ── Banner 轮播（简易实现）──
      const banner = context.querySelector('.xedc-vl-banner')
        || document.querySelector('.xedc-vl-banner');
      if (banner && !banner.dataset.bound) {
        banner.dataset.bound = '1';
        const dots = banner.querySelectorAll('.xedc-vl-banner__dot');
        const prevBtn = banner.querySelector('.xedc-vl-banner__nav--prev');
        const nextBtn = banner.querySelector('.xedc-vl-banner__nav--next');
        // 单张时隐藏导航
        if (dots.length <= 1) {
          prevBtn && (prevBtn.style.display = 'none');
          nextBtn && (nextBtn.style.display = 'none');
        }
        // 更多张时：可在此扩展轮播逻辑
      }

      // ── 移动端分类宫格：超出 10 项折叠 ──
      const catsRow = context.querySelector('.xedc-vl-cats__row')
        || document.querySelector('.xedc-vl-cats__row');
      if (catsRow && !catsRow.dataset.bound && window.innerWidth <= 900) {
        catsRow.dataset.bound = '1';
        const items = Array.from(catsRow.querySelectorAll('.xedc-vl-cat-icon'));
        if (items.length > 10) {
          items.slice(10).forEach(el => el.style.display = 'none');
        }
      }
    },
  };

})(Drupal);
