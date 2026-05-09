/**
 * article-toc.js — 文章目录自动生成 + 滚动联动 + 阅读控制
 */
(function (Drupal) {
  'use strict';

  // ── 目录生成 ──
  function initToc() {
    var body = document.getElementById('xedc-article-body');
    var tocList = document.getElementById('xedc-toc-list');
    if (!body || !tocList) return;

    var headings = body.querySelectorAll('h2, h3');
    if (headings.length < 2) {
      var sidebar = document.getElementById('xedc-toc-sidebar');
      if (sidebar) sidebar.style.display = 'none';
      return;
    }

    var fragment = document.createDocumentFragment();
    headings.forEach(function (h, i) {
      // 给标题加锚点 id
      if (!h.id) h.id = 'heading-' + i;

      var item = document.createElement('a');
      item.href = '#' + h.id;
      item.className = 'xedc-toc__item xedc-toc__item--' + h.tagName.toLowerCase();
      item.textContent = h.textContent;
      item.setAttribute('data-target', h.id);

      item.addEventListener('click', function (e) {
        e.preventDefault();
        h.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });

      fragment.appendChild(item);
    });
    tocList.appendChild(fragment);

    // ── IntersectionObserver 滚动联动 ──
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var link = tocList.querySelector('[data-target="' + entry.target.id + '"]');
        if (link) link.classList.toggle('is-active', entry.isIntersecting);
      });
    }, { rootMargin: '-80px 0px -70% 0px' });

    headings.forEach(function (h) { io.observe(h); });
  }

  // ── 阅读进度条 ──
  function initReadingProgress() {
    var bar = document.getElementById('xedc-progress-bar');
    var progressEl = document.getElementById('xedc-reading-progress');
    if (!bar) return;

    window.addEventListener('scroll', function () {
      var scrollTop = window.scrollY;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var pct = docHeight > 0 ? Math.min((scrollTop / docHeight) * 100, 100) : 0;
      bar.style.width = pct + '%';
      if (progressEl) progressEl.setAttribute('aria-valuenow', Math.round(pct));
    }, { passive: true });
  }

  // ── 字体大小控制 ──
  function initFontControl() {
    var body = document.getElementById('xedc-article-body');
    if (!body) return;

    var sizes = [14, 15, 16, 17, 18, 20];
    var currentIndex = 2; // 默认 16px
    try { currentIndex = parseInt(localStorage.getItem('xedc-font-size-index') || '2'); } catch (e) {}
    applySize(currentIndex);

    var dec = document.getElementById('xedc-font-decrease');
    var inc = document.getElementById('xedc-font-increase');

    if (dec) dec.addEventListener('click', function () {
      currentIndex = Math.max(0, currentIndex - 1);
      applySize(currentIndex);
    });

    if (inc) inc.addEventListener('click', function () {
      currentIndex = Math.min(sizes.length - 1, currentIndex + 1);
      applySize(currentIndex);
    });

    function applySize(idx) {
      body.style.fontSize = sizes[idx] + 'px';
      try { localStorage.setItem('xedc-font-size-index', idx); } catch (e) {}
    }
  }

  // ── 专注模式 ──
  function initFocusMode() {
    var btn = document.getElementById('xedc-focus-mode');
    if (!btn) return;

    btn.addEventListener('click', function () {
      document.body.classList.toggle('xedc-focus-mode');
      var isOn = document.body.classList.contains('xedc-focus-mode');
      btn.setAttribute('title', isOn ? '退出专注模式' : '专注模式');
    });

    // ESC 退出
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        document.body.classList.remove('xedc-focus-mode');
      }
    });
  }

  Drupal.behaviors.xedcArticleToc = {
    attach: function () {
      initToc();
      initReadingProgress();
      initFontControl();
      initFocusMode();
    }
  };

})(Drupal);
