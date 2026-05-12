/**
 * lightbox.js — 多图画廊切换 + 缩放拖拽
 */
(function (Drupal) {
  'use strict';

  var scale = 1;
  var isDragging = false;
  var dragStart = { x: 0, y: 0 };
  var translate = { x: 0, y: 0 };
  var currentImg = null;
  var currentIndex = 0;
  var viewerInited = false;
  var thumbsInited = false;
  var batchSelectInited = false;
  var colSwitchInited = false;
  var modeSwitchInited = false;
  var stageEl = null;

  // ── 切换到指定下标的图片 ──
  function switchToIndex(idx) {
    var mainImgs = document.querySelectorAll('#xedc-viewer-stage .xedc-viewer__main-img');
    if (!mainImgs.length) return;

    var total = mainImgs.length;
    idx = ((idx % total) + total) % total; // 循环边界

    mainImgs.forEach(function (img) {
      var imgIdx = parseInt(img.getAttribute('data-index') || '0', 10);
      if (imgIdx === idx) {
        img.classList.add('is-active');
        currentImg = img;
      } else {
        img.classList.remove('is-active');
      }
    });

    // 更新缩略图激活状态
    var thumbImgs = document.querySelectorAll('#xedc-image-thumbs img');
    thumbImgs.forEach(function (t) {
      var tIdx = parseInt(t.getAttribute('data-index') || '0', 10);
      t.classList.toggle('is-active', tIdx === idx);
      if (tIdx === idx) {
        try {
          t.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        } catch (e) {
          try { t.scrollIntoView(); } catch (e2) {}
        }
      }
    });

    // 更新计数器
    var counterCurrent = document.getElementById('xedc-viewer-current');
    if (counterCurrent) counterCurrent.textContent = idx + 1;

    currentIndex = idx;

    // 重置缩放
    scale = 1;
    translate = { x: 0, y: 0 };
    applyTransform();
  }

  // ── 主图缩放/拖拽初始化 ──
  function initViewer() {
    if (viewerInited) return;
    var stage = document.getElementById('xedc-viewer-stage');
    if (!stage) return;
    viewerInited = true;
    stageEl = stage;

    // 初始化 currentImg 为第一张可见的主图
    currentImg = stage.querySelector('.xedc-viewer__main-img.is-active')
                 || stage.querySelector('.xedc-viewer__main-img')
                 || stage.querySelector('img');
    if (!currentImg) return;

    // ── 滚轮缩放 ──
    // 移动端/触摸设备上下滑动页面时不接管滚轮，避免浏览器地址栏变化或触摸板事件导致图片自动忽大忽小。
    stage.addEventListener('wheel', function (e) {
      var isCoarsePointer = false;
      try {
        isCoarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
      } catch (err) {}
      if (isCoarsePointer) return;

      e.preventDefault();
      var delta = e.deltaY > 0 ? -0.1 : 0.1;
      scale = Math.min(Math.max(0.5, scale + delta), 4);
      applyTransform();
    }, { passive: false });

    // ── 拖拽移动 ──
    stage.addEventListener('pointerdown', function (e) {
      if (scale <= 1) return;
      if (e.button != null && e.button !== 0) return;
      isDragging = true;
      dragStart = { x: e.clientX - translate.x, y: e.clientY - translate.y };
      stage.style.cursor = 'grabbing';
      try { stage.setPointerCapture(e.pointerId); } catch (err) {}
      e.preventDefault();
    });

    stage.addEventListener('pointermove', function (e) {
      if (!isDragging) return;
      translate.x = e.clientX - dragStart.x;
      translate.y = e.clientY - dragStart.y;
      applyTransform();
    });

    stage.addEventListener('pointerup', function () {
      if (!isDragging) return;
      isDragging = false;
      stage.style.cursor = '';
    });

    stage.addEventListener('pointercancel', function () {
      if (!isDragging) return;
      isDragging = false;
      stage.style.cursor = '';
    });

    // ── 控制按钮 ──
    var zoomIn  = document.getElementById('xedc-zoom-in');
    var zoomOut = document.getElementById('xedc-zoom-out');
    var zoomReset = document.getElementById('xedc-zoom-reset');
    var fullscreenBtn = document.getElementById('xedc-fullscreen');

    if (zoomIn) zoomIn.addEventListener('click', function () {
      scale = Math.min(scale + 0.25, 4);
      applyTransform();
    });
    if (zoomOut) zoomOut.addEventListener('click', function () {
      scale = Math.max(scale - 0.25, 0.5);
      applyTransform();
    });
    if (zoomReset) zoomReset.addEventListener('click', function () {
      scale = 1;
      translate = { x: 0, y: 0 };
      applyTransform();
    });
    if (fullscreenBtn) fullscreenBtn.addEventListener('click', function () {
      var area = document.getElementById('xedc-lightbox-area');
      if (!area) return;
      if (!document.fullscreenElement) {
        area.requestFullscreen && area.requestFullscreen();
      } else {
        document.exitFullscreen && document.exitFullscreen();
      }
    });

    // ── Prev / Next 箭头 ──
    var prevBtn = document.getElementById('xedc-viewer-prev');
    var nextBtn = document.getElementById('xedc-viewer-next');
    if (prevBtn) {
      prevBtn.addEventListener('click', function () { switchToIndex(currentIndex - 1); });
      prevBtn.addEventListener('pointerup', function (e) { e.preventDefault(); switchToIndex(currentIndex - 1); });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', function () { switchToIndex(currentIndex + 1); });
      nextBtn.addEventListener('pointerup', function (e) { e.preventDefault(); switchToIndex(currentIndex + 1); });
    }

    // ── 键盘方向键 ──
    document.addEventListener('keydown', function (e) {
      var mainImgs = document.querySelectorAll('#xedc-viewer-stage .xedc-viewer__main-img');
      if (!mainImgs.length) return;
      if (e.key === 'ArrowRight') { switchToIndex(currentIndex + 1); }
      if (e.key === 'ArrowLeft')  { switchToIndex(currentIndex - 1); }
    });
  }

  // ── 缩略图点击 ──
  function initThumbs() {
    if (thumbsInited) return;
    var thumbs = document.querySelectorAll('#xedc-image-thumbs img');
    if (!thumbs.length) return;
    thumbsInited = true;

    thumbs.forEach(function (thumb) {
      thumb.addEventListener('click', function () {
        var idx = parseInt(this.getAttribute('data-index') || '0', 10);
        switchToIndex(idx);
      });
      thumb.addEventListener('pointerup', function (e) {
        e.preventDefault();
        var idx = parseInt(this.getAttribute('data-index') || '0', 10);
        switchToIndex(idx);
      });
    });

    // 初始化总数显示
    var totalEl = document.getElementById('xedc-viewer-total');
    if (totalEl && !totalEl.textContent) {
      totalEl.textContent = thumbs.length;
    }
  }

  function applyTransform() {
    if (!currentImg) return;
    currentImg.style.transform =
      'translate3d(' + translate.x + 'px, ' + translate.y + 'px, 0) scale(' + scale + ')';
    if (stageEl) {
      if (scale > 1) {
        stageEl.style.touchAction = 'none';
      } else {
        stageEl.style.touchAction = 'pan-y';
      }
    }
  }

  // ── 批量多选 ──
  function initBatchSelect() {
    if (batchSelectInited) return;
    var toggleBtn    = document.getElementById('xedc-select-toggle');
    var batchActions = document.querySelector('.xedc-batch-actions');
    var countEl      = document.getElementById('xedc-select-count');
    var selectMode   = false;

    if (!toggleBtn) return;
    batchSelectInited = true;

    toggleBtn.addEventListener('click', function () {
      selectMode = !selectMode;
      toggleBtn.textContent = selectMode ? '取消多选' : '多选';
      toggleBtn.classList.toggle('xedc-btn--default', selectMode);
      if (batchActions) batchActions.style.display = selectMode ? 'flex' : 'none';
      document.querySelectorAll('.xedc-image-card__checkbox').forEach(function (cb) {
        cb.style.display = selectMode ? 'block' : 'none';
        if (!selectMode) { var inp = cb.querySelector('input'); if (inp) inp.checked = false; }
      });
      updateCount();
    });

    document.addEventListener('change', function (e) {
      if (e.target.classList.contains('xedc-select-item')) updateCount();
    });

    function updateCount() {
      var selected = document.querySelectorAll('.xedc-select-item:checked').length;
      if (countEl) countEl.textContent = '已选 ' + selected + ' 张';
    }
  }

  // ── 列数切换（瀑布流页）──
  function initColSwitch() {
    if (colSwitchInited) return;
    var masonry = document.getElementById('xedc-masonry');
    var btns    = document.querySelectorAll('.xedc-col-btn');
    if (!masonry || !btns.length) return;
    colSwitchInited = true;

    var saved = 3;
    try { saved = parseInt(localStorage.getItem('xedc-masonry-cols') || '3', 10); } catch (e) {}
    setCol(saved);

    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cols = parseInt(this.getAttribute('data-cols'), 10);
        setCol(cols);
        try { localStorage.setItem('xedc-masonry-cols', cols); } catch (e) {}
      });
    });

    function setCol(cols) {
      masonry.setAttribute('data-cols', cols);
      btns.forEach(function (b) {
        b.classList.toggle('is-active', parseInt(b.getAttribute('data-cols'), 10) === cols);
      });
    }
  }

  Drupal.behaviors.xedcLightbox = {
    attach: function () {
      initViewer();
      initThumbs();
      initBatchSelect();
      initColSwitch();
      initModeSwitch();
    }
  };

  function initModeSwitch() {
    if (modeSwitchInited) return;
    var toggleBtn = document.getElementById('xedc-view-mode-toggle');
    var root = document.querySelector('.xedc-image-detail');
    if (!toggleBtn || !root) return;
    modeSwitchInited = true;

    var mode = 'slideshow';
    try { mode = localStorage.getItem('xedc-image-view-mode') || 'slideshow'; } catch (e) {}
    setMode(mode);

    toggleBtn.addEventListener('click', function () {
      setMode(root.getAttribute('data-view-mode') === 'slideshow' ? 'tile' : 'slideshow');
    });

    document.addEventListener('click', function (e) {
      var target = e.target;
      if (!target || !target.closest) return;
      var tileImg = target.closest('.xedc-image-tiles img[data-index]');
      if (!tileImg) return;
      var idx = parseInt(tileImg.getAttribute('data-index') || '0', 10);
      setMode('slideshow');
      switchToIndex(idx);
    });

    function setMode(next) {
      var val = (next === 'tile') ? 'tile' : 'slideshow';
      root.setAttribute('data-view-mode', val);
      toggleBtn.setAttribute('data-mode', val);
      toggleBtn.textContent = val === 'slideshow' ? '平铺' : '幻灯片';
      try { localStorage.setItem('xedc-image-view-mode', val); } catch (e) {}
    }
  }

  if (document.readyState !== 'loading') {
    initViewer();
    initThumbs();
    initBatchSelect();
    initColSwitch();
    initModeSwitch();
  } else {
    document.addEventListener('DOMContentLoaded', function () {
      initViewer();
      initThumbs();
      initBatchSelect();
      initColSwitch();
      initModeSwitch();
    });
  }

})(Drupal);
