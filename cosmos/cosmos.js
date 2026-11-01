/* COSMOS — 共用互動層：星空、導覽、進場、音景、上一頁/下一頁 */
(function () {
  'use strict';
  var script = document.currentScript;
  var BASE = script ? script.src.replace(/cosmos\/cosmos\.js.*$/, '') : '';
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var path = decodeURIComponent(location.pathname);
  var inPlanet = /\/planet\/planet_/.test(path);
  var inZodiac = /\/zodiac\/zodiac_/.test(path);
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  var COSMOS = window.COSMOS = {
    anim: store.get('cosmos-anim') !== '0', cbs: [],
    setAnim: function (v) { this.anim = !!v; store.set('cosmos-anim', v ? '1' : '0'); document.documentElement.classList.toggle('no-anim', !v); this.cbs.forEach(function (f) { f(!!v); }); },
    onAnim: function (f) { this.cbs.push(f); }
  };
  document.documentElement.classList.toggle('no-anim', !COSMOS.anim);

  document.addEventListener('DOMContentLoaded', function () {
    document.body.classList.add('cosmos-enter');
    if (inPlanet) document.body.classList.add('sub-planet');
    if (inZodiac) document.body.classList.add('sub-zodiac');
    buildBackground(); buildStars(); buildProgress();
    enhanceNav(); accentFromPage(); buildPager();
    setupReveal(); setupSpotlight(); buildFabs(); enhanceSlider(); buildTrail();
  });

  /* ---------- 動態背景 ---------- */
  function buildBackground() {
    var bg = document.createElement('div');
    bg.className = 'cosmos-bg';
    bg.innerHTML = '<i class="a1"></i><i class="a2"></i><i class="a3"></i>';
    document.body.insertBefore(bg, document.body.firstChild);
  }

  /* 把星座頁的主題色套到極光上 */
  function accentFromPage() {
    if (!inZodiac) return;
    var h = $('.zodiac-header h1');
    if (h) document.documentElement.style.setProperty('--accent', getComputedStyle(h).color);
  }

  /* ---------- 星空（三層視差 + 閃爍 + 流星） ---------- */
  function buildStars() {
    var c = document.createElement('canvas');
    c.id = 'cosmos-stars';
    document.body.insertBefore(c, document.body.firstChild);
    var x = c.getContext('2d'), W, H, dpr, stars = [], shoots = [], mx = 0, my = 0, tx = 0, ty = 0, running = true;

    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = c.width = innerWidth * dpr; H = c.height = innerHeight * dpr;
      var n = Math.min(260, Math.floor(innerWidth * innerHeight / 7000));
      stars = [];
      for (var i = 0; i < n; i++) {
        var layer = Math.random() < .6 ? 0 : (Math.random() < .7 ? 1 : 2);
        stars.push({
          x: Math.random() * W, y: Math.random() * H, l: layer,
          r: (layer * .45 + .5 + Math.random() * .7) * dpr,
          a: .35 + Math.random() * .65, p: Math.random() * 6.28, s: .5 + Math.random() * 1.6,
          h: Math.random() < .18 ? 45 : (Math.random() < .3 ? 280 : 215)
        });
      }
    }
    size(); addEventListener('resize', size);
    addEventListener('pointermove', function (e) { tx = e.clientX / innerWidth - .5; ty = e.clientY / innerHeight - .5; }, { passive: true });
    document.addEventListener('visibilitychange', function () { running = !document.hidden; if (running) frame(); });

    function spawnShoot() {
      if (!running || reduce || !COSMOS.anim) return;
      shoots.push({ x: Math.random() * W * .8, y: Math.random() * H * .4, vx: (7 + Math.random() * 5) * dpr, vy: (3 + Math.random() * 3) * dpr, life: 1 });
    }
    (function loop() { setTimeout(function () { spawnShoot(); loop(); }, 6000 + Math.random() * 9000); })();

    var t = 0;
    function frame() {
      if (!running) return;
      t += .016; mx += ((COSMOS.anim ? tx : 0) - mx) * .04; my += ((COSMOS.anim ? ty : 0) - my) * .04;
      x.clearRect(0, 0, W, H);
      for (var i = 0; i < stars.length; i++) {
        var s = stars[i], d = (s.l + 1) * 7 * dpr;
        var px = ((s.x - mx * d) % W + W) % W, py = ((s.y - my * d) % H + H) % H;
        var tw = (reduce || !COSMOS.anim) ? 1 : .55 + .45 * Math.sin(t * s.s + s.p);
        x.globalAlpha = s.a * tw;
        x.fillStyle = 'hsl(' + s.h + ',70%,' + (s.h === 215 ? 88 : 78) + '%)';
        x.beginPath(); x.arc(px, py, s.r, 0, 6.283); x.fill();
        if (s.l === 2 && s.r > 1.4 * dpr) { x.globalAlpha *= .25; x.beginPath(); x.arc(px, py, s.r * 3.2, 0, 6.283); x.fill(); }
      }
      for (var j = shoots.length - 1; j >= 0; j--) {
        var m = shoots[j]; m.x += m.vx; m.y += m.vy; m.life -= .016;
        var g = x.createLinearGradient(m.x, m.y, m.x - m.vx * 9, m.y - m.vy * 9);
        g.addColorStop(0, 'rgba(255,255,255,' + m.life + ')'); g.addColorStop(1, 'rgba(160,180,255,0)');
        x.globalAlpha = 1; x.strokeStyle = g; x.lineWidth = 1.6 * dpr;
        x.beginPath(); x.moveTo(m.x, m.y); x.lineTo(m.x - m.vx * 9, m.y - m.vy * 9); x.stroke();
        if (m.life <= 0) shoots.splice(j, 1);
      }
      x.globalAlpha = 1;
      if (!reduce) requestAnimationFrame(frame);
    }
    frame();
  }

  function buildProgress() {
    var p = document.createElement('div'); p.className = 'cosmos-progress'; document.body.appendChild(p);
    var tick = false;
    function upd() {
      var h = document.documentElement.scrollHeight - innerHeight;
      p.style.transform = 'scaleX(' + (h > 0 ? Math.min(1, scrollY / h) : 0) + ')';
      var up = $('.to-top'); if (up) up.classList.toggle('show', scrollY > 500);
      tick = false;
    }
    addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
    upd();
  }

  /* ---------- 導覽列：品牌、目前頁面、手機選單 ---------- */
  function enhanceNav() {
    var nav = $('.top-nav'); if (!nav) return;
    var logo = $('.logo-link', nav);
    if (logo) {
      logo.className = 'brand';
      logo.setAttribute('aria-label', '星宇・探索 首頁');
      logo.innerHTML = '<svg viewBox="0 0 40 40" fill="none"><defs><linearGradient id="bg1" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#9d8cff"/><stop offset="1" stop-color="#5eead4"/></linearGradient></defs><circle cx="20" cy="20" r="7" fill="url(#bg1)"/><ellipse cx="20" cy="20" rx="17" ry="6.5" stroke="url(#bg1)" stroke-width="1.5" transform="rotate(-24 20 20)"/><circle cx="34" cy="12" r="2" fill="#fde7a5"/></svg><span>星宇<small>EXPLORER</small></span>';
    }
    var file = (path.split('/').pop() || 'index.html');
    $$('.menu-item', nav).forEach(function (a) {
      var h = a.getAttribute('href');
      if (inPlanet && /SEplanets/.test(h)) a.classList.add('active');
      else if (inZodiac && /SEother/.test(h)) a.classList.add('active');
      else if (h.split('/').pop() === file || (file === '' && /index/.test(h))) a.classList.add('active');
    });
    var btn = document.createElement('button');
    btn.className = 'nav-btn nav-toggle'; btn.setAttribute('aria-label', '開啟選單'); btn.innerHTML = '☰';
    nav.appendChild(btn);
    var menu = $('.menu', nav);
    btn.addEventListener('click', function () { var o = menu.classList.toggle('open'); btn.innerHTML = o ? '✕' : '☰'; });
    menu.addEventListener('click', function (e) { if (e.target.closest('a')) menu.classList.remove('open'); });
  }

  /* ---------- 進場 / 光暈 ---------- */
  function setupReveal() {
    var sel = '.hero > *,.stat,.feature-card,.announcement-board,.slider-container,.system-box,.planet-card,.glass-card,.fortune-item,.element-card,.about-card,.section-head,body.sub-planet main,.pager a';
    var els = $$(sel);
    if (!('IntersectionObserver' in window) || reduce) return;
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: .08, rootMargin: '0px 0px -40px 0px' });
    els.forEach(function (el, i) { el.classList.add('reveal'); el.style.setProperty('--i', i % 8); io.observe(el); });
    /* 動態顯示（例如點進太陽系列表）的卡片 */
    new MutationObserver(function () {
      $$('.planet-card:not(.reveal),.glass-card:not(.reveal)').forEach(function (el, i) {
        el.classList.add('reveal'); el.style.setProperty('--i', i % 8); io.observe(el);
      });
    }).observe(document.body, { subtree: true, attributes: true, attributeFilter: ['style', 'class'] });
  }
  function setupSpotlight() {
    document.addEventListener('pointermove', function (e) {
      var el = e.target.closest && e.target.closest('.glass,.system-box,.planet-card,.glass-card,.element-card,.feature-card,.stat');
      if (!el) return;
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px'); el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    }, { passive: true });
  }

  /* ---------- 浮動按鈕：宇宙音景、回到頂端 ---------- */
  function buildFabs() {
    var up = document.createElement('button');
    up.className = 'nav-btn to-top'; up.setAttribute('aria-label', '回到頂端'); up.innerHTML = '↑';
    up.onclick = function () { scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); };
    document.body.appendChild(up);

    var fab = document.createElement('button');
    fab.className = 'sound-fab'; fab.setAttribute('aria-pressed', 'false');
    fab.innerHTML = '<span class="bars"><i></i><i></i><i></i></span><span>宇宙音景</span>';
    document.body.appendChild(fab);
    var af = document.createElement('button');
    af.className = 'sound-fab anim-fab';
    function afLab() { af.innerHTML = '<span class="ico">✨</span><span>動畫 ' + (COSMOS.anim ? '開' : '關') + '</span>'; af.classList.toggle('on', COSMOS.anim); af.setAttribute('aria-pressed', COSMOS.anim); }
    af.onclick = function () { COSMOS.setAnim(!COSMOS.anim); }; COSMOS.onAnim(afLab); afLab();
    document.body.appendChild(af);
    var ac, master, nodes = [], on = false;

    function start() {
      var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
      ac = ac || new AC();
      master = ac.createGain(); master.gain.value = 0;
      var lp = ac.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; lp.Q.value = .4;
      var lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = .07; lg.gain.value = 380;
      lfo.connect(lg); lg.connect(lp.frequency); lfo.start();
      var dl = ac.createDelay(1); dl.delayTime.value = .55; var fb = ac.createGain(); fb.gain.value = .45;
      dl.connect(fb); fb.connect(dl);
      lp.connect(master); lp.connect(dl); dl.connect(master); master.connect(ac.destination);
      [110, 164.81, 220, 277.18, 329.63, 415.3].forEach(function (f, i) {
        var o = ac.createOscillator(), g = ac.createGain();
        o.type = i % 2 ? 'sine' : 'triangle'; o.frequency.value = f; o.detune.value = (Math.random() - .5) * 14;
        g.gain.value = .05 / (1 + i * .35);
        var l2 = ac.createOscillator(), l2g = ac.createGain(); l2.frequency.value = .05 + Math.random() * .08; l2g.gain.value = g.gain.value * .6;
        l2.connect(l2g); l2g.connect(g.gain); l2.start();
        o.connect(g); g.connect(lp); o.start(); nodes.push(o, l2);
      });
      nodes.push(lfo);
      return true;
    }
    function toggle() {
      if (!on) {
        if (!ac || !master) { if (!start()) return; }
        ac.resume(); master.gain.cancelScheduledValues(ac.currentTime);
        master.gain.linearRampToValueAtTime(.55, ac.currentTime + 3); on = true;
      } else {
        master.gain.cancelScheduledValues(ac.currentTime);
        master.gain.linearRampToValueAtTime(0, ac.currentTime + 1.2);
        setTimeout(function () { if (!on && ac) ac.suspend(); }, 1400); on = false;
      }
      fab.classList.toggle('on', on); fab.setAttribute('aria-pressed', on);
      store.set('cosmos-sound', on ? '1' : '0');
    }
    fab.addEventListener('click', toggle);
    /* 瀏覽器限制：需有手勢才能播放。若上次為開啟，首次互動時自動恢復 */
    if (store.get('cosmos-sound') === '1') {
      var once = function () { removeEventListener('pointerdown', once); if (!on) toggle(); };
      addEventListener('pointerdown', once);
    }
  }

  /* ---------- 輪播強化（首頁） ---------- */
  function enhanceSlider() {
    var box = $('.slider-container'), s = $('#main-slider'); if (!box || !s) return;
    var slides = $$('.slide', s), dots = $$('.dot', box), cur = 0, timer, DUR = 6500;
    var bar = document.createElement('div'); bar.className = 'slider-progress'; box.appendChild(bar);
    ['prev', 'next'].forEach(function (d) {
      var b = document.createElement('button'); b.className = 'slider-arrow ' + d; b.setAttribute('aria-label', d === 'prev' ? '上一張' : '下一張');
      b.innerHTML = d === 'prev' ? '‹' : '›';
      b.onclick = function (e) { e.stopPropagation(); go(cur + (d === 'prev' ? -1 : 1), true); };
      box.appendChild(b);
    });
    dots.forEach(function (d, i) { d.removeAttribute('onclick'); d.setAttribute('role', 'button'); d.tabIndex = 0; d.onclick = function (e) { e.stopPropagation(); go(i, true); }; d.onkeydown = function (e) { if (e.key === 'Enter') go(i, true); }; });
    function mark() {
      slides.forEach(function (el, i) { el.classList.toggle('is-active', i === cur); });
      dots.forEach(function (el, i) { el.classList.toggle('active', i === cur); });
    }
    function progress() {
      bar.style.transition = 'none'; bar.style.transform = 'scaleX(0)';
      void bar.offsetWidth;
      if (!reduce) { bar.style.transition = 'transform ' + DUR + 'ms linear'; bar.style.transform = 'scaleX(1)'; }
    }
    function go(i, user) {
      cur = (i + slides.length) % slides.length;
      s.scrollTo({ left: s.clientWidth * cur, behavior: reduce ? 'auto' : 'smooth' });
      mark(); restart();
    }
    function restart() { clearTimeout(timer); if (!COSMOS.anim) { bar.style.transition = 'none'; bar.style.transform = 'scaleX(0)'; return; } progress(); timer = setTimeout(function () { go(cur + 1); }, DUR); }
    COSMOS.onAnim(function () { restart(); });
    s.addEventListener('scroll', function () {
      var i = Math.round(s.scrollLeft / s.clientWidth); if (i !== cur && i >= 0 && i < slides.length) { cur = i; mark(); }
    }, { passive: true });
    box.addEventListener('mouseenter', function () { clearTimeout(timer); bar.style.transition = 'none'; });
    box.addEventListener('mouseleave', restart);
    box.setAttribute('tabindex', '0');
    box.addEventListener('keydown', function (e) { if (e.key === 'ArrowLeft') go(cur - 1, true); if (e.key === 'ArrowRight') go(cur + 1, true); });
    mark(); restart();
  }


  /* ---------- 游標星塵（僅在頁面沒有自己的特效時啟用） ---------- */
  function buildTrail() {
    if (reduce || $('#magic-canvas') || $('#effect-canvas') || matchMedia('(pointer: coarse)').matches) return;
    var c = document.createElement('canvas');
    c.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9999';
    document.body.appendChild(c);
    var x = c.getContext('2d'), P = [], R = [];
    function rs() { c.width = innerWidth; c.height = innerHeight; } rs(); addEventListener('resize', rs);
    var hues = [175, 255, 45, 210];
    addEventListener('pointermove', function (e) {
      if (!COSMOS.anim) return;
      for (var i = 0; i < 2; i++) P.push({ x: e.clientX, y: e.clientY, vx: (Math.random() - .5) * 1.2, vy: -Math.random() * .9 - .1, r: Math.random() * 1.8 + .6, l: 1, d: Math.random() * .02 + .014, h: hues[Math.random() * 4 | 0] });
    }, { passive: true });
    addEventListener('click', function (e) {
      R.push({ x: e.clientX, y: e.clientY, r: 2, l: 1 });
      for (var i = 0; i < 10; i++) { var a = Math.random() * 6.28, v = Math.random() * 3 + 1; P.push({ x: e.clientX, y: e.clientY, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: Math.random() * 2 + 1, l: 1, d: .02, h: hues[Math.random() * 4 | 0] }); }
    });
    (function loop() {
      x.clearRect(0, 0, c.width, c.height); x.globalCompositeOperation = 'lighter';
      for (var i = P.length - 1; i >= 0; i--) {
        var p = P[i]; p.x += p.vx; p.y += p.vy; p.vx *= .985; p.vy *= .985; p.l -= p.d;
        if (p.l <= 0) { P.splice(i, 1); continue; }
        x.fillStyle = 'hsla(' + p.h + ',90%,72%,' + p.l + ')'; x.shadowBlur = 8; x.shadowColor = x.fillStyle;
        x.beginPath(); x.arc(p.x, p.y, p.r, 0, 6.283); x.fill();
      }
      x.shadowBlur = 0;
      for (var j = R.length - 1; j >= 0; j--) {
        var q = R[j]; q.r += (60 - q.r) * .1; q.l -= .028;
        if (q.l <= 0) { R.splice(j, 1); continue; }
        x.strokeStyle = 'hsla(255,90%,75%,' + q.l + ')'; x.lineWidth = 1.5; x.beginPath(); x.arc(q.x, q.y, q.r, 0, 6.283); x.stroke();
      }
      requestAnimationFrame(loop);
    })();
  }

  /* ---------- 上一個 / 下一個 ---------- */
  function buildPager() {
    var list, dir, host, file = path.split('/').pop();
    if (inPlanet) {
      list = [['planet_sun.html', '太陽'], ['planet_merc.html', '水星'], ['planet_venus.html', '金星'], ['planet_earth.html', '地球'], ['planet_mars.html', '火星'], ['planet_asteroid.html', '小行星帶'], ['planet_jupiter.html', '木星'], ['planet_saturn.html', '土星'], ['planet_uranus.html', '天王星'], ['planet_neptune.html', '海王星']];
      host = $('main');
    } else if (inZodiac) {
      list = [['aries', '白羊座'], ['taurus', '金牛座'], ['gemini', '雙子座'], ['cancer', '巨蟹座'], ['leo', '獅子座'], ['virgo', '處女座'], ['libra', '天秤座'], ['scorpio', '天蠍座'], ['sagittarius', '射手座'], ['capricorn', '摩羯座'], ['aquarius', '水瓶座'], ['pisces', '雙魚座']].map(function (a) { return ['zodiac_' + a[0] + '.html', a[1]]; });
      host = $('.container');
    } else return;
    var i = -1; list.forEach(function (it, k) { if (it[0] === file) i = k; }); if (i < 0 || !host) return;
    var prev = list[(i - 1 + list.length) % list.length], next = list[(i + 1) % list.length];
    var nav = document.createElement('nav'); nav.className = 'pager'; nav.setAttribute('aria-label', '上一個與下一個');
    nav.innerHTML = '<a class="prev" href="' + prev[0] + '"><small>← PREV</small><b>' + prev[1] + '</b></a><a class="next" href="' + next[0] + '"><small>NEXT →</small><b>' + next[1] + '</b></a>';
    if (inPlanet) host.parentNode.insertBefore(nav, host.nextSibling); else host.appendChild(nav);
    document.addEventListener('keydown', function (e) {
      if (e.target.closest && e.target.closest('input,textarea,select')) return;
      if (e.key === 'ArrowLeft') location.href = prev[0]; if (e.key === 'ArrowRight') location.href = next[0];
    });
  }
})();
