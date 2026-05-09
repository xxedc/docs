/**
 * xedc-interactions.js — 点赞/收藏/关注前端交互
 * 通过 REST API 与后端通信，携带 CSRF Token
 */
(function (Drupal, drupalSettings) {
  'use strict';

  // ── 获取 CSRF Token ──
  function getToken() {
    return (drupalSettings.xedc && drupalSettings.xedc.csrfToken) || '';
  }

  // ── 通用 API 请求 ──
  function apiPost(url, onSuccess, onError) {
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-Token': getToken(),
      },
      credentials: 'same-origin',
    })
    .then(function (res) { return res.json(); })
    .then(function (data) {
      if (data.status === 'ok') {
        onSuccess && onSuccess(data);
      } else {
        onError && onError(data.message || '操作失败');
      }
    })
    .catch(function () {
      onError && onError('网络错误，请重试');
    });
  }

  // ── 浏览量上报 ──
  function reportView() {
    var nid = drupalSettings.xedc && drupalSettings.xedc.nid;
    if (!nid) return;

    // 延迟3秒上报（避免快速跳走）
    setTimeout(function () {
      apiPost('/api/view/' + nid, function (data) {
        // 更新页面显示的浏览量
        var countEls = document.querySelectorAll('[data-view-count]');
        countEls.forEach(function (el) {
          el.textContent = data.viewCount;
        });
      });
    }, 3000);
  }

  // ── 点赞按钮 ──
  function initLikeButtons(context) {
    var btns = context.querySelectorAll ? context.querySelectorAll('.xedc-like-btn') : [];
    Array.prototype.forEach.call(btns, function (btn) {
      if (btn.dataset.likeInit) return;
      btn.dataset.likeInit = '1';

      var nid = btn.getAttribute('data-nid');
      if (!nid) return;

      btn.addEventListener('click', function () {
        if (!drupalSettings.xedc || !drupalSettings.xedc.isLoggedIn) {
          window.location.href = '/user/login';
          return;
        }

        btn.disabled = true;
        apiPost('/api/like/' + nid,
          function (data) {
            btn.disabled = false;
            btn.classList.toggle('is-active', data.liked);

            // 更新计数显示
            var countEl = btn.querySelector('.xedc-action-btn__count');
            if (countEl) countEl.textContent = data.likeCount;

            // 心跳动画
            btn.classList.add('xedc-like-animate');
            setTimeout(function () { btn.classList.remove('xedc-like-animate'); }, 600);
          },
          function (msg) {
            btn.disabled = false;
            alert(msg);
          }
        );
      });
    });
  }

  // ── 收藏按钮 ──
  function initCollectButtons(context) {
    var btns = context.querySelectorAll ? context.querySelectorAll('.xedc-collect-btn') : [];
    Array.prototype.forEach.call(btns, function (btn) {
      if (btn.dataset.collectInit) return;
      btn.dataset.collectInit = '1';

      var nid = btn.getAttribute('data-nid');
      if (!nid) return;

      btn.addEventListener('click', function () {
        if (!drupalSettings.xedc || !drupalSettings.xedc.isLoggedIn) {
          window.location.href = '/user/login';
          return;
        }

        btn.disabled = true;
        apiPost('/api/collect/' + nid,
          function (data) {
            btn.disabled = false;
            btn.classList.toggle('is-active', data.collected);
            var label = btn.querySelector('.xedc-action-btn__label');
            if (label) label.textContent = data.collected ? '已收藏' : '收藏';
          },
          function (msg) {
            btn.disabled = false;
            alert(msg);
          }
        );
      });
    });
  }

  // ── 关注按钮 ──
  function initFollowButtons(context) {
    var btns = context.querySelectorAll ? context.querySelectorAll('.xedc-follow-btn') : [];
    Array.prototype.forEach.call(btns, function (btn) {
      if (btn.dataset.followInit) return;
      btn.dataset.followInit = '1';

      var uid = btn.getAttribute('data-uid');
      if (!uid) return;

      btn.addEventListener('click', function () {
        if (!drupalSettings.xedc || !drupalSettings.xedc.isLoggedIn) {
          window.location.href = '/user/login';
          return;
        }

        btn.disabled = true;
        apiPost('/api/follow/' + uid,
          function (data) {
            btn.disabled = false;
            btn.classList.toggle('is-active', data.following);
            btn.textContent = data.following ? '已关注' : '关注';
          },
          function (msg) {
            btn.disabled = false;
            alert(msg);
          }
        );
      });
    });
  }

  // ── Drupal Behaviors ──
  Drupal.behaviors.xedcInteractions = {
    attach: function (context) {
      initLikeButtons(context);
      initCollectButtons(context);
      initFollowButtons(context);

      // 详情页浏览量上报（只在 body 级别触发一次）
      if (context === document || context.tagName === 'BODY') {
        reportView();
      }
    }
  };

})(Drupal, drupalSettings);
