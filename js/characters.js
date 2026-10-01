/* 小云朵回家 · characters (all procedurally drawn, animated by state) */
(function () {
  'use strict';
  const SB = window.SB;
  const C = (SB.C = {});
  const { fillEll, fillCirc } = SB;
  const TAU = Math.PI * 2;

  let pat = null;
  SB.crayonPat = (ctx) => {
    if (!pat) {
      const c = document.createElement('canvas'); c.width = c.height = 160;
      const g = c.getContext('2d'); const r = SB.rng(9); g.lineCap = 'round';
      for (let i = 0; i < 420; i++) {
        const x = r() * 160, y = r() * 160, a = -0.5 + (r() - 0.5) * 0.8, L = 5 + r() * 14;
        g.strokeStyle = r() < 0.55 ? `rgba(255,255,255,${0.1 + r() * 0.16})` : `rgba(60,40,30,${0.04 + r() * 0.07})`;
        g.lineWidth = 1 + r() * 1.8;
        for (const ox of [-160, 0, 160]) for (const oy of [-160, 0, 160]) { g.beginPath(); g.moveTo(x + ox, y + oy); g.lineTo(x + ox + Math.cos(a) * L, y + oy + Math.sin(a) * L); g.stroke(); }
      }
      pat = c;
    }
    return ctx.createPattern(pat, 'repeat');
  };
  // filled shape + crayon overlay + inner lower shading
  const body = (SB.body = (ctx, pathFn, col, o = {}) => {
    ctx.beginPath(); pathFn(ctx); ctx.fillStyle = col; ctx.fill();
    ctx.save(); ctx.clip();
    if (o.shade !== false) {
      const [x0, y0, x1, y1] = o.sb || [-200, -200, 200, 200];
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, 'rgba(255,255,255,0.12)'); g.addColorStop(0.55, 'rgba(255,255,255,0)'); g.addColorStop(1, o.dark || 'rgba(60,40,50,0.16)');
      ctx.fillStyle = g; ctx.fillRect(-400, -400, 800, 800);
    }
    ctx.fillStyle = SB.crayonPat(ctx); ctx.fillRect(-400, -400, 800, 800);
    ctx.restore();
  });
  const eye = (ctx, x, y, r, blink = 0, look = [0, 0]) => {
    if (blink > 0.5) { ctx.strokeStyle = '#2e2522'; ctx.lineWidth = r * 0.55; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(x, y - r * 0.3, r * 0.9, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke(); return; }
    fillEll(ctx, x + look[0] * r * 0.25, y + look[1] * r * 0.25, r * 0.85, r, '#2e2522');
    fillCirc(ctx, x + look[0] * r * 0.25 + r * 0.3, y + look[1] * r * 0.25 - r * 0.35, r * 0.32, '#fff');
  };
  const happyEye = (ctx, x, y, r) => { ctx.strokeStyle = '#2e2522'; ctx.lineWidth = r * 0.55; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(x, y + r * 0.4, r * 0.9, 1.15 * Math.PI, 1.85 * Math.PI); ctx.stroke(); };
  const cheek = (ctx, x, y, r, a = 0.55) => fillEll(ctx, x, y, r, r * 0.62, `rgba(245,128,128,${a})`);
  C.blink = (t, seed = 0) => { const p = (t + seed * 1.7) % 3.7; return p < 0.13 ? 1 : 0; };

  /* ---------------- 棉棉 the lamb ---------------- */
  const woolCache = new Map();
  const woolRing = (n, rx, ry, rr, seed) => {
    const k = n + '|' + seed; if (woolCache.has(k)) return woolCache.get(k);
    const r = SB.rng(seed); const out = [];
    for (let i = 0; i < n; i++) { const a = (i / n) * TAU; out.push([Math.cos(a) * rx, Math.sin(a) * ry, rr * (0.8 + r() * 0.4)]); }
    woolCache.set(k, out); return out;
  };
  C.lamb = (ctx, st) => {
    const s = st.s || 1, f = st.f || 1, t = st.t || 0;
    const run = st.run || 0; const ph = st.legPh != null ? st.legPh : t * 10;
    const bleat = st.bleat || 0; const hop = st.hop || 0;
    ctx.save(); ctx.translate(st.x, st.y);
    if (!st.noShadow) fillEll(ctx, 0, 0, 72 * s * (1 - hop / 300), 11 * s, 'rgba(40,40,30,0.16)');
    ctx.scale(s * f, s);
    ctx.translate(0, -hop / s);
    const breathe = Math.sin(t * 2.4) * 1.6;
    const bob = run ? Math.abs(Math.sin(ph)) * -7 : 0;
    ctx.translate(0, bob);
    ctx.rotate((st.tilt || 0) + (run ? Math.sin(ph) * 0.03 : 0));
    // legs
    const legs = [[-44, 0], [-24, 1], [22, 1], [42, 0]];
    for (const [lx, o] of legs) {
      const sw = run ? Math.sin(ph + o * Math.PI) * 0.55 : 0;
      ctx.save(); ctx.translate(lx, -40); ctx.rotate(sw);
      ctx.fillStyle = o ? '#4b3b38' : '#3b2e2c';
      ctx.beginPath(); SB.roundRect(ctx, -6.5, -4, 13, 44 - bob * 0.3, 6); ctx.fill();
      fillEll(ctx, 0, 40 - bob * 0.3, 8, 5, '#2b211f');
      ctx.restore();
    }
    // tail
    const tw = Math.sin(t * 9) * 0.35 + (run ? Math.sin(ph * 2) * 0.4 : 0);
    ctx.save(); ctx.translate(-80, -92); ctx.rotate(tw);
    body(ctx, (c) => SB.circles([[-8, -4, 13], [-2, 6, 11]])(c), '#f7f3ea', { sb: [0, -15, 0, 15] });
    ctx.restore();
    // body wool
    const ring = woolRing(16, 70, 40 + breathe * 0.3, 22, 3);
    body(ctx, (c) => { c.ellipse(0, -82, 74, 46 + breathe * 0.4, 0, 0, TAU); SB.circles(ring.map(([x, y, r]) => [x, y - 82, r]))(c); }, '#fbf8f0', { sb: [0, -130, 0, -30], dark: 'rgba(120,120,150,0.2)' });
    // wool curls
    ctx.strokeStyle = 'rgba(190,190,205,0.55)'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
    for (const [cx, cy] of [[-40, -95], [-10, -110], [20, -92], [-25, -70], [10, -64], [40, -76], [-52, -78]]) { ctx.beginPath(); ctx.arc(cx, cy, 7, 0.3, 3.9); ctx.stroke(); }
    // bell + ribbon
    ctx.save(); ctx.translate(52, -64);
    ctx.fillStyle = '#e8574a'; ctx.beginPath(); SB.roundRect(ctx, -16, -8, 32, 10, 5); ctx.fill();
    const bs = st.bell || 0;
    ctx.rotate(Math.sin(t * 20) * 0.5 * bs + Math.sin(t * 3) * 0.1);
    body(ctx, (c) => c.arc(0, 8, 9, 0, TAU), '#f5c542', { sb: [0, 0, 0, 16], dark: 'rgba(160,90,0,0.35)' });
    ctx.fillStyle = '#7a5418'; ctx.fillRect(-5, 9, 10, 2);
    fillCirc(ctx, -3, 5, 2.4, 'rgba(255,255,255,0.8)');
    ctx.restore();
    // head
    const hb = run ? Math.sin(ph * 2) * 2 : Math.sin(t * 2.4 + 1) * 1.5;
    ctx.save(); ctx.translate(72, -112 + hb); ctx.rotate((st.headRot || 0) - bleat * 0.35);
    // ears
    const ew = Math.sin(t * 3.1) * 0.08 + (run ? Math.sin(ph) * 0.2 : 0);
    for (const [ex, sg] of [[-22, -1], [18, 1]]) {
      ctx.save(); ctx.translate(ex, -14); ctx.rotate(sg * (0.9 + ew) + (sg < 0 ? 0.3 : 0));
      body(ctx, (c) => c.ellipse(0, 18, 9, 20, 0, 0, TAU), '#e9cdb6', { sb: [0, 0, 0, 36] });
      fillEll(ctx, 0, 20, 4.5, 12, '#f2a8a0');
      ctx.restore();
    }
    body(ctx, (c) => c.ellipse(0, 4, 30, 34, 0, 0, TAU), '#f1d8c2', { sb: [0, -30, 0, 40] });
    // head wool tuft
    body(ctx, (c) => SB.circles([[-16, -26, 13], [0, -32, 15], [16, -26, 13], [-6, -20, 11], [9, -19, 11]])(c), '#fbf8f0', { sb: [0, -45, 0, -10], dark: 'rgba(120,120,150,0.18)' });
    const bl = st.blink != null ? st.blink : C.blink(t, st.seed || 0);
    if (st.happy) { happyEye(ctx, -11, -2, 5.5); happyEye(ctx, 13, -2, 5.5); }
    else { eye(ctx, -11, -2, 5.5, bl, st.look || [0.6, 0]); eye(ctx, 13, -2, 5.5, bl, st.look || [0.6, 0]); }
    cheek(ctx, -18, 14, 7); cheek(ctx, 22, 14, 7);
    // nose / mouth
    fillEll(ctx, 2, 16, 4, 2.6, '#8e5a52');
    if (bleat > 0.05) {
      fillEll(ctx, 2, 26, 7 * bleat + 2, 8 * bleat + 1, '#6d3434');
      fillEll(ctx, 2, 29 + bleat * 3, 4 * bleat, 3 * bleat, '#f18c8c');
    } else {
      ctx.strokeStyle = '#6d3a36'; ctx.lineWidth = 2.2; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(2, 18); ctx.lineTo(2, 22); ctx.moveTo(-5, 22); ctx.quadraticCurveTo(2, 28, 9, 22); ctx.stroke();
    }
    ctx.restore();
    ctx.restore();
  };

  /* ---------------- 噗噗 the little cloud ---------------- */
  const cloudBumps = [[-52, 8, 30], [-26, -14, 36], [10, -24, 40], [44, -6, 32], [60, 16, 24], [-62, 24, 22]];
  C.cloudPath = (squash = 0) => (c) => {
    SB.circles(cloudBumps.map(([x, y, r]) => [x * (1 + squash * 0.15), y * (1 - squash * 0.2), r]))(c);
    c.moveTo(-70, 20); SB.roundRect(c, -76 * (1 + squash * 0.15), 0, 152 * (1 + squash * 0.15), 44 * (1 - squash * 0.1), 22);
  };
  C.cloud = (ctx, st) => {
    const s = st.s || 1, t = st.t || 0, mood = st.mood || 'happy';
    const fl = st.float != null ? st.float : 1;
    const sq = st.squash || 0;
    ctx.save(); ctx.translate(st.x, st.y + Math.sin(t * 2) * 6 * fl);
    if (st.shadowY) { ctx.save(); ctx.translate(0, st.shadowY - Math.sin(t * 2) * 6 * fl); fillEll(ctx, 0, 0, 60 * s * (st.shadowK || 1), 9 * s * (st.shadowK || 1), 'rgba(40,40,70,0.13)'); ctx.restore(); }
    ctx.scale(s, s); ctx.rotate((st.rot || 0) + Math.sin(t * 1.3) * 0.03 * fl);
    if (st.glow) {
      const g = ctx.createRadialGradient(0, 0, 20, 0, 0, 150); g.addColorStop(0, `rgba(255,250,210,${0.55 * st.glow})`); g.addColorStop(1, 'rgba(255,250,210,0)');
      ctx.fillStyle = g; ctx.fillRect(-160, -160, 320, 320);
    }
    // little arms
    const wave = st.wave || 0;
    ctx.save(); ctx.translate(-74, 22); ctx.rotate(-0.4 - Math.sin(t * 12) * 0.5 * wave - (st.armsUp || 0) * 1.4);
    body(ctx, (c) => c.ellipse(-8, 0, 14, 9, 0, 0, TAU), '#ffffff', { sb: [0, -9, 0, 9], dark: 'rgba(120,140,190,0.3)' }); ctx.restore();
    ctx.save(); ctx.translate(74, 22); ctx.rotate(0.4 + Math.sin(t * 12 + 1) * 0.5 * wave + (st.armsUp || 0) * 1.4);
    body(ctx, (c) => c.ellipse(8, 0, 14, 9, 0, 0, TAU), '#ffffff', { sb: [0, -9, 0, 9], dark: 'rgba(120,140,190,0.3)' }); ctx.restore();
    body(ctx, C.cloudPath(sq), st.col || '#ffffff', { sb: [0, -60, 0, 44], dark: mood === 'sad' ? 'rgba(110,130,180,0.42)' : 'rgba(130,160,210,0.32)' });
    // highlight
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = 5; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(8, -22, 30, 3.6, 4.4); ctx.stroke();
    // face
    const bl = st.blink != null ? st.blink : C.blink(t, 2);
    const fy = 12;
    if (mood === 'laugh' || mood === 'joy') { happyEye(ctx, -20, fy, 6); happyEye(ctx, 20, fy, 6); }
    else if (mood === 'sleep') { ctx.strokeStyle = '#2e2522'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(-20, fy, 6, 0.15 * Math.PI, 0.85 * Math.PI); ctx.moveTo(26, fy + 2); ctx.arc(20, fy, 6, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); }
    else {
      const big = mood === 'wow' ? 1.25 : 1;
      eye(ctx, -20, fy, 6.5 * big, bl, st.look || [0, 0.2]); eye(ctx, 20, fy, 6.5 * big, bl, st.look || [0, 0.2]);
      if (mood === 'sad') { ctx.strokeStyle = '#2e2522'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-30, fy - 13); ctx.lineTo(-14, fy - 17); ctx.moveTo(30, fy - 13); ctx.lineTo(14, fy - 17); ctx.stroke(); }
    }
    cheek(ctx, -34, fy + 12, 9, 0.6); cheek(ctx, 34, fy + 12, 9, 0.6);
    ctx.strokeStyle = '#3a2a28'; ctx.lineWidth = 2.8; ctx.lineCap = 'round';
    if (mood === 'sad') { ctx.beginPath(); ctx.arc(0, fy + 20, 7, 1.15 * Math.PI, 1.85 * Math.PI); ctx.stroke(); }
    else if (mood === 'laugh' || mood === 'wow' || st.talk) {
      const o = mood === 'wow' ? 1 : st.talk ? 0.4 + Math.abs(Math.sin(t * 14)) * 0.6 : 1;
      fillEll(ctx, 0, fy + 13, 7, 7 * o, '#6d3434'); fillEll(ctx, 0, fy + 13 + 3 * o, 4, 3 * o, '#f18c8c');
    } else if (mood === 'blow') { fillEll(ctx, 0, fy + 12, 4.5, 4.5, '#6d3434'); }
    else if (mood !== 'sleep') { ctx.beginPath(); ctx.arc(0, fy + 8, 8, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke(); }
    // tears
    if (mood === 'sad' && !st.noTears) {
      for (const sx of [-1, 1]) {
        const k = ((t * 0.9 + (sx > 0 ? 0.5 : 0)) % 1);
        ctx.globalAlpha = 1 - k; fillEll(ctx, sx * 24, fy + 10 + k * 26, 3.5, 5, '#8ccff0'); ctx.globalAlpha = 1;
      }
    }
    ctx.restore();
  };

  /* ---------------- duck ---------------- */
  C.duck = (ctx, st) => {
    const s = st.s || 1, f = st.f || 1, t = st.t || 0, q = st.quack || 0;
    const baby = st.baby;
    ctx.save(); ctx.translate(st.x, st.y + Math.sin(t * 2.5 + (st.seed || 0)) * 2.5);
    ctx.scale(s * f, s); ctx.rotate(Math.sin(t * 2.5 + (st.seed || 0)) * 0.04 + (st.dive || 0));
    const bc = baby ? '#f7d34f' : st.col || '#fbfaf4';
    // body
    const wing = st.flap ? Math.sin(t * 30) * 0.6 * st.flap : 0;
    body(ctx, (c) => { c.moveTo(-50, -14); c.bezierCurveTo(-58, -40, -20, -40, 10, -32); c.bezierCurveTo(40, -34, 48, -12, 40, 0); c.bezierCurveTo(20, 12, -30, 12, -44, 0); c.lineTo(-66, -26); c.closePath(); }, bc, { sb: [0, -40, 0, 10] });
    // wing
    ctx.save(); ctx.translate(-8, -22); ctx.rotate(-wing - 0.1);
    body(ctx, (c) => { c.moveTo(-28, 0); c.quadraticCurveTo(-10, -18, 18, -6); c.quadraticCurveTo(0, 10, -28, 0); }, baby ? '#eebc36' : '#e9e6dc', { sb: [0, -16, 0, 8] });
    ctx.restore();
    // head
    ctx.save(); ctx.translate(26, -44 + (st.headBob || 0)); ctx.rotate(-q * 0.25);
    body(ctx, (c) => c.arc(0, 0, 20, 0, TAU), bc, { sb: [0, -20, 0, 20] });
    if (baby) { ctx.fillStyle = '#f7d34f'; ctx.beginPath(); ctx.moveTo(-4, -18); ctx.quadraticCurveTo(0, -30, 6, -20); ctx.fill(); }
    // beak
    ctx.fillStyle = '#f08a2c';
    ctx.beginPath(); ctx.moveTo(14, -4); ctx.quadraticCurveTo(34, -6 - q * 6, 36, 0 - q * 6); ctx.quadraticCurveTo(28, 2, 14, 2); ctx.fill();
    ctx.fillStyle = '#e07722';
    ctx.beginPath(); ctx.moveTo(14, 3); ctx.quadraticCurveTo(30, 4 + q * 8, 34, 5 + q * 10); ctx.quadraticCurveTo(24, 10 + q * 6, 14, 7); ctx.fill();
    eye(ctx, 7, -6, 3.6, st.blink != null ? st.blink : C.blink(t, st.seed || 1));
    cheek(ctx, 2, 6, 5, 0.45);
    ctx.restore();
    // water line cover (reflection sliver)
    if (st.water) { ctx.fillStyle = st.water; ctx.globalAlpha = 0.85; ctx.beginPath(); ctx.ellipse(-8, 4, 60, 8, 0, 0, TAU); ctx.fill(); ctx.globalAlpha = 1; ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(-8, 0, 58 + Math.sin(t * 3) * 4, 6, 0, 0.1, Math.PI - 0.1); ctx.stroke(); }
    ctx.restore();
  };

  /* ---------------- small bird ---------------- */
  C.bird = (ctx, st) => {
    const s = st.s || 1, f = st.f || 1, t = st.t || 0;
    const col = st.col || '#5f9fe0', belly = st.belly || '#fbe7c6';
    const fly = st.fly || 0; const flap = fly ? Math.sin(t * 28 + (st.seed || 0)) : Math.sin(t * 2) * 0.1;
    ctx.save(); ctx.translate(st.x, st.y); ctx.scale(s * f, s);
    ctx.rotate(st.rot || 0);
    const hop = st.hop || 0; ctx.translate(0, -hop);
    if (!fly) { ctx.strokeStyle = '#a16a3a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-3, -2); ctx.lineTo(-5, 6); ctx.moveTo(4, -2); ctx.lineTo(3, 6); ctx.stroke(); }
    // tail
    ctx.fillStyle = SB.shade(col, -12); ctx.beginPath(); ctx.moveTo(-14, -12); ctx.lineTo(-30, -20 + Math.sin(t * 5) * 3); ctx.lineTo(-28, -8); ctx.closePath(); ctx.fill();
    body(ctx, (c) => c.ellipse(0, -14, 17, 14, 0, 0, TAU), col, { sb: [0, -28, 0, 0] });
    fillEll(ctx, 4, -9, 10, 8, belly);
    // wing
    ctx.save(); ctx.translate(-3, -16); ctx.rotate(fly ? -flap * 1.1 - 0.3 : 0.15);
    body(ctx, (c) => c.ellipse(-4, fly ? -8 : 0, 11, fly ? 14 : 7, fly ? -0.4 : 0.2, 0, TAU), SB.shade(col, -10), { sb: [0, -10, 0, 10] });
    ctx.restore();
    // beak & eye
    const sing = st.sing || 0;
    ctx.fillStyle = '#f2a33a';
    ctx.beginPath(); ctx.moveTo(15, -18); ctx.lineTo(24, -16 - sing * 3); ctx.lineTo(15, -14); ctx.fill();
    if (sing > 0.1) { ctx.beginPath(); ctx.moveTo(15, -14); ctx.lineTo(23, -11 + sing * 2); ctx.lineTo(15, -12); ctx.fill(); }
    eye(ctx, 8, -19, 2.8, st.blink != null ? st.blink : C.blink(t, st.seed || 3));
    cheek(ctx, 6, -11, 4, 0.5);
    ctx.restore();
  };

  /* ---------------- bear ---------------- */
  C.bear = (ctx, st) => {
    const s = st.s || 1, f = st.f || 1, t = st.t || 0;
    const wave = st.wave || 0, yawn = st.yawn || 0, walk = st.walk || 0, ph = t * 7;
    const col = '#9a6644';
    ctx.save(); ctx.translate(st.x, st.y);
    fillEll(ctx, 0, 0, 70 * s, 11 * s, 'rgba(30,30,20,0.18)');
    ctx.scale(s * f, s);
    ctx.translate(0, walk ? -Math.abs(Math.sin(ph)) * 5 : 0);
    // legs
    for (const [lx, o] of [[-28, 0], [26, 1]]) {
      ctx.save(); ctx.translate(lx, -44); ctx.rotate(walk ? Math.sin(ph + o * Math.PI) * 0.3 : 0);
      body(ctx, (c) => SB.roundRect(c, -17, -6, 34, 50, 16), SB.shade(col, -6), { sb: [0, -6, 0, 44] });
      fillEll(ctx, 0, 40, 18, 8, SB.shade(col, -14));
      ctx.restore();
    }
    // body
    body(ctx, (c) => c.ellipse(0, -100, 62, 70 + Math.sin(t * 2) * 1.5, 0, 0, TAU), col, { sb: [-40, -170, 40, -30] });
    body(ctx, (c) => c.ellipse(6, -90, 38, 46, 0, 0, TAU), '#e8c49a', { sb: [0, -130, 0, -45] });
    // arms
    ctx.save(); ctx.translate(-50, -130); ctx.rotate(0.35 + Math.sin(t * 1.6) * 0.04);
    body(ctx, (c) => SB.roundRect(c, -14, -6, 28, 64, 14), SB.shade(col, -4), { sb: [0, 0, 0, 60] }); ctx.restore();
    ctx.save(); ctx.translate(50, -130); ctx.rotate(-0.35 - wave * (2.4 + Math.sin(t * 10) * 0.35) - (st.reach || 0) * 1.1);
    body(ctx, (c) => SB.roundRect(c, -14, -6, 28, 64, 14), SB.shade(col, -4), { sb: [0, 0, 0, 60] }); ctx.restore();
    // head
    ctx.save(); ctx.translate(4, -186); ctx.rotate(Math.sin(t * 1.2) * 0.04 - yawn * 0.15);
    for (const ex of [-36, 36]) { body(ctx, (c) => c.arc(ex, -34, 17, 0, TAU), col, {}); fillCirc(ctx, ex, -34, 9, '#d9a47e'); }
    body(ctx, (c) => c.ellipse(0, 0, 50, 45, 0, 0, TAU), col, { sb: [0, -45, 0, 45] });
    body(ctx, (c) => c.ellipse(4, 14, 22, 17, 0, 0, TAU), '#e8c49a', { sb: [0, 0, 0, 30] });
    fillEll(ctx, 4, 6, 8, 5.5, '#3a2622');
    const bl = yawn > 0.3 ? 1 : st.blink != null ? st.blink : C.blink(t, 5);
    if (st.happy) { happyEye(ctx, -18, -8, 5); happyEye(ctx, 24, -8, 5); } else { eye(ctx, -18, -8, 5, bl); eye(ctx, 24, -8, 5, bl); }
    cheek(ctx, -28, 12, 8, 0.5); cheek(ctx, 36, 12, 8, 0.5);
    if (yawn > 0.05) { fillEll(ctx, 4, 22, 9 * yawn + 3, 11 * yawn + 2, '#5a2626'); fillEll(ctx, 4, 27 + yawn * 3, 6 * yawn, 4 * yawn, '#e88686'); }
    else if (st.blow) { fillEll(ctx, 4, 24, 4, 4, '#5a2626'); }
    else { ctx.strokeStyle = '#3a2622'; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.moveTo(4, 11); ctx.lineTo(4, 17); ctx.moveTo(-6, 18); ctx.quadraticCurveTo(4, 25, 14, 18); ctx.stroke(); }
    ctx.restore();
    ctx.restore();
  };

  /* ---------------- squirrel ---------------- */
  C.squirrel = (ctx, st) => {
    const s = st.s || 1, f = st.f || 1, t = st.t || 0;
    const col = '#d9803e';
    ctx.save(); ctx.translate(st.x, st.y - (st.hop || 0)); ctx.scale(s * f, s);
    // tail
    const tw = Math.sin(t * 3) * 0.08 + (st.flick || 0) * Math.sin(t * 25) * 0.2;
    ctx.save(); ctx.translate(-14, -14); ctx.rotate(tw);
    body(ctx, (c) => { c.moveTo(0, 0); c.bezierCurveTo(-40, 0, -46, -50, -26, -74); c.bezierCurveTo(-6, -96, 26, -84, 20, -60); c.bezierCurveTo(14, -44, -8, -52, -4, -34); c.bezierCurveTo(-2, -20, 10, -10, 0, 0); }, '#e39052', { sb: [0, -90, 0, 0] });
    ctx.strokeStyle = 'rgba(255,230,190,0.6)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(-6, -62, 16, 3, 5.8); ctx.stroke();
    ctx.restore();
    body(ctx, (c) => c.ellipse(0, -22, 17, 23, 0, 0, TAU), col, { sb: [0, -45, 0, 0] });
    fillEll(ctx, 5, -18, 9, 14, '#f6d7ae');
    // pinecone in hands
    if (st.cone !== false) {
      ctx.save(); ctx.translate(12, -26);
      body(ctx, (c) => c.ellipse(0, 0, 8, 11, 0, 0, TAU), '#8a5a32', { sb: [0, -11, 0, 11] });
      ctx.strokeStyle = '#5e3b1f'; ctx.lineWidth = 1.5; for (let i = -1; i <= 1; i++) { ctx.beginPath(); ctx.moveTo(-7, i * 5); ctx.lineTo(7, i * 5 + 2); ctx.stroke(); }
      ctx.restore();
    }
    fillEll(ctx, 13, -24, 6, 4, SB.shade(col, -8));
    // head
    ctx.save(); ctx.translate(6, -52); ctx.rotate(st.headRot || Math.sin(t * 1.7) * 0.06);
    body(ctx, (c) => { c.moveTo(-8, -14); c.lineTo(-10, -30); c.lineTo(2, -18); c.closePath(); c.moveTo(8, -16); c.lineTo(10, -32); c.lineTo(16, -14); c.closePath(); }, col, {});
    body(ctx, (c) => c.ellipse(2, -4, 16, 14, 0, 0, TAU), col, { sb: [0, -18, 0, 12] });
    fillEll(ctx, 11, 1, 7, 6, '#f6d7ae');
    eye(ctx, 6, -7, 3.3, st.blink != null ? st.blink : C.blink(t, 7));
    fillCirc(ctx, 17, -1, 2.4, '#3a2622');
    cheek(ctx, 4, 3, 4, 0.5);
    ctx.restore();
    ctx.restore();
  };

  /* ---------------- rabbit ---------------- */
  C.rabbit = (ctx, st) => {
    const s = st.s || 1, f = st.f || 1, t = st.t || 0;
    const col = st.col || '#f4efe8';
    ctx.save(); ctx.translate(st.x, st.y - (st.hop || 0)); ctx.scale(s * f, s);
    if (!st.noShadow && !st.hop) fillEll(ctx, 0, 0, 26, 5, 'rgba(0,0,0,0.12)');
    body(ctx, (c) => c.ellipse(-4, -22, 24, 22, 0, 0, TAU), col, { sb: [0, -44, 0, 0] });
    body(ctx, (c) => c.arc(-26, -18, 8, 0, TAU), '#ffffff', {});
    fillEll(ctx, 10, -2, 10, 5, SB.shade(col, -6));
    ctx.save(); ctx.translate(12, -46);
    const ew = Math.sin(t * 2.2) * 0.08 + (st.ear || 0) * Math.sin(t * 20) * 0.15;
    for (const [ex, a] of [[-6, -0.25], [6, 0.2]]) {
      ctx.save(); ctx.translate(ex, -12); ctx.rotate(a + ew);
      body(ctx, (c) => c.ellipse(0, -18, 7, 22, 0, 0, TAU), col, {}); fillEll(ctx, 0, -17, 3.5, 15, '#f3b2b2');
      ctx.restore();
    }
    body(ctx, (c) => c.ellipse(0, 0, 19, 17, 0, 0, TAU), col, { sb: [0, -17, 0, 17] });
    eye(ctx, 6, -3, 3.3, st.blink != null ? st.blink : C.blink(t, 9));
    fillEll(ctx, 17, 3, 3, 2.3, '#e58c8c');
    cheek(ctx, 4, 7, 5, 0.5);
    ctx.restore();
    ctx.restore();
  };

  /* ---------------- owl ---------------- */
  C.owl = (ctx, st) => {
    const s = st.s || 1, t = st.t || 0, open = st.open != null ? st.open : 1;
    ctx.save(); ctx.translate(st.x, st.y); ctx.scale(s, s); ctx.rotate(st.rot || 0);
    body(ctx, (c) => { c.ellipse(0, 0, 26, 30, 0, 0, TAU); c.moveTo(-22, -20); c.lineTo(-24, -40); c.lineTo(-8, -26); c.moveTo(22, -20); c.lineTo(24, -40); c.lineTo(8, -26); }, '#8b6c55', { sb: [0, -30, 0, 30] });
    fillEll(ctx, 0, 10, 16, 16, '#d8c2a0');
    ctx.strokeStyle = 'rgba(120,90,60,0.5)'; ctx.lineWidth = 1.5; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.arc(0, 4 + i * 7, 6, 0.2, 2.9); ctx.stroke(); }
    for (const ex of [-11, 11]) {
      fillCirc(ctx, ex, -10, 10, '#f5eed8');
      if (open > 0.2) { fillEll(ctx, ex, -10, 6, 6 * open, '#2b211f'); fillCirc(ctx, ex + 2, -12, 2, '#fff'); }
      else { ctx.strokeStyle = '#2b211f'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(ex - 6, -10); ctx.lineTo(ex + 6, -10); ctx.stroke(); }
    }
    ctx.fillStyle = '#f0a33a'; ctx.beginPath(); ctx.moveTo(-4, -2); ctx.lineTo(4, -2); ctx.lineTo(0, 6 + (st.hoot || 0) * 2); ctx.fill();
    ctx.restore();
  };

  /* ---------------- fish ---------------- */
  C.fish = (ctx, st) => {
    const s = st.s || 1, t = st.t || 0;
    ctx.save(); ctx.translate(st.x, st.y); ctx.scale(s, s); ctx.rotate(st.rot || 0);
    const w = Math.sin(t * 20) * 0.3;
    ctx.save(); ctx.translate(-18, 0); ctx.rotate(w); ctx.fillStyle = '#f07a3a'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-16, -11); ctx.lineTo(-13, 0); ctx.lineTo(-16, 11); ctx.closePath(); ctx.fill(); ctx.restore();
    body(ctx, (c) => c.ellipse(0, 0, 22, 12, 0, 0, TAU), '#f58f45', { sb: [0, -12, 0, 12] });
    ctx.strokeStyle = 'rgba(255,255,255,0.6)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(-4, 0, 7, -1, 1); ctx.stroke();
    eye(ctx, 10, -3, 2.8, 0);
    ctx.restore();
  };

  /* ---------------- frog ---------------- */
  C.frog = (ctx, st) => {
    const s = st.s || 1, t = st.t || 0, cr = st.croak || 0;
    ctx.save(); ctx.translate(st.x, st.y - (st.hop || 0)); ctx.scale(s * (st.f || 1), s);
    if (cr > 0.05) { fillEll(ctx, 6, -2, 14 * cr + 4, 10 * cr + 3, 'rgba(250,236,170,0.95)'); }
    body(ctx, (c) => { c.ellipse(0, -10, 24, 15, 0, 0, TAU); c.moveTo(-10, -20); c.arc(-10, -22, 9, 0, TAU); c.moveTo(18, -20); c.arc(10, -22, 9, 0, TAU); }, '#79b84a', { sb: [0, -30, 0, 5] });
    fillEll(ctx, -20, -2, 10, 5, '#6aa640'); fillEll(ctx, 20, -2, 10, 5, '#6aa640');
    for (const ex of [-10, 10]) { fillCirc(ctx, ex, -23, 5.5, '#fff'); eye(ctx, ex + 1, -23, 3, st.blink != null ? st.blink : C.blink(t, 4)); }
    ctx.strokeStyle = '#3d6a24'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, -12, 10, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
    cheek(ctx, -14, -8, 4, 0.5); cheek(ctx, 14, -8, 4, 0.5);
    ctx.restore();
  };

  /* ---------------- butterfly ---------------- */
  C.butterfly = (ctx, st) => {
    const s = st.s || 1, t = st.t || 0; const w = Math.abs(Math.sin(t * (st.speed || 14) + (st.seed || 0)));
    ctx.save(); ctx.translate(st.x, st.y); ctx.scale(s, s); ctx.rotate(st.rot || 0);
    const col = st.col || '#f29fb5';
    for (const sg of [-1, 1]) {
      ctx.save(); ctx.scale(sg * (0.25 + w * 0.75), 1);
      body(ctx, (c) => { c.ellipse(9, -6, 10, 9, 0.4, 0, TAU); c.moveTo(14, 6); c.ellipse(7, 6, 7, 6, -0.4, 0, TAU); }, col, { sb: [0, -12, 0, 12] });
      fillCirc(ctx, 11, -7, 3, 'rgba(255,255,255,0.7)');
      ctx.restore();
    }
    ctx.fillStyle = '#4a3a34'; ctx.beginPath(); ctx.ellipse(0, 0, 2.4, 9, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = '#4a3a34'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(-1, -8); ctx.quadraticCurveTo(-4, -16, -6, -16); ctx.moveTo(1, -8); ctx.quadraticCurveTo(4, -16, 6, -16); ctx.stroke();
    ctx.restore();
  };

  /* ---------------- sun ---------------- */
  C.sun = (ctx, st) => {
    const s = st.s || 1, t = st.t || 0, spin = st.spin || 0;
    ctx.save(); ctx.translate(st.x, st.y); ctx.scale(s, s);
    const g = ctx.createRadialGradient(0, 0, 40, 0, 0, 150); g.addColorStop(0, 'rgba(255,240,170,0.55)'); g.addColorStop(1, 'rgba(255,240,170,0)');
    ctx.fillStyle = g; ctx.fillRect(-150, -150, 300, 300);
    ctx.save(); ctx.rotate(t * 0.15 + spin);
    for (let i = 0; i < 12; i++) {
      ctx.rotate(TAU / 12);
      const L = 76 + Math.sin(t * 3 + i) * 6 + (st.shine || 0) * 20;
      ctx.fillStyle = i % 2 ? '#f7c948' : '#f4a93c';
      ctx.beginPath(); ctx.moveTo(-9, -52); ctx.quadraticCurveTo(0, -L - 8, 9, -52); ctx.closePath(); ctx.fill();
    }
    ctx.restore();
    body(ctx, (c) => c.arc(0, 0, 52, 0, TAU), '#f9d44e', { sb: [0, -52, 0, 52], dark: 'rgba(230,120,30,0.3)' });
    const bl = st.blink != null ? st.blink : C.blink(t, 11);
    if (st.happy) { happyEye(ctx, -17, -6, 6); happyEye(ctx, 17, -6, 6); } else { eye(ctx, -17, -6, 6, bl); eye(ctx, 17, -6, 6, bl); }
    cheek(ctx, -28, 12, 9, 0.55); cheek(ctx, 28, 12, 9, 0.55);
    ctx.strokeStyle = '#8a4a1a'; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, 8, 12, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    ctx.restore();
  };

  /* ---------------- moon ---------------- */
  C.moon = (ctx, st) => {
    const s = st.s || 1, t = st.t || 0;
    ctx.save(); ctx.translate(st.x, st.y); ctx.scale(s, s); ctx.rotate(-0.25 + Math.sin(t * 0.8) * 0.05 + (st.rock || 0));
    const g = ctx.createRadialGradient(0, 0, 30, 0, 0, 170); g.addColorStop(0, 'rgba(255,245,200,0.35)'); g.addColorStop(1, 'rgba(255,245,200,0)');
    ctx.fillStyle = g; ctx.fillRect(-170, -170, 340, 340);
    body(ctx, (c) => { c.arc(0, 0, 62, 0.5 * Math.PI, 1.5 * Math.PI, true); c.bezierCurveTo(-40, -45, -40, 45, 0, 62); }, '#fbe7a2', { sb: [20, -60, 0, 60], dark: 'rgba(210,160,60,0.35)' });
    ctx.strokeStyle = '#6a5030'; ctx.lineWidth = 3; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.arc(22, -10, 6, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    cheek(ctx, 26, 8, 7, 0.5);
    ctx.beginPath(); ctx.arc(12, 20, 7, 0.2 * Math.PI, 0.9 * Math.PI); ctx.stroke();
    // nightcap
    ctx.fillStyle = '#7d8fd8'; ctx.beginPath(); ctx.moveTo(-8, -58); ctx.quadraticCurveTo(10, -80, 50, -70); ctx.quadraticCurveTo(28, -56, 20, -44); ctx.closePath(); ctx.fill();
    fillCirc(ctx, 54, -70, 8, '#fff');
    ctx.restore();
  };

  /* ---------------- 风婆婆 Granny Wind ---------------- */
  C.wind = (ctx, st) => {
    const s = st.s || 1, t = st.t || 0, awake = st.awake || 0, blow = st.blow || 0;
    ctx.save(); ctx.translate(st.x, st.y + Math.sin(t * 0.9) * 8); ctx.scale(s, s);
    // swirl hair
    ctx.lineCap = 'round';
    for (let i = 0; i < 7; i++) {
      const a0 = -2.6 + i * 0.55, len = 70 + i * 6;
      ctx.strokeStyle = i % 2 ? 'rgba(214,230,246,0.95)' : 'rgba(236,244,252,0.95)';
      ctx.lineWidth = 16 - i * 0.8;
      ctx.beginPath();
      for (let k = 0; k <= 20; k++) {
        const u = k / 20; const rad = 70 + u * len * 0.6; const a = a0 + u * 1.1 + Math.sin(t * 1.3 + i + u * 3) * 0.1;
        const x = Math.cos(a) * rad - u * 60, y = Math.sin(a) * rad * 0.8;
        k ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
      }
      ctx.stroke();
      const ea = a0 + 1.1, er = 70 + len * 0.6;
      ctx.beginPath(); ctx.arc(Math.cos(ea) * er - 60, Math.sin(ea) * er * 0.8, 10, 0, 4.5); ctx.stroke();
    }
    const puff = blow * (0.8 + Math.sin(t * 20) * 0.2);
    body(ctx, (c) => { c.ellipse(0, 0, 78, 70, 0, 0, TAU); c.moveTo(80 + puff * 8, 20); c.ellipse(48, 22, 30 + puff * 10, 26 + puff * 8, 0, 0, TAU); }, '#f3f7fc', { sb: [0, -70, 0, 70], dark: 'rgba(120,150,200,0.35)' });
    // eyes
    if (awake < 0.5) {
      ctx.strokeStyle = '#3d3a4a'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(-24, -8, 10, 0.15 * Math.PI, 0.85 * Math.PI); ctx.moveTo(38, -6); ctx.arc(28, -8, 10, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    } else if (blow > 0.1) {
      ctx.strokeStyle = '#3d3a4a'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.moveTo(-34, -12); ctx.lineTo(-16, -6); ctx.lineTo(-34, 0); ctx.moveTo(38, -12); ctx.lineTo(20, -6); ctx.lineTo(38, 0); ctx.stroke();
    } else { eye(ctx, -24, -8, 8, st.blink != null ? st.blink : C.blink(t, 13)); eye(ctx, 28, -8, 8, st.blink != null ? st.blink : C.blink(t, 13)); }
    // brows / wrinkles
    ctx.strokeStyle = 'rgba(120,130,160,0.7)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(-38, -28); ctx.quadraticCurveTo(-24, -34, -12, -28); ctx.moveTo(16, -28); ctx.quadraticCurveTo(28, -34, 42, -28); ctx.stroke();
    cheek(ctx, -40, 18, 11, 0.5); cheek(ctx, 10, 22, 8, 0.4);
    // mouth
    if (blow > 0.1) { fillEll(ctx, 70 + puff * 6, 22, 8, 10, '#6a4050'); }
    else if (awake >= 0.5) { ctx.strokeStyle = '#6a4050'; ctx.lineWidth = 3.5; ctx.beginPath(); ctx.arc(8, 22, 14, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke(); }
    else { fillEll(ctx, 8, 28, 6 + Math.sin(t * 1.5) * 2, 4 + Math.sin(t * 1.5) * 1.5, '#8a6070'); }
    ctx.restore();
  };

  /* ---------------- tiny townspeople (like the reference) ---------------- */
  C.person = (ctx, x, y, h, col, head = '#2e2a2a', t = 0, walk = 0) => {
    const b = walk ? Math.abs(Math.sin(t * 8)) * 1.5 : 0;
    ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(x, y, h * 0.25, h * 0.06, 0, 0, TAU); ctx.fill();
    ctx.fillStyle = '#2d2a2e';
    const lw = walk ? Math.sin(t * 8) * h * 0.08 : 0;
    ctx.fillRect(x - h * 0.12 + lw, y - h * 0.4, h * 0.1, h * 0.4); ctx.fillRect(x + h * 0.02 - lw, y - h * 0.4, h * 0.1, h * 0.4);
    ctx.fillStyle = col; ctx.beginPath(); SB.roundRect(ctx, x - h * 0.17, y - h * 0.8 - b, h * 0.34, h * 0.45, h * 0.1); ctx.fill();
    fillCirc(ctx, x, y - h * 0.9 - b, h * 0.13, head);
  };
})();
