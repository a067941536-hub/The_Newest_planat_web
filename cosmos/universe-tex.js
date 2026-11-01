/* 程序化行星材質與球體渲染（不依賴圖片） */
(function (root) {
  'use strict';
  function hash(i, j, s) { var h = (Math.imul(i, 374761393) + Math.imul(j, 668265263) + Math.imul(s, 1442695041)) | 0; h = Math.imul(h ^ (h >>> 13), 1274126177); return ((h ^ (h >>> 16)) >>> 0) / 4294967295; }
  function sm(t) { return t * t * (3 - 2 * t); }
  function vnoise(x, y, per, s) {
    var xi = Math.floor(x), yi = Math.floor(y), xf = sm(x - xi), yf = sm(y - yi);
    var x0 = ((xi % per) + per) % per, x1 = (x0 + 1) % per;
    var a = hash(x0, yi, s), b = hash(x1, yi, s), c = hash(x0, yi + 1, s), d = hash(x1, yi + 1, s);
    return a + (b - a) * xf + (c - a) * yf + (a - b - c + d) * xf * yf;
  }
  // u: 0..1（經度，可循環）  v: 0..1（緯度，0=北極）
  function fbm(u, v, oct, f0, seed) {
    var s = 0, a = .5, f = f0, n = 0;
    for (var o = 0; o < oct; o++) { s += a * vnoise(u * f, v * f * .5, f, seed + o * 17); n += a; a *= .5; f *= 2; }
    return s / n;
  }
  function cl(x, a, b) { return x < a ? a : (x > b ? b : x); }
  function ss(a, b, x) { var t = cl((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  function mix(c1, c2, t) { return [c1[0] + (c2[0] - c1[0]) * t, c1[1] + (c2[1] - c1[1]) * t, c1[2] + (c2[2] - c1[2]) * t]; }
  function contrast(x, k) { return cl((x - .5) * k + .5, 0, 1); }

  var GEN = {
    earth: function (u, v) {
      var lat = Math.abs(.5 - v) * 2; // 0 赤道 → 1 極
      var e = contrast(fbm(u, v, 6, 3, 11), 2.6), m = fbm(u, v, 4, 5, 33), col;
      if (e > .5) {
        var h = ss(.5, .85, e);
        col = mix([54, 120, 58], [128, 112, 72], h);
        if (m < .46 && lat < .55) col = mix(col, [205, 175, 110], ss(.46, .36, m) * .9);
        if (lat > .62) col = mix(col, [236, 242, 247], ss(.62, .8, lat));
      } else {
        col = mix([8, 34, 96], [38, 108, 178], ss(.2, .5, e));
        if (lat > .8) col = mix(col, [225, 235, 245], ss(.8, .92, lat));
      }
      var c = contrast(fbm(u + .31, v, 5, 5, 77), 2.4), ca = ss(.52, .78, c) * .88;
      return mix(col, [255, 255, 255], ca);
    },
    mars: function (u, v) {
      var lat = Math.abs(.5 - v) * 2, n = fbm(u, v, 6, 4, 5), d = contrast(fbm(u, v, 4, 3, 91), 2.4);
      var col = mix([184, 104, 62], [210, 140, 90], n);
      col = mix(col, [92, 52, 44], ss(.55, .75, d) * .8);
      if (lat > .88) col = mix(col, [245, 245, 250], ss(.88, .95, lat));
      return col;
    },
    venus: function (u, v) {
      var w = fbm(u, v, 4, 2, 3), n = fbm(u + w * .5, v + w * .15, 5, 3, 9);
      return mix([236, 208, 146], [196, 150, 92], contrast(n, 2.2));
    },
    jupiter: function (u, v) {
      var lat = (.5 - v) * Math.PI, t = fbm(u * 1, v * 2, 5, 2, 21), b = Math.sin(lat * 9 + t * 3) + .55 * Math.sin(lat * 21 + 1 + t * 5) + .6 * (t - .5);
      var k = cl(b * .5 + .5, 0, 1), col = mix([232, 206, 164], [168, 108, 66], k);
      if (k > .72) col = mix(col, [250, 240, 222], (k - .72) * 2);
      var dx = ((u - .3 + 1.5) % 1) - .5, dy = (lat + .38) * 1.6, g = dx * dx / .0035 + dy * dy / .008;
      if (g < 1) col = mix(col, [190, 76, 52], (1 - g) * .85);
      return col;
    },
    saturn: function (u, v) {
      var lat = (.5 - v) * Math.PI, t = fbm(u, v, 4, 2, 41), b = Math.sin(lat * 12 + t * 2) * .5 + .5;
      return mix([236, 214, 160], [200, 168, 108], b * .8 + (t - .5) * .5);
    },
    uranus: function (u, v) { var lat = (.5 - v) * Math.PI, b = Math.sin(lat * 10) * .5 + .5, t = fbm(u, v, 3, 2, 8); return mix([140, 210, 222], [176, 232, 238], b * .6 + t * .4); },
    neptune: function (u, v) {
      var lat = (.5 - v) * Math.PI, t = fbm(u, v, 5, 3, 14), b = Math.sin(lat * 11 + t * 3) * .5 + .5;
      var col = mix([40, 78, 200], [76, 118, 240], b * .7 + (t - .5) * .6);
      var dx = ((u - .6 + 1.5) % 1) - .5, dy = (lat + .3) * 1.8, g = dx * dx / .004 + dy * dy / .006; if (g < 1) col = mix(col, [20, 36, 120], (1 - g) * .8);
      var w = contrast(fbm(u * 1, v, 4, 5, 60), 3); if (w > .78) col = mix(col, [190, 215, 255], (w - .78) * 1.5);
      return col;
    },
    sun: function (u, v) {
      var g = fbm(u, v, 5, 14, 5), s = contrast(fbm(u, v, 3, 3, 71), 3), col = mix([255, 132, 20], [255, 214, 90], contrast(g, 2.4));
      var lat = Math.abs(.5 - v);
      if (s > .74 && lat < .3) col = mix(col, [140, 50, 8], (s - .74) * 3.2);
      return col;
    },
    mercury: function (u, v) { var n = fbm(u, v, 6, 4, 2); var g = 96 + n * 90; return [g, g * .97, g * .92]; },
    moon: function (u, v) { var n = fbm(u, v, 6, 3, 6), m = fbm(u, v, 3, 2, 9), g = 130 + n * 85; if (m < .46) g *= .72; return [g, g, g * .98]; }
  };
  function craters(t, n, seed) {
    for (var c = 0; c < n; c++) {
      var u = hash(c, 1, seed), v = .12 + hash(c, 2, seed) * .76, r = (.004 + Math.pow(hash(c, 3, seed), 3) * .045) * t.w;
      var cx = u * t.w, cy = v * t.h, kx = 1 / Math.max(.3, Math.sin(v * Math.PI));
      for (var y = -r; y <= r; y++) for (var x = -r * kx; x <= r * kx; x++) {
        var d = Math.sqrt((x / kx) * (x / kx) + y * y) / r; if (d > 1.2) continue;
        var px = ((Math.round(cx + x) % t.w) + t.w) % t.w, py = Math.round(cy + y); if (py < 0 || py >= t.h) continue;
        var i = (py * t.w + px) * 3, f = d < .85 ? -.2 * (1 - d) : (d < 1.05 ? .22 : 0); if (!f) continue;
        t.d[i] = cl(t.d[i] * (1 + f), 0, 255); t.d[i + 1] = cl(t.d[i + 1] * (1 + f), 0, 255); t.d[i + 2] = cl(t.d[i + 2] * (1 + f), 0, 255);
      }
    }
  }
  var TEX = {};
  function make(name) {
    if (TEX[name]) return TEX[name];
    var w = name === 'earth' ? 512 : 384, h = w / 2, d = new Uint8ClampedArray(w * h * 3), g = GEN[name];
    for (var y = 0; y < h; y++) for (var x = 0; x < w; x++) { var c = g(x / w, y / h), i = (y * w + x) * 3; d[i] = c[0]; d[i + 1] = c[1]; d[i + 2] = c[2]; }
    var t = { w: w, h: h, d: d };
    if (name === 'moon') craters(t, 200, 3); if (name === 'mercury') craters(t, 260, 8);
    return (TEX[name] = t);
  }

  /* 球體渲染：依像素取材質，Lambert 光照＋邊緣暗化＋大氣光暈 */
  var cache = {}, off = document.createElement('canvas'), octx = off.getContext('2d');
  function disc(N) {
    if (cache[N]) return cache[N];
    var n2 = N * N, u = new Float32Array(n2), v = new Float32Array(n2), w = new Float32Array(n2), lon = new Float32Array(n2), ty = new Uint16Array(n2), a = new Float32Array(n2);
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      var i = y * N + x, uu = (x + .5) / N * 2 - 1, vv = (y + .5) / N * 2 - 1, r2 = uu * uu + vv * vv;
      u[i] = uu; v[i] = vv; var ww = Math.sqrt(Math.max(0, 1 - r2)); w[i] = ww; lon[i] = Math.atan2(uu, ww);
      ty[i] = cl(Math.round((Math.asin(cl(vv, -1, 1)) / Math.PI + .5) * 1000), 0, 1000);
      a[i] = cl((1 - Math.sqrt(r2)) * N * .5, 0, 1);
    }
    return (cache[N] = { u: u, v: v, w: w, lon: lon, ty: ty, a: a });
  }
  // opts: lx,ly (螢幕上朝向太陽的單位向量), spin, atm [r,g,b], emissive
  function sphere(ctx, name, cx, cy, R, opts) {
    var t = make(name), N = cl(Math.round(R * 2), 20, 360), D = disc(N);
    off.width = N; off.height = N; var img = octx.createImageData(N, N), px = img.data;
    var lx = opts.lx * .82, ly = opts.ly * .82, lz = .58, ln = Math.sqrt(lx * lx + ly * ly + lz * lz); lx /= ln; ly /= ln; lz /= ln;
    var spin = opts.spin || 0, atm = opts.atm, em = opts.emissive, TW = t.w, TH = t.h, td = t.d, TAU = Math.PI * 2;
    for (var i = 0, n2 = N * N; i < n2; i++) {
      var al = D.a[i]; if (al <= 0) continue;
      var ww = D.w[i], lon = (D.lon[i] + spin) / TAU; lon -= Math.floor(lon);
      var fx = lon * TW, x0 = fx | 0, ax = fx - x0, x1 = x0 + 1 >= TW ? 0 : x0 + 1, fy = (D.ty[i] / 1000) * (TH - 1), y0 = fy | 0, ay = fy - y0, y1 = y0 + 1 >= TH ? y0 : y0 + 1;
      var i00 = (y0 * TW + x0) * 3, i10 = (y0 * TW + x1) * 3, i01 = (y1 * TW + x0) * 3, i11 = (y1 * TW + x1) * 3, w00 = (1 - ax) * (1 - ay), w10 = ax * (1 - ay), w01 = (1 - ax) * ay, w11 = ax * ay;
      var r = td[i00] * w00 + td[i10] * w10 + td[i01] * w01 + td[i11] * w11, g = td[i00 + 1] * w00 + td[i10 + 1] * w10 + td[i01 + 1] * w01 + td[i11 + 1] * w11, b = td[i00 + 2] * w00 + td[i10 + 2] * w10 + td[i01 + 2] * w01 + td[i11 + 2] * w11, k;
      if (em) { k = .62 + .38 * Math.pow(ww, .5); }
      else { var lam = D.u[i] * lx + D.v[i] * ly + ww * lz; k = lam > 0 ? .06 + lam * .98 : .045; k *= .55 + .45 * Math.pow(ww, .35); }
      r *= k; g *= k; b *= k;
      if (atm && ww < .42) { var rim = (1 - ww / .42); rim *= rim; var lit = cl(D.u[i] * lx + D.v[i] * ly + .55, 0, 1); r += atm[0] * rim * lit * .9; g += atm[1] * rim * lit * .9; b += atm[2] * rim * lit * .9; }
      var o = i * 4; px[o] = r > 255 ? 255 : r; px[o + 1] = g > 255 ? 255 : g; px[o + 2] = b > 255 ? 255 : b; px[o + 3] = al * 255;
    }
    octx.putImageData(img, 0, 0);
    if (atm) { // 外側大氣暈
      var gg = ctx.createRadialGradient(cx, cy, R * .96, cx, cy, R * 1.14); var c = 'rgba(' + atm[0] + ',' + atm[1] + ',' + atm[2] + ',';
      gg.addColorStop(0, c + (.28 * (opts.lit == null ? 1 : opts.lit)) + ')'); gg.addColorStop(1, c + '0)'); ctx.fillStyle = gg; ctx.beginPath(); ctx.arc(cx, cy, R * 1.14, 0, 6.2832); ctx.fill();
    }
    ctx.imageSmoothingEnabled = true; ctx.drawImage(off, cx - R, cy - R, R * 2, R * 2);
  }
  root.PTEX = { make: make, sphere: sphere, names: Object.keys(GEN) };
})(window);
