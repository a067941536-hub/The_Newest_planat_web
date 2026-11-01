/* 宇宙尺度之旅：對數縮放 10^6.3 公尺（地球近景）→ 10^24.9 公尺（星系團） */
(function () {
  'use strict';
  var LY = 9.4607e15, AU = 1.496e11, C = 2.998e8, J2000 = Date.UTC(2000, 0, 1, 12), TAU = Math.PI * 2, DEG = Math.PI / 180;
  var LMIN = 6.3, LMAX = 26.9, reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  var cv = document.getElementById('uv'), ctx = cv.getContext('2d'), stage = document.getElementById('stage');
  var W = 0, H = 0, dpr = 1, FONT = getComputedStyle(document.body).fontFamily;
  var S = { pan: [0, 0], recenter: 0, L: 7.3, Lt: 7.3, focus: 'earth', anim: null, auto: 0, hover: null, vL: 0, tour: null };
  function clamp(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function win(L, a, b, c, d) { if (L <= a || L >= d) return 0; if (L < b) return (L - a) / (b - a); if (L <= c) return 1; return (d - L) / (d - c); }
  function rnd() { return Math.random(); }
  function gauss() { return (rnd() + rnd() + rnd() + rnd() - 2) / .58; }
  function ly(n) { return n * LY; }
  function pol(distLy, ang) { return [distLy * LY * Math.cos(ang * DEG), distLy * LY * Math.sin(ang * DEG)]; }

  /* ---------- 資料 ---------- */
  var SUN = { id: 'sun', n: '太陽', D: 1.3927e9, tex: 'sun', rot: .04, em: true, fact: '直徑約 139 萬公里，可以裝下約 130 萬個地球，占太陽系質量 99.86%。' };
  var PL = [
    { id: 'mercury', n: '水星', a: .387, P: 87.97, L0: 252.25, D: 4.879e6, tex: 'mercury', rot: .017, c: '#b3aca2', fact: '最小的行星，表面佈滿撞擊坑，白天高達 430 °C、夜晚低至 −180 °C。' },
    { id: 'venus', n: '金星', a: .723, P: 224.7, L0: 181.98, D: 1.2104e7, tex: 'venus', rot: -.004, atm: [255, 220, 150], c: '#e8c070', fact: '濃厚的二氧化碳大氣讓地表高達 465 °C，是太陽系最熱的行星。' },
    { id: 'earth', n: '地球', a: 1, P: 365.25, L0: 100.46, D: 1.2742e7, tex: 'earth', rot: 1, atm: [110, 170, 255], c: '#5aa0ff', fact: '直徑 12,742 公里，目前已知唯一有生命的星球，表面約 71% 是海洋。' },
    { id: 'mars', n: '火星', a: 1.524, P: 686.98, L0: 355.45, D: 6.779e6, tex: 'mars', rot: .97, atm: [230, 150, 110], c: '#d9623b', fact: '表面的氧化鐵讓它呈紅色，擁有太陽系最高的火山奧林帕斯山（約 22 公里）。' },
    { id: 'jupiter', n: '木星', a: 5.203, P: 4332.6, L0: 34.4, D: 1.3982e8, tex: 'jupiter', rot: 2.4, atm: [230, 200, 160], c: '#c99a62', fact: '最大的行星，大紅斑是一場持續數百年的巨大風暴，比地球還大。' },
    { id: 'saturn', n: '土星', a: 9.537, P: 10759, L0: 49.94, D: 1.1646e8, tex: 'saturn', rot: 2.25, atm: [235, 210, 160], ring: true, c: '#d9b878', fact: '行星環主要由冰塊組成，寬達數十萬公里，卻薄得只有約十公尺到數百公尺。' },
    { id: 'uranus', n: '天王星', a: 19.19, P: 30688, L0: 313.23, D: 5.0724e7, tex: 'uranus', rot: -1.4, atm: [170, 235, 240], c: '#8fd8e6', fact: '自轉軸躺著（傾斜約 98 度），極區會連續約 42 年白天、42 年黑夜。' },
    { id: 'neptune', n: '海王星', a: 30.07, P: 60190, L0: 304.88, D: 4.9244e7, tex: 'neptune', rot: 1.5, atm: [110, 150, 255], c: '#4a6ee0', fact: '最遠的行星，風速可超過每小時 2,000 公里，是太陽系之冠。' }
  ];
  var MOON = { id: 'moon', n: '月球', D: 3.474e6, tex: 'moon', rot: .037, orbit: 3.844e8, P: 27.32, fact: '直徑 3,474 公里，平均距離地球 38.4 萬公里，光只要約 1.3 秒就能到達。' };
  var PBY = {}; PL.forEach(function (p) { PBY[p.id] = p; });
  var STARS = [ // 名稱, 距離(光年), 赤經(時), 顏色, 亮度
    ['比鄰星', 4.24, 14.5, '#ff9b7a', 1.2], ['半人馬座α', 4.37, 14.66, '#ffe9b0', 2.2], ['巴納德星', 5.96, 17.96, '#ff9b7a', 1.1], ['沃夫 359', 7.9, 10.94, '#ff8a6a', .9],
    ['天狼星', 8.6, 6.75, '#cfe3ff', 2.8], ['鯨魚座 UV', 8.7, 1.65, '#ff8a6a', .9], ['羅斯 154', 9.7, 18.83, '#ff9b7a', .9], ['天苑四', 10.5, 3.55, '#ffd9a0', 1.5],
    ['南河三', 11.4, 7.65, '#fff1d0', 2.1], ['天鵝座 61', 11.4, 21.1, '#ffbf8a', 1.4], ['天倉五', 11.9, 1.73, '#ffe3b0', 1.5], ['河鼓二（牛郎星）', 16.7, 19.85, '#eaf2ff', 2.2],
    ['織女星', 25, 18.6, '#d6e6ff', 2.6], ['北落師門', 25, 22.96, '#e6efff', 2.3]
  ];
  var STAR_POS = STARS.map(function (s) { return pol(s[1], s[2] * 15); });
  // 星系：id, 名稱, 距離(光年), 方位角, 半徑(光年), 類型, 傾角(度), 旋轉(度), 粒子數
  var GALS = [
    { id: 'mw', n: '銀河系', pos: pol(26400, 200), R: 50000, kind: 'spiral4', inc: 0, rot: 0, parts: 6500, big: 1 },
    { id: 'lmc', n: '大麥哲倫雲', pos: pol(163000, 255), R: 7000, kind: 'irr', inc: 30, rot: 20 },
    { id: 'smc', n: '小麥哲倫雲', pos: pol(200000, 276), R: 3500, kind: 'irr', inc: 40, rot: 70 },
    { id: 'm31', n: '仙女座星系 M31', pos: pol(2540000, 50), R: 110000, kind: 'spiral2', inc: 77, rot: 35, parts: 6000, big: 1 },
    { id: 'm33', n: '三角座星系 M33', pos: pol(2730000, 28), R: 30000, kind: 'spiral3', inc: 54, rot: -20, parts: 4500, big: 1 },
    { id: 'n6822', n: 'NGC 6822', pos: pol(1600000, 160), R: 5000, kind: 'irr', inc: 50, rot: 10 },
    { id: 'ic1613', n: 'IC 1613', pos: pol(2400000, 120), R: 5000, kind: 'irr', inc: 30, rot: 40 }
  ];
  var NEIGH = [ // 距離(百萬光年), 方位角, 半徑(千光年), 類型, 傾角
    ['n253', 'NGC 253 玉夫座星系', 11.4, 318, 45, 'spiral2', 78], ['m81', 'M81 波德星系', 11.8, 72, 45, 'spiral2', 58], ['m82', 'M82 雪茄星系', 11.8, 78, 18, 'irr', 82],
    ['cena', '半人馬座 A', 13.1, 190, 30, 'ell', 50], ['m83', 'M83 南風車星系', 14.7, 214, 45, 'spiral3', 30], ['m94', 'M94', 16, 112, 25, 'spiral2', 35],
    ['m101', 'M101 風車星系', 20.9, 95, 85, 'spiral2', 15], ['m51', 'M51 漩渦星系', 23, 92, 38, 'spiral2', 20], ['m63', 'M63 向日葵星系', 29, 125, 45, 'spiral3', 55],
    ['m104', 'M104 草帽星系', 29.3, 240, 25, 'ell', 80], ['m87', 'M87（室女座星系團中心）', 53.5, 165, 60, 'ell', 0]
  ];
  NEIGH.forEach(function (n) { GALS.push({ id: n[0], n: n[1], pos: pol(n[2] * 1e6, n[3]), R: n[4] * 1000, kind: n[5], inc: n[6], rot: n[3] % 90, nb: 1 }); });
  var GBY = {}; GALS.forEach(function (g) { g.D = g.R * 2 * LY; g.pos = [g.pos[0], g.pos[1]]; GBY[g.id] = g; });
  var CLUSTERS = [
    { id: 'virgo', n: '室女座星系團', pos: GBY.m87.pos, R: ly(4.5e6), cnt: 520 },
    { id: 'fornax', n: '天爐座星系團', pos: pol(62e6, 335), R: ly(3e6), cnt: 320 },
    { id: 'coma', n: '后髮座星系團', pos: pol(321e6, 118), R: ly(8e6), cnt: 480 }
  ];
  CLUSTERS.forEach(function (c) { c.pts = []; for (var i = 0; i < c.cnt; i++) { var r = Math.abs(gauss()) * c.R * .55, a = rnd() * TAU; c.pts.push([Math.cos(a) * r, Math.sin(a) * r, .25 + rnd() * .55, rnd() < .25 ? 1 : 0]); } });
  var COM = Object.keys(ASTRO.COMETS).map(function (id) { var c = ASTRO.COMETS[id], q = ASTRO.cometOrbit(id, 240); return { id: id, n: c.n, x: 0, y: 0, r: 1, D: 1.6e4, orb: q.map(function (p) { return [p.x, p.y]; }) }; });
  var COMFACT = { halley: '約每 76 年回到太陽附近一次，上次是 1986 年，下次預計 2061 年 7 月。現在它正位在海王星軌道外側，接近最遠點，所以沒有彗尾。', encke: '週期只有約 3.3 年，是週期最短的彗星之一。靠近太陽時，冰受熱昇華，形成氣體與塵埃彗尾，彗尾永遠指向背離太陽的方向。', c67p: '歐洲太空總署的羅賽塔號在 2014 年環繞它，菲萊登陸器在彗核上著陸，是人類第一次在彗星表面登陸。' };
  var WEB = { n: [], e: [], R: ly(4.65e10) }; (function () {
    var cs = [], i, j; for (i = 0; i < 16; i++) { var r0 = Math.sqrt(rnd()) * 3.6e10, a0 = rnd() * TAU; cs.push([Math.cos(a0) * r0, Math.sin(a0) * r0]); }
    for (i = 0; i < 420; i++) { var c = cs[i % 16], r = Math.abs(gauss()) * 1.25e10, a = rnd() * TAU; WEB.n.push([ly(c[0] + Math.cos(a) * r), ly(c[1] + Math.sin(a) * r), .3 + rnd() * .7]); }
    for (i = 0; i < WEB.n.length; i++) { var ds = []; for (j = 0; j < WEB.n.length; j++) if (j !== i) { var dx = WEB.n[i][0] - WEB.n[j][0], dy = WEB.n[i][1] - WEB.n[j][1]; ds.push([dx * dx + dy * dy, j]); } ds.sort(function (A, B) { return A[0] - B[0]; }); for (j = 0; j < 3; j++) if (ds[j][0] < Math.pow(ly(1.1e10), 2)) { var A2 = WEB.n[i], B2 = WEB.n[ds[j][1]], pts = [], dxx = B2[0] - A2[0], dyy = B2[1] - A2[1], pj; for (pj = 0; pj < 14; pj++) { var tt = rnd(), jj = gauss() * .07; pts.push([A2[0] + dxx * tt - dyy * jj, A2[1] + dyy * tt + dxx * jj, .3 + rnd() * .6]); } WEB.e.push([i, ds[j][1], pts]); } }
  })();
  var WARP = []; for (var wi = 0; wi < 90; wi++) WARP.push([rnd() * TAU, .06 + rnd() * .9, rnd()]);
  var SUPER = { n: '室女座超星系團', pos: GBY.m87.pos, R: ly(55e6) };
  // 本星系群的小矮星系、本地恆星雲
  var DWARFS = []; (function () {
    var i, p, ctrs = [GBY.mw.pos, GBY.m31.pos];
    for (i = 0; i < 70; i++) { var c = ctrs[i % 2], r = Math.abs(gauss()) * ly(i % 2 ? 450000 : 380000), a = rnd() * TAU; DWARFS.push([c[0] + Math.cos(a) * r, c[1] + Math.sin(a) * r, .2 + rnd() * .35]); }
  })();
  var LOCAL = []; for (var li = 0; li < 2600; li++) { var lr = Math.sqrt(rnd()) * ly(2600), la = rnd() * TAU; LOCAL.push([Math.cos(la) * lr, Math.sin(la) * lr, .12 + Math.pow(rnd(), 3) * .75, rnd()]); }
  var OORT = []; for (var oi = 0; oi < 70; oi++) OORT.push([rnd() * TAU, 3e3 + Math.pow(rnd(), 1.5) * 9e4]);
  var BELT = []; for (var bi = 0; bi < 520; bi++) BELT.push([rnd() * TAU, 2.2 + rnd() * 1.0, .25 + rnd() * .5]);
  var KUIPER = []; for (var ki = 0; ki < 420; ki++) KUIPER.push([rnd() * TAU, 30 + rnd() * 20, .2 + rnd() * .4]);

  /* ---------- 星系粒子 ---------- */
  var PAL = { blue: [[170, 200, 255], [200, 220, 255], [150, 185, 255]], pink: [[255, 150, 205], [255, 175, 215]], gold: [[255, 225, 170], [255, 240, 200], [255, 205, 140]] };
  function genGal(kind, n) {
    var P = [], i, arms = { spiral4: 4, spiral2: 2, spiral3: 3 }[kind] || 0, pitch = { spiral4: .24, spiral2: .2, spiral3: .3 }[kind] || .2;
    for (i = 0; i < n; i++) {
      var k = rnd(), r, th, z = 0, pal, a, s, hot = false;
      if (kind === 'ell') { r = Math.abs(gauss()) * .34; th = rnd() * TAU; pal = PAL.gold; a = .18 + rnd() * .5; s = .6 + rnd(); }
      else if (kind === 'irr') { var cc = (i % 6) * 1.047; var cx = Math.cos(cc) * .45 * (((i * 7) % 5) / 5 + .3), cy = Math.sin(cc) * .3; var x = cx + gauss() * .22, y = cy + gauss() * .16; r = Math.sqrt(x * x + y * y); th = Math.atan2(y, x); pal = rnd() < .3 ? PAL.pink : PAL.blue; a = .15 + rnd() * .5; s = .6 + rnd(); }
      else if (k < .17) { r = Math.abs(gauss()) * .09; th = rnd() * TAU; pal = PAL.gold; a = .35 + rnd() * .5; s = .7 + rnd(); }
      else if (k < .92) {
        r = -Math.log(1 - rnd() * .95) * (kind === 'spiral3' ? .34 : .3) + .05; if (r > 1) r = rnd();
        var arm = Math.floor(rnd() * arms); th = Math.log(r / .05) / Math.tan(pitch) * .56 + arm * (TAU / arms) + gauss() * (.12 + r * .09);
        var ring = kind === 'spiral2' ? Math.exp(-Math.pow((r - .55) / .07, 2)) : 0;
        hot = rnd() < .22 + ring * .5; pal = hot ? PAL.pink : (r < .22 ? PAL.gold : PAL.blue); a = .2 + rnd() * .5; s = .6 + rnd() * 1.1;
      } else { r = .3 + rnd() * .7; th = rnd() * TAU; pal = PAL.blue; a = .06 + rnd() * .12; s = .6 + rnd() * .8; z = gauss() * .2; }
      var c = pal[(rnd() * pal.length) | 0]; P.push({ r: r, th: th, z: z, s: s, c: c, a: a, w: 1 / Math.pow(.14 + r, .7) });
    }
    P.sort(function (A, B) { return A.c[0] * 1000 + A.c[1] - B.c[0] * 1000 - B.c[1]; });
    return P;
  }
  var GP = {}, SPR = {};
  function parts(g) { var key = g.id; return GP[key] || (GP[key] = genGal(g.kind, g.parts || 1800)); }
  function drawParts(c, P, Rpx, spin, alpha, inc, rot, sizeK) {
    var ci = Math.cos(inc * DEG), cr = Math.cos(rot * DEG), sr = Math.sin(rot * DEG), lastKey = '', n = P.length;
    c.globalCompositeOperation = 'lighter';
    for (var i = 0; i < n; i++) {
      var p = P[i], th = p.th + spin * p.w, x = Math.cos(th) * p.r * Rpx, y = Math.sin(th) * p.r * Rpx * ci - p.z * Rpx * Math.sin(inc * DEG) * .5;
      var X = x * cr - y * sr, Y = x * sr + y * cr, key = p.c[0] + ',' + p.c[1];
      if (key !== lastKey) { c.fillStyle = 'rgba(' + p.c[0] + ',' + p.c[1] + ',' + p.c[2] + ',' + (.55 * alpha) + ')'; lastKey = key; }
      var s = p.s * sizeK; c.fillRect(X - s / 2 + c.__cx, Y - s / 2 + c.__cy, s, s);
    }
    c.globalCompositeOperation = 'source-over';
  }
  function sprite(g) { // 正面 256px 預渲染
    if (SPR[g.kind]) return SPR[g.kind];
    var cn = document.createElement('canvas'); cn.width = cn.height = 256; var c = cn.getContext('2d'); c.__cx = 128; c.__cy = 128;
    var P = genGal(g.kind, g.kind === 'ell' ? 900 : (g.kind === 'irr' ? 800 : 2600));
    var gr = c.createRadialGradient(128, 128, 0, 128, 128, 126); gr.addColorStop(0, 'rgba(255,235,200,.55)'); gr.addColorStop(.25, 'rgba(200,190,255,.16)'); gr.addColorStop(1, 'rgba(100,100,220,0)');
    c.fillStyle = gr; c.fillRect(0, 0, 256, 256); drawParts(c, P, 120, 0, 1.25, 0, 0, 1.6); return (SPR[g.kind] = cn);
  }

  /* ---------- 相機 ---------- */
  var FOC = {};
  FOC.sun = { pos: function () { return [0, 0]; }, size: SUN.D };
  PL.forEach(function (p) { FOC[p.id] = { pos: function () { return [p.x, p.y]; }, size: p.D * (p.ring ? 2.4 : 1) }; });
  FOC.moon = { pos: function () { return [PBY.earth.x + MOON.x, PBY.earth.y + MOON.y]; }, size: MOON.D };
  COM.forEach(function (c) { FOC[c.id] = { pos: function () { return [c.x, c.y]; }, size: 1.6e8 }; });
  GALS.forEach(function (g) { FOC[g.id] = { pos: function () { return g.pos; }, size: g.D }; });
  CLUSTERS.forEach(function (c) { FOC[c.id] = { pos: function () { return c.pos; }, size: c.R * 2 }; });
  function updateBodies(now) {
    var days = (now - J2000) / 864e5;
    PL.forEach(function (p) { var th = (p.L0 + 360 * days / p.P) * DEG; p.x = p.a * AU * Math.cos(th); p.y = p.a * AU * Math.sin(th); p.th = th; });
    COM.forEach(function (c) { var q = ASTRO.comet(c.id, days); c.x = q.x * AU; c.y = q.y * AU; c.r = q.r; });
    var mt = TAU * days / MOON.P; MOON.x = MOON.orbit * Math.cos(mt); MOON.y = MOON.orbit * Math.sin(mt);
  }
  function Lfar(key) { var f = FOC[key], p = f.pos(), d = Math.hypot(p[0], p[1]); return d < 1 ? -9 : Math.log10(d * 2.5); }
  function camBase() {
    var f = FOC[S.focus]; if (!f) return [0, 0]; var p = f.pos(), d = Math.hypot(p[0], p[1]); if (d < 1) return [0, 0];
    var lf = Math.log10(d * 2.5), ln = Math.log10(f.size * 3), t = lf > ln ? clamp((lf - S.L) / (lf - ln), 0, 1) : 0; t = t * t * (3 - 2 * t); return [p[0] * t, p[1] * t];
  }
  function camCenter() { var b = camBase(); return [b[0] + S.pan[0], b[1] + S.pan[1]]; }
  var TARGETS = {
    earth: ['earth', 7.25], moon: ['moon', 6.8], sun: ['sun', 9.5], mercury: ['mercury', 6.95], venus: ['venus', 7.3], mars: ['mars', 7.05], jupiter: ['jupiter', 8.3], saturn: ['saturn', 8.62], uranus: ['uranus', 7.75], neptune: ['neptune', 7.75],
    halley: ['halley', 8.6], encke: ['encke', 8.5], c67p: ['c67p', 8.6], solar: ['sun', 13.1], stars: ['sun', 17.2], local: ['sun', 19.5], mw: ['mw', 21.2], lmc: ['lmc', 20.5], group: ['sun', 23.0], m31: ['m31', 21.8], m33: ['m33', 21.1], neigh: ['sun', 24.25], virgo: ['virgo', 24.3], web: ['sun', 26.8]
  };
  function flyTo(key) {
    var t = TARGETS[key]; if (!t) return; var ph = [];
    if (t[0] !== S.focus) { var a = FOC[S.focus].pos(), b = FOC[t[0]].pos(), dist = Math.hypot(a[0] - b[0], a[1] - b[1]); var pk = Math.max(Lfar(S.focus), Lfar(t[0]), Math.log10(dist * 2.5 + 1), S.L); ph.push({ L: pk }); ph.push({ L: t[1], focus: t[0] }); }
    else ph.push({ L: t[1] });
    S.anim = { ph: ph, i: 0 }; S.auto = 0; setPlay();
  }

  /* ---------- 繪製工具 ---------- */
  var labels = [], hits = [];
  function glow(x, y, r, col, a) { var g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, 'rgba(' + col + ',' + a + ')'); g.addColorStop(1, 'rgba(' + col + ',0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); }
  function hex2rgb(h) { var n = parseInt(h.slice(1), 16); return (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255); }
  function onscreen(x, y, r) { return x + r > -20 && x - r < W + 20 && y + r > -20 && y - r < H + 20; }
  function label(x, y, text, a, key, size, col) { labels.push({ x: x, y: y, t: text, a: a == null ? 1 : a, k: key, s: size || 12, c: col || '#e6ebff' }); }
  function ringLabel(cx, cy, r, text, a, ang) {
    var angs = ang != null ? [ang] : [-90, -60, -120, -30, -150, 0, 180, 30, 150, 60, 120, 90];
    for (var i = 0; i < angs.length; i++) { var x = cx + Math.cos(angs[i] * DEG) * r, y = cy + Math.sin(angs[i] * DEG) * r; if (x > 70 && x < W - 110 && y > 80 && y < H - 100) { label(x, y - 6, text, a, null, 11, '#9fb0ff'); return; } }
  }
  function dashedCircle(cx, cy, r, a, col) { if (r < 3 || r > 6000) return; ctx.strokeStyle = col || 'rgba(165,178,255,' + a + ')'; ctx.setLineDash([3, 7]); ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(cx, cy, r, 0, TAU); ctx.stroke(); ctx.setLineDash([]); }
  function sunDir(x, y, sx, sy) { var dx = sx - x, dy = sy - y, d = Math.hypot(dx, dy) || 1; return [dx / d, dy / d]; }

  /* ---------- 主繪製 ---------- */
  var spinT = 0;
  function frame(t) {
    var now = Date.now(), dt = Math.min(.05, (t - (frame.t || t)) / 1000); frame.t = t; if (COSMOS.anim) spinT += dt;
    // 相機動畫
    var Lprev = S.L;
    if (S.tour) {
      var T = S.tour; if (!T.paused) {
        var w = TOUR[T.i];
        if (T.st === 'hold') { T.t += dt; if (T.t >= w.hold) { if (T.i >= TOUR.length - 1) tourEnd(true); else { T.i++; T.st = 'move'; T.tm = 0; hideCine(); } } }
        else {
          T.tm += dt; var dd = w.L - S.L, v = Math.min(1.15, .2 + Math.abs(dd) * .55, .12 + T.tm * .8);
          if (w.swap && S.L >= w.swap.at) S.focus = w.swap.focus;
          if (Math.abs(dd) <= v * dt + .002) { S.L = w.L; if (w.swap) S.focus = w.swap.focus; T.st = 'hold'; T.t = 0; showCine(T.i); if (w.hit) UMUSIC.hit(w.hit === 'big'); }
          else S.L += Math.sign(dd) * v * dt;
        }
        S.Lt = S.L;
      }
    } else if (S.anim) {
      var ph = S.anim.ph[S.anim.i]; if (ph.focus && S.focus !== ph.focus) S.focus = ph.focus;
      var d = ph.L - S.L, step = (.55 + Math.min(2.6, Math.abs(d) * .85)) * dt;
      if (Math.abs(d) <= step) { S.L = ph.L; S.anim.i++; if (S.anim.i >= S.anim.ph.length) S.anim = null; } else S.L += Math.sign(d) * step;
      S.Lt = S.L;
    } else if (S.auto) { S.L = clamp(S.L + S.auto * .34 * dt, LMIN, LMAX); S.Lt = S.L; if (S.L >= LMAX || S.L <= LMIN) { S.auto = 0; setPlay(); } }
    else { S.L += (S.Lt - S.L) * Math.min(1, dt * 8); }
    S.vL += (Math.abs(S.L - Lprev) / Math.max(dt, .001) - S.vL) * Math.min(1, dt * 5);
    if (S.tour || S.anim || S.auto || S.recenter) { var kk = Math.min(1, dt * (S.recenter ? 5 : 1.6)); S.pan[0] *= 1 - kk; S.pan[1] *= 1 - kk; if (S.recenter && Math.hypot(S.pan[0], S.pan[1]) * Math.min(W, H) / Math.pow(10, S.L) < .5) { S.pan = [0, 0]; S.recenter = 0; } }
    updateBodies(now);
    var cam = camCenter(), L = S.L, sc = Math.min(W, H) / Math.pow(10, L), cx0 = W / 2, cy0 = H / 2;
    function X(wx) { return cx0 + (wx - cam[0]) * sc; } function Y(wy) { return cy0 - (wy - cam[1]) * sc; }
    ctx.clearRect(0, 0, W, H); labels = []; hits = [];
    var sx = X(0), sy = Y(0);
    if (COSMOS.anim && S.vL > .45) { var wa = clamp((S.vL - .45) / 1.4, 0, .6), wl = H * (.08 + clamp(S.vL / 3, 0, .5)); ctx.save(); ctx.lineCap = 'round'; ctx.globalCompositeOperation = 'lighter';
      WARP.forEach(function (w) { var r1 = (w[1] * .55 + ((spinT * (.5 + S.vL * .4) + w[2]) % 1) * .6) * Math.max(W, H) * .6, r2 = r1 + wl * (.4 + w[2]); ctx.strokeStyle = 'rgba(' + (w[2] > .5 ? '170,200,255' : '255,220,190') + ',' + (wa * (.25 + w[2] * .6)) + ')'; ctx.lineWidth = .6 + w[2] * 1.4; ctx.beginPath(); ctx.moveTo(cx0 + Math.cos(w[0]) * r1, cy0 + Math.sin(w[0]) * r1); ctx.lineTo(cx0 + Math.cos(w[0]) * r2, cy0 + Math.sin(w[0]) * r2); ctx.stroke(); }); ctx.restore(); }

    /* 距離環（光年） */
    [1, 10, 100, 1e3, 1e4, 1e5, 1e6, 1e7, 1e8].forEach(function (v, i) {
      var r = v * LY * sc, a = r < 40 ? 0 : (r < 90 ? (r - 40) / 50 : (r > Math.max(W, H) * 1.1 ? 0 : 1)); if (a <= 0 || L < 15.2) return;
      dashedCircle(sx, sy, r, .16 * a); var txt = v >= 1e8 ? '1 億光年' : (v >= 1e4 ? (v / 1e4) + ' 萬光年' : v + ' 光年'); ringLabel(sx, sy, r, txt, .7 * a);
    });

    /* 本地恆星雲 */
    var aLoc = win(L, 17.2, 18.4, 20.4, 21.6);
    if (aLoc > .01) { ctx.save(); ctx.globalCompositeOperation = 'lighter'; for (var i = 0; i < LOCAL.length; i++) { var p = LOCAL[i], x = X(p[0]), y = Y(p[1]); if (x < 0 || x > W || y < 0 || y > H) continue; ctx.fillStyle = 'rgba(' + (p[3] < .2 ? '255,220,170' : '200,220,255') + ',' + (p[2] * aLoc * .9) + ')'; var s = p[2] > .6 ? 2 : 1.2; ctx.fillRect(x, y, s, s); } ctx.restore(); }

    /* 銀河系與其他星系 */
    var aGal = win(L, 19.3, 20.4, 26, 27);
    GALS.forEach(function (g) {
      var x = X(g.pos[0]), y = Y(g.pos[1]), Rpx = g.R * LY * sc, vis = onscreen(x, y, Math.max(Rpx, 20));
      if (!vis) return;
      var lumA = g.nb ? .9 : 1;
      // 淡出：遠離時變成光點
      if (Rpx < 1.5) {
        var a = g.nb || g.id === 'mw' ? (g.id === 'mw' ? aGal : win(L, 22.0, 22.8, 26, 27)) : win(L, 21.5, 22.3, 26, 27); if (a < .02) return;
        glow(x, y, 4 + (g.big ? 3 : 0), '230,225,255', .75 * a * lumA); hits.push({ x: x, y: y, r: 12, k: g.id, n: g.n });
        if (g.nb && L > 23.0 && L < 25.2) label(x + 9, y + 4, g.n, a * .85, g.id, 11, '#cfd8ff'); else if (!g.nb && g.id !== 'mw' && L > 21.8 && L < 24) label(x + 9, y + 4, g.n, a * .8, g.id, 11, '#cfd8ff');
        return;
      }
      var base = g.id === 'mw' ? aGal : (g.nb ? win(L, 22.2, 23.0, 26, 27) : win(L, 20.4, 21.4, 26, 27)); if (L > 24.8 && !g.nb) base *= 1; if (base < .02) return;
      ctx.save(); ctx.translate(x, y); var big = Rpx > 80 && g.parts;
      if (big) { ctx.__cx = 0; ctx.__cy = 0; var P = parts(g); drawParts(ctx, P, Rpx * 1.5, spinT * .03, base, g.inc, g.rot, clamp(Rpx / 260, .9, 1.7)); }
      if (!big || Rpx < 130) {
        var sp = sprite(g), ci = Math.cos(g.inc * DEG); ctx.rotate(g.rot * DEG); ctx.scale(1, Math.max(.12, ci)); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = base * (big ? clamp((130 - Rpx) / 50, 0, 1) : 1) * lumA; var s2 = Rpx * 3; ctx.drawImage(sp, -s2 / 2, -s2 / 2, s2, s2);
      }
      ctx.restore(); ctx.globalAlpha = 1;
      // 核心亮點
      glow(x, y, Math.max(6, Rpx * .13), '255,238,200', .55 * base);
      if (Rpx > 6) hits.push({ x: x, y: y, r: Math.max(18, Math.min(Rpx, 120)), k: g.id, n: g.n });
      var showLab = (g.id === 'mw' && L > 20.4 && L < 23.3) || (!g.nb && L > 21.3 && L < 24.2 && g.id !== 'mw') || (g.nb && L > 22.8 && L < 25.2) || Rpx > 40 && Rpx < 600;
      if (showLab) label(x, y + Math.min(Rpx, 90) * (g.inc > 60 ? .45 : .8) + 16, g.n, base * (g.id === 'mw' ? aGal : 1), g.id, g.big || g.nb ? 12.5 : 11);
    });
    // 銀河系的「太陽在這裡」
    if (aGal > .05) { var pu = 1 + .15 * Math.sin(spinT * 3); ctx.strokeStyle = 'rgba(255,214,120,' + (.9 * aGal) + ')'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(sx, sy, 7 * pu, 0, TAU); ctx.stroke(); label(sx + 12, sy - 12, '太陽系在這裡', aGal, null, 12, '#ffd98a'); }

    /* 本星系群小矮星系、超星系團 */
    var aDw = win(L, 21.8, 22.4, 23.6, 24.2);
    if (aDw > .02) { ctx.fillStyle = 'rgba(190,200,255,' + (.6 * aDw) + ')'; DWARFS.forEach(function (d) { var x = X(d[0]), y = Y(d[1]); if (onscreen(x, y, 2)) { ctx.globalAlpha = d[2] * aDw * 1.6; ctx.fillRect(x, y, 2, 2); } }); ctx.globalAlpha = 1; }
    var aLG = win(L, 21.8, 22.6, 23.7, 24.3);
    if (aLG > .02) { var gx = X(ly(1.4e6) * 0 + GBY.m31.pos[0] * .5), gy = Y(GBY.m31.pos[1] * .5), gr = ly(5e6) * sc; dashedCircle(gx, gy, gr, .22 * aLG); label(gx, gy - gr - 8, '本星系群（約 1,000 萬光年）', aLG, null, 12, '#b9c4ff'); }

    /* 星系團 */
    var aCl = win(L, 23.3, 24.0, 26, 27);
    CLUSTERS.forEach(function (c) {
      var x = X(c.pos[0]), y = Y(c.pos[1]); if (aCl < .02 || !onscreen(x, y, c.R * sc)) return;
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; c.pts.forEach(function (p) { var px = x + p[0] * sc, py = y - p[1] * sc; if (px < 0 || px > W || py < 0 || py > H) return; ctx.fillStyle = p[3] ? 'rgba(255,205,150,' + (p[2] * aCl) + ')' : 'rgba(200,215,255,' + (p[2] * aCl) + ')'; ctx.fillRect(px, py, 2, 2); }); ctx.restore();
      hits.push({ x: x, y: y, r: 26, k: c.id === 'virgo' ? 'virgo' : null, n: c.n });
      label(x, y + Math.min(c.R * sc * .7, 90) + 18, c.n, aCl, c.id === 'virgo' ? 'virgo' : null, 12.5, '#ffd9a8');
    });
    if (L > 23.7) { var a2 = win(L, 23.8, 24.3, 26, 27), sx2 = X(SUPER.pos[0]), sy2 = Y(SUPER.pos[1]); dashedCircle(sx2, sy2, SUPER.R * sc, .2 * a2); if (a2 > .02) label(sx2, sy2 - SUPER.R * sc - 8, SUPER.n + '（直徑約 1.1 億光年）', a2, null, 12, '#b9c4ff'); }

    /* 宇宙網與可觀測宇宙 */
    var aWeb = win(L, 25.0, 25.9, 28, 29);
    if (aWeb > .02) {
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.lineWidth = 1;
      WEB.e.forEach(function (e) { var A = WEB.n[e[0]], B = WEB.n[e[1]]; ctx.strokeStyle = 'rgba(110,140,255,' + (.07 * aWeb) + ')'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(X(A[0]), Y(A[1])); ctx.lineTo(X(B[0]), Y(B[1])); ctx.stroke(); e[2].forEach(function (p) { var px = X(p[0]), py = Y(p[1]); if (px > 0 && px < W && py > 0 && py < H) { ctx.fillStyle = 'rgba(200,215,255,' + (p[2] * .7 * aWeb) + ')'; ctx.fillRect(px, py, 1.6, 1.6); } }); });
      WEB.n.forEach(function (n) { var x = X(n[0]), y = Y(n[1]); if (!onscreen(x, y, 12)) return; glow(x, y, 4 + n[2] * 6, n[2] > .7 ? '255,215,170' : '170,195,255', .38 * aWeb * n[2]); });
      ctx.restore();
      var rb = WEB.R * sc; dashedCircle(sx, sy, rb, .3 * aWeb); if (L > 26.1) ringLabel(sx, sy, rb, '可觀測宇宙邊界（直徑約 930 億光年）', aWeb, -90);
      if (L > 25.4) label(sx + 10, sy - 10, '我們在這裡', aWeb, null, 13, '#ffd98a');
    }

    /* 附近恆星 */
    var aSt = win(L, 14.8, 15.8, 18.6, 19.6);
    if (aSt > .02) STARS.forEach(function (s, i) {
      var x = X(STAR_POS[i][0]), y = Y(STAR_POS[i][1]); if (!onscreen(x, y, 30)) return;
      var rgb = hex2rgb(s[3]); glow(x, y, 6 + s[4] * 5, rgb, .6 * aSt); ctx.fillStyle = 'rgba(' + rgb + ',' + aSt + ')'; ctx.beginPath(); ctx.arc(x, y, 1.6 + s[4] * .6, 0, TAU); ctx.fill();
      label(x + 9, y - 7, s[0] + '・' + s[1] + ' 光年', aSt * (L > 18.2 ? clamp((18.9 - L) / .7, 0, 1) : 1), null, 11.5, '#dbe3ff');
    });

    /* 歐特雲 */
    var aOort = win(L, 15.2, 15.9, 17.0, 17.7);
    if (aOort > .02) { var ro = 1e5 * AU * sc, ri = 2e3 * AU * sc; var og = ctx.createRadialGradient(sx, sy, ri, sx, sy, ro); og.addColorStop(0, 'rgba(140,170,255,0)'); og.addColorStop(.25, 'rgba(140,170,255,' + .16 * aOort + ')'); og.addColorStop(1, 'rgba(140,170,255,0)'); ctx.fillStyle = og; ctx.beginPath(); ctx.arc(sx, sy, ro, 0, TAU); ctx.fill(); label(sx, sy - ro * .55, '歐特雲（彗星的老家，約 0.03–1.6 光年）', aOort, null, 12, '#b9c9ff');
      ctx.fillStyle = 'rgba(210,230,255,' + (.8 * aOort) + ')'; OORT.forEach(function (o) { var rr = o[1] * AU * sc, x = sx + Math.cos(o[0]) * rr, y = sy - Math.sin(o[0]) * rr; if (x > 0 && x < W && y > 0 && y < H) ctx.fillRect(x, y, 1.8, 1.8); }); }

    /* 太陽系 */
    var aSol = win(L, 6, 6.5, 13.4, 14.8);
    if (aSol > .01) {
      // 日球層頂
      var rH = 120 * AU * sc; if (rH > 20 && rH < 5000) { dashedCircle(sx, sy, rH, .28 * aSol); ringLabel(sx, sy, rH, '日球層頂（太陽風的邊界，約 120 AU）', aSol * .9); }
      // 柯伊伯帶
      if (L > 12.2) { ctx.fillStyle = 'rgba(165,185,255,' + .5 * aSol + ')'; KUIPER.forEach(function (k) { var r = k[1] * AU * sc; ctx.globalAlpha = k[2]; ctx.fillRect(sx + Math.cos(k[0]) * r, sy - Math.sin(k[0]) * r, 1.2, 1.2); }); ctx.globalAlpha = 1; ringLabel(sx, sy, 40 * AU * sc, '柯伊伯帶', aSol * .8, 205); }
      // 小行星帶
      if (L > 10.4) { ctx.fillStyle = 'rgba(214,208,196,' + .8 * aSol + ')'; BELT.forEach(function (b) { var r = b[1] * AU * sc, a = b[0] + spinT * .004; ctx.globalAlpha = b[2]; ctx.fillRect(sx + Math.cos(a) * r, sy - Math.sin(a) * r, 1.3, 1.3); }); ctx.globalAlpha = 1; ringLabel(sx, sy, 2.7 * AU * sc, '小行星帶', aSol * .8, 135); }
      // 軌道
      PL.forEach(function (p) { var r = p.a * AU * sc; if (r > 6 && r < 6000) { ctx.strokeStyle = 'rgba(165,178,255,' + (.2 * aSol) + ')'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(sx, sy, r, 0, TAU); ctx.stroke(); } });
      // 月球軌道
      var ex = X(PBY.earth.x), ey = Y(PBY.earth.y), mr = MOON.orbit * sc; if (mr > 8 && mr < 3000) { ctx.strokeStyle = 'rgba(200,205,230,' + .18 * aSol + ')'; ctx.beginPath(); ctx.arc(ex, ey, mr, 0, TAU); ctx.stroke(); }
      // 行星
      var draws = PL.map(function (p) { return { p: p, x: X(p.x), y: Y(p.y), R: p.D * sc / 2 }; });
      draws.forEach(function (o) {
        var p = o.p; if (!onscreen(o.x, o.y, Math.max(o.R * (p.ring ? 2.4 : 1.3), 30))) return;
        var dir = sunDir(o.x, o.y, sx, sy), spin = spinT * .12 * p.rot;
        if (o.R > 9) {
          if (p.ring) drawRing(o.x, o.y, o.R, 0, dir);
          PTEX.sphere(ctx, p.tex, o.x, o.y, o.R, { lx: dir[0], ly: dir[1], spin: spin, atm: p.atm });
          if (p.ring) drawRing(o.x, o.y, o.R, 1, dir);
        } else { var rr = Math.max(1.8, o.R); glow(o.x, o.y, rr * 4 + 6, hex2rgb(p.c), .35 * aSol); ctx.fillStyle = p.c; ctx.beginPath(); ctx.arc(o.x, o.y, rr, 0, TAU); ctx.fill(); }
        hits.push({ x: o.x, y: o.y, r: Math.max(14, o.R + 6), k: p.id, n: p.n });
        if (L < 13.6) label(o.x + Math.max(o.R, 3) + 8, o.y + 4, p.n, aSol * (o.R > 90 ? .6 : 1), p.id, 12.5, '#e6ebff');
      });
      // 月球
      var mx = X(PBY.earth.x + MOON.x), my = Y(PBY.earth.y + MOON.y), mR = MOON.D * sc / 2;
      if (onscreen(mx, my, 20) && mr > 6) {
        var md = sunDir(mx, my, sx, sy);
        if (mR > 7) PTEX.sphere(ctx, 'moon', mx, my, mR, { lx: md[0], ly: md[1], spin: spinT * .12 * MOON.rot }); else { ctx.fillStyle = '#d8d8d8'; ctx.beginPath(); ctx.arc(mx, my, Math.max(1.4, mR), 0, TAU); ctx.fill(); }
        hits.push({ x: mx, y: my, r: 12, k: 'moon', n: '月球' }); if (mr > 26) label(mx + Math.max(mR, 3) + 7, my + 4, '月球', aSol, 'moon', 11.5);
      }
    }
    // 彗星
    if (aSol > .01) COM.forEach(function (c) {
      var px = X(c.x), py = Y(c.y), lw = 1;
      if (L > 9.0) { ctx.strokeStyle = 'rgba(150,200,255,' + (.28 * aSol) + ')'; ctx.lineWidth = 1; ctx.setLineDash([2, 5]); ctx.beginPath(); c.orb.forEach(function (p, i) { var ox = X(p[0] * AU), oy = Y(p[1] * AU); if (i) ctx.lineTo(ox, oy); else ctx.moveTo(ox, oy); }); ctx.stroke(); ctx.setLineDash([]); }
      if (!onscreen(px, py, Math.max(W, H) * 1.7)) return;
      var dx = px - sx, dy = py - sy, dn = Math.hypot(dx, dy) || 1, ux = dx / dn, uy = dy / dn, act = clamp(1 - c.r / 8, 0, 1);
      var tl = Math.min(4e10 / Math.pow(Math.max(c.r, .25), 1.5) * act * sc, Math.max(W, H) * 1.6); if (L > 9.6 && L < 14.6) tl = Math.max(tl, act * 30 * clamp((14.6 - L) / 2, .4, 1));
      if (tl > 3) {
        var nx = -uy, ny = ux, wd = Math.min(2 + tl * .003, 5);
        var g1 = ctx.createLinearGradient(px, py, px + ux * tl, py + uy * tl); g1.addColorStop(0, 'rgba(170,215,255,.8)'); g1.addColorStop(.25, 'rgba(140,190,255,.3)'); g1.addColorStop(1, 'rgba(120,170,255,0)');
        ctx.fillStyle = g1; ctx.beginPath(); ctx.moveTo(px + nx * wd * .5, py + ny * wd * .5); ctx.lineTo(px + ux * tl, py + uy * tl); ctx.lineTo(px - nx * wd * .5, py - ny * wd * .5); ctx.closePath(); ctx.fill();
        var ang = .2, ca = Math.cos(ang), sa = Math.sin(ang), vx = ux * ca - uy * sa, vy = ux * sa + uy * ca, L2 = tl * .78, bx = px + ux * L2 * .55 + (-uy) * L2 * .08, by = py + uy * L2 * .55 + ux * L2 * .08, ex = px + vx * L2, ey = py + vy * L2;
        var g2 = ctx.createLinearGradient(px, py, ex, ey); g2.addColorStop(0, 'rgba(255,235,190,.45)'); g2.addColorStop(.3, 'rgba(255,215,150,.16)'); g2.addColorStop(1, 'rgba(255,200,130,0)'); ctx.fillStyle = g2; ctx.beginPath(); ctx.moveTo(px + nx * wd * 1.2, py + ny * wd * 1.2); ctx.quadraticCurveTo(bx + nx * wd * 5, by + ny * wd * 5, ex, ey); ctx.quadraticCurveTo(bx - nx * wd * 3, by - ny * wd * 3, px - nx * wd * 1.2, py - ny * wd * 1.2); ctx.closePath(); ctx.fill();
      }
      glow(px, py, 6 + 10 * act + (L < 9.5 ? 14 : 0), '170,215,255', .65 * Math.max(.5, act)); var nr = Math.max(1.7, c.D * sc / 2); ctx.fillStyle = '#f2f8ff'; ctx.beginPath(); ctx.arc(px, py, nr, 0, TAU); ctx.fill();
      hits.push({ x: px, y: py, r: 16, k: c.id, n: c.n + '（點擊飛過去）' });
      if (L < 15) label(px + 9, py - 8, c.n + '・' + c.r.toFixed(c.r < 10 ? 1 : 0) + ' AU', aSol, c.id, 12, '#bfe0ff');
    });
    // 太陽（永遠存在）
    var sR = SUN.D * sc / 2;
    if (onscreen(sx, sy, 40)) {
      var hot = win(L, 6, 7, 99, 100);
      if (sR > 9) {
        glow(sx, sy, sR * 1.7, '255,150,50', .34); PTEX.sphere(ctx, 'sun', sx, sy, sR, { lx: 0, ly: 0, spin: spinT * .12 * SUN.rot, emissive: true });
        var cor = ctx.createRadialGradient(sx, sy, sR * .98, sx, sy, sR * 1.35); cor.addColorStop(0, 'rgba(255,190,90,.5)'); cor.addColorStop(1, 'rgba(255,140,40,0)'); ctx.fillStyle = cor; ctx.beginPath(); ctx.arc(sx, sy, sR * 1.35, 0, TAU); ctx.fill();
      } else {
        var gr = clamp(10 + 28 * (1 - clamp((L - 9.3) / 6, 0, 1)), 8, 36); if (L > 19) gr = 8;
        glow(sx, sy, gr * 2.2, '255,170,70', .55); if (L > 9 && L < 18) { var fl = ctx.createLinearGradient(sx - gr * 9, sy, sx + gr * 9, sy); fl.addColorStop(0, 'rgba(255,200,120,0)'); fl.addColorStop(.5, 'rgba(255,230,180,' + (.55 * clamp((18 - L) / 4, 0, 1)) + ')'); fl.addColorStop(1, 'rgba(255,200,120,0)'); ctx.fillStyle = fl; ctx.fillRect(sx - gr * 9, sy - 1, gr * 18, 2); } ctx.fillStyle = '#fff1c2'; ctx.beginPath(); ctx.arc(sx, sy, Math.max(2.2, sR), 0, TAU); ctx.fill();
      }
      hits.push({ x: sx, y: sy, r: Math.max(16, sR), k: 'sun', n: '太陽' });
      if (L < 19.2 && L > 6.2) label(sx + Math.max(sR, 5) + 10, sy + 16, '太陽', clamp((19.2 - L) / 1.2, 0, 1), 'sun', 13, '#ffe3a3');
    }

    drawLabels(); ctx.globalAlpha = 1;
    updateUI(); UMUSIC.update(S.L, S.vL, (S.L - 7.3) / 19.5);
    requestAnimationFrame(frame);
  }
  function drawRing(x, y, R, front, dir) {
    var tilt = -.46, rat = .42, bands = [[1.24, 1.5, .2], [1.52, 1.95, .62], [2.03, 2.26, .46]];
    ctx.save(); ctx.translate(x, y); ctx.rotate(tilt); ctx.scale(1, rat);
    ctx.beginPath(); if (front) ctx.rect(-R * 3, 0, R * 6, R * 3); else ctx.rect(-R * 3, -R * 3, R * 6, R * 3); ctx.clip();
    bands.forEach(function (b) { ctx.strokeStyle = 'rgba(232,210,160,' + b[2] + ')'; ctx.lineWidth = (b[1] - b[0]) * R; ctx.beginPath(); ctx.arc(0, 0, (b[0] + b[1]) / 2 * R, 0, TAU); ctx.stroke(); });
    ctx.restore();
  }
  function drawLabels() {
    ctx.font = '500 12px ' + FONT; ctx.textAlign = 'left'; ctx.shadowColor = 'rgba(0,0,0,.9)'; ctx.shadowBlur = 6;
    var placed = [];
    labels.sort(function (a, b) { return b.s - a.s; }).forEach(function (l) {
      if (l.a < .03 || l.x > W - 130) return; var w = l.t.length * l.s * .98 + 4, x = l.x, y = l.y;
      var box = [x - 2, y - l.s, x + w, y + 4]; for (var i = 0; i < placed.length; i++) { var p = placed[i]; if (box[0] < p[2] && box[2] > p[0] && box[1] < p[3] && box[3] > p[1]) return; }
      placed.push(box); ctx.globalAlpha = clamp(l.a, 0, 1); ctx.font = '500 ' + l.s + 'px ' + FONT; ctx.fillStyle = l.c; ctx.fillText(l.t, x, y);
    });
    ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  }

  /* ---------- 介面 ---------- */
  var LAYERS = [
    [6.0, 9.6, '', ''],
    [9.6, 13.4, '太陽系', '八大行星繞著太陽公轉。最外側的海王星距離太陽約 30 AU（45 億公里），圖上的行星與彗星位置都是依今天的日期推算的。彗星靠近太陽時會長出指向背離太陽的彗尾。'],
    [13.4, 15.4, '太陽系的外緣', '太陽風吹出一個巨大的「泡泡」（日球層），外面是冰與岩石組成的柯伊伯帶。1977 年發射的航海家 1 號已飛出這個邊界。'],
    [15.4, 16.9, '歐特雲', '理論上，太陽系被一個巨大的球殼狀「彗星倉庫」包圍。這裡已經是太陽引力能影響到的最遠邊緣。'],
    [16.9, 18.6, '最近的鄰居', '離太陽最近的恆星是比鄰星，距離 4.24 光年。以目前最快的太空船速度，要走上好幾萬年。'],
    [18.6, 20.5, '太陽附近的恆星', '這一帶位於銀河系的「獵戶臂」，周圍有成千上萬顆恆星。每一個光點，都可能有自己的行星。'],
    [20.5, 22.3, '銀河系', '直徑約 10 萬光年，有 1000–4000 億顆恆星。太陽位於離中心約 2.6 萬光年的旋臂邊緣，繞銀河系一圈約 2.3 億年。'],
    [22.3, 23.45, '本星系群', '銀河系和仙女座星系是群裡最大的兩個成員，旁邊還有三角座星系、兩朵麥哲倫雲，以及數十個矮星系。'],
    [23.45, 24.35, '附近的星系', '這些星系離我們約 1,000 萬到 3,000 萬光年，有些和銀河系一樣是旋渦星系，有些是巨大的橢圓星系。'],
    [24.35, 25.4, '星系團與超星系團', '星系會聚集成團，再組成更大的超星系團。我們的銀河系，位於「室女座超星系團」的外圍。'],
    [25.4, 99, '宇宙網', '在最大的尺度上，星系沿著巨大的絲狀結構分布，中間是廣大的空洞，像一張發光的網。可觀測宇宙的直徑約 930 億光年。']
  ];
  var CHIPS = [['earth', '地球'], ['moon', '月球'], ['sun', '太陽'], ['jupiter', '木星'], ['saturn', '土星'], ['encke', '彗星'], ['solar', '太陽系'], ['stars', '最近的恆星'], ['local', '太陽附近'], ['mw', '銀河系'], ['group', '本星系群'], ['m31', '仙女座'], ['m33', '三角座'], ['neigh', '附近的星系'], ['virgo', '星系團'], ['web', '宇宙網']];
  var els = { title: document.getElementById('lTitle'), text: document.getElementById('lText'), w: document.getElementById('rW'), t: document.getElementById('rT'), thumb: document.getElementById('zThumb') };
  var lastKey = '';
  function fmtBig(v, unitSmall, unit4, unit8) { if (v >= 1e8) return (v / 1e8).toFixed(v / 1e8 >= 100 ? 0 : 1).replace(/\.0$/, '') + ' ' + unit8; if (v >= 1e4) return (v / 1e4).toFixed(v / 1e4 >= 100 ? 0 : 1).replace(/\.0$/, '') + ' ' + unit4; return (v >= 100 ? Math.round(v).toLocaleString('en-US') : v.toFixed(v >= 10 ? 1 : 2).replace(/\.?0+$/, '')) + ' ' + unitSmall; }
  function fmtLen(m) { var km = m / 1e3; if (m < 1.496e10) return fmtBig(km, '公里', '萬公里', '億公里'); var au = m / AU; if (m < LY * .3) return fmtBig(au, 'AU', '萬 AU', '億 AU'); return fmtBig(m / LY, '光年', '萬光年', '億光年'); }
  function fmtTime(m) { var s = m / C; if (s < 1) return (s * 1000 | 0) + ' 毫秒'; if (s < 60) return s.toFixed(1) + ' 秒'; if (s < 3600) return (s / 60).toFixed(1) + ' 分鐘'; if (s < 86400) return (s / 3600).toFixed(1) + ' 小時'; if (s < 3.156e7) return (s / 86400).toFixed(1) + ' 天'; return fmtBig(s / 3.156e7, '年', '萬年', '億年'); }
  function updateUI() {
    var L = S.L, m = Math.pow(10, L); document.getElementById('expo').innerHTML = '10<sup>' + L.toFixed(1) + '</sup> 公尺'; els.w.textContent = fmtLen(m); els.t.textContent = fmtTime(m);
    var cm = COM.filter(function (c) { return c.id === S.focus; })[0], f = FOC[S.focus], close = (cm && L < 11.2) || f && L < Math.log10(f.size * 3) + .4 && S.focus in PBY || (f && S.focus === 'moon' && L < 8) || (S.focus === 'sun' && L < 10.4), title, text;
    if (close) { if (cm) { title = cm.n; text = COMFACT[cm.id] + '（此刻距太陽 ' + cm.r.toFixed(1) + ' AU）'; } else { var o = S.focus === 'sun' ? SUN : (S.focus === 'moon' ? MOON : PBY[S.focus]); title = o.n; text = o.fact; } }
    else { var ly2 = LAYERS.filter(function (x) { return L >= x[0] && L < x[1]; })[0] || LAYERS[1]; title = ly2[2] || '行星近景'; text = ly2[3] || '點選下方的天體，或繼續放大／縮小。'; }
    var key = title; if (key !== lastKey) { lastKey = key; els.title.textContent = title; els.text.textContent = text; var c = document.getElementById('layerCard'); c.classList.remove('flash'); void c.offsetWidth; c.classList.add('flash'); }
    var r = (LMAX - L) / (LMAX - LMIN); els.thumb.style.top = (r * 100) + '%';
  }
  var playBtn = document.getElementById('btnOut'), inBtn = document.getElementById('btnIn');
  function setPlay() { playBtn.classList.toggle('on', S.auto === 1); inBtn.classList.toggle('on', S.auto === -1); playBtn.innerHTML = S.auto === 1 ? '⏸ 縮小中' : '▶ 自動縮小'; inBtn.innerHTML = S.auto === -1 ? '⏸ 放大中' : '◀ 自動放大'; }
  playBtn.onclick = function () { S.anim = null; S.auto = S.auto === 1 ? 0 : 1; setPlay(); };
  inBtn.onclick = function () { S.anim = null; S.auto = S.auto === -1 ? 0 : -1; setPlay(); };
  var chips = document.getElementById('chips');
  CHIPS.forEach(function (c) { var b = document.createElement('button'); b.className = 'chip-b'; b.textContent = c[1]; b.onclick = function () { flyTo(c[0]); }; chips.appendChild(b); });
  var ticks = document.getElementById('zTicks');
  [[7.25, '地球', 'earth'], [9.5, '太陽', 'sun'], [13.1, '太陽系', 'solar'], [17.2, '鄰近恆星', 'stars'], [21.2, '銀河系', 'mw'], [23, '本星系群', 'group'], [24.3, '星系團', 'virgo'], [26.5, '可觀測宇宙', 'web']].forEach(function (t) {
    var d = document.createElement('button'); d.className = 'tick'; d.style.top = ((LMAX - t[0]) / (LMAX - LMIN) * 100) + '%'; d.innerHTML = '<span>' + t[1] + '</span><i></i>'; d.onclick = function () { flyTo(t[2]); }; ticks.appendChild(d);
  });
  var zbar = document.getElementById('zTrack'), zdrag = false;
  function zSet(e) { var r = zbar.getBoundingClientRect(), k = clamp((e.clientY - r.top) / r.height, 0, 1); S.anim = null; S.auto = 0; setPlay(); S.Lt = LMAX - k * (LMAX - LMIN); }
  zbar.addEventListener('pointerdown', function (e) { zdrag = true; zbar.setPointerCapture(e.pointerId); zSet(e); });
  zbar.addEventListener('pointermove', function (e) { if (zdrag) zSet(e); }); zbar.addEventListener('pointerup', function () { zdrag = false; });
  document.getElementById('zIn').onclick = function () { S.anim = null; S.auto = 0; setPlay(); S.Lt = clamp(S.Lt - .5, LMIN, LMAX); };
  var bAnim = document.getElementById('btnAnim'), bCen = document.getElementById('btnCenter');
  function animLab() { bAnim.textContent = COSMOS.anim ? '✨ 動畫：開' : '✨ 動畫：關'; bAnim.classList.toggle('on', COSMOS.anim); }
  bAnim.onclick = function () { COSMOS.setAnim(!COSMOS.anim); }; COSMOS.onAnim(animLab); animLab();
  bCen.onclick = function () { S.recenter = 1; };
  document.getElementById('zOut').onclick = function () { S.anim = null; S.auto = 0; setPlay(); S.Lt = clamp(S.Lt + .5, LMIN, LMAX); };
  cv.addEventListener('wheel', function (e) { e.preventDefault(); S.anim = null; if (S.auto) { S.auto = 0; setPlay(); } S.Lt = clamp(S.Lt + e.deltaY * .0016, LMIN, LMAX); }, { passive: false });
  var ptr = {}, pd0 = 0, downAt = null;
  function pdist() { var k = Object.keys(ptr); if (k.length < 2) return 0; return Math.hypot(ptr[k[0]].x - ptr[k[1]].x, ptr[k[0]].y - ptr[k[1]].y); }
  cv.addEventListener('pointerdown', function (e) { cv.setPointerCapture(e.pointerId); ptr[e.pointerId] = { x: e.offsetX, y: e.offsetY }; pd0 = pdist(); downAt = { x: e.offsetX, y: e.offsetY, m: 0 }; });
  cv.addEventListener('pointermove', function (e) {
    var tip = document.getElementById('tip');
    if (!ptr[e.pointerId]) { var h = hitAt(e.offsetX, e.offsetY); cv.style.cursor = h && h.k ? 'pointer' : 'grab'; if (h) { tip.textContent = h.n + (h.k ? '（點擊飛過去）' : ''); tip.style.left = e.offsetX + 'px'; tip.style.top = e.offsetY + 'px'; tip.style.opacity = 1; } else tip.style.opacity = 0; return; }
    var p = ptr[e.pointerId]; var dx = e.offsetX - p.x, dy = e.offsetY - p.y; p.x = e.offsetX; p.y = e.offsetY;
    if (Object.keys(ptr).length >= 2) { var d = pdist(); if (pd0) { S.anim = null; S.Lt = clamp(S.Lt - Math.log10(d / pd0) * 1.4, LMIN, LMAX); S.L = S.Lt; } pd0 = d; downAt.m = 99; return; }
    downAt.m += Math.abs(dx) + Math.abs(dy); if (downAt.m > 6 && !S.tour) { S.anim = null; S.recenter = 0; var scn = Math.min(W, H) / Math.pow(10, S.L); S.pan[0] -= dx / scn; S.pan[1] += dy / scn; cv.style.cursor = 'grabbing'; document.getElementById('tip').style.opacity = 0; }
  });
  function hitAt(x, y) { var b = null, bd = 1e9; hits.forEach(function (h) { var d = Math.hypot(h.x - x, h.y - y); if (d <= h.r && d < bd) { bd = d; b = h; } }); return b; }
  function up(e) { cv.style.cursor = 'grab'; var tap = downAt && downAt.m <= 6 && Object.keys(ptr).length === 1; delete ptr[e.pointerId]; if (tap) { var h = hitAt(e.offsetX, e.offsetY); if (h && h.k && TARGETS[h.k]) flyTo(h.k); else if (h && h.k) { /* 無預設目標：略過 */ } } if (!Object.keys(ptr).length) downAt = null; }
  cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
  cv.addEventListener('pointerleave', function () { document.getElementById('tip').style.opacity = 0; });
  document.addEventListener('keydown', function (e) { if (!S.tour && /^Arrow/.test(e.key)) { var st = Math.min(W, H) * .12 / (Math.min(W, H) / Math.pow(10, S.L)); S.anim = null; if (e.key === 'ArrowLeft') S.pan[0] -= st; if (e.key === 'ArrowRight') S.pan[0] += st; if (e.key === 'ArrowUp') S.pan[1] += st; if (e.key === 'ArrowDown') S.pan[1] -= st; }
    if (e.key === '+' || e.key === '=') S.Lt = clamp(S.Lt - .4, LMIN, LMAX); if (e.key === '-') S.Lt = clamp(S.Lt + .4, LMIN, LMAX); if (e.key === ' ' && document.activeElement === document.body) { e.preventDefault(); playBtn.click(); } });
  function resize() { dpr = Math.min(devicePixelRatio || 1, 2); W = stage.clientWidth; H = stage.clientHeight; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  addEventListener('resize', resize); resize();
  // 小行星/鄰居也能點擊：補上沒有預設目標者的目標
  GALS.forEach(function (g) { if (!TARGETS[g.id]) TARGETS[g.id] = [g.id, Math.log10(g.D * 2.4)]; });
  CLUSTERS.forEach(function (c) { if (!TARGETS[c.id]) TARGETS[c.id] = [c.id, Math.log10(c.R * 5)]; });

  /* ---------- 導覽模式 ---------- */
  var TOUR = [
    { L: 7.3, hold: 6, t: '地球', s: '直徑 12,742 公里。所有你認識的人，都住在這顆藍色的星球上。' },
    { L: 8.95, hold: 4, t: '月球', s: '38 萬公里外的鄰居。光走過這段距離，只要 1.3 秒。' },
    { L: 13.1, swap: { at: 11.7, focus: 'sun' }, hold: 5.5, hit: 'small', t: '太陽系', s: '八大行星繞著太陽公轉。最外側的海王星，距離我們 45 億公里。' },
    { L: 16.1, hold: 4, t: '歐特雲', s: '太陽系的邊界，是一個由數兆顆彗星組成的巨大球殼。' },
    { L: 17.3, hold: 5, t: '最近的恆星', s: '比鄰星，4.24 光年。以目前最快的太空船，也要飛超過 7 萬年。' },
    { L: 19.7, hold: 4, t: '太陽附近', s: '成千上萬顆恆星，每一顆都可能有自己的行星。' },
    { L: 21.35, hold: 7, hit: 'big', t: '銀河系', s: '直徑 10 萬光年，上千億顆恆星。太陽，只是其中不起眼的一顆。' },
    { L: 23.0, hold: 6, t: '本星系群', s: '仙女座星系在 250 萬光年外，正以每秒 110 公里的速度朝我們靠近。' },
    { L: 24.3, hold: 6, t: '附近的星系', s: '每個光點都是一個星系，各有數千億顆恆星；而這只是宇宙的一小角。' },
    { L: 25.6, hold: 5, t: '星系團與超星系團', s: '星系聚成團，團再聚成超星系團，連成一張巨大的網。' },
    { L: 26.85, hold: 10, hit: 'big', t: '可觀測宇宙', s: '直徑約 930 億光年。我們在這裡：微小，卻能看見這一切。' }
  ];
  var cineT = document.getElementById('cineT'), cineS = document.getElementById('cineS'), cine = document.getElementById('cine'), tourBar = document.getElementById('tourBar'), endCard = document.getElementById('endCard'), intro = document.getElementById('intro');
  function showCine(i) { var w = TOUR[i]; cineT.textContent = w.t; cineS.textContent = w.s; cine.classList.add('show'); document.getElementById('tourStep').textContent = (i + 1) + ' / ' + TOUR.length; }
  function hideCine() { cine.classList.remove('show'); }
  function tourStart() {
    S.anim = null; S.auto = 0; setPlay(); S.focus = 'earth'; S.L = S.Lt = 7.3; S.tour = { i: 0, st: 'hold', t: 0, tm: 0, paused: false };
    stage.classList.add('tour'); endCard.classList.remove('show'); showCine(0); tourBar.classList.add('show'); document.getElementById('tPause').textContent = '⏸ 暫停';
  }
  function tourEnd(finished) {
    S.tour = null; stage.classList.remove('tour'); tourBar.classList.remove('show'); S.Lt = S.L; hideCine();
    if (finished) { endCard.classList.add('show'); }
  }
  document.getElementById('tPause').onclick = function () { if (!S.tour) return; S.tour.paused = !S.tour.paused; this.textContent = S.tour.paused ? '▶ 繼續' : '⏸ 暫停'; };
  document.getElementById('tSkip').onclick = function () { if (!S.tour) return; var T = S.tour; hideCine(); if (T.i >= TOUR.length - 1) { tourEnd(false); return; } T.i++; T.st = 'move'; T.tm = 0; T.paused = false; document.getElementById('tPause').textContent = '⏸ 暫停'; };
  document.getElementById('tExit').onclick = function () { tourEnd(false); };
  document.getElementById('btnTour').onclick = function () { intro.classList.add('gone'); if (!UMUSIC.isOn()) UMUSIC.start(); syncMusic(); tourStart(); };
  document.getElementById('goTour').onclick = function () { intro.classList.add('hide'); setTimeout(function () { intro.classList.add('gone'); }, 1000); UMUSIC.start(); syncMusic(); tourStart(); };
  document.getElementById('goFree').onclick = function () { intro.classList.add('hide'); setTimeout(function () { intro.classList.add('gone'); }, 1000); flyTo('solar'); };
  document.getElementById('eAgain').onclick = function () { tourStart(); };
  document.getElementById('eFree').onclick = function () { endCard.classList.remove('show'); };
  var mbtn = document.getElementById('btnMusic');
  function syncMusic() { mbtn.textContent = UMUSIC.isOn() && !UMUSIC.isMuted() ? '🔊 配樂' : '🔇 配樂'; mbtn.classList.toggle('on', UMUSIC.isOn() && !UMUSIC.isMuted()); }
  mbtn.onclick = function () { if (!UMUSIC.isOn()) UMUSIC.start(); else UMUSIC.setMute(!UMUSIC.isMuted()); syncMusic(); };
  document.getElementById('tMute').onclick = function () { mbtn.click(); this.textContent = UMUSIC.isMuted() ? '🔇' : '🔊'; };
  (function () { var h = (location.hash || '').slice(1); if (h && TARGETS[h]) { intro.classList.add('gone'); S.focus = TARGETS[h][0]; S.L = S.Lt = TARGETS[h][1]; } })();
  setPlay(); syncMusic(); requestAnimationFrame(frame);
  window.__U = { S: S, flyTo: flyTo, tourStart: tourStart, setL: function (L, f) { S.anim = null; S.auto = 0; if (f) S.focus = f; S.L = S.Lt = L; } };
})();
