/* 宇宙配樂 v2：柔和、神秘、放鬆。全部以 Web Audio 即時合成。
   — 低頻鋪底（正弦＋三角波）、緩慢呼吸的「人聲般」氣息、稀疏的低音域鐘聲、很暗的長混響 */
(function (root) {
  'use strict';
  var A = null, master, tone, dry, wet, conv, padLP, padGain, subG, airG, whooshG, whooshBP, voices = [], timers = [], on = false, muted = false, lastPluck = 0, ci = 0;
  var CHORDS = [ // D 小調附近的神秘進行（低八度）
    { b: 73.42, v: [146.83, 174.61, 220, 261.63] }, { b: 58.27, v: [116.54, 146.83, 174.61, 220] },
    { b: 49.0, v: [98, 146.83, 196, 233.08] }, { b: 55.0, v: [110, 164.81, 220, 246.94] }
  ];
  var PENT = [146.83, 174.61, 196, 220, 261.63, 293.66, 349.23, 392];
  var VOL = .8;
  function impulse(a, sec) { // 較暗的混響：高頻衰減較快
    var n = (a.sampleRate * sec) | 0, b = a.createBuffer(2, n, a.sampleRate);
    for (var c = 0; c < 2; c++) { var d = b.getChannelData(c), lp = 0; for (var i = 0; i < n; i++) { var env = Math.pow(1 - i / n, 2.2), al = .06 + .5 * (1 - i / n); lp += ((Math.random() * 2 - 1) - lp) * al; d[i] = lp * env; } }
    return b;
  }
  function noiseBuf(a) { var b = a.createBuffer(1, a.sampleRate * 3, a.sampleRate), d = b.getChannelData(0), lp = 0; for (var i = 0; i < d.length; i++) { lp += ((Math.random() * 2 - 1) - lp) * .35; d[i] = lp * 2; } return b; }
  function start() {
    if (on) return; var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    A = A || new AC(); A.resume(); on = true;
    master = A.createGain(); master.gain.value = 0;
    tone = A.createBiquadFilter(); tone.type = 'lowpass'; tone.frequency.value = 2600; tone.Q.value = .4; // 整體柔化，去掉尖銳高頻
    var comp = A.createDynamicsCompressor(); comp.threshold.value = -22; comp.ratio.value = 3; comp.attack.value = .02; comp.release.value = .4;
    dry = A.createGain(); dry.gain.value = .7; wet = A.createGain(); wet.gain.value = .5; conv = A.createConvolver(); conv.buffer = impulse(A, 6.5);
    dry.connect(comp); wet.connect(conv); conv.connect(comp); comp.connect(tone); tone.connect(master); master.connect(A.destination);
    master.gain.linearRampToValueAtTime(muted ? 0 : VOL, A.currentTime + 6);
    // 鋪底：正弦＋輕微失諧的三角波，極慢的濾波器起伏
    padLP = A.createBiquadFilter(); padLP.type = 'lowpass'; padLP.frequency.value = 320; padLP.Q.value = .3; padGain = A.createGain(); padGain.gain.value = .26;
    padLP.connect(padGain); padGain.connect(dry); padGain.connect(wet);
    var lfo = A.createOscillator(), lg = A.createGain(); lfo.frequency.value = .045; lg.gain.value = 120; lfo.connect(lg); lg.connect(padLP.frequency); lfo.start();
    for (var i = 0; i < 4; i++) {
      var o1 = A.createOscillator(); o1.type = 'sine'; o1.frequency.value = CHORDS[0].v[i]; var g1 = A.createGain(); g1.gain.value = .11;
      var o2 = A.createOscillator(); o2.type = 'triangle'; o2.frequency.value = CHORDS[0].v[i]; o2.detune.value = (i % 2 ? 7 : -7); var g2 = A.createGain(); g2.gain.value = .035;
      o1.connect(g1); g1.connect(padLP); o2.connect(g2); g2.connect(padLP); o1.start(); o2.start(); voices.push(o1, o2);
    }
    var sub = A.createOscillator(); sub.type = 'sine'; sub.frequency.value = CHORDS[0].b; subG = A.createGain(); subG.gain.value = 0; sub.connect(subG); subG.connect(dry); sub.start(); voices.sub = sub; voices.push(sub);
    subG.gain.linearRampToValueAtTime(.16, A.currentTime + 8);
    // 氣息：被濾波的噪音，像遠方的合唱，隨呼吸起伏
    var ns = A.createBufferSource(); ns.buffer = noiseBuf(A); ns.loop = true;
    var f1 = A.createBiquadFilter(); f1.type = 'bandpass'; f1.frequency.value = 420; f1.Q.value = 5; var f2 = A.createBiquadFilter(); f2.type = 'bandpass'; f2.frequency.value = 880; f2.Q.value = 6;
    airG = A.createGain(); airG.gain.value = 0; var al = A.createOscillator(), alg = A.createGain(); al.frequency.value = .07; alg.gain.value = .35; al.connect(alg);
    var am = A.createGain(); am.gain.value = .65; alg.connect(am.gain); ns.connect(f1); ns.connect(f2); f1.connect(am); f2.connect(am); am.connect(airG); airG.connect(wet); airG.connect(dry); ns.start(); al.start(); voices.push(al);
    // 躍進風聲（很輕）
    var wn = A.createBufferSource(); wn.buffer = noiseBuf(A); wn.loop = true; whooshBP = A.createBiquadFilter(); whooshBP.type = 'bandpass'; whooshBP.frequency.value = 250; whooshBP.Q.value = .6; whooshG = A.createGain(); whooshG.gain.value = 0;
    wn.connect(whooshBP); whooshBP.connect(whooshG); whooshG.connect(wet); wn.start();
    timers.push(setInterval(nextChord, 11000));
  }
  function nextChord() {
    if (!A) return; ci = (ci + 1) % CHORDS.length; var c = CHORDS[ci], t = A.currentTime;
    for (var i = 0; i < 4; i++) { voices[i * 2].frequency.setTargetAtTime(c.v[i], t, 2.2); voices[i * 2 + 1].frequency.setTargetAtTime(c.v[i], t, 2.2); }
    voices.sub.frequency.setTargetAtTime(c.b, t, 1.4);
  }
  function bell(freq, vel) { // 柔和的低音鐘：慢起音、長尾音
    var t = A.currentTime, o = A.createOscillator(), o2 = A.createOscillator(), g = A.createGain(), lp = A.createBiquadFilter();
    o.type = 'sine'; o.frequency.value = freq; o2.type = 'sine'; o2.frequency.value = freq * 2.005; lp.type = 'lowpass'; lp.frequency.value = 1100;
    var g2 = A.createGain(); g2.gain.value = .12;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vel, t + .14); g.gain.exponentialRampToValueAtTime(.0001, t + 5.5);
    o.connect(g); o2.connect(g2); g2.connect(g); g.connect(lp); lp.connect(wet); lp.connect(dry); o.start(t); o2.start(t); o.stop(t + 5.8); o2.stop(t + 5.8);
  }
  // L：目前尺度；vL：縮放速度；p：進度
  function update(L, vL, p) {
    if (!on || !A) return; var t = A.currentTime, k = Math.min(1, Math.max(0, (L - 6.5) / 20));
    padLP.frequency.setTargetAtTime(280 + 620 * k + 160 * Math.min(1, vL), t, 1.2);
    wet.gain.setTargetAtTime(.45 + .25 * k, t, 2); padGain.gain.setTargetAtTime(.24 + .06 * k, t, 2);
    airG.gain.setTargetAtTime(.02 + .035 * k, t, 2);
    whooshG.gain.setTargetAtTime(Math.min(.05, Math.max(0, (vL - .4) * .045)), t, .5); whooshBP.frequency.setTargetAtTime(220 + vL * 420, t, .5);
    var gap = 2.6 - Math.min(1.2, vL * .35 + k * .7);
    if (t - lastPluck > gap && !muted) { lastPluck = t + Math.random() * .9; var idx = Math.min(PENT.length - 1, Math.floor(Math.random() * (4 + k * 4))); bell(PENT[idx], .016 + Math.random() * .014 + k * .01); }
  }
  function hit(big) { // 重音：低沉的脈動與緩緩升起的和聲（不尖銳）
    if (!on || !A || muted) return; var t = A.currentTime, o = A.createOscillator(), g = A.createGain(), lp = A.createBiquadFilter();
    o.type = 'sine'; o.frequency.setValueAtTime(78, t); o.frequency.exponentialRampToValueAtTime(34, t + 1.8); lp.type = 'lowpass'; lp.frequency.value = 220;
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(big ? .42 : .26, t + .05); g.gain.exponentialRampToValueAtTime(.001, t + 3.2); o.connect(lp); lp.connect(g); g.connect(dry); g.connect(wet); o.start(t); o.stop(t + 3.4);
    [146.83, 220, 293.66, 440].forEach(function (f, i) { var q = A.createOscillator(), h = A.createGain(), l2 = A.createBiquadFilter(); q.type = 'sine'; q.frequency.value = f; l2.type = 'lowpass'; l2.frequency.value = 900;
      h.gain.setValueAtTime(0, t); h.gain.linearRampToValueAtTime((big ? .055 : .035) / (1 + i * .5), t + 1.6); h.gain.exponentialRampToValueAtTime(.0001, t + (big ? 9 : 5.5)); q.connect(l2); l2.connect(h); h.connect(wet); h.connect(dry); q.start(t); q.stop(t + 9.5); });
  }
  function setMute(m) { muted = m; if (master && A) master.gain.setTargetAtTime(m ? 0 : VOL, A.currentTime, .4); }
  function stop() { if (!on) return; on = false; timers.forEach(clearInterval); timers = []; if (master) master.gain.setTargetAtTime(0, A.currentTime, .6); setTimeout(function () { voices.forEach(function (o) { try { o.stop(); } catch (e) {} }); voices = []; if (A) A.suspend(); }, 2200); }
  root.UMUSIC = { start: start, stop: stop, update: update, hit: hit, setMute: setMute, isOn: function () { return on; }, isMuted: function () { return muted; } };
})(window);
