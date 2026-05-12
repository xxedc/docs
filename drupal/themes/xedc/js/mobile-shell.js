/**
 * mobile-shell.js — 全站移动端壳：抽屉开关
 */
(function () {
  'use strict';

  function openShell() {
    var drawer  = document.getElementById('xedc-shell-drawer');
    var overlay = document.getElementById('xedc-shell-overlay');
    if (drawer)  drawer.classList.add('is-open');
    if (overlay) overlay.classList.add('is-open');
    document.body.style.overflow = 'hidden';
  }

  function closeShell() {
    var drawer  = document.getElementById('xedc-shell-drawer');
    var overlay = document.getElementById('xedc-shell-overlay');
    if (drawer)  drawer.classList.remove('is-open');
    if (overlay) overlay.classList.remove('is-open');
    document.body.style.overflow = '';
  }

  window.xedcOpenShell  = openShell;
  window.xedcCloseShell = closeShell;

function toggleMobileSearch() {
  var panel = document.getElementById('xedc-mobile-search');
  if (!panel) return;
  panel.classList.toggle('is-open');
}
window.xedcToggleMobileSearch = toggleMobileSearch;


  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeShell();
  });
})();

// Rewrite logout links to include CSRF token (prevents Drupal confirm page).
(function (Drupal) {
  'use strict';
  Drupal.behaviors.xedcLogoutUrl = {
    attach: function (context, settings) {
      var url = settings.xedc && settings.xedc.logoutUrl;
      if (!url) return;
      var links = context.querySelectorAll('a[href*="user/logout"]');
      for (var i = 0; i < links.length; i++) {
        var href = links[i].getAttribute('href');
        if (href && href.indexOf('token=') === -1) {
          links[i].setAttribute('href', url);
        }
      }
    }
  };
})(Drupal);

// Close button on Drupal status messages.
(function () {
  'use strict';
  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-xedc-msg-close]');
    if (!btn) return;
    var card = btn.closest('.xedc-msg');
    if (!card) return;
    card.style.transition = 'opacity .15s, transform .15s';
    card.style.opacity = '0';
    card.style.transform = 'translateY(-4px)';
    setTimeout(function () { card.remove(); }, 150);
  });
})();
