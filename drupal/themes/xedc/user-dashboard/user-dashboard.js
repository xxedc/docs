(function (Drupal) {
  'use strict';

  function pad2(n) {
    return n < 10 ? '0' + n : '' + n;
  }

  function getNow() {
    return new Date();
  }

  function getPeriod(h) {
    if (h >= 5 && h < 11) {
      return { key: 'dawn', greeting: '晨曦初照，笔墨生香', mood: '晨曦初露', animal: '仙鹤' };
    }
    if (h >= 11 && h < 13) {
      return { key: 'noon', greeting: '晌午微醺，且听风吟', mood: '晌午微澜', animal: '锦鲤' };
    }
    if (h >= 13 && h < 18) {
      return { key: 'afternoon', greeting: '午后悠游，慢品流光', mood: '午后悠游', animal: '熊猫' };
    }
    if (h >= 18 && h < 23) {
      return { key: 'night', greeting: '月上柳梢，宁静致远', mood: '月落乌啼', animal: '玉兔' };
    }
    return { key: 'midnight', greeting: '此时万籁俱寂，宜入好梦', mood: '万籁俱寂', animal: '神鹿' };
  }

  function setCrumb(label) {
    var el = document.querySelector('[data-xedc-crumb-current]');
    if (el) el.textContent = label;
  }

  function initCrumbs(context) {
    var root = context.querySelector ? context.querySelector('[data-xedc-profile]') : null;
    if (!root || root.dataset.xedcCrumbsInit) return;
    root.dataset.xedcCrumbsInit = '1';

    function updateFromActive() {
      var active = root.querySelector('.xedc-profile-tab.is-active');
      var key = active ? active.getAttribute('data-tab') : 'posts';
      var map = {
        posts: '我的文章',
        collects: '收藏',
        drafts: '草稿箱',
        history: '浏览历史'
      };
      setCrumb(map[key] || '个人中心');
    }

    updateFromActive();
    window.setTimeout(updateFromActive, 0);
    root.addEventListener('click', function (e) {
      var t = e.target && e.target.closest ? e.target.closest('.xedc-profile-tab') : null;
      if (!t) return;
      window.requestAnimationFrame(function () {
        updateFromActive();
      });
    });
  }

  function initCollectsFilter(context) {
    var tabs = context.querySelector ? context.querySelector('[data-xedc-collects-tabs]') : null;
    if (!tabs || tabs.dataset.xedcFilterInit) return;
    tabs.dataset.xedcFilterInit = '1';

    var container = context.querySelector('[data-xedc-filter-container]');
    if (!container) return;

    var cards = Array.prototype.slice.call(container.querySelectorAll('[data-xedc-bundle]'));
    var rafId = 0;

    function setActive(btn) {
      Array.prototype.forEach.call(tabs.querySelectorAll('.xedc-subtab'), function (b) {
        b.classList.toggle('is-active', b === btn);
      });
    }

    function applyFilter(key) {
      if (rafId) {
        window.cancelAnimationFrame(rafId);
        rafId = 0;
      }

      container.setAttribute('data-xedc-filter', key);

      cards.forEach(function (c) {
        c.classList.remove('is-filter-enter');
      });

      if (key === 'all') {
        cards.forEach(function (c) {
          if (c.hidden) {
            c.hidden = false;
            c.classList.add('is-filter-enter');
          }
        });
      } else {
        cards.forEach(function (c) {
          var b = c.getAttribute('data-xedc-bundle') || '';
          var shouldShow = b === key;
          if (!shouldShow) {
            c.hidden = true;
          } else {
            if (c.hidden) {
              c.hidden = false;
              c.classList.add('is-filter-enter');
            }
          }
        });
      }

      rafId = window.requestAnimationFrame(function () {
        cards.forEach(function (c) {
          c.classList.remove('is-filter-enter');
        });
        rafId = 0;
      });
    }

    Array.prototype.forEach.call(tabs.querySelectorAll('[data-xedc-filter]'), function (btn) {
      btn.addEventListener('click', function () {
        var key = btn.getAttribute('data-xedc-filter') || 'all';
        setActive(btn);
        applyFilter(key);
      });
    });

    applyFilter('all');
  }

  function initMediaAutoRatio(context) {
    var imgs = context.querySelectorAll ? context.querySelectorAll('img[data-xedc-media]') : [];
    if (!imgs.length) return;

    function mark(img) {
      var card = img.closest ? img.closest('.xedc-content-card') : null;
      if (!card) return;
      var w = img.naturalWidth || 0;
      var h = img.naturalHeight || 0;
      if (!w || !h) return;
      var portrait = h / w >= 1.1;
      card.classList.toggle('is-portrait', portrait);
      card.classList.toggle('is-landscape', !portrait);
      img.classList.add('is-loaded');
    }

    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var img = entry.target;
          if (img.complete && img.naturalWidth > 0) {
            window.requestAnimationFrame(function () { mark(img); });
            io.unobserve(img);
            return;
          }
          img.addEventListener('load', function () {
            window.requestAnimationFrame(function () { mark(img); });
          }, { once: true });
          io.unobserve(img);
        });
      }, { rootMargin: '200px' });

      Array.prototype.forEach.call(imgs, function (img) {
        if (img.dataset.xedcMediaInit) return;
        img.dataset.xedcMediaInit = '1';
        io.observe(img);
      });
    } else {
      Array.prototype.forEach.call(imgs, function (img) {
        if (img.complete && img.naturalWidth > 0) mark(img);
        else img.addEventListener('load', function () { mark(img); }, { once: true });
      });
    }
  }

  function initZenHero(context) {
    var hero = context.querySelector ? context.querySelector('[data-xedc-zen-hero]') : null;
    if (!hero || hero.dataset.xedcZenInit) return;
    hero.dataset.xedcZenInit = '1';

    var timeEl = hero.querySelector('[data-xedc-zen-time]');
    var greetingEl = hero.querySelector('[data-xedc-zen-greeting]');
    if (!timeEl || !greetingEl) return;

    function update() {
      var now = getNow();
      var period = getPeriod(now.getHours());
      timeEl.textContent = pad2(now.getHours()) + ':' + pad2(now.getMinutes());
      greetingEl.textContent = period.greeting;
      hero.setAttribute('data-xedc-zen-period', period.key);
    }

    update();
    window.setInterval(update, 10000);
  }

  Drupal.behaviors.xedcUserDashboard = {
    attach: function (context) {
      initCrumbs(context);
      initCollectsFilter(context);
      initMediaAutoRatio(context);
      initZenHero(context);
    }
  };

})(Drupal);
