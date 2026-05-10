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

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeShell();
  });
})();
