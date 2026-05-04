/**
 * dropdown.js — 通用下拉菜单交互逻辑
 */
(function (Drupal) {
  'use strict';

  // 关闭所有下拉菜单
  function closeAll(except) {
    document.querySelectorAll('[data-xedc-dropdown-menu].is-open')
      .forEach(function (menu) {
        if (menu !== except) {
          menu.classList.remove('is-open');
          menu.setAttribute('aria-hidden', 'true');
          var id = menu.getAttribute('data-xedc-dropdown-menu');
          var trigger = document.querySelector(
            '[data-xedc-dropdown-trigger="' + id + '"]'
          );
          if (trigger) trigger.setAttribute('aria-expanded', 'false');
        }
      });
  }

  // 初始化单个下拉菜单
  function initDropdown(wrapper) {
    if (wrapper.dataset.xedcDropdownInit) return;
    wrapper.dataset.xedcDropdownInit = '1';

    var id = wrapper.getAttribute('data-xedc-dropdown');
    var trigger = wrapper.querySelector('[data-xedc-dropdown-trigger="' + id + '"]');
    var menu = wrapper.querySelector('[data-xedc-dropdown-menu="' + id + '"]');

    if (!trigger || !menu) return;

    // 点击触发器切换
    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      var isOpen = menu.classList.toggle('is-open');
      menu.setAttribute('aria-hidden', isOpen ? 'false' : 'true');
      trigger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      if (isOpen) closeAll(menu);
    });

    // 键盘支持
    trigger.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        trigger.click();
      }
      if (e.key === 'Escape') {
        menu.classList.remove('is-open');
        menu.setAttribute('aria-hidden', 'true');
        trigger.setAttribute('aria-expanded', 'false');
        trigger.focus();
      }
    });
  }

  // 点击外部关闭
  document.addEventListener('click', function () {
    closeAll(null);
  });

  // Drupal behaviors
  Drupal.behaviors.xedcDropdown = {
    attach: function (context) {
      var wrappers = context.querySelectorAll
        ? context.querySelectorAll('[data-xedc-dropdown]')
        : [];
      Array.prototype.forEach.call(wrappers, initDropdown);
    }
  };

})(Drupal);
