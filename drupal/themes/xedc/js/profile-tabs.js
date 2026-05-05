/**
 * profile-tabs.js — 个人中心 Tab 切换
 */
(function (Drupal) {
  'use strict';

  Drupal.behaviors.xedcProfileTabs = {
    attach: function (context) {
      var tabs = context.querySelectorAll
        ? context.querySelectorAll('.xedc-profile-tab')
        : [];

      Array.prototype.forEach.call(tabs, function (tab) {
        if (tab.dataset.tabInit) return;
        tab.dataset.tabInit = '1';

        tab.addEventListener('click', function () {
          var tabId = this.getAttribute('data-tab');

          // 切换 tab 激活状态
          var allTabs = this.closest('.xedc-profile__tabs')
            .querySelectorAll('.xedc-profile-tab');
          allTabs.forEach(function (t) { t.classList.remove('is-active'); });
          this.classList.add('is-active');

          // 切换内容面板
          var panels = document.querySelectorAll('.xedc-tab-panel');
          panels.forEach(function (p) {
            p.style.display = 'none';
            p.classList.remove('is-active');
          });

          var target = document.getElementById('tab-' + tabId);
          if (target) {
            target.style.display = 'block';
            target.classList.add('is-active');
          }
        });
      });
    }
  };

})(Drupal);
