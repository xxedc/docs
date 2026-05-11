/**
 * auth-modal.js — 站内登录/找回密码弹窗
 *
 * 拦截所有指向 /user/login、/user/password 的链接，在当前页面打开
 * shadcn Dialog 风格的模态框，通过 fetch 加载 Drupal 表单并嵌入。
 * 注册链接 /user/register 直接跳转，不在弹窗中加载。
 */
(function (Drupal, drupalSettings) {
  'use strict';

  var MODAL_ID = 'xedc-auth-modal';

  function escapeHTML(str) {
    return String(str).replace(/[&<>"']/g, function (m) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m];
    });
  }

  function buildLogoHTML() {
    var name = (drupalSettings && drupalSettings.xedc && drupalSettings.xedc.siteName) || 'DCXE';
    var escaped = escapeHTML(name);
    if (escaped.indexOf('X') >= 0) {
      return escaped.replace('X', '<span class="xedc-logo-x">X</span>');
    }
    return escaped;
  }

  function ensureModal() {
    var existing = document.getElementById(MODAL_ID);
    if (existing) return existing;

    var modal = document.createElement('div');
    modal.id = MODAL_ID;
    modal.className = 'xedc-auth-backdrop';
    modal.hidden = true;
    modal.innerHTML =
      '<div class="xedc-auth-dialog" role="dialog" aria-modal="true">' +
        '<button type="button" class="xedc-auth-dialog__close" aria-label="关闭" data-xedc-auth-close>' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>' +
        '</button>' +
        '<div class="xedc-auth-dialog__brand">' +
          '<a href="/" class="xedc-auth-dialog__logo">' + buildLogoHTML() + '</a>' +
          '<p class="xedc-auth-dialog__tagline" data-xedc-auth-tagline>欢迎回来，请登录您的账号</p>' +
        '</div>' +
        '<div class="xedc-auth-modal-content xedc-auth-form-wrap" data-xedc-auth-content>' +
          '<div class="xedc-auth-loading">加载中…</div>' +
        '</div>' +
        '<div class="xedc-auth-dialog__footer">' +
          '<a href="/user/password" data-xedc-auth-link class="xedc-auth-footer-link">忘记密码？</a>' +
          '<a href="/user/register" class="xedc-auth-register-link">立即注册 →</a>' +
        '</div>' +
      '</div>';
    document.body.appendChild(modal);

    // Backdrop click to close.
    modal.addEventListener('click', function (e) {
      if (e.target === modal) closeModal();
    });

    // Delegated handlers inside modal.
    modal.addEventListener('click', function (e) {
      var closeEl = e.target.closest('[data-xedc-auth-close]');
      if (closeEl) {
        e.preventDefault();
        closeModal();
        return;
      }
      var inner = e.target.closest('[data-xedc-auth-link]');
      if (inner) {
        e.preventDefault();
        loadAndShow(inner.getAttribute('href'));
        return;
      }
    });

    return modal;
  }

  function setTagline(url) {
    var modal = document.getElementById(MODAL_ID);
    if (!modal) return;
    var el = modal.querySelector('[data-xedc-auth-tagline]');
    if (!el) return;
    if (url.indexOf('/user/password') >= 0) el.textContent = '找回您的密码';
    else el.textContent = '欢迎回来，请登录您的账号';
  }

  function loadAndShow(url) {
    var modal = ensureModal();
    var content = modal.querySelector('[data-xedc-auth-content]');
    content.innerHTML = '<div class="xedc-auth-loading">加载中…</div>';
    setTagline(url);

    fetch(url, {
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      credentials: 'same-origin'
    })
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');

        // Find the Drupal user form (login / password reset).
        var form =
          doc.querySelector('form#user-login-form') ||
          doc.querySelector('form#user-pass') ||
          doc.querySelector('form.user-login-form') ||
          doc.querySelector('form.user-pass') ||
          doc.querySelector('.xedc-auth-form-wrap form') ||
          doc.querySelector('main form');

        if (!form) {
          content.innerHTML = '<p class="xedc-text-muted">无法加载表单，<a href="' + escapeHTML(url) + '">点此跳转</a>。</p>';
          return;
        }

        var messages = doc.querySelector('[data-drupal-messages], .xedc-msgs, .messages__wrapper, .messages');

        content.innerHTML = '';
        if (messages && messages.textContent.trim()) {
          content.appendChild(messages);
        }
        content.appendChild(form);

        try {
          if (Drupal && Drupal.attachBehaviors) {
            Drupal.attachBehaviors(content, drupalSettings);
          }
        } catch (e) {}
      })
      .catch(function () {
        content.innerHTML = '<p class="xedc-text-muted">加载失败，<a href="' + escapeHTML(url) + '">点此跳转</a>。</p>';
      });
  }

  function openModal(url) {
    var modal = ensureModal();
    modal.hidden = false;
    document.body.style.overflow = 'hidden';
    loadAndShow(url);
  }

  function closeModal() {
    var modal = document.getElementById(MODAL_ID);
    if (modal) modal.hidden = true;
    document.body.style.overflow = '';
  }

  function shouldIntercept(href) {
    if (!href) return false;
    // /user/register navigates directly (not in modal).
    if (href === '/user/login' || href === '/user/password') return true;
    if (href.indexOf('/user/login?') === 0) return true;
    if (href.indexOf('/user/password?') === 0) return true;
    return false;
  }

  // Global click delegation — intercept login/password links.
  document.addEventListener('click', function (e) {
    if (e.target.closest('#' + MODAL_ID)) return;
    var a = e.target.closest('a');
    if (!a) return;
    if (a.getAttribute('target') === '_blank') return;
    var href = a.getAttribute('href');
    if (!shouldIntercept(href)) return;
    e.preventDefault();
    openModal(href);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });

  window.xedcOpenAuthModal  = openModal;
  window.xedcCloseAuthModal = closeModal;
})(Drupal, drupalSettings);
