(function(){
  var id=document.body.dataset.planet,P=PLANETS[id],app=document.getElementById('app');
  function stat(s){return '<div class="pstat"><small>'+s[0]+'</small><b>'+s[1]+'</b>'+(s[2]?'<span>'+s[2]+'</span>':'')+'</div>';}
  app.innerHTML=
   '<a class="back-btn" href="../SEplanets.html#solar">← 返回行星列表</a>'+
   '<header class="glass-card p-hero"><div class="p-sphere"><canvas id="ps" width="560" height="560"></canvas></div><div class="p-info"><span class="eyebrow">'+P.en.toUpperCase()+'</span><h1>'+P.n+'</h1><p class="p-tag">'+P.tag+'</p><div class="pills"><span>'+P.type+'</span>'+(P.au?'<span>距太陽 '+P.au+' AU</span>':'')+'</div>'+
   '<div class="cta-row" style="margin-top:18px"><a class="btn primary" href="../universe.html#'+(id==='asteroid'?'solar':(id==='merc'?'mercury':id))+'">🔭 在宇宙尺度中看它</a><a class="btn" href="../jdiagram.html">太陽系模型</a></div></div></header>'+
   '<section class="glass-card"><div class="section-head"><h2>快速數據</h2><span>Quick Facts</span></div><div class="pstats">'+P.stats.map(stat).join('')+'</div></section>'+
   '<section class="glass-card weight"><div class="section-head"><h2>你在這裡有多重？</h2><span>Weight</span></div><div class="wrow"><label>你的體重 <input type="number" id="wIn" value="50" min="1" max="300"> 公斤</label><div class="wres">在 '+P.n+' 上，磅秤會顯示 <b id="wOut"></b> 公斤</div></div><p class="wn">'+(P.em?'太陽是氣體球，沒有地方可以站，這裡的數字是以表面重力計算的假想值。':(id==='jupiter'||id==='saturn'||id==='uranus'||id==='neptune'?'氣態／冰巨行星沒有固體表面，這是以雲頂高度的重力估算。':'依表面重力計算（地球 = 1，這裡是 '+P.g+'）。'))+'</p></section>'+
   '<section><div class="section-head"><h2>三個特色</h2><span>Highlights</span></div><div class="pfeat">'+P.feats.map(function(f){return '<div class="glass-card"><h3>'+f[0]+'</h3><p>'+f[1]+'</p></div>';}).join('')+'</div></section>'+
   '<section class="glass-card"><div class="section-head"><h2>你可能不知道</h2><span>Did You Know</span></div><ul class="pfun">'+P.fun.map(function(f){return '<li>'+f+'</li>';}).join('')+'</ul></section>'+
   '<section class="glass-card"><div class="section-head"><h2>探測任務</h2><span>Missions</span></div><div class="pmis">'+P.missions.map(function(m){return '<div><b>'+m[0]+'</b><small>'+m[1]+'</small><p>'+m[2]+'</p></div>';}).join('')+'</div></section>';
  var wIn=document.getElementById('wIn'),wOut=document.getElementById('wOut');function wc(){wOut.textContent=(+wIn.value*P.g).toFixed(P.g<1?1:(P.g>5?0:1));}wIn.oninput=wc;wc();
  // 行星球體
  var cv=document.getElementById('ps'),c=cv.getContext('2d'),R=170,t0=performance.now();
  function ring(front){var tilt=-.42,rat=.36,bands=[[1.24,1.5,.2],[1.52,1.95,.62],[2.03,2.26,.46]];c.save();c.translate(280,280);c.rotate(tilt);c.scale(1,rat);c.beginPath();if(front)c.rect(-R*3,0,R*6,R*3);else c.rect(-R*3,-R*3,R*6,R*3);c.clip();
    bands.forEach(function(b){c.strokeStyle='rgba(232,210,160,'+b[2]+')';c.lineWidth=(b[1]-b[0])*R;c.beginPath();c.arc(0,0,(b[0]+b[1])/2*R,0,6.2832);c.stroke();});c.restore();}
  var Rr=P.ring?R*.62:(P.em?R*.92:R);
  function draw(now){var s=(now-t0)/1000;c.clearRect(0,0,560,560);
    if(P.em){var g=c.createRadialGradient(280,280,Rr*.9,280,280,Rr*1.6);g.addColorStop(0,'rgba(255,170,60,.45)');g.addColorStop(1,'rgba(255,120,30,0)');c.fillStyle=g;c.beginPath();c.arc(280,280,Rr*1.6,0,6.2832);c.fill();}
    if(P.ring){var R0=R;R=Rr;ring(0);R=R0;}
    PTEX.sphere(c,P.tex,280,280,Rr,{lx:-.75,ly:-.45,spin:s*.18*(P.rot||1),atm:P.atm,emissive:!!P.em});
    if(P.ring){var R1=R;R=Rr;ring(1);R=R1;}
    setTimeout(function(){requestAnimationFrame(draw);},33);}
  requestAnimationFrame(draw);
})();
