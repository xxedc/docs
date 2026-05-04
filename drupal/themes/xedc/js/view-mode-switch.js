/**
 * view-mode-switch.js — 列表/网格视图模式切换
 */
(function (Drupal) {
  'use strict';

  Drupal.behaviors.xedcViewModeSwitch = {
    attach: function (context) {
      var switches = context.querySelectorAll
        ? context.querySelectorAll('[data-xedc-view-mode]')
        : [];

      Array.prototype.forEach.call(switches, function (sw) {
        if (sw.dataset.xedcViewModeInit) return;
        sw.dataset.xedcViewModeInit = '1';

        var key = 'xedc-view-mode-' + sw.getAttribute('data-xedc-view-mode');
        var container = document.querySelector('[data-view-container="' + sw.getAttribute('data-xedc-view-mode') + '"]');
        var btns = sw.querySelectorAll('[data-mode]');

        // 恢复上次的模式
        var savedMode = '';
        try { savedMode = localStorage.getItem(key) || 'grid'; } catch (e) { savedMode = 'grid'; }
        applyMode(savedMode);

        btns.forEach(function (btn) {
          btn.addEventListener('click', function () {
            var mode = this.getAttribute('data-mode');
            applyMode(mode);
            try { localStorage.setItem(key, mode); } catch (e) {}
          });
        });

        function applyMode(mode) {
          btns.forEach(function (b) {
            b.classList.toggle('is-active', b.getAttribute('data-mode') === mode);
          });
          if (container) {
            container.setAttribute('data-mode', mode);
          }
        }
      });
    }
  };

})(Drupal);
