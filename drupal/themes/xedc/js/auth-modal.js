/**
 * auth-modal.js — 站内登录/注册/找回密码弹窗
 *
 * 拦截所有指向 /user/login、/user/register、/user/password 的链接，
 * 在当前页面打开 shadcn Dialog 风格的模态框，通过 fetch 加载 Drupal 表单
 * 并嵌入模态框中。提交表单时走 Drupal 原生 POST（含 CSRF token），
 * 提交后由 Drupal 服务端重定向到目标页。
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
        '<div class="xedc-auth-tabs" role="tablist">' +
          '<a href="/user/login" data-xedc-auth-tab="login" class="xedc-auth-tab is-active" role="tab">登录</a>' +
          '<a href="/user/register" data-xedc-auth-tab="register" class="xedc-auth-tab" role="tab">注册</a>' +
        '</div>' +
        '<div class="xedc-auth-modal-content xedc-auth-form-wrap" data-xedc-auth-content>' +
          '<div class="xedc-auth-loading">加载中…</div>' +
        '</div>' +
        '<div class="xedc-auth-dialog__footer xedc-flex xedc-flex-between">' +
          '<a href="/user/password" data-xedc-auth-link>忘记密码？</a>' +
          '<a href="/" data-xedc-auth-close>返回首页</a>' +
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
        if (closeEl.tagName === 'A' && closeEl.getAttribute('href') && closeEl.getAttribute('href') !== '#') {
          // "返回首页" link — let it navigate.
          return;
        }
        e.preventDefault();
        closeModal();
        return;
      }
      var tab = e.target.closest('[data-xedc-auth-tab]');
      if (tab) {
        e.preventDefault();
        var url = tab.getAttribute('href');
        setActiveTab(tab.getAttribute('data-xedc-auth-tab'));
        loadAndShow(url);
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

  function setActiveTab(key) {
    var modal = document.getElementById(MODAL_ID);
    if (!modal) return;
    var tabs = modal.querySelectorAll('[data-xedc-auth-tab]');
    for (var i = 0; i < tabs.length; i++) {
      if (tabs[i].getAttribute('data-xedc-auth-tab') === key) {
        tabs[i].classList.add('is-active');
      } else {
        tabs[i].classList.remove('is-active');
      }
    }
  }

  function setTagline(url) {
    var modal = document.getElementById(MODAL_ID);
    if (!modal) return;
    var el = modal.querySelector('[data-xedc-auth-tagline]');
    if (!el) return;
    if (url.indexOf('/user/register') >= 0) el.textContent = '创建一个新账号';
    else if (url.indexOf('/user/password') >= 0) el.textContent = '找回您的密码';
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

        // Find the Drupal user form (login / register / password reset).
        var form =
          doc.querySelector('form#user-login-form') ||
          doc.querySelector('form#user-register-form') ||
          doc.querySelector('form#user-pass') ||
          doc.querySelector('form.user-login-form') ||
          doc.querySelector('form.user-register-form') ||
          doc.querySelector('form.user-pass') ||
          doc.querySelector('.xedc-auth-form-wrap form') ||
          doc.querySelector('main form');

        if (!form) {
          content.innerHTML = '<p class="xedc-text-muted">无法加载表单，<a href="' + escapeHTML(url) + '">点此跳转</a>。</p>';
          return;
        }

        // Pull any pre-form status messages.
        var messages = doc.querySelector('.messages__wrapper, [data-drupal-messages], .messages');

        content.innerHTML = '';
        if (messages && messages.textContent.trim()) {
          var msgWrap = document.createElement('div');
          msgWrap.className = 'xedc-auth-messages';
          msgWrap.setAttribute('role', 'alert');
          msgWrap.appendChild(messages);
          content.appendChild(msgWrap);
        }
        content.appendChild(form);

        // Re-attach Drupal behaviors so AJAX/validation fire.
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
    var key = url.indexOf('/user/register') >= 0 ? 'register' : 'login';
    setActiveTab(key);
    loadAndShow(url);
  }

  function closeModal() {
    var modal = document.getElementById(MODAL_ID);
    if (modal) modal.hidden = true;
    document.body.style.overflow = '';
  }

  function shouldIntercept(href) {
    if (!href) return false;
    if (href === '/user/login' || href === '/user/register' || href === '/user/password') return true;
    if (href.indexOf('/user/login?') === 0) return true;
    if (href.indexOf('/user/register?') === 0) return true;
    if (href.indexOf('/user/password?') === 0) return true;
    return false;
  }

  // Global click delegation — intercept any auth-link on the site.
  document.addEventListener('click', function (e) {
    // Ignore clicks inside the modal (handled separately above).
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
