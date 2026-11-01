/* 星座頁渲染：<body data-sign="aries"> */
(function () {
  var id = document.body.dataset.sign, Z = window.ZODIAC, sg = Z.signs[id], el = Z.el[sg.el];
  var app = document.getElementById('app'), off = 0;
  document.documentElement.style.setProperty('--accent', el.c);
  function stars(n) { var s = ''; for (var i = 1; i <= 5; i++) s += '<i class="' + (i <= n ? 'on' : '') + '">★</i>'; return '<span class="stars" aria-label="' + n + ' 顆星">' + s + '</span>'; }
  var WK = ['日', '一', '二', '三', '四', '五', '六'];
  function render() {
    var d = Z.daily(id, off), dt = d.date, ds = dt.getFullYear() + '.' + (dt.getMonth() + 1) + '.' + dt.getDate() + '（週' + WK[dt.getDay()] + '）';
    var h = '<div class="tabs" role="tablist">' + [[-1, '昨天'], [0, '今天'], [1, '明天']].map(function (t) {
      return '<button role="tab" class="' + (t[0] === off ? 'on' : '') + '" data-off="' + t[0] + '">' + t[1] + '</button>'; }).join('') + '<span class="dt">' + ds + '</span></div>';
    h += '<div class="overall"><div><small>整體運勢</small>' + stars(d.overall) + '</div><p>' + d.overallText + '</p></div><div class="cat-grid">';
    d.cats.forEach(function (c) {
      h += '<div class="cat"><div class="cat-h"><span>' + c.icon + ' ' + c.label + '</span>' + stars(c.rating) + '</div><div class="meter"><i style="width:' + c.rating * 20 + '%"></i></div><p>' + c.text + '</p></div>';
    });
    h += '</div><div class="do-row"><div class="do yi"><small>宜</small><b>' + d.yi + '</b></div><div class="do ji"><small>忌</small><b>' + d.ji + '</b></div></div>';
    h += '<div class="lucky"><div><small>幸運色</small><b><i class="sw" style="background:' + d.color.hex + '"></i>' + d.color.n + '</b></div><div><small>幸運數字</small><b>' + d.num + '</b></div><div><small>幸運方位</small><b>' + d.dir + '</b></div><div><small>順利時段</small><b>' + d.time + '</b></div></div>';
    document.getElementById('daily').innerHTML = h;
    document.querySelectorAll('.cat,.overall,.do,.lucky>div').forEach(function (e, i) { e.style.animationDelay = i * 45 + 'ms'; });
  }
  app.innerHTML =
    '<a class="back-btn" href="../SEother.html">← 返回星座列表</a>' +
    '<header class="zodiac-header glass-card"><div class="sym">' + sg.s + '</div><div><h1 style="color:' + el.c + '">' + sg.n + ' <small>' + sg.en.toUpperCase() + '</small></h1><p class="dates">' + sg.d + '</p>' +
    '<div class="pills"><span>' + el.n + '</span><span>' + sg.mode + '星座</span><span>守護星：' + sg.ruler + '</span></div></div></header>' +
    '<section class="glass-card daily-card"><div class="section-head"><h2>每日運勢</h2><span>每天 00:00 更新</span></div><div id="daily"></div></section>' +
    '<section class="glass-card about-sign"><div class="section-head"><h2>認識' + sg.n + '</h2><span>' + sg.tag + '</span></div><p class="intro">' + sg.intro + '</p>' +
    '<div class="chips" style="margin-bottom:16px">' + sg.kw.map(function (k) { return '<span class="chip">' + k + '</span>'; }).join('') + '</div>' +
    '<div class="two"><div><h3>✨ 優點</h3><ul>' + sg.good.map(function (g) { return '<li>' + g + '</li>'; }).join('') + '</ul></div><div><h3>🌱 小提醒</h3><ul>' + sg.care.map(function (g) { return '<li>' + g + '</li>'; }).join('') + '</ul></div></div>' +
    '<p class="sign-tip">💬 ' + sg.tip + '</p></section>';
  document.getElementById('daily').addEventListener('click', function (e) { var b = e.target.closest('.tabs button'); if (b) { off = +b.dataset.off; render(); } });
  render();
})();
