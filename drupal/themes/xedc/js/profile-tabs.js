/**
 * profile-tabs.js — 个人中心 Tab 切换
 */
(function (Drupal) {
  'use strict';

  function setTabInUrl(tabId) {
    try {
      var u = new URL(window.location.href);
      if (tabId) {
        u.searchParams.set('tab', tabId);
      } else {
        u.searchParams.delete('tab');
      }
      window.history.replaceState({}, '', u.toString());
    } catch (e) {}
  }

  function activateTab(container, tabId, updateUrl) {
    if (!container) return;
    var tab = container.querySelector('.xedc-profile-tab[data-tab="' + tabId + '"]');
    if (!tab) return;

    var allTabs = container.querySelectorAll('.xedc-profile-tab');
    allTabs.forEach(function (t) { t.classList.remove('is-active'); });
    tab.classList.add('is-active');

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

    if (updateUrl) setTabInUrl(tabId);
  }

  Drupal.behaviors.xedcProfileTabs = {
    attach: function (context) {
      var tabs = context.querySelectorAll
        ? context.querySelectorAll('.xedc-profile-tab')
        : [];

      var container = context.querySelector
        ? context.querySelector('.xedc-profile')
        : null;

      if (container && !container.dataset.xedcDefaultTabApplied) {
        container.dataset.xedcDefaultTabApplied = '1';
        try {
          var url = new URL(window.location.href);
          var initialTab = url.searchParams.get('tab');
          if (initialTab) {
            activateTab(container, initialTab, false);
          }
        } catch (e) {}
      }

      Array.prototype.forEach.call(tabs, function (tab) {
        if (tab.dataset.tabInit) return;
        tab.dataset.tabInit = '1';

        tab.addEventListener('click', function () {
          var tabId = this.getAttribute('data-tab');
          activateTab(this.closest('.xedc-profile'), tabId, true);
        });
      });
    }
  };

})(Drupal);
