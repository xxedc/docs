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
        t.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
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
    var stage = document.getElementById('xedc-viewer-stage');
    if (!stage) return;

    // 初始化 currentImg 为第一张可见的主图
    currentImg = stage.querySelector('.xedc-viewer__main-img.is-active')
                 || stage.querySelector('.xedc-viewer__main-img')
                 || stage.querySelector('img');
    if (!currentImg) return;

    // ── 滚轮缩放 ──
    stage.addEventListener('wheel', function (e) {
      e.preventDefault();
      var delta = e.deltaY > 0 ? -0.1 : 0.1;
      scale = Math.min(Math.max(0.5, scale + delta), 4);
      applyTransform();
    }, { passive: false });

    // ── 拖拽移动 ──
    stage.addEventListener('mousedown', function (e) {
      if (scale <= 1) return;
      isDragging = true;
      dragStart = { x: e.clientX - translate.x, y: e.clientY - translate.y };
      stage.style.cursor = 'grabbing';
      e.preventDefault();
    });

    document.addEventListener('mousemove', function (e) {
      if (!isDragging) return;
      translate.x = e.clientX - dragStart.x;
      translate.y = e.clientY - dragStart.y;
      applyTransform();
    });

    document.addEventListener('mouseup', function () {
      if (isDragging) {
        isDragging = false;
        stage.style.cursor = '';
      }
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
    if (prevBtn) prevBtn.addEventListener('click', function () { switchToIndex(currentIndex - 1); });
    if (nextBtn) nextBtn.addEventListener('click', function () { switchToIndex(currentIndex + 1); });

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
    var thumbs = document.querySelectorAll('#xedc-image-thumbs img');
    if (!thumbs.length) return;

    thumbs.forEach(function (thumb) {
      thumb.addEventListener('click', function () {
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
      'translate(' + translate.x + 'px, ' + translate.y + 'px) scale(' + scale + ')';
  }

  // ── 批量多选 ──
  function initBatchSelect() {
    var toggleBtn    = document.getElementById('xedc-select-toggle');
    var batchActions = document.querySelector('.xedc-batch-actions');
    var countEl      = document.getElementById('xedc-select-count');
    var selectMode   = false;

    if (!toggleBtn) return;

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
    var masonry = document.getElementById('xedc-masonry');
    var btns    = document.querySelectorAll('.xedc-col-btn');
    if (!masonry || !btns.length) return;

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
    }
  };

})(Drupal);
