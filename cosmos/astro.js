/* 簡化天文計算：行星日心位置（含偏心率修正）、地心視位置、太陽、月球、恆星時、地平座標（精度約 1° 內，供教學示意） */
(function (root) {
  'use strict';
  var D2R = Math.PI / 180, J2000 = Date.UTC(2000, 0, 1, 12);
  var EL = { // a(AU) e L0(度) P(天) ϖ(度)
    mercury: { a: .38710, e: .20563, L0: 252.25, P: 87.969, w: 77.46 }, venus: { a: .72333, e: .00677, L0: 181.98, P: 224.701, w: 131.53 },
    earth: { a: 1.00000, e: .01671, L0: 100.46, P: 365.256, w: 102.94 }, mars: { a: 1.52368, e: .09340, L0: 355.45, P: 686.980, w: 336.04 },
    jupiter: { a: 5.20260, e: .04849, L0: 34.40, P: 4332.59, w: 14.75 }, saturn: { a: 9.55491, e: .05551, L0: 49.94, P: 10759.22, w: 92.43 },
    uranus: { a: 19.2184, e: .04630, L0: 313.23, P: 30688.5, w: 170.96 }, neptune: { a: 30.1104, e: .00899, L0: 304.88, P: 60182, w: 44.97 }
  };
  function days(date) { return ((date instanceof Date ? date.getTime() : date) - J2000) / 864e5; }
  function norm(x) { x = x % 360; return x < 0 ? x + 360 : x; }
  function helio(id, d) {
    var p = EL[id], L = norm(p.L0 + 360 * d / p.P), M = (L - p.w) * D2R, e = p.e;
    var v = M + (2 * e * Math.sin(M) + 1.25 * e * e * Math.sin(2 * M)), lon = v + p.w * D2R;
    var r = p.a * (1 - e * e) / (1 + e * Math.cos(v));
    return { lon: lon, r: r, x: r * Math.cos(lon), y: r * Math.sin(lon) };
  }
  function geo(id, d) { var p = helio(id, d), e = helio('earth', d), x = p.x - e.x, y = p.y - e.y; return { lon: Math.atan2(y, x), lat: 0, dist: Math.hypot(x, y) }; }
  function sun(d) { var e = helio('earth', d); return { lon: e.lon + Math.PI, lat: 0, dist: e.r }; }
  function moon(d) {
    var L = 218.316 + 13.176396 * d, M = 134.963 + 13.064993 * d, F = 93.272 + 13.229350 * d;
    var lon = L + 6.289 * Math.sin(M * D2R), lat = 5.128 * Math.sin(F * D2R);
    return { lon: norm(lon) * D2R, lat: lat * D2R, dist: 385000 - 20905 * Math.cos(M * D2R) };
  }
  function eclToEq(lon, lat, d) {
    var eps = (23.4393 - 3.563e-7 * d) * D2R, sl = Math.sin(lon), cl = Math.cos(lon), sb = Math.sin(lat), cb = Math.cos(lat);
    var ra = Math.atan2(sl * Math.cos(eps) * cb - sb * Math.sin(eps), cl * cb), dec = Math.asin(sb * Math.cos(eps) + cb * Math.sin(eps) * sl);
    return { ra: ra < 0 ? ra + 2 * Math.PI : ra, dec: dec };
  }
  function gmst(d) { return norm(280.46061837 + 360.98564736629 * d) * D2R; }
  // ra,dec(弧度)；lat,lon(度，東經為正)；d：自 J2000 的天數 → 高度、方位（北為 0，向東增加）
  function horiz(ra, dec, lat, lon, d) {
    var H = gmst(d) + lon * D2R - ra, phi = lat * D2R, sa = Math.sin(dec) * Math.sin(phi) + Math.cos(dec) * Math.cos(phi) * Math.cos(H);
    var alt = Math.asin(Math.max(-1, Math.min(1, sa)));
    var az = Math.atan2(-Math.cos(dec) * Math.sin(H), Math.sin(dec) * Math.cos(phi) - Math.cos(dec) * Math.sin(phi) * Math.cos(H));
    return { alt: alt, az: az < 0 ? az + 2 * Math.PI : az };
  }

  /* 彗星：克卜勒軌道（投影到黃道面的示意）。w：近日點黃經；T：近日點時刻；P：週期（天）；dir：公轉方向（+1 順行、−1 逆行） */
  var COMETS = {
    halley: { n: '哈雷彗星', a: 17.834, e: .96714, w: 169.75, T: Date.UTC(1986, 1, 9, 12), P: 27563, dir: -1 },
    encke: { n: '恩克彗星', a: 2.215, e: .8471, w: 161.1, T: Date.UTC(2023, 9, 22, 12), P: 1204, dir: 1 },
    c67p: { n: '67P 彗星', a: 3.462, e: .6405, w: 63.0, T: Date.UTC(2021, 10, 2, 12), P: 2352, dir: 1 }
  };
  function kepler(M, e) { M = ((M + Math.PI) % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI) - Math.PI; var E = e > .8 ? Math.PI : M; for (var i = 0; i < 40; i++) { var d = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E)); E -= d; if (Math.abs(d) < 1e-9) break; } return E; }
  function comet(id, d) {
    var c = COMETS[id], dt = d - (c.T - J2000) / 864e5, E = kepler(2 * Math.PI * dt / c.P, c.e);
    var x = c.a * (Math.cos(E) - c.e), y = c.a * Math.sqrt(1 - c.e * c.e) * Math.sin(E), nu = Math.atan2(y, x), r = c.a * (1 - c.e * Math.cos(E)), lon = c.w * D2R + c.dir * nu;
    return { r: r, lon: lon, x: r * Math.cos(lon), y: r * Math.sin(lon) };
  }
  function cometOrbit(id, n) {
    var c = COMETS[id], pts = [], b = c.a * Math.sqrt(1 - c.e * c.e);
    for (var i = 0; i <= n; i++) { var E = i / n * 2 * Math.PI, x = c.a * (Math.cos(E) - c.e), y = b * Math.sin(E), nu = Math.atan2(y, x), r = Math.hypot(x, y), lon = c.w * D2R + c.dir * nu; pts.push({ r: r, lon: lon, x: r * Math.cos(lon), y: r * Math.sin(lon) }); }
    return pts;
  }
  root.ASTRO = { COMETS: COMETS, comet: comet, cometOrbit: cometOrbit, EL: EL, days: days, helio: helio, geo: geo, sun: sun, moon: moon, eclToEq: eclToEq, gmst: gmst, horiz: horiz, J2000: J2000 };
})(window);
