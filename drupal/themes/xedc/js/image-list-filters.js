(function (Drupal) {
  'use strict';

  function debounce(fn, wait) {
    var t;
    return function () {
      var ctx = this;
      var args = arguments;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, wait);
    };
  }

  function isImageListPage() {
    return !!document.querySelector('.xedc-image-waterfall');
  }

  function fetchAndSwap(url, pushState, replaceState) {
    var currentRoot = document.querySelector('.xedc-image-waterfall');
    if (!currentRoot) return;

    fetch(url, { headers: { 'X-Requested-With': 'XMLHttpRequest' } })
      .then(function (r) { return r.text(); })
      .then(function (html) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');
        var nextRoot = doc.querySelector('.xedc-image-waterfall');
        if (!nextRoot) return;

        currentRoot.replaceWith(nextRoot);
        Drupal.attachBehaviors(nextRoot);

        if (pushState) {
          window.history.pushState({}, '', url);
        } else if (replaceState) {
          window.history.replaceState({}, '', url);
        }
      })
      .catch(function () {});
  }

  function buildSearchUrl(value) {
    var u = new URL(window.location.href);
    if (value) {
      u.searchParams.set('search', value);
    } else {
      u.searchParams.delete('search');
    }
    u.searchParams.delete('page');
    return u.toString();
  }

  function initFilterLinksOnce() {
    if (document.documentElement.dataset.xedcImageListFiltersInit) return;
    document.documentElement.dataset.xedcImageListFiltersInit = '1';

    document.addEventListener('click', function (e) {
      if (!isImageListPage()) return;
      var a = e.target.closest('.xedc-image-waterfall__filters a');
      if (!a) return;
      var href = a.getAttribute('href');
      if (!href) return;
      e.preventDefault();
      fetchAndSwap(href, true, false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    window.addEventListener('popstate', function () {
      if (!isImageListPage()) return;
      fetchAndSwap(window.location.href, false, false);
    });
  }

  function initSearchOnce() {
    if (document.documentElement.dataset.xedcImageListSearchInit) return;
    document.documentElement.dataset.xedcImageListSearchInit = '1';

    var form = document.querySelector('form[role="search"]');
    if (!form) return;
    var input = form.querySelector('input[name="q"], input[type="search"]');
    if (!input) return;

    var onChange = debounce(function () {
      if (!isImageListPage()) return;
      var v = (input.value || '').trim();
      fetchAndSwap(buildSearchUrl(v), false, true);
    }, 250);

    input.addEventListener('input', onChange, { passive: true });

    form.addEventListener('submit', function (e) {
      if (!isImageListPage()) return;
      e.preventDefault();
      var v = (input.value || '').trim();
      fetchAndSwap(buildSearchUrl(v), true, false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function initBatchDownloadOnce() {
    if (document.documentElement.dataset.xedcImageListBatchInit) return;
    document.documentElement.dataset.xedcImageListBatchInit = '1';

    document.addEventListener('click', function (e) {
      if (!isImageListPage()) return;
      var btn = e.target.closest('#xedc-batch-download');
      if (!btn) return;
      e.preventDefault();
      var ids = Array.prototype.slice.call(document.querySelectorAll('.xedc-select-item:checked'))
        .map(function (el) { return el.value; })
        .filter(function (v) { return /^\d+$/.test(v); });
      if (!ids.length) return;
      var url = '/download/image-posts?ids=' + encodeURIComponent(ids.join(','));
      window.open(url, '_blank');
    });
  }

  Drupal.behaviors.xedcImageListFilters = {
    attach: function () {
      if (!isImageListPage()) return;
      initFilterLinksOnce();
      initSearchOnce();
      initBatchDownloadOnce();
    }
  };
})(Drupal);

