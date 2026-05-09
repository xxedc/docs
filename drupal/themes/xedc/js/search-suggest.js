/**
 * search-suggest.js — 搜索框联想下拉
 */
(function (Drupal) {
  'use strict';

  function initSearchSuggest(context) {
    var forms = context.querySelectorAll
      ? context.querySelectorAll('form[role="search"]')
      : [];

    Array.prototype.forEach.call(forms, function (form) {
      if (form.dataset.suggestInit) return;
      form.dataset.suggestInit = '1';

      var input = form.querySelector('input[type="search"]');
      if (!input) return;

      // 创建联想下拉容器
      var dropdown = document.createElement('div');
      dropdown.className = 'xedc-search-suggest';
      dropdown.setAttribute('role', 'listbox');
      dropdown.setAttribute('aria-hidden', 'true');
      form.style.position = 'relative';
      form.appendChild(dropdown);

      var timer = null;

      input.addEventListener('input', function () {
        var q = this.value.trim();
        clearTimeout(timer);

        if (q.length < 1) {
          dropdown.innerHTML = '';
          dropdown.setAttribute('aria-hidden', 'true');
          return;
        }

        timer = setTimeout(function () {
          fetch('/api/search-suggest?q=' + encodeURIComponent(q), {
            credentials: 'same-origin',
          })
          .then(function (r) { return r.json(); })
          .then(function (data) {
            if (!data.suggestions || !data.suggestions.length) {
              dropdown.innerHTML = '';
              return;
            }

            dropdown.innerHTML = data.suggestions.map(function (item) {
              var icon = item.type === 'video' ? '🎬' :
                         item.type === 'image_post' ? '🖼️' : '📝';
              return '<a href="' + item.url + '" class="xedc-search-suggest__item" role="option">' +
                     '<span class="xedc-search-suggest__icon">' + icon + '</span>' +
                     '<span class="xedc-search-suggest__text">' + item.title + '</span>' +
                     '</a>';
            }).join('');

            dropdown.setAttribute('aria-hidden', 'false');
          })
          .catch(function () {
            dropdown.innerHTML = '';
          });
        }, 300);
      });

      // 点击外部关闭
      document.addEventListener('click', function (e) {
        if (!form.contains(e.target)) {
          dropdown.innerHTML = '';
          dropdown.setAttribute('aria-hidden', 'true');
        }
      });
    });
  }

  Drupal.behaviors.xedcSearchSuggest = {
    attach: function (context) {
      initSearchSuggest(context);
    }
  };

})(Drupal);
