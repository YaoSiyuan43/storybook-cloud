/* scenes A: cover, title page, spread 1 (hillside) */
(function () {
  'use strict';
  const SB = window.SB, P = SB.P, C = SB.C, A = SB.A;
  const DEF = (SB.DEF = SB.DEF || []);
  const TAU = Math.PI * 2;

  /* shared meadow painter (used by several spreads) */
  SB.meadow = (ctx, r, o = {}) => {
    const pal = Object.assign({ far: '#94b7b0', far2: '#7fa79a', mid: '#9ccc72', front: '#74b552', frontS: '#8ccb62', flower: ['#f7f1f1', '#f4b6c2', '#f7d56a', '#b9a4f0'] }, o.pal || {});
    const x0 = o.x0 || 0, x1 = o.x1 || 1600;
    const far = SB.ridge(x0 - 20, x1 + 20, 40, (x) => 470 + Math.sin(x * 0.006 + 1) * 40 + Math.sin(x * 0.017) * 14, r, 4);
    P.land(ctx, r, far, 960, pal.far, { dens: 400, len: 30, lw: 2.6, a: 0.3, aj: 0.1 });
    if (o.forest !== false) {
      const ft = SB.ridge(x0 - 20, Math.min(x1, 760) + 20, 30, (x) => 520 - Math.sin((x / 780) * Math.PI) * 70 + Math.sin(x * 0.03) * 6, r, 3);
      P.forest(ctx, r, ft, 960, { pal: o.forestPal || ['#3f7658', '#4a8462', '#56926c', '#63a076', '#72ad80'], th: 12, sx: 6, sy: 6.5, haze: 'rgba(160,200,190,0.35)' });
    }
    const mid = SB.ridge(x0 - 20, x1 + 20, 40, (x) => 600 + Math.sin(x * 0.004 + 2.2) * 36 + Math.sin(x * 0.013) * 10, r, 3);
    P.land(ctx, r, mid, 960, pal.mid, P.grassOpts({ dens: 170 }));
    const front = SB.ridge(x0 - 20, x1 + 20, 40, (x) => 700 + Math.sin(x * 0.0032 + 0.6) * 38 + Math.sin(x * 0.011 + 1) * 12, r, 2);
    P.land(ctx, r, front, 960, pal.front, P.grassOpts({ dens: 110, sc: pal.frontS, grad: (c) => { const g = c.createLinearGradient(0, 680, 0, 960); g.addColorStop(0, 'rgba(255,255,230,0.14)'); g.addColorStop(1, 'rgba(20,60,20,0.16)'); c.fillStyle = g; c.fillRect(x0, 600, x1 - x0, 400); } }));
    const fy = (x) => SB.interpY(front, x);
    P.grassTufts(ctx, r, x0, x1, fy, 90, SB.shade(pal.front, -10));
    for (let i = 0; i < 160; i++) { const x = x0 + r() * (x1 - x0), y = fy(x) + 20 + r() * (960 - fy(x) - 20); P.flowerDot(ctx, x, y, 2 + r() * 2, pal.flower[i % pal.flower.length]); }
    return { far, mid, front, fy, midY: (x) => SB.interpY(mid, x) };
  };
  SB.roundTree = (ctx, r, x, y, h, col = '#5f9e4c') => {
    ctx.fillStyle = '#6d4a33'; ctx.beginPath(); ctx.moveTo(x - h * 0.05, y); ctx.lineTo(x - h * 0.03, y - h * 0.55); ctx.lineTo(x + h * 0.03, y - h * 0.55); ctx.lineTo(x + h * 0.06, y); ctx.fill();
    SB.fillEll(ctx, x, y, h * 0.3, h * 0.04, 'rgba(0,0,0,0.12)');
    const list = SB.blobPts(x, y - h * 0.68, h * 0.34, h * 0.3, 9, 0.12, r).map((p) => [p[0], p[1], h * 0.16]);
    SB.tex(ctx, (c) => { SB.circles(list)(c); c.moveTo(x + h * 0.3, y - h * 0.68); c.ellipse(x, y - h * 0.68, h * 0.3, h * 0.26, 0, 0, TAU); }, col, { r, box: [x - h * 0.6, y - h * 1.1, h * 1.2, h * 0.9], dens: 40, len: 10, lw: 2.2, aj: 3, a: 0.5, dl: 12, shadow: 'rgba(0,0,0,0.18)', shadowBlur: 10, shadowY: 4, after: (c) => { for (let i = 0; i < 18; i++) SB.fillCirc(c, x - h * 0.3 + r() * h * 0.6, y - h * 0.95 + r() * h * 0.5, 2 + r() * 3, 'rgba(255,255,220,0.3)'); } });
  };

  /* ================= 0 · COVER ================= */
  DEF[0] = {
    name: 'cover',
    bg(ctx, r) {
      ctx.save(); ctx.beginPath(); ctx.rect(800, 0, 800, 960); ctx.clip();
      P.sky(ctx, r, '#79aee3');
      P.paperTop(ctx, r);
      P.streak(ctx, 1000, 420, 300, 12); P.streak(ctx, 1420, 380, 220, 10);
      SB.meadow(ctx, r, { x0: 800, x1: 1600, forest: false });
      SB.roundTree(ctx, r, 1500, 700, 230);
      ctx.restore();
      // spine binding strip
      ctx.fillStyle = 'rgba(40,60,90,0.16)'; ctx.fillRect(800, 0, 26, 960);
      ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(826, 0, 3, 960);
    },
    init(S) { S.ch = [0, 0, 0, 0, 0].map(() => ({ y: 0, v: 0, r: 0 })); S.lamb = { bleat: 0, hop: 0, hv: 0 }; S.cl = { mood: 'happy', k: 0 }; },
    update(S, dt) {
      for (const c of S.ch) { c.v += (-c.y * 180 - c.v * 9) * dt; c.y += c.v * dt; c.r *= Math.pow(0.02, dt); }
      const L = S.lamb; L.bleat = Math.max(0, L.bleat - dt * 1.4); if (L.hop > 0 || L.hv) { L.hv -= 1500 * dt; L.hop += L.hv * dt; if (L.hop <= 0) { L.hop = 0; L.hv = 0; } }
      S.cl.k = Math.max(0, S.cl.k - dt);
    },
    draw(ctx, S) {
      const t = S.t;
      C.sun(ctx, { x: 1460, y: 170, s: 0.75, t });
      // title
      const chars = '小云朵回家'; const cols = ['#e8774e', '#5d95d6', '#f2b53e', '#6fb35a', '#e56c8e'];
      for (let i = 0; i < 5; i++) {
        const c = S.ch[i]; const x = 1208 + (i - 2) * 128, y = 212 + Math.sin(t * 2 + i * 0.8) * 5 + c.y;
        ctx.save(); ctx.translate(x, y); ctx.rotate(Math.sin(t * 1.5 + i) * 0.04 + c.r);
        ctx.font = `900 118px ${SB.FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
        ctx.lineWidth = 26; ctx.strokeStyle = '#fffaf0'; ctx.strokeText(chars[i], 0, 0);
        ctx.fillStyle = 'rgba(80,50,40,0.25)'; ctx.fillText(chars[i], 4, 6);
        ctx.fillStyle = cols[i]; ctx.fillText(chars[i], 0, 0);
        ctx.restore();
      }
      SB.outlineText(ctx, '一只小羊和一朵云的故事', 1208, 330, 36, '#4a6f9c', '#fffaf0', 10, 700, 'center');
      C.cloud(ctx, { x: 1330, y: 590, s: 0.95, t, mood: S.cl.k > 0 ? 'laugh' : 'happy', wave: S.cl.k > 0 ? 1 : 0.25, shadowY: 180, shadowK: 0.7 });
      C.lamb(ctx, { x: 1040, y: 820, s: 1.15, f: 1, t, bleat: S.lamb.bleat, hop: S.lamb.hop, look: [0.8, -0.5], bell: S.lamb.bleat });
      SB.outlineText(ctx, '文·图  花椒绘本工作室', 1500, 925, 22, '#fff', 'rgba(60,90,40,0.5)', 5, 700, 'right');
    },
    hover: (S, x, y) => SB.hitEll(x, y, 1045, 720, 130, 110) || SB.hitEll(x, y, 1330, 590, 110, 70) || SB.hitCirc(x, y, 1460, 170, 70) || (y > 140 && y < 290 && x > 900 && x < 1520),
    tap(S, x, y) {
      if (y > 140 && y < 290 && x > 900 && x < 1520) { const i = SB.clamp(Math.round((x - 1208) / 128) + 2, 0, 4); S.ch[i].v = -700; S.ch[i].r = (Math.random() - 0.5) * 0.5; A.note(i + 2, 0.6, 0.14); S.tap('title'); return true; }
      if (SB.hitEll(x, y, 1045, 720, 130, 110)) { S.lamb.bleat = 1; S.lamb.hv = 520; A.bleat(1.1); A.bell(); S.fx.say(1110, 600, '咩——', { s: 34 }); S.tap('lamb'); return true; }
      if (SB.hitEll(x, y, 1330, 590, 110, 70)) { S.cl.k = 1.5; A.giggle(); S.fx.burst('heart', 1330, 540, 6, { speed: 120, up: 80, cols: ['#f58fa6', '#ffb3c4'], life: 1.2 }); S.tap('cloud'); return true; }
      if (SB.hitCirc(x, y, 1460, 170, 70)) { A.sparkle(); S.fx.burst('spark', 1460, 170, 10, { speed: 200, cols: ['#ffe27a', '#fff'] }); return true; }
      return false;
    },
    hints: () => [[1045, 700, 'lamb'], [1330, 580, 'cloud'], [1208, 212, 'title']],
  };

  /* ================= 1 · ENDPAPER + TITLE PAGE ================= */
  DEF[1] = {
    name: 'title',
    bg(ctx, r) {
      P.endpaper(ctx, r, 0, 800);
      P.creamPaper(ctx, r, 800, 1600);
      // vignette meadow disc
      ctx.save(); ctx.beginPath(); ctx.arc(1200, 560, 230, 0, TAU); ctx.clip();
      P.sky(ctx, r, '#86b8e8', { h: 960 });
      SB.tex(ctx, (c) => { c.moveTo(900, 640); c.quadraticCurveTo(1200, 560, 1500, 650); c.lineTo(1500, 900); c.lineTo(900, 900); c.closePath(); }, '#7dbb58', Object.assign({ r, box: [900, 560, 600, 340] }, P.grassOpts()));
      for (let i = 0; i < 30; i++) P.flowerDot(ctx, 980 + r() * 440, 680 + r() * 110, 2.4, ['#fff', '#f6b3c3', '#f7d56a'][i % 3]);
      ctx.restore();
      ctx.strokeStyle = '#e8c9a0'; ctx.lineWidth = 6; ctx.setLineDash([2, 12]); ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(1200, 560, 246, 0, TAU); ctx.stroke(); ctx.setLineDash([]);
      SB.outlineText(ctx, '小云朵回家', 1200, 170, 76, '#e8774e', '#fffaf0', 14, 900, 'center');
    },
    init(S) { S.awake = 0; },
    update(S, dt) { S.awake = Math.max(0, S.awake - dt * 0.4); if (S.awake < 0.1 && Math.random() < dt * 0.9) S.fx.add({ type: 'z', x: 1270, y: 450, vy: -40, vx: 20, life: 2, s: 1, c: '#7b93c9' }); },
    draw(ctx, S) {
      const t = S.t;
      C.lamb(ctx, { x: 1180, y: 700, s: 0.9, f: 1, t, blink: S.awake > 0.1 ? 0 : 1, happy: S.awake > 0.1, noShadow: false });
      C.cloud(ctx, { x: 1180, y: 540 - S.awake * 40, s: 0.62, t, mood: S.awake > 0.1 ? 'laugh' : 'sleep', float: 0.4 });
    },
    text: { x: 1200, y: 850, size: 30, align: 'center', w: 640, col: '#8a6a52', lines: [{ t: '献给每一个愿意帮助别人的小朋友' }] },
    hover: (S, x, y) => SB.hitCirc(x, y, 1200, 600, 200),
    tap(S, x, y) { if (SB.hitCirc(x, y, 1200, 600, 200)) { S.awake = 1.6; A.giggle(); A.bleat(1.25); S.fx.burst('spark', 1200, 520, 10, { speed: 160, cols: ['#ffe27a', '#fff', '#ffc4d4'] }); S.tap('v'); return true; } return false; },
    hints: () => [[1200, 580, 'v']],
  };

  /* ================= 2 · HILLSIDE ================= */
  const H2 = { gy: (x) => 818 + Math.sin(x * 0.004 + 0.4) * 16 };
  DEF[2] = {
    name: 'hill',
    bg(ctx, r) {
      P.sky(ctx, r, '#78a9df');
      P.paperTop(ctx, r);
      P.streak(ctx, 420, 470, 320, 12, -0.05); P.streak(ctx, 1000, 360, 260, 10, -0.08); P.streak(ctx, 1250, 440, 200, 8);
      P.cloud(ctx, r, 1120, 250, 250, 80);
      const m = SB.meadow(ctx, r);
      H2.midY = m.midY;
      // farmhouse on the mid hill
      const hx = 1330, hy = m.midY(1330) + 12;
      ctx.fillStyle = '#b98a5c'; for (let i = 0; i < 9; i++) ctx.fillRect(1220 + i * 26, hy - 16 + Math.sin(i) * 2, 5, 22);
      ctx.fillRect(1220, hy - 10, 210, 4);
      P.house(ctx, r, hx, hy, 110, 70, '#d9573f');
      ctx.fillStyle = '#8a5a3a'; ctx.fillRect(hx + 22, hy - 118, 14, 30);
      P.house(ctx, r, hx + 90, hy + 4, 60, 44, '#e59b3c');
      SB.roundTree(ctx, r, 130, 790, 300, '#5b9a48');
      SB.roundTree(ctx, r, 1530, 640, 150, '#6aa954');
      P.bush(ctx, r, 330, 900, 150, 60, '#5d9a4a');
      P.bush(ctx, r, 1480, 930, 180, 70, '#5a954a');
    },
    init(S) {
      S.lamb = { x: 520, home: 520, f: 1, run: 0, ph: 0, bleat: 0, hop: 0, hv: 0, target: null, taps: 0 };
      S.cl = { x: 1040, y: -140, vy: 0, landed: false, squash: 0, mood: 'sad', say: 0, fallAt: 1.1 };
      const fl = [[300, 740, '#f59ab0'], [700, 900, '#f7d24a'], [880, 780, '#b8a0f2'], [1230, 900, '#f58f6a'], [1420, 760, '#f59ab0'], [610, 760, '#8ec9f5'], [1560, 850, '#f7d24a']];
      S.flowers = fl.map(([x, y, c], i) => ({ x, y, c, open: 0, tg: 0, i }));
      S.bflies = [{ cx: 760, cy: 560, a: 0, col: '#f29fb5', flee: 0 }, { cx: 1260, cy: 620, a: 2, col: '#f6c953', flee: 0 }];
      S.sun = { spin: 0, sv: 0, happy: 0 };
      S.smoke = 0;
    },
    enter(S) { if (!S.cl.landed) { S.cl.y = -140; S.cl.vy = 0; S.cl.fallAt = S.t + 1.2; } },
    update(S, dt) {
      const L = S.lamb, cl = S.cl, t = S.t;
      // cloud falling
      if (!cl.landed && t > cl.fallAt) {
        cl.vy += 1300 * dt; cl.y += cl.vy * dt;
        if (Math.random() < dt * 30) S.fx.add({ type: 'puff', x: cl.x + (Math.random() - 0.5) * 80, y: cl.y - 30, life: 0.6, s: 0.8, c: '#ffffff' });
        const land = 730;
        if (cl.y >= land) {
          cl.y = land;
          if (cl.vy > 300) { cl.vy = -cl.vy * 0.32; cl.squash = 1; A.thud(); A.boing(false); S.fx.pop(cl.x, cl.y - 110, '噗——！', { s: 50, c: '#5d95d6' }); S.fx.burst('dot', cl.x, cl.y + 40, 14, { speed: 260, up: 150, g: 700, cols: ['#fff', '#e8f3ff', '#b5dd8c'], life: 0.8 }); }
          else { cl.landed = true; cl.vy = 0; setTimeout(() => { A.sniff(); S.fx.say(cl.x + 30, cl.y - 60, '呜呜……\n我飞不回天上了', { s: 30, life: 2.8, side: 1 }); }, 500); }
        }
      }
      cl.squash *= Math.pow(0.004, dt);
      cl.say = Math.max(0, cl.say - dt);
      // lamb
      L.bleat = Math.max(0, L.bleat - dt * 1.3);
      if (L.hv || L.hop > 0) { L.hv -= 1600 * dt; L.hop += L.hv * dt; if (L.hop <= 0) { L.hop = 0; L.hv = 0; } }
      if (L.target != null) {
        L.run = Math.min(1, L.run + dt * 2);
        const d = L.target - L.x; const sp = 230 * L.run;
        L.f = d > 0 ? 1 : -1; L.x += Math.sign(d) * Math.min(Math.abs(d), sp * dt); L.ph += dt * 13 * L.run;
        if (Math.random() < dt * 8) S.fx.add({ type: 'puff', x: L.x - L.f * 60, y: H2.gy(L.x) - 5, vx: -L.f * 40, vy: -20, life: 0.5, s: 0.45, c: 'rgba(235,245,215,0.9)' });
        if (Math.abs(d) < 2) { if (L.target !== L.home) L.target = L.home; else { L.target = null; L.f = 1; } }
      } else { L.run = Math.max(0, L.run - dt * 3); }
      // flowers
      for (const f of S.flowers) f.open += (f.tg - f.open) * Math.min(1, dt * 5);
      // butterflies
      for (const b of S.bflies) { b.flee = Math.max(0, b.flee - dt); b.a += dt * (0.6 + b.flee * 2.5); }
      // sun
      S.sun.sv *= Math.pow(0.2, dt); S.sun.spin += S.sun.sv * dt; S.sun.happy = Math.max(0, S.sun.happy - dt);
      S.smoke += dt; if (S.smoke > 0.7) { S.smoke = 0; S.fx.add({ type: 'puff', x: 1359, y: H2.midY(1330) - 110, vx: 14, vy: -26, life: 3, s: 0.5, c: 'rgba(255,255,255,0.8)' }); }
    },
    draw(ctx, S) {
      const t = S.t, L = S.lamb, cl = S.cl;
      C.sun(ctx, { x: 1440, y: 175, s: 0.85, t, spin: S.sun.spin, happy: S.sun.happy > 0, shine: S.sun.happy > 0 ? 1 : 0 });
      // butterflies
      for (const b of S.bflies) { const x = b.cx + Math.sin(b.a) * 170 + Math.sin(b.a * 2.3) * 40, y = b.cy + Math.sin(b.a * 1.7) * 60 - b.flee * 60; b.x = x; b.y = y; C.butterfly(ctx, { x, y, s: 1.1, t, col: b.col, rot: Math.cos(b.a) * 0.3, speed: 14 + b.flee * 16 }); }
      // flowers
      for (const f of S.flowers) {
        const sw = Math.sin(t * 1.8 + f.i) * 0.05;
        ctx.save(); ctx.translate(f.x, f.y); ctx.rotate(sw);
        ctx.strokeStyle = '#4c8a3a'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-6, -24, 0, -48); ctx.stroke();
        SB.fillEll(ctx, -10, -18, 10, 4.5, '#5ea04a', -0.5); SB.fillEll(ctx, 10, -28, 10, 4.5, '#5ea04a', 0.5);
        ctx.translate(0, -52);
        const o = SB.ease.outElastic(Math.min(1, f.open));
        if (f.open < 0.05) { SB.body(ctx, (c) => c.ellipse(0, 0, 9, 13, 0, 0, TAU), f.c, {}); }
        else {
          ctx.rotate(t * 0.3 * f.open);
          for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; SB.body(ctx, (c) => c.ellipse(Math.cos(a) * 15 * o, Math.sin(a) * 15 * o, 12 * o, 8 * o, a, 0, TAU), f.c, {}); }
          SB.fillCirc(ctx, 0, 0, 9 * o, '#f7d24a'); SB.fillCirc(ctx, -2, -2, 3 * o, '#fff5c0');
        }
        ctx.restore();
      }
      // cloud (behind lamb if lamb runs past)
      const drawCloud = () => C.cloud(ctx, { x: cl.x, y: cl.y, s: 0.9, t, mood: cl.say > 0 ? 'wow' : cl.mood, squash: cl.squash, float: cl.landed ? 0.35 : 0, shadowY: cl.landed ? 818 - cl.y + 30 : 0, shadowK: 0.9, look: [-0.6, 0.2] });
      const lamb = () => C.lamb(ctx, { x: L.x, y: H2.gy(L.x), s: 1.05, f: L.f, t, run: L.run, legPh: L.ph, bleat: L.bleat, hop: L.hop, bell: L.bleat + L.run, look: cl.landed ? [0.9, -0.2] : [0.3, -1] });
      drawCloud(); lamb();
    },
    text: { x: 90, y: 128, size: 36, w: 600, lines: [{ t: '山坡上，住着一只小羊，名叫棉棉。' }, { t: '棉棉的毛又白又软，像天上的云。' }, { t: '这天早上，“噗——”，一朵小云朵掉了下来！' }] },
    hover(S, x, y) { const L = S.lamb; return SB.hitEll(x, y, L.x + L.f * 20, H2.gy(L.x) - 90, 110, 90) || (S.cl.landed && SB.hitEll(x, y, S.cl.x, S.cl.y, 90, 60)) || S.flowers.some((f) => SB.hitCirc(x, y, f.x, f.y - 50, 34)) || S.bflies.some((b) => SB.hitCirc(x, y, b.x, b.y, 34)) || SB.hitCirc(x, y, 1440, 175, 70); },
    tap(S, x, y) {
      const L = S.lamb, cl = S.cl;
      if (SB.hitEll(x, y, L.x + L.f * 20, H2.gy(L.x) - 90, 110, 90)) {
        L.taps++; L.bleat = 1; A.bleat(1 + Math.random() * 0.15); A.bell(); S.tap('lamb');
        if (L.target == null && L.taps % 2 === 0) { L.target = L.x < 800 ? 1450 : 250; if (Math.abs(L.target - cl.x) < 120) L.target += 150; S.fx.say(L.x + L.f * 60, H2.gy(L.x) - 170, '咩~我跑给你看！', { s: 28 }); }
        else { L.hv = 560; S.fx.say(L.x + L.f * 60, H2.gy(L.x) - 170, cl.landed ? '你好呀，小云朵！' : '咩——', { s: 28 }); }
        S.fx.add({ type: 'note', x: L.x + L.f * 90, y: H2.gy(L.x) - 150, vx: L.f * 40, vy: -70, life: 1.4, s: 1, c: '#e8774e' });
        return true;
      }
      if (cl.landed && SB.hitEll(x, y, cl.x, cl.y, 90, 60)) {
        cl.say = 0.6; cl.squash = 0.6; A.sniff(); S.tap('cloud');
        const lines = ['呜呜……我想回家', '天上是我的家', '你能帮帮我吗？'];
        S.fx.say(cl.x + 30, cl.y - 60, lines[(S.cSay = ((S.cSay || 0) + 1) % 3)], { s: 30, life: 2.2 });
        S.fx.burst('drop', cl.x, cl.y, 6, { speed: 120, up: 120, g: 500, cols: ['#8ccff0'], life: 0.8 });
        return true;
      }
      for (const f of S.flowers) if (SB.hitCirc(x, y, f.x, f.y - 50, 34)) {
        if (f.tg) { f.open = 0.4; } f.tg = 1; S.tap('flower');
        A.pop(1 + f.i * 0.1); A.note(f.i + 3, 0.6, 0.1);
        S.fx.burst('petal', f.x, f.y - 52, 8, { speed: 150, up: 60, g: 120, cols: [f.c, '#fff'], life: 1.3 });
        return true;
      }
      for (const b of S.bflies) if (SB.hitCirc(x, y, b.x, b.y, 34)) { b.flee = 1.6; A.sparkle(4, 5); S.fx.burst('spark', b.x, b.y, 8, { speed: 140, cols: ['#fff6c2', b.col] }); S.tap('bfly'); return true; }
      if (SB.hitCirc(x, y, 1440, 175, 70)) { S.sun.sv = 12; S.sun.happy = 2; A.sparkle(7, 2); S.fx.say(1400, 90, '早上好！', { s: 28, side: -1 }); S.tap('sun'); return true; }
      return false;
    },
    hints(S) { const L = S.lamb; return [[L.x + 20, H2.gy(L.x) - 100, 'lamb'], [S.cl.x, S.cl.y, 'cloud'], [S.flowers[2].x, S.flowers[2].y - 50, 'flower'], [1440, 175, 'sun']].filter((h) => h[2] !== 'cloud' || S.cl.landed); },
  };
})();
