/* 小云朵回家 · synthesized sound effects, music box, narration */
(function () {
  'use strict';
  const SB = window.SB;
  const A = (SB.A = { ctx: null, muted: false, musicOn: true });
  let ac, master, sfx, musicBus, reverb, noiseBuf;

  A.init = () => {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    ac = A.ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain(); master.gain.value = 0.9;
    const comp = ac.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4;
    master.connect(comp).connect(ac.destination);
    sfx = ac.createGain(); sfx.gain.value = 0.8; sfx.connect(master);
    musicBus = ac.createGain(); musicBus.gain.value = 0; musicBus.connect(master);
    // reverb impulse
    const len = ac.sampleRate * 2.2; const ir = ac.createBuffer(2, len, ac.sampleRate);
    for (let ch = 0; ch < 2; ch++) { const d = ir.getChannelData(ch); for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
    reverb = ac.createConvolver(); reverb.buffer = ir;
    const rvG = ac.createGain(); rvG.gain.value = 0.35; reverb.connect(rvG).connect(master);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const nd = noiseBuf.getChannelData(0); for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
    startMusic();
  };
  A.setMuted = (m) => { A.muted = m; if (master && ac) master.gain.setTargetAtTime(m ? 0 : 0.9, ac.currentTime, 0.05); if (m) A.stopSpeech(); };
  A.setMusic = (on) => { A.musicOn = on; if (musicBus) musicBus.gain.setTargetAtTime(on ? 0.16 : 0, ac.currentTime, 0.4); };
  const ok = () => ac && !A.muted;
  const now = () => ac.currentTime;
  const env = (g, t0, a, peak, d, sus = 0) => { g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(peak, t0 + a); g.gain.exponentialRampToValueAtTime(Math.max(0.0001, sus), t0 + a + d); };
  const osc = (type, f, t0, dur, out, gainPeak = 0.3, a = 0.01) => {
    const o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f, t0);
    const g = ac.createGain(); env(g, t0, a, gainPeak, dur); o.connect(g).connect(out); o.start(t0); o.stop(t0 + a + dur + 0.05);
    return { o, g };
  };
  const noise = (t0, dur, out) => { const s = ac.createBufferSource(); s.buffer = noiseBuf; s.loop = true; s.start(t0, Math.random()); s.stop(t0 + dur + 0.05); const g = ac.createGain(); s.connect(g).connect(out); return { s, g }; };
  const bp = (f, q) => { const b = ac.createBiquadFilter(); b.type = 'bandpass'; b.frequency.value = f; b.Q.value = q; return b; };
  const lp = (f, q = 0.7) => { const b = ac.createBiquadFilter(); b.type = 'lowpass'; b.frequency.value = f; b.Q.value = q; return b; };
  const toRev = (node, amt = 0.4) => { const g = ac.createGain(); g.gain.value = amt; node.connect(g).connect(reverb); };
  const R = (a, b) => a + Math.random() * (b - a);

  A.bleat = (pitch = 1) => {
    if (!ok()) return; const t0 = now() + 0.01; const dur = R(0.65, 0.9);
    const out = ac.createGain(); out.gain.value = 0.9;
    const f1 = bp(750 * pitch, 5), f2 = bp(1500 * pitch, 6), f3 = bp(2600 * pitch, 8);
    const mix = ac.createGain(); mix.gain.value = 1;
    [f1, f2, f3].forEach((f) => { mix.connect(f); f.connect(out); });
    out.connect(sfx); toRev(out, 0.15);
    const o = ac.createOscillator(); o.type = 'sawtooth';
    const base = 430 * pitch * R(0.95, 1.08);
    o.frequency.setValueAtTime(base * 1.08, t0); o.frequency.linearRampToValueAtTime(base, t0 + 0.12); o.frequency.linearRampToValueAtTime(base * 0.9, t0 + dur);
    const lfo = ac.createOscillator(); lfo.frequency.value = R(16, 20); const lg = ac.createGain(); lg.gain.value = base * 0.035; lfo.connect(lg).connect(o.frequency);
    const am = ac.createGain(); const alfo = ac.createOscillator(); alfo.frequency.value = lfo.frequency.value; const ag = ac.createGain(); ag.gain.value = 0.45; alfo.connect(ag).connect(am.gain); am.gain.value = 0.55;
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.5, t0 + 0.06); g.gain.setValueAtTime(0.5, t0 + dur * 0.6); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(am).connect(g).connect(mix);
    [o, lfo, alfo].forEach((x) => { x.start(t0); x.stop(t0 + dur + 0.1); });
  };
  A.quack = (pitch = 1, n = 1) => {
    if (!ok()) return;
    for (let i = 0; i < n; i++) {
      const t0 = now() + 0.01 + i * 0.22; const dur = 0.16;
      const o = ac.createOscillator(); o.type = 'sawtooth';
      o.frequency.setValueAtTime(330 * pitch, t0); o.frequency.exponentialRampToValueAtTime(210 * pitch, t0 + dur);
      const f = bp(1150 * pitch, 3.5), f2 = bp(2400 * pitch, 5);
      const g = ac.createGain(); env(g, t0, 0.015, 0.8, dur);
      o.connect(f).connect(g); o.connect(f2).connect(g); g.connect(sfx);
      o.start(t0); o.stop(t0 + dur + 0.05);
    }
  };
  A.chirp = (n = 3, pitch = 1) => {
    if (!ok()) return;
    for (let i = 0; i < n; i++) {
      const t0 = now() + 0.01 + i * R(0.09, 0.14); const o = ac.createOscillator(); o.type = 'sine';
      const f = R(2600, 3400) * pitch;
      o.frequency.setValueAtTime(f, t0); o.frequency.exponentialRampToValueAtTime(f * R(1.3, 1.6), t0 + 0.05); o.frequency.exponentialRampToValueAtTime(f * 0.9, t0 + 0.09);
      const g = ac.createGain(); env(g, t0, 0.006, 0.18, 0.09); o.connect(g).connect(sfx); toRev(g, 0.3); o.start(t0); o.stop(t0 + 0.12);
    }
  };
  A.bell = () => {
    if (!ok()) return; const t0 = now() + 0.01;
    for (const [f, a, d] of [[1760, 0.12, 1.1], [2637, 0.07, 0.7], [4186, 0.04, 0.4], [1767, 0.08, 1.2]]) { const x = osc('sine', f, t0, d, sfx, a, 0.003); toRev(x.g, 0.5); }
    for (const [f, a, d] of [[1760, 0.07, 0.6], [2637, 0.04, 0.4]]) { const x = osc('sine', f * 1.003, t0 + 0.14, d, sfx, a, 0.003); toRev(x.g, 0.5); }
  };
  A.boing = (up = true) => {
    if (!ok()) return; const t0 = now() + 0.01; const o = ac.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(up ? 180 : 520, t0); o.frequency.exponentialRampToValueAtTime(up ? 620 : 160, t0 + 0.22);
    const lfo = ac.createOscillator(); lfo.frequency.value = 22; const lg = ac.createGain(); lg.gain.value = 30; lfo.connect(lg).connect(o.frequency);
    const g = ac.createGain(); env(g, t0, 0.01, 0.28, 0.28); o.connect(g).connect(sfx); o.start(t0); lfo.start(t0); o.stop(t0 + 0.35); lfo.stop(t0 + 0.35);
  };
  A.pop = (p = 1) => {
    if (!ok()) return; const t0 = now() + 0.005; const o = ac.createOscillator(); o.type = 'sine';
    o.frequency.setValueAtTime(420 * p, t0); o.frequency.exponentialRampToValueAtTime(1300 * p, t0 + 0.06);
    const g = ac.createGain(); env(g, t0, 0.004, 0.35, 0.08); o.connect(g).connect(sfx); o.start(t0); o.stop(t0 + 0.12);
  };
  A.splash = (big = 1) => {
    if (!ok()) return; const t0 = now() + 0.01; const n = noise(t0, 0.5 * big, sfx);
    const f = bp(1400, 0.8); n.s.disconnect(); n.s.connect(f).connect(n.g);
    f.frequency.setValueAtTime(2600, t0); f.frequency.exponentialRampToValueAtTime(500, t0 + 0.45 * big);
    env(n.g, t0, 0.01, 0.35 * big, 0.45 * big);
    for (let i = 0; i < 5; i++) { const x = osc('sine', R(700, 1600), t0 + R(0.05, 0.3), 0.06, sfx, 0.06, 0.003); x.o.frequency.exponentialRampToValueAtTime(R(1800, 2600), t0 + 0.4); }
  };
  A.wind = (dur = 1.5, str = 1) => {
    if (!ok()) return; const t0 = now() + 0.01; const n = noise(t0, dur, sfx);
    const f = bp(500, 1.2); n.s.disconnect(); n.s.connect(f).connect(n.g);
    f.frequency.setValueAtTime(300, t0); f.frequency.exponentialRampToValueAtTime(1100 * str, t0 + dur * 0.4); f.frequency.exponentialRampToValueAtTime(350, t0 + dur);
    n.g.gain.setValueAtTime(0.0001, t0); n.g.gain.exponentialRampToValueAtTime(0.5 * str, t0 + dur * 0.35); n.g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    toRev(n.g, 0.3);
  };
  A.yawn = () => {
    if (!ok()) return; const t0 = now() + 0.01, dur = 1.3;
    const o = ac.createOscillator(); o.type = 'sawtooth';
    o.frequency.setValueAtTime(110, t0); o.frequency.linearRampToValueAtTime(175, t0 + 0.5); o.frequency.linearRampToValueAtTime(85, t0 + dur);
    const f = lp(500, 4); f.frequency.setValueAtTime(350, t0); f.frequency.linearRampToValueAtTime(1100, t0 + 0.5); f.frequency.linearRampToValueAtTime(300, t0 + dur);
    const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.45, t0 + 0.2); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(f).connect(g).connect(sfx); o.start(t0); o.stop(t0 + dur + 0.05);
  };
  A.grr = () => {
    if (!ok()) return; const t0 = now() + 0.01, dur = 0.6;
    const o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.setValueAtTime(95, t0); o.frequency.linearRampToValueAtTime(140, t0 + 0.2); o.frequency.linearRampToValueAtTime(100, t0 + dur);
    const am = ac.createGain(); const l = ac.createOscillator(); l.frequency.value = 28; const lg = ac.createGain(); lg.gain.value = 0.5; l.connect(lg).connect(am.gain);
    const f = lp(700, 3); const g = ac.createGain(); env(g, t0, 0.05, 0.4, dur);
    o.connect(am).connect(f).connect(g).connect(sfx); o.start(t0); l.start(t0); o.stop(t0 + dur + 0.1); l.stop(t0 + dur + 0.1);
  };
  A.hoot = () => {
    if (!ok()) return;
    [[0, 480, 0.35], [0.45, 420, 0.5]].forEach(([d, f, du]) => {
      const t0 = now() + 0.01 + d; const o = ac.createOscillator(); o.type = 'sine'; o.frequency.setValueAtTime(f * 1.05, t0); o.frequency.linearRampToValueAtTime(f, t0 + 0.1);
      const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.35, t0 + 0.08); g.gain.exponentialRampToValueAtTime(0.0001, t0 + du);
      o.connect(g).connect(sfx); toRev(g, 0.6); o.start(t0); o.stop(t0 + du + 0.05);
    });
  };
  A.croak = () => {
    if (!ok()) return;
    for (let i = 0; i < 2; i++) {
      const t0 = now() + 0.01 + i * 0.2; const o = ac.createOscillator(); o.type = 'square'; o.frequency.value = 120 - i * 15;
      const am = ac.createGain(); const l = ac.createOscillator(); l.type = 'square'; l.frequency.value = 45; const lg = ac.createGain(); lg.gain.value = 0.5; l.connect(lg).connect(am.gain); am.gain.value = 0.5;
      const f = bp(500, 2); const g = ac.createGain(); env(g, t0, 0.01, 0.5, 0.15);
      o.connect(am).connect(f).connect(g).connect(sfx); o.start(t0); l.start(t0); o.stop(t0 + 0.2); l.stop(t0 + 0.2);
    }
  };
  const PENT = [523.25, 587.33, 659.25, 783.99, 880, 1046.5, 1174.66, 1318.5, 1568, 1760];
  A.sparkle = (n = 6, base = 3) => {
    if (!ok()) return;
    for (let i = 0; i < n; i++) { const t0 = now() + 0.01 + i * 0.07; const f = PENT[Math.min(PENT.length - 1, base + i + Math.floor(Math.random() * 2))] * 2; const x = osc('sine', f, t0, 0.5, sfx, 0.08, 0.004); toRev(x.g, 0.9); }
  };
  A.note = (i, dur = 0.8, vol = 0.12) => { if (!ok()) return; const t0 = now() + 0.01; const f = PENT[((i % PENT.length) + PENT.length) % PENT.length]; const x = osc('triangle', f, t0, dur, sfx, vol, 0.005); const y = osc('sine', f * 2, t0, dur * 0.6, sfx, vol * 0.4, 0.005); toRev(x.g, 0.6); toRev(y.g, 0.6); };
  A.giggle = () => {
    if (!ok()) return;
    for (let i = 0; i < 4; i++) {
      const t0 = now() + 0.01 + i * 0.11; const o = ac.createOscillator(); o.type = 'triangle'; const f = 880 + (i % 2) * 120 - i * 30;
      o.frequency.setValueAtTime(f, t0); o.frequency.exponentialRampToValueAtTime(f * 1.25, t0 + 0.04); o.frequency.exponentialRampToValueAtTime(f * 0.9, t0 + 0.09);
      const f1 = bp(1500, 2); const g = ac.createGain(); env(g, t0, 0.008, 0.3, 0.08); o.connect(f1).connect(g).connect(sfx); o.start(t0); o.stop(t0 + 0.12);
    }
  };
  A.sniff = () => {
    if (!ok()) return; const t0 = now() + 0.01, dur = 0.8; const o = ac.createOscillator(); o.type = 'triangle';
    o.frequency.setValueAtTime(700, t0); o.frequency.linearRampToValueAtTime(520, t0 + dur);
    const l = ac.createOscillator(); l.frequency.value = 7; const lg = ac.createGain(); lg.gain.value = 18; l.connect(lg).connect(o.frequency);
    const f = bp(1100, 2); const g = ac.createGain(); g.gain.setValueAtTime(0.0001, t0); g.gain.exponentialRampToValueAtTime(0.22, t0 + 0.1); g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(f).connect(g).connect(sfx); o.start(t0); l.start(t0); o.stop(t0 + dur + 0.05); l.stop(t0 + dur + 0.05);
  };
  A.squeak = () => {
    if (!ok()) return;
    for (let i = 0; i < 3; i++) { const t0 = now() + 0.01 + i * 0.08; const x = osc('sine', 1800 + i * 200, t0, 0.05, sfx, 0.15, 0.004); x.o.frequency.exponentialRampToValueAtTime(2600 + i * 200, t0 + 0.05); }
  };
  A.thud = () => { if (!ok()) return; const t0 = now() + 0.01; const x = osc('sine', 160, t0, 0.18, sfx, 0.5, 0.004); x.o.frequency.exponentialRampToValueAtTime(60, t0 + 0.18); };
  A.page = () => {
    if (!ok()) return; const t0 = now() + 0.01, dur = 0.55;
    const n = noise(t0, dur, sfx); const f = bp(900, 0.9); n.s.disconnect(); n.s.connect(f).connect(n.g);
    f.frequency.setValueAtTime(700, t0); f.frequency.exponentialRampToValueAtTime(3200, t0 + 0.2); f.frequency.exponentialRampToValueAtTime(900, t0 + dur);
    n.g.gain.setValueAtTime(0.0001, t0); n.g.gain.exponentialRampToValueAtTime(0.22, t0 + 0.12); n.g.gain.exponentialRampToValueAtTime(0.03, t0 + 0.35); n.g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    const n2 = noise(t0 + dur - 0.1, 0.1, sfx); const f2 = lp(400); n2.s.disconnect(); n2.s.connect(f2).connect(n2.g); env(n2.g, t0 + dur - 0.1, 0.005, 0.25, 0.08);
  };
  A.rain = (dur = 2.5) => {
    if (!ok()) return; const t00 = now();
    for (let i = 0; i < dur * 40; i++) { const t0 = t00 + Math.random() * dur; const x = osc('sine', R(2000, 5000), t0, 0.02, sfx, R(0.01, 0.05), 0.001); toRev(x.g, 0.4); }
    const n = noise(t00, dur, sfx); const f = bp(3000, 0.5); n.s.disconnect(); n.s.connect(f).connect(n.g);
    n.g.gain.setValueAtTime(0.0001, t00); n.g.gain.exponentialRampToValueAtTime(0.06, t00 + 0.4); n.g.gain.exponentialRampToValueAtTime(0.0001, t00 + dur);
  };
  A.tada = () => {
    if (!ok()) return; const t0 = now() + 0.02;
    [523.25, 659.25, 783.99, 1046.5].forEach((f, i) => { const x = osc('triangle', f, t0 + i * 0.09, 1.4, sfx, 0.1, 0.01); toRev(x.g, 0.7); const y = osc('sine', f * 2, t0 + i * 0.09, 0.8, sfx, 0.04, 0.01); toRev(y.g, 0.7); });
  };
  A.twinkle = (i = 0) => { if (!ok()) return; const t0 = now() + 0.01; const f = PENT[5 + (i % 5)] * 2; const x = osc('sine', f, t0, 1.2, sfx, 0.07, 0.003); toRev(x.g, 1); const y = osc('sine', f * 1.5, t0 + 0.05, 0.8, sfx, 0.03, 0.003); toRev(y.g, 1); };

  /* ---------- music box loop ---------- */
  function startMusic() {
    const bpm = 76, beat = 60 / bpm;
    // gentle original lullaby (scale degrees into PENT), -1 = rest
    const mel = [4, 3, 2, 3, 4, 4, 4, -1, 3, 3, 3, -1, 4, 6, 6, -1, 4, 3, 2, 3, 4, 4, 4, 2, 3, 3, 4, 3, 2, -1, -1, -1,
      5, 4, 3, 4, 5, -1, 4, 3, 2, 1, 2, -1, 3, 4, 2, -1, 5, 4, 3, 4, 5, 6, 5, 4, 3, 2, 3, 1, 0, -1, -1, -1];
    const bass = [0, 3, 1, 4, 0, 3, 1, 0];
    let step = 0, next = ac.currentTime + 0.5;
    const tick = () => {
      while (next < ac.currentTime + 0.6) {
        const m = mel[step % mel.length];
        if (m >= 0) {
          const f = PENT[m] ;
          const x = ac.createOscillator(); x.type = 'sine'; x.frequency.value = f * 2;
          const y = ac.createOscillator(); y.type = 'sine'; y.frequency.value = f * 4.01;
          const g = ac.createGain(); g.gain.setValueAtTime(0.0001, next); g.gain.exponentialRampToValueAtTime(0.35, next + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, next + 1.6);
          const g2 = ac.createGain(); g2.gain.value = 0.18; y.connect(g2).connect(g);
          x.connect(g); g.connect(musicBus); const rg = ac.createGain(); rg.gain.value = 0.7; g.connect(rg).connect(reverb);
          x.start(next); y.start(next); x.stop(next + 1.7); y.stop(next + 1.7);
        }
        if (step % 4 === 0) {
          const b = PENT[bass[(step / 4) % bass.length]] / 2;
          const o = ac.createOscillator(); o.type = 'triangle'; o.frequency.value = b;
          const g = ac.createGain(); g.gain.setValueAtTime(0.0001, next); g.gain.exponentialRampToValueAtTime(0.22, next + 0.02); g.gain.exponentialRampToValueAtTime(0.0001, next + beat * 3.5);
          o.connect(g).connect(musicBus); o.start(next); o.stop(next + beat * 3.6);
        }
        step++; next += beat / 2;
      }
    };
    setInterval(tick, 150);
    A.setMusic(A.musicOn);
  }

  /* ---------- narration (Web Speech) ---------- */
  const VOICE = { n: { p: 1.05, r: 0.86 }, cloud: { p: 1.55, r: 0.92 }, lamb: { p: 1.35, r: 0.9 }, duck: { p: 1.3, r: 0.95 }, bird: { p: 1.7, r: 1.0 }, bear: { p: 0.6, r: 0.78 }, wind: { p: 0.85, r: 0.8 }, all: { p: 1.3, r: 0.9 } };
  let zhVoice = null, speakToken = 0;
  const pickVoice = () => {
    if (!('speechSynthesis' in window)) return null;
    const vs = speechSynthesis.getVoices();
    const zh = vs.filter((v) => /zh[-_]CN|cmn/i.test(v.lang));
    zhVoice = zh.find((v) => /Tingting|婷婷/i.test(v.name)) || zh.find((v) => /Lili|Yu-shu|Xiaoxiao|Google/i.test(v.name)) || zh[0] || vs.find((v) => /^zh/i.test(v.lang)) || null;
    return zhVoice;
  };
  if ('speechSynthesis' in window) { pickVoice(); speechSynthesis.onvoiceschanged = pickVoice; }
  A.canSpeak = () => ('speechSynthesis' in window) || A.hasClips();

  /* ---------- pre-generated narration audio (edge-tts) ---------- */
  A.clips = null; A.clipBase = 'audio/';
  A.hasClips = () => A.clips && Object.keys(A.clips.lines || {}).length > 0;
  const audioCache = new Map();
  A.loadClips = () => {
    fetch(A.clipBase + 'manifest.json').then((r) => r.ok ? r.json() : null).then((m) => {
      if (m && m.lines) { A.clips = m; }
    }).catch(() => {});
  };
  A.loadClips();
  const getClip = (key) => {
    if (!A.clips || !A.clips.lines[key]) return null;
    let a = audioCache.get(key);
    if (!a) { a = new Audio(A.clipBase + key + '.mp3'); a.preload = 'auto'; audioCache.set(key, a); }
    return a;
  };
  let curClip = null;

  A.stopSpeech = () => { speakToken++; if ('speechSynthesis' in window) speechSynthesis.cancel(); if (curClip) { try { curClip.pause(); curClip.currentTime = 0; } catch (e) {} curClip = null; } if (A.onLine) A.onLine(-1); };

  // lines: [{t, who, _key}]; onLine(i) called with current index. Plays pre-generated MP3 when available, else Web Speech.
  A.speak = (lines, onDone) => {
    if (A.muted || (!A.hasClips() && !('speechSynthesis' in window))) { onDone && onDone(); return; }
    A.stopSpeech(); const tok = ++speakToken; let i = 0;
    if (musicBus && A.musicOn && ac) musicBus.gain.setTargetAtTime(0.06, ac.currentTime, 0.3);
    const fin = () => { if (musicBus && A.musicOn && ac) musicBus.gain.setTargetAtTime(0.16, ac.currentTime, 0.8); A.onLine && A.onLine(-1); onDone && onDone(); };
    const nextLine = () => {
      if (tok !== speakToken) return;
      if (i >= lines.length) return fin();
      const L = lines[i]; A.onLine && A.onLine(i);
      const advance = () => { if (tok !== speakToken) return; i++; setTimeout(nextLine, 300); };
      const clip = L._key ? getClip(L._key) : null;
      if (clip) {
        curClip = clip; try { clip.pause(); clip.currentTime = 0; } catch (e) {}
        clip.muted = A.muted; clip.volume = 1;
        let done = false; const go = () => { if (done) return; done = true; clip.onended = clip.onerror = null; advance(); };
        clip.onended = go; clip.onerror = () => { go(); };
        const p = clip.play(); if (p && p.catch) p.catch(() => speakFallback(L, tok, advance));
        return;
      }
      speakFallback(L, tok, advance);
    };
    const speakFallback = (L, tok, advance) => {
      if (!('speechSynthesis' in window)) return advance();
      const u = new SpeechSynthesisUtterance(L.t.replace(/[“”「」]/g, ''));
      if (zhVoice) u.voice = zhVoice; u.lang = 'zh-CN';
      const v = VOICE[L.who || 'n'] || VOICE.n; u.pitch = v.p; u.rate = v.r; u.volume = 1;
      let done = false; const go = () => { if (done) return; done = true; advance(); };
      u.onend = go; u.onerror = go;
      setTimeout(() => { if (!done && tok === speakToken && !speechSynthesis.speaking) go(); }, 1500 + L.t.length * 420);
      speechSynthesis.speak(u);
    };
    nextLine();
  };
})();
