/**
 * lightbox.js — 图片灯箱 + 缩放拖拽
 */
(function (Drupal) {
  'use strict';

  var scale = 1;
  var isDragging = false;
  var dragStart = { x: 0, y: 0 };
  var translate = { x: 0, y: 0 };
  var stage, currentImg;

  function initViewer() {
    stage = document.getElementById('xedc-viewer-stage');
    if (!stage) return;

    // 找到主图
    currentImg = stage.querySelector('img');
    if (!currentImg) return;

    currentImg.style.cursor = 'grab';
    currentImg.style.transition = 'transform 0.2s ease';
    currentImg.style.userSelect = 'none';

    // ── 滚轮缩放 ──
    stage.addEventListener('wheel', function (e) {
      e.preventDefault();
      var delta = e.deltaY > 0 ? -0.1 : 0.1;
      scale = Math.min(Math.max(0.5, scale + delta), 4);
      applyTransform();
    }, { passive: false });

    // ── 拖拽移动 ──
    currentImg.addEventListener('mousedown', function (e) {
      if (scale <= 1) return;
      isDragging = true;
      dragStart = { x: e.clientX - translate.x, y: e.clientY - translate.y };
      currentImg.style.cursor = 'grabbing';
      e.preventDefault();
    });

    document.addEventListener('mousemove', function (e) {
      if (!isDragging) return;
      translate.x = e.clientX - dragStart.x;
      translate.y = e.clientY - dragStart.y;
      applyTransform();
    });

    document.addEventListener('mouseup', function () {
      isDragging = false;
      if (currentImg) currentImg.style.cursor = 'grab';
    });

    // ── 控制按钮 ──
    var zoomIn = document.getElementById('xedc-zoom-in');
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

    // ── 键盘左右切换（图集）──
    document.addEventListener('keydown', function (e) {
      var thumbs = document.querySelectorAll('#xedc-image-thumbs img');
      if (!thumbs.length) return;
      var current = Array.from(thumbs).findIndex(function (t) {
        return t.classList.contains('is-active');
      });
      if (e.key === 'ArrowRight' && current < thumbs.length - 1) {
        thumbs[current + 1].click();
      }
      if (e.key === 'ArrowLeft' && current > 0) {
        thumbs[current - 1].click();
      }
    });
  }

  function applyTransform() {
    if (!currentImg) return;
    currentImg.style.transform =
      'translate(' + translate.x + 'px, ' + translate.y + 'px) scale(' + scale + ')';
  }

  // ── 批量选择 ──
  function initBatchSelect() {
    var toggleBtn = document.getElementById('xedc-select-toggle');
    var batchActions = document.querySelector('.xedc-batch-actions');
    var checkboxes = document.querySelectorAll('.xedc-image-card__checkbox');
    var countEl = document.getElementById('xedc-select-count');
    var selectMode = false;

    if (!toggleBtn) return;

    toggleBtn.addEventListener('click', function () {
      selectMode = !selectMode;
      toggleBtn.textContent = selectMode ? '取消多选' : '多选';
      toggleBtn.classList.toggle('xedc-btn--default', selectMode);
      if (batchActions) batchActions.style.display = selectMode ? 'flex' : 'none';
      checkboxes.forEach(function (cb) {
        cb.style.display = selectMode ? 'block' : 'none';
        if (!selectMode) cb.querySelector('input').checked = false;
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

  // ── 列数切换 ──
  function initColSwitch() {
    var masonry = document.getElementById('xedc-masonry');
    var btns = document.querySelectorAll('.xedc-col-btn');
    if (!masonry || !btns.length) return;

    var saved = 3;
    try { saved = parseInt(localStorage.getItem('xedc-masonry-cols') || '3'); } catch (e) {}
    setCol(saved);

    btns.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var cols = parseInt(this.getAttribute('data-cols'));
        setCol(cols);
        try { localStorage.setItem('xedc-masonry-cols', cols); } catch (e) {}
      });
    });

    function setCol(cols) {
      if (masonry) masonry.setAttribute('data-cols', cols);
      btns.forEach(function (b) {
        b.classList.toggle('is-active', parseInt(b.getAttribute('data-cols')) === cols);
      });
    }
  }

  Drupal.behaviors.xedcLightbox = {
    attach: function () {
      initViewer();
      initBatchSelect();
      initColSwitch();
    }
  };

})(Drupal);
