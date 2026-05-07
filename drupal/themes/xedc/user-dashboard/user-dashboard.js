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

    var canvas = hero.querySelector('[data-xedc-zen-canvas]');
    var timeEl = hero.querySelector('[data-xedc-zen-time]');
    var greetingEl = hero.querySelector('[data-xedc-zen-greeting]');
    var animalIconEl = hero.querySelector('[data-xedc-zen-animal-icon]');
    var animalWrap = hero.querySelector('[data-xedc-zen-animal]');
    if (!canvas || !timeEl || !greetingEl || !animalIconEl || !animalWrap) return;

    var ctx = canvas.getContext('2d', { alpha: true });
    var dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    var w = 0;
    var h = 0;
    var running = true;

    var particles = [];
    var ripples = [];
    var leaves = [];

    function resize() {
      var rect = canvas.getBoundingClientRect();
      w = Math.max(1, Math.floor(rect.width));
      h = Math.max(1, Math.floor(rect.height));
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function spawnParticles(n) {
      particles.length = 0;
      for (var i = 0; i < n; i++) {
        particles.push({
          x: Math.random() * w,
          y: Math.random() * h,
          r: 0.6 + Math.random() * 1.8,
          vx: (-0.3 + Math.random() * 0.6),
          vy: (-0.2 + Math.random() * 0.4),
          a: 0.08 + Math.random() * 0.18
        });
      }
    }

    function drawSoftClouds(t) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      for (var i = 0; i < 4; i++) {
        var px = (t * 0.012 + i * 0.28) % 1;
        var x = px * (w + 220) - 110;
        var y = h * (0.18 + i * 0.08);
        var rw = 260 + i * 40;
        var rh = 90 + i * 12;
        var g = ctx.createRadialGradient(x, y, 10, x, y, rw);
        g.addColorStop(0, 'rgba(255,255,255,0.10)');
        g.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.ellipse(x, y, rw, rh, 0, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    function drawStars(t) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      for (var i = 0; i < 80; i++) {
        var x = (i * 37) % w;
        var y = (i * 61) % (h * 0.7);
        var tw = 0.2 + 0.8 * (0.5 + 0.5 * Math.sin(t * 0.002 + i));
        ctx.fillStyle = 'rgba(255,255,255,' + (0.06 + tw * 0.16) + ')';
        ctx.fillRect(x, y, 1, 1);
      }
      ctx.restore();
    }

    function drawShootingStar(t) {
      var phase = (t % 12000) / 12000;
      if (phase < 0.72) return;
      var p = (phase - 0.72) / 0.28;
      var x0 = w * 0.75;
      var y0 = h * 0.18;
      var x = x0 - p * w * 0.35;
      var y = y0 + p * h * 0.25;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.18 * (1 - p)) + ')';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + 90, y - 70);
      ctx.stroke();
      ctx.restore();
    }

    function drawCrane(t) {
      var x = w * 0.18;
      var y = h * 0.62;
      var bob = Math.sin(t * 0.0012) * 3;
      var groom = 0.5 + 0.5 * Math.sin(t * 0.001);
      ctx.save();
      ctx.translate(x, y + bob);
      ctx.strokeStyle = 'rgba(255,255,255,0.52)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(16, -42, 44, -62);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(44, -62);
      ctx.quadraticCurveTo(56, -70 - groom * 6, 66, -60);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.38)';
      ctx.beginPath();
      ctx.moveTo(22, -18);
      ctx.quadraticCurveTo(42, -26, 60, -10);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(10, 6);
      ctx.lineTo(10, 28);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(22, 6);
      ctx.lineTo(22, 34);
      ctx.stroke();
      ctx.restore();
    }

    function drawKoi(t) {
      var cx = w * 0.52;
      var cy = h * 0.56;
      var r = Math.min(w, h) * 0.08;
      var a1 = t * 0.001;
      var a2 = a1 + Math.PI;
      function fish(a, hue) {
        var x = cx + Math.cos(a) * (r * 2.3);
        var y = cy + Math.sin(a) * (r * 1.4);
        ctx.save();
        ctx.translate(x, y);
        ctx.rotate(a + Math.PI / 2);
        ctx.fillStyle = 'hsla(' + hue + ',80%,70%,0.40)';
        ctx.beginPath();
        ctx.ellipse(0, 0, r * 1.05, r * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = 'hsla(' + hue + ',90%,75%,0.55)';
        ctx.beginPath();
        ctx.moveTo(0, r * 0.65);
        ctx.quadraticCurveTo(r * 0.8, r * 1.2, 0, r * 1.55);
        ctx.quadraticCurveTo(-r * 0.8, r * 1.2, 0, r * 0.65);
        ctx.fill();
        ctx.restore();
      }
      fish(a1, 18);
      fish(a2, 200);
    }

    function drawPanda(t) {
      var x = w * 0.2;
      var y = h * 0.7;
      var chew = 0.5 + 0.5 * Math.sin(t * 0.0022);
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = 'rgba(255,255,255,0.42)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 34, 28, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.14)';
      ctx.beginPath();
      ctx.ellipse(-16, -14, 10, 8, -0.3, 0, Math.PI * 2);
      ctx.ellipse(16, -14, 10, 8, 0.3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.16)';
      ctx.beginPath();
      ctx.ellipse(-26, -30, 10, 10, 0, 0, Math.PI * 2);
      ctx.ellipse(26, -30, 10, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.22)';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-6, 6);
      ctx.quadraticCurveTo(0, 10 + chew * 4, 6, 6);
      ctx.stroke();
      ctx.restore();
    }

    function drawMoonRabbit(t) {
      var mx = w * 0.78;
      var my = h * 0.42;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.beginPath();
      ctx.arc(mx, my, 58, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(mx, my + 16);
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.beginPath();
      ctx.ellipse(0, 18, 18, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.36)';
      ctx.beginPath();
      ctx.ellipse(0, 8, 16, 12, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.30)';
      ctx.beginPath();
      ctx.ellipse(-8, -10, 6, 18, -0.2, 0, Math.PI * 2);
      ctx.ellipse(8, -10, 6, 18, 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    function drawDeer(t) {
      var x = w * 0.78;
      var y = h * 0.68;
      var glow = 0.5 + 0.5 * Math.sin(getNow().getTime() * 0.002);
      ctx.save();
      ctx.translate(x, y);
      ctx.fillStyle = 'rgba(255,255,255,0.18)';
      ctx.beginPath();
      ctx.ellipse(0, 0, 34, 22, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,' + (0.18 + glow * 0.22) + ')';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-10, -18);
      ctx.quadraticCurveTo(-28, -38, -20, -58);
      ctx.moveTo(10, -18);
      ctx.quadraticCurveTo(28, -38, 20, -58);
      ctx.stroke();
      ctx.restore();
    }

    function updateLeaves(t) {
      if (leaves.length < 14 && Math.random() < 0.14) {
        leaves.push({
          x: Math.random() * w,
          y: -20,
          r: 6 + Math.random() * 10,
          vy: 0.35 + Math.random() * 0.9,
          vx: -0.25 + Math.random() * 0.5,
          rot: Math.random() * Math.PI,
          vr: -0.03 + Math.random() * 0.06
        });
      }
      for (var i = leaves.length - 1; i >= 0; i--) {
        var lf = leaves[i];
        lf.x += lf.vx;
        lf.y += lf.vy;
        lf.rot += lf.vr;
        if (lf.y > h + 30) leaves.splice(i, 1);
      }
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = 'rgba(180,255,210,0.20)';
      leaves.forEach(function (lf) {
        ctx.save();
        ctx.translate(lf.x, lf.y);
        ctx.rotate(lf.rot);
        ctx.beginPath();
        ctx.ellipse(0, 0, lf.r * 0.55, lf.r, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
      ctx.restore();
    }

    function updateRipples(t) {
      for (var i = ripples.length - 1; i >= 0; i--) {
        var rp = ripples[i];
        var age = (t - rp.t0) / 900;
        if (age >= 1) {
          ripples.splice(i, 1);
          continue;
        }
        var rr = rp.r0 + age * 80;
        ctx.save();
        ctx.strokeStyle = 'rgba(255,255,255,' + (0.22 * (1 - age)) + ')';
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.arc(rp.x, rp.y, rr, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      }
    }

    function drawFireflies(t) {
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      particles.forEach(function (p, idx) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -20) p.x = w + 20;
        if (p.x > w + 20) p.x = -20;
        if (p.y < -20) p.y = h + 20;
        if (p.y > h + 20) p.y = -20;
        var tw = 0.5 + 0.5 * Math.sin(t * 0.004 + idx);
        var a = p.a + tw * 0.22;
        ctx.fillStyle = 'rgba(255,255,220,' + a + ')';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    function render(t) {
      if (!running) return;

      ctx.clearRect(0, 0, w, h);
      var now = getNow();
      var period = getPeriod(now.getHours());
      timeEl.textContent = pad2(now.getHours()) + ':' + pad2(now.getMinutes());
      greetingEl.textContent = period.greeting;
      animalWrap.setAttribute('aria-label', period.animal);
      hero.setAttribute('data-xedc-zen-period', period.key);
      if (animalIconEl.dataset.xedcAnimalKey !== period.key) {
        animalIconEl.dataset.xedcAnimalKey = period.key;
        animalIconEl.innerHTML = getAnimalSvg(period.key);
      }

      drawFireflies(t);

      if (period.key === 'dawn') {
        drawSoftClouds(t);
        drawCrane(t);
      } else if (period.key === 'noon') {
        drawKoi(t);
        updateRipples(t);
      } else if (period.key === 'afternoon') {
        updateLeaves(t);
        drawPanda(t);
      } else if (period.key === 'night') {
        drawStars(t);
        drawShootingStar(t);
        drawMoonRabbit(t);
      } else {
        drawFireflies(t);
        drawDeer(t);
      }

      window.requestAnimationFrame(render);
    }

    function onClick(e) {
      var now = getNow();
      var period = getPeriod(now.getHours());
      if (period.key !== 'noon') return;
      var rect = canvas.getBoundingClientRect();
      ripples.push({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        t0: now.getTime(),
        r0: 8
      });
    }

    resize();
    spawnParticles(Math.floor(Math.min(140, Math.max(70, w * 0.12))));
    window.addEventListener('resize', function () {
      resize();
      spawnParticles(Math.floor(Math.min(140, Math.max(70, w * 0.12))));
    });
    hero.addEventListener('click', onClick);

    document.addEventListener('visibilitychange', function () {
      running = document.visibilityState !== 'hidden';
      if (running) window.requestAnimationFrame(render);
    });

    window.requestAnimationFrame(render);
  }

  function getAnimalSvg(key) {
    if (key === 'dawn') {
      return '<svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M28 78c12-6 22-18 26-52" stroke="currentColor" stroke-opacity=".58" stroke-width="4" stroke-linecap="round"/><path d="M54 26c10-10 24-13 38-9" stroke="currentColor" stroke-opacity=".35" stroke-width="4" stroke-linecap="round"/><path class="wing" d="M45 46c18 5 31 18 37 38" stroke="currentColor" stroke-opacity=".40" stroke-width="4" stroke-linecap="round"/><path d="M34 78V60" stroke="currentColor" stroke-opacity=".58" stroke-width="4" stroke-linecap="round"/><path d="M58 60c4-12 3-22-6-34" stroke="currentColor" stroke-opacity=".20" stroke-width="4" stroke-linecap="round"/><path d="M62 34c4 0 7-2 10-6" stroke="currentColor" stroke-opacity=".25" stroke-width="4" stroke-linecap="round"/></svg>';
    }
    if (key === 'noon') {
      return '<svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M30 56c10-18 28-18 38 0" stroke="currentColor" stroke-opacity=".52" stroke-width="4" stroke-linecap="round"/><path d="M36 56c6 14 16 21 30 21" stroke="currentColor" stroke-opacity=".38" stroke-width="4" stroke-linecap="round"/><path class="tail" d="M26 48c-7 5-10 12-10 19 7-3 14-3 21 0" stroke="currentColor" stroke-opacity=".58" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M60 50c10-10 20-14 30-14" stroke="currentColor" stroke-opacity=".18" stroke-width="4" stroke-linecap="round"/><path d="M52 60c2 3 5 4 8 4" stroke="currentColor" stroke-opacity=".20" stroke-width="4" stroke-linecap="round"/></svg>';
    }
    if (key === 'afternoon') {
      return '<svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M22 62c0-20 18-36 40-36s40 16 40 36" stroke="currentColor" stroke-opacity=".46" stroke-width="4" stroke-linecap="round"/><path d="M30 26c-6-10-3-19 7-23" stroke="currentColor" stroke-opacity=".30" stroke-width="4" stroke-linecap="round"/><path d="M94 26c6-10 3-19-7-23" stroke="currentColor" stroke-opacity=".30" stroke-width="4" stroke-linecap="round"/><path class="mouth" d="M48 66c6 3 12 3 18 0" stroke="currentColor" stroke-opacity=".58" stroke-width="4" stroke-linecap="round"/><path d="M44 54c4-2 8-2 12 0" stroke="currentColor" stroke-opacity=".18" stroke-width="4" stroke-linecap="round"/><path d="M70 58c2 6 6 10 12 12" stroke="currentColor" stroke-opacity=".16" stroke-width="4" stroke-linecap="round"/></svg>';
    }
    if (key === 'night') {
      return '<svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M68 18c12 4 22 17 22 33 0 21-17 38-38 38-18 0-32-11-36-26" stroke="currentColor" stroke-opacity=".50" stroke-width="4" stroke-linecap="round"/><path d="M40 74c7 8 19 12 33 12" stroke="currentColor" stroke-opacity=".34" stroke-width="4" stroke-linecap="round"/><path d="M68 24c-6 12-6 22 0 32" stroke="currentColor" stroke-opacity=".16" stroke-width="4" stroke-linecap="round"/><path class="star" d="M22 26l4 8 9 3-9 3-4 8-4-8-9-3 9-3 4-8Z" fill="currentColor" fill-opacity=".18"/></svg>';
    }
    return '<svg viewBox="0 0 96 96" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M26 68c0-16 15-30 34-30s34 14 34 30" stroke="currentColor" stroke-opacity=".40" stroke-width="4" stroke-linecap="round"/><path class="antler" d="M40 38c-8-14-22-21-36-20 10 6 14 13 14 23-7-6-14-7-22-4 15 6 23 18 25 34" stroke="currentColor" stroke-opacity=".62" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path class="antler" d="M56 38c8-14 22-21 36-20-10 6-14 13-14 23 7-6 14-7 22-4-15 6-23 18-25 34" stroke="currentColor" stroke-opacity=".62" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><path d="M48 72c4 3 9 3 13 0" stroke="currentColor" stroke-opacity=".16" stroke-width="4" stroke-linecap="round"/></svg>';
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
