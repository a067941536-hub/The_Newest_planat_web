/* 宇宙神社：場景、搖籤動畫、音效、籤紙 */
(function () {
  'use strict';
  var SH = window.SHRINE, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s) { return document.querySelector(s); };
  var entry = $('#entry'), shrine = $('#shrine'), box = $('#box'), hint = $('#hint'), btn = $('#btnShake'), tag = $('#noTag');
  var paperWrap = $('#paperWrap'), paper = $('#paper');
  var cur = null, state = 'idle', lastNo = 0, muted = false, timers = [];
  var store = { get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} } };
  muted = store.get('shrine-mute') === '1';
  function later(fn, ms) { var t = setTimeout(fn, ms); timers.push(t); return t; }
  function clearTimers() { timers.forEach(clearTimeout); timers = []; }
  function rnd(a) { return a[Math.floor(Math.random() * a.length)]; }

  /* ---------- 入口：四座神社 ---------- */
  var ICON = {
    fire: '<svg viewBox="0 0 64 64" fill="none"><path d="M32 6c3 10 14 15 14 29a14 14 0 0 1-28 0c0-6 3-9 6-13 1 5 4 7 6 7-2-8 0-15 2-23z" fill="currentColor" fill-opacity=".25" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><path d="M32 34c2 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-5 3-7 1 2 2 3 3 3-1-3 0-5 0-7z" fill="currentColor"/></svg>',
    earth: '<svg viewBox="0 0 64 64" fill="none"><path d="M6 52 24 20l10 16 8-12 16 28z" fill="currentColor" fill-opacity=".25" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><path d="M18 52 24 40l6 12" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><circle cx="48" cy="14" r="5" fill="currentColor"/></svg>',
    water: '<svg viewBox="0 0 64 64" fill="none"><path d="M32 6C22 20 14 29 14 40a18 18 0 0 0 36 0C50 29 42 20 32 6z" fill="currentColor" fill-opacity=".25" stroke="currentColor" stroke-width="2.4" stroke-linejoin="round"/><path d="M23 41a9 9 0 0 0 8 9" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>',
    air: '<svg viewBox="0 0 64 64" fill="none"><path d="M6 24h32a7 7 0 1 0-7-7" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M6 36h44a7 7 0 1 1-7 7" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M6 48h20" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>'
  };
  var grid = $('#elGrid');
  Object.keys(SH.shrines).forEach(function (k) {
    var s = SH.shrines[k], b = document.createElement('button');
    b.className = 'el-card glass'; b.style.setProperty('--tc', s.color); b.style.color = '#fff';
    b.innerHTML = '<span style="color:' + s.color + ';display:grid">' + ICON[k] + '</span><small>' + s.en + '</small><h3>' + s.name + '</h3><div class="signs">' + s.signs + '</div><span class="vibe">' + s.vibe + '</span>';
    b.onclick = function () { enter(k); };
    grid.appendChild(b);
  });

  /* ---------- 籤筒中的籤 ---------- */
  (function () {
    var g = '', n = 13;
    for (var i = 0; i < n; i++) {
      var r = (-24 + i * (48 / (n - 1))) + (Math.random() - .5) * 3, y = 28 + Math.random() * 18, d = (Math.random() * -.2).toFixed(2);
      g += '<g class="stick" style="--r:' + r.toFixed(1) + 'deg;--d:' + d + 's"><rect class="bar" x="86" y="' + y.toFixed(1) + '" width="8" height="122" rx="3"/><rect class="tip" x="86" y="' + y.toFixed(1) + '" width="8" height="16" rx="3"/></g>';
    }
    $('#sticks').innerHTML = g;
  })();

  /* ---------- 紀錄 ---------- */
  function hist() { try { return JSON.parse(store.get('shrine-hist') || '[]'); } catch (e) { return []; } }
  function renderHist() {
    var h = hist(), el = $('#hist'); if (!h.length) { el.hidden = true; return; }
    el.hidden = false;
    el.innerHTML = '<span class="hist-head">最近抽到的籤<button id="hClr">清除</button></span><div class="row">' + h.map(function (x) {
      var d = new Date(x.t); return '<span class="h" style="--lc:' + x.c + '"><b>' + x.n + '</b><span>' + SH.shrines[x.e].name + '</span><em>' + (d.getMonth() + 1) + '/' + d.getDate() + '</em></span>'; }).join('') + '</div>';
    $('#hClr').onclick = function () { store.set('shrine-hist', '[]'); renderHist(); };
  }
  renderHist();

  /* ---------- 進入 / 離開 ---------- */
  function enter(k) {
    cur = k; var s = SH.shrines[k];
    shrine.style.setProperty('--tc', s.color); paper.style.setProperty('--tc', s.color);
    document.documentElement.style.setProperty('--accent', s.color);
    $('#sEn').textContent = s.en + ' SHRINE'; $('#sName').textContent = s.name; $('#sSigns').textContent = s.signs + ' ・ ' + s.vibe;
    entry.style.display = 'none'; shrine.classList.add('show'); scrollTo(0, 0); reset(); fx.ambient(true); fx.setColor(s.color);
  }
  function leave() {
    clearTimers(); closePaper(true); shrine.classList.remove('show'); entry.style.display = ''; fx.ambient(false);
    document.documentElement.style.setProperty('--accent', '#8b7cf6'); renderHist(); cur = null;
  }
  $('#btnBack').onclick = leave;
  function reset() {
    state = 'idle'; box.classList.remove('shaking', 'busy'); tag.classList.remove('show');
    document.querySelectorAll('.stick.pick').forEach(function (s) { s.classList.remove('pick'); });
    btn.disabled = false; btn.textContent = '搖　籤'; hint.textContent = '心裡默想一個問題，然後搖一搖籤筒';
  }

  /* ---------- 抽籤 ---------- */
  function weighted() { var t = 0; SH.levels.forEach(function (l) { t += l.w; }); var r = Math.random() * t; for (var i = 0; i < SH.levels.length; i++) { r -= SH.levels[i].w; if (r <= 0) return SH.levels[i]; } return SH.levels[1]; }
  function draw(k) {
    var s = SH.shrines[k], lv = weighted(), pool = SH.text[k][lv.up ? 'up' : 'down'], no;
    do { no = 1 + Math.floor(Math.random() * 100); } while (no === lastNo); lastNo = no;
    var col = rnd(s.luckyColors);
    return { e: k, no: no, lv: lv, poem: rnd(lv.poems), rows: SH.fields.map(function (f) { return { l: f[1], i: f[2], t: rnd(pool[f[0]]) }; }),
      color: col, item: rnd(s.items), num: 1 + Math.floor(Math.random() * 99) };
  }

  /* ---------- 音效 ---------- */
  var ac = null;
  function ctx() { if (!ac) { var A = window.AudioContext || window.webkitAudioContext; if (A) ac = new A(); } if (ac && ac.state === 'suspended') ac.resume(); return ac; }
  function rattle(dur) {
    if (muted) return; var a = ctx(); if (!a) return;
    var len = a.sampleRate * .05, buf = a.createBuffer(1, len, a.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
    var t = 0;
    while (t < dur) {
      var src = a.createBufferSource(), f = a.createBiquadFilter(), g = a.createGain(); src.buffer = buf;
      f.type = 'bandpass'; f.frequency.value = 1400 + Math.random() * 3000; f.Q.value = 1.4;
      var vol = (.05 + Math.random() * .12) * (1 - t / dur * .6); g.gain.value = vol;
      src.connect(f); f.connect(g); g.connect(a.destination); src.start(a.currentTime + t);
      t += .045 + Math.random() * .09;
    }
  }
  function chime(big) {
    if (muted) return; var a = ctx(); if (!a) return; var now = a.currentTime;
    [[784, .16], [1175, .1], [1568, .07], [2093, .035]].forEach(function (p, i) {
      var o = a.createOscillator(), g = a.createGain(); o.type = 'sine'; o.frequency.value = p[0] * (big ? 1 : .75);
      g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(p[1], now + .01); g.gain.exponentialRampToValueAtTime(.0001, now + (big ? 3.2 : 1.8) - i * .2);
      o.connect(g); g.connect(a.destination); o.start(now); o.stop(now + 3.4);
    });
  }
  var mb = $('#btnMute');
  function syncMute() { mb.textContent = muted ? '🔕 靜音' : '🔔 音效'; mb.setAttribute('aria-pressed', muted); }
  mb.onclick = function () { muted = !muted; store.set('shrine-mute', muted ? '1' : '0'); syncMute(); }; syncMute();

  /* ---------- 搖籤流程 ---------- */
  function shake() {
    if (state !== 'idle' || !cur) return; state = 'shaking';
    var res = draw(cur), T = reduce ? 500 : 2500;
    btn.disabled = true; btn.textContent = '搖啊搖…'; hint.textContent = '專心想著你的問題…';
    box.classList.add('busy', 'shaking'); rattle(T / 1000 - .2);
    later(function () { // 籤掉出來
      box.classList.remove('shaking'); state = 'pick';
      var sticks = document.querySelectorAll('.stick'), pk = sticks[Math.floor(sticks.length / 2) + (Math.random() < .5 ? -1 : 1)] || sticks[0];
      pk.classList.add('pick'); tag.textContent = '第 ' + res.no + ' 番'; tag.classList.add('show');
      hint.textContent = '籤出來了！'; chime(false);
      var r = box.getBoundingClientRect(); fx.burst(r.left + r.width / 2, r.top + r.height * .1, 36, 4);
    }, T);
    later(function () { // 展開籤紙
      var r = box.getBoundingClientRect(); fx.burst(r.left + r.width / 2, r.top + r.height * .3, 90, 7);
      openPaper(res); chime(true);
    }, T + (reduce ? 400 : 1700));
  }
  btn.onclick = shake; box.onclick = shake;
  box.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); shake(); } });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && paperWrap.classList.contains('show')) closePaper();
    else if (e.code === 'Space' && shrine.classList.contains('show') && state === 'idle' && document.activeElement === document.body) { e.preventDefault(); shake(); }
  });

  /* ---------- 籤紙 ---------- */
  var lastRes = null;
  function openPaper(r) {
    lastRes = r; state = 'result'; var s = SH.shrines[r.e], i = 0;
    paper.style.setProperty('--lc', r.lv.c);
    paper.innerHTML = '<div class="roller top"></div><div class="paper-in"><div class="pp">' +
      '<div class="p-head" style="--i:' + (i++) + '">' + s.name + '<b>' + r.lv.n + '籤</b><span class="p-no">第 ' + r.no + ' 番</span></div>' +
      '<div class="seal-row"><div class="seal">' + r.lv.n + '</div></div>' +
      '<div class="poem" style="--i:' + (i++) + '">' + r.poem[0] + '<br>' + r.poem[1] + '</div>' +
      '<p class="gist" style="--i:' + (i++) + '">' + r.lv.gist + '</p>' +
      '<div class="rows">' + r.rows.map(function (w) { return '<div class="rw" style="--i:' + (i++) + '"><span>' + w.i + ' ' + w.l + '</span><p>' + w.t + '</p></div>'; }).join('') + '</div>' +
      '<div class="lk" style="--i:' + (i++) + '"><div><small>幸運色</small><b><i style="background:' + r.color[1] + '"></i>' + r.color[0] + '</b></div><div><small>幸運物</small><b>' + r.item + '</b></div><div><small>幸運數字</small><b>' + r.num + '</b></div></div>' +
      '<p class="p-note" style="--i:' + (i++) + '">籤運只是參考，今天的你，依然值得好好過。</p>' +
      '<div class="p-actions" style="--i:' + (i++) + '"><button class="pri" id="pAgain">再抽一次</button><button id="pCopy">複製籤文</button><button id="pClose">關閉</button></div>' +
      '</div><div class="roller bot"></div></div>';
    paperWrap.classList.add('show'); paperWrap.scrollTop = 0;
    // 紀錄
    var h = hist(); h.unshift({ e: r.e, n: r.lv.n, c: r.lv.c, t: Date.now() }); store.set('shrine-hist', JSON.stringify(h.slice(0, 6)));
    $('#pAgain').onclick = function () { closePaper(); later(shake, 350); };
    $('#pClose').onclick = function () { closePaper(); };
    $('#pCopy').onclick = function () { copy(this); };
    later(function () { var b = $('#pAgain'); if (b) b.focus({ preventScroll: true }); }, 2200);
  }
  function closePaper(silent) {
    paperWrap.classList.remove('show'); paper.innerHTML = ''; if (!silent && cur) reset();
  }
  paperWrap.addEventListener('click', function (e) { if (e.target === paperWrap) closePaper(); });
  function copy(b) {
    var r = lastRes, s = SH.shrines[r.e];
    var t = '【' + s.name + '・第' + r.no + '番・' + r.lv.n + '】\n' + r.poem[0] + '\n' + r.poem[1] + '\n' + r.lv.gist + '\n\n' +
      r.rows.map(function (w) { return w.l + '：' + w.t; }).join('\n') + '\n\n幸運色：' + r.color[0] + '　幸運物：' + r.item + '　幸運數字：' + r.num + '\n— 星宇・探索 宇宙神社';
    function ok() { b.textContent = '已複製 ✓'; setTimeout(function () { b.textContent = '複製籤文'; }, 1600); }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(t).then(ok, ok);
    else { var ta = document.createElement('textarea'); ta.value = t; document.body.appendChild(ta); ta.select(); try { document.execCommand('copy'); } catch (e) {} ta.remove(); ok(); }
  }

  /* ---------- 粒子特效 ---------- */
  var fx = (function () {
    var c = $('#fx'), x = c.getContext('2d'), W, H, dpr, P = [], A = [], on = false, run = false, col = '#8b7cf6', rgb = [139, 124, 246];
    function rs() { dpr = Math.min(devicePixelRatio || 1, 2); W = innerWidth; H = innerHeight; c.width = W * dpr; c.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0); }
    rs(); addEventListener('resize', rs);
    function hex(h) { var n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
    function mk() { return { x: Math.random() * W, y: H + Math.random() * 60, vy: -(.2 + Math.random() * .5), r: 1 + Math.random() * 2.6, a: .15 + Math.random() * .5, ph: Math.random() * 6.28, dx: (Math.random() - .5) * .2 }; }
    function loop() {
      if (!on && !P.length) { run = false; x.clearRect(0, 0, W, H); return; }
      x.clearRect(0, 0, W, H); x.globalCompositeOperation = 'lighter';
      if (on && !reduce) { while (A.length < 46) A.push(mk()); }
      for (var i = A.length - 1; i >= 0; i--) {
        var a = A[i]; a.y += a.vy; a.x += a.dx + Math.sin(a.ph += .02) * .3;
        if (a.y < -20 || !on) { if (on) A[i] = mk(); else A.splice(i, 1); continue; }
        var g = x.createRadialGradient(a.x, a.y, 0, a.x, a.y, a.r * 5); g.addColorStop(0, 'rgba(' + rgb + ',' + a.a + ')'); g.addColorStop(1, 'rgba(' + rgb + ',0)');
        x.fillStyle = g; x.beginPath(); x.arc(a.x, a.y, a.r * 5, 0, 6.283); x.fill();
      }
      for (var j = P.length - 1; j >= 0; j--) {
        var p = P[j]; p.x += p.vx; p.y += p.vy; p.vy += .05; p.vx *= .985; p.l -= p.d;
        if (p.l <= 0) { P.splice(j, 1); continue; }
        x.fillStyle = 'rgba(' + p.c + ',' + p.l + ')'; x.shadowBlur = 10; x.shadowColor = 'rgb(' + p.c + ')';
        x.beginPath(); if (p.star) { star(p.x, p.y, p.s * p.l + .5); } else x.arc(p.x, p.y, p.s, 0, 6.283); x.fill();
      }
      x.shadowBlur = 0; x.globalCompositeOperation = 'source-over'; requestAnimationFrame(loop);
    }
    function star(cx, cy, r) { for (var i = 0; i < 8; i++) { var a = i * Math.PI / 4 - Math.PI / 2, rr = i % 2 ? r * .4 : r * 1.6; x[i ? 'lineTo' : 'moveTo'](cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } x.closePath(); }
    function kick() { if (!run) { run = true; requestAnimationFrame(loop); } }
    return {
      setColor: function (h) { col = h; rgb = hex(h); },
      ambient: function (v) { on = v; if (v) kick(); },
      burst: function (px, py, n, sp) { if (reduce) n = 12; var gold = [253, 231, 165];
        for (var i = 0; i < n; i++) { var a = Math.random() * 6.283, v = Math.random() * sp + 1;
          P.push({ x: px, y: py, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 1.5, s: Math.random() * 2.4 + .8, l: 1, d: .008 + Math.random() * .014, c: (Math.random() < .4 ? gold : rgb).join(','), star: Math.random() < .35 }); }
        kick(); }
    };
  })();
})();
