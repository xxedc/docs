/**
 * video-controls.js — 视频播放器增强控制
 * 记忆播放进度 + 浏览量上报（阶段4接 API）
 */
(function (Drupal) {
  'use strict';

  Drupal.behaviors.xedcVideoControls = {
    attach: function (context) {
      var video = context.querySelector
        ? context.querySelector('.xedc-video-player__video')
        : null;
      if (!video || video.dataset.xedcVideoInit) return;
      video.dataset.xedcVideoInit = '1';

      var nid = video.getAttribute('data-nid');
      var storageKey = 'xedc-video-progress-' + nid;

      // ── 恢复播放进度 ──
      var saved = 0;
      try { saved = parseFloat(localStorage.getItem(storageKey) || '0'); } catch (e) {}
      if (saved > 5) {
        video.currentTime = saved;
      }

      // ── 保存播放进度（每5秒）──
      video.addEventListener('timeupdate', function () {
        if (Math.floor(video.currentTime) % 5 === 0) {
          try { localStorage.setItem(storageKey, video.currentTime); } catch (e) {}
        }
      });

      // ── 播放完毕清除进度 ──
      video.addEventListener('ended', function () {
        try { localStorage.removeItem(storageKey); } catch (e) {}
      });

      // ── 浏览量上报（阶段4的 API，这里预留）──
      var counted = false;
      video.addEventListener('play', function () {
        if (!counted && nid) {
          counted = true;
          // 阶段4接入：fetch('/api/view/' + nid, { method: 'POST' })
        }
      });
    }
  };

})(Drupal);
