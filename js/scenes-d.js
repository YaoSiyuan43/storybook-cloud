/* scenes D: spread 9 (home at last · the gift), 10 (goodnight ending) */
(function () {
  'use strict';
  const SB = window.SB, P = SB.P, C = SB.C, A = SB.A;
  const DEF = SB.DEF;
  const TAU = Math.PI * 2;

  /* ================= 9 · 回到天上 (home at last — and a gift of rain) ================= */
  const G9 = {};
  DEF[9] = {
    name: 'home',
    bg(ctx, r) {
      // night sky, highest up — the cloud's home
      SB.tex(ctx, (c) => c.rect(0, 0, 1600, 720), '#3a4388', { r, box: [0, 0, 1600, 720], dens: 320, len: 46, lw: 3.2, a: 0.3, grad: (c) => { const g = c.createLinearGradient(0, 0, 0, 720); g.addColorStop(0, '#232a63'); g.addColorStop(0.55, '#45508e'); g.addColorStop(1, '#8a7cae'); c.fillStyle = g; c.fillRect(0, 0, 1600, 720); } });
      for (let i = 0; i < 110; i++) { const x = r() * 1600, y = r() * 640; const s = 1 + r() * 2.8; ctx.fillStyle = `rgba(255,255,235,${0.4 + r() * 0.55})`; ctx.beginPath(); SB.star4(ctx, x, y, s, r() * 6, 0.3); ctx.fill(); }
      // a few shooting-star streaks
      ctx.save(); ctx.strokeStyle = 'rgba(255,255,230,0.5)'; ctx.lineWidth = 2; ctx.lineCap = 'round'; for (const [sx, sy, l] of [[400, 180, 70], [1180, 120, 90]]) { ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + l, sy + l * 0.4); ctx.stroke(); } ctx.restore();
      C.moon(ctx, { x: 1300, y: 230, s: 1.1, t: 0 });
      // sea of soft clouds — the cloud's home neighbourhood
      for (let i = 0; i < 7; i++) P.cloud(ctx, r, 60 + i * 250 + (i % 2) * 120, 760 + (i % 2) * 30, 300, 76, '#eef2fb', '#c6cfe6');
      // the far hilltop + tiny friends below, down on the ground, looking up
      const ridge = SB.ridge(0, 1600, 40, (x) => 905 + Math.sin(x * 0.004) * 8, r, 3);
      P.land(ctx, r, ridge, 960, '#4b6a52', { dens: 220, len: 18, lw: 2.2, a: 0.3, sc: '#5a7a60' });
    },
    init(S) {
      S.cl = { x: 760, y: 760, rise: 0, mood: 'joy', wave: 1, say: 0, home: 0 };
      S.lamb = { bleat: 0, wave: 0 };
      S.rainBtn = 0; S.raining = 0; S.rainT = 0; S.rainbow = 0;
      S.hearts = 0;
    },
    enter(S) { S.cl.rise = 0; S.cl.y = 760; S.cl.home = 0; },
    update(S, dt) {
      const t = S.t;
      // cloud gently rises to its home spot among the clouds and settles
      S.cl.rise = Math.min(1, S.cl.rise + dt * 0.35);
      S.cl.y = 760 - SB.ease.out(S.cl.rise) * 360;
      if (S.cl.rise > 0.98 && !S.cl.home) { S.cl.home = 1; A.sparkle(10, 5); A.twinkle(2); S.fx.burst('star', S.cl.x, S.cl.y, 14, { speed: 180, cols: ['#ffe27a', '#fff', '#cfe0ff'], life: 1.4 }); S.fx.say(S.cl.x, S.cl.y - 110, '我到家啦！', { s: 32, life: 2.4 }); }
      S.cl.say = Math.max(0, S.cl.say - dt);
      S.lamb.bleat = Math.max(0, S.lamb.bleat - dt * 1.3); S.lamb.wave = Math.max(0, S.lamb.wave - dt);
      if (S.hearts > 0) S.hearts -= dt;
      // the gift: cloud makes it rain down on the thirsty meadow, then a moon-rainbow
      if (S.raining > 0) {
        S.rainT += dt; S.raining -= dt;
        for (let i = 0; i < 4; i++) S.fx.add({ type: 'drop', x: S.cl.x + (Math.random() - 0.5) * 260, y: S.cl.y + 60, vy: 260, g: 300, life: 1.4, s: 1, c: '#9fd4f2' });
        if (S.raining <= 0) { S.rainbow = 1.0; A.twinkle(4); S.sayColors = S.t + 0.4; }
      }
      if (S.rainbow > 0 && S.rainbow < 1) S.rainbow = Math.min(1, S.rainbow + dt);
      // name the rainbow colours one by one — a gentle colour-learning moment
      if (S.sayColors && S.t >= S.sayColors) {
        const cols = ['红', '橙', '黄', '绿', '蓝', '紫'];
        if ((S.colIdx || 0) < cols.length) {
          const i = S.colIdx || 0; S.colIdx = i + 1; S.sayColors = S.t + 0.62;
          const hue = ['#e85b5b', '#f09a3c', '#f3d14a', '#5fb45a', '#5a9fe0', '#9a74d6'][i];
          S.fx.pop(S.cl.x - 150 + i * 60, S.cl.y + 170, cols[i], { s: 40, c: hue, life: 1.4, rot0: (Math.random() - 0.5) * 0.2 });
          A.note(i + 2, 0.45, 0.09);
          if (i === cols.length - 1) setTimeout(() => { S.cl.say = 2.4; S.fx.say(S.cl.x, S.cl.y - 110, '红、橙、黄、绿、蓝、紫，\n彩虹有好多颜色呀！', { s: 24, life: 3 }); }, 700);
        } else S.sayColors = 0;
      }
    },
    draw(ctx, S) {
      const t = S.t;
      // moon-rainbow arcs after the rain
      if (S.rainbow > 0) {
        ctx.save(); ctx.globalAlpha = 0.5 * S.rainbow; ctx.lineWidth = 16; ctx.lineCap = 'round';
        const cols = ['#f29b9b', '#f6c76a', '#f3ea8a', '#9fd98f', '#8fc9ef', '#b9a4f0'];
        cols.forEach((c, i) => { ctx.strokeStyle = c; ctx.beginPath(); ctx.arc(760, 980, 360 + (cols.length - i) * 16, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke(); });
        ctx.restore();
      }
      // friends on the ground, waving up
      C.bear(ctx, { x: 300, y: 955, s: 0.6, f: 1, t, wave: 0.5 + Math.sin(t * 3) * 0.5, happy: true });
      C.lamb(ctx, { x: 470, y: 945, s: 0.62, f: 1, t, bleat: S.lamb.bleat, happy: true, look: [0.2, -1] });
      C.squirrel(ctx, { x: 600, y: 930, s: 0.5, f: 1, t, flick: 1 });
      C.duck(ctx, { x: 170, y: 948, s: 0.5, f: 1, t, seed: 2 });
      // the little cloud, home among the clouds, waving back
      C.cloud(ctx, { x: S.cl.x, y: S.cl.y, s: 0.9, t, mood: S.cl.say > 0 ? 'laugh' : 'joy', float: 0.5, wave: 0.5 + Math.sin(t * 5) * 0.5, armsUp: 0.3, glow: S.cl.home ? 0.5 + Math.sin(t * 2) * 0.2 : 0.2, look: [0, 0.4] });
      if (S.hearts > 0) { if (Math.random() < 0.3) S.fx.add({ type: 'heart', x: S.cl.x + (Math.random() - 0.5) * 100, y: S.cl.y + 30, vy: 60, life: 1.4, s: 1, c: '#f58fa6' }); }
    },
    drawTop(ctx, S) {
      if (S.cl.home && S.rainbow <= 0 && S.raining <= 0) {
        ctx.save(); ctx.globalAlpha = 0.85 * (0.6 + 0.4 * Math.sin(S.t * 4));
        SB.outlineText(ctx, '点点小云朵，收下它的谢礼 →', 760, 150, 26, '#fff', 'rgba(40,50,110,0.8)', 7, 800, 'center');
        ctx.restore();
      }
    },
    text: { x: 90, y: 820, size: 32, w: 620, col: '#f3ecff', halo: 'rgba(40,50,110,0.9)', lines: [{ t: '“到家啦——！”小云朵高兴得转起圈圈。' }, { t: '为了谢谢大家，它下起了一场甜甜的小雨，' }, { t: '天边，还挂起了一道亮晶晶的彩虹。' }] },
    hover(S, x, y) { return SB.hitEll(x, y, S.cl.x, S.cl.y, 95, 65) || SB.hitEll(x, y, 470, 880, 70, 70); },
    tap(S, x, y) {
      if (SB.hitEll(x, y, S.cl.x, S.cl.y, 95, 65)) {
        S.cl.say = 1.4; S.hearts = 1.6;
        if (S.cl.home && S.raining <= 0 && S.rainbow <= 0) { S.raining = 1.6; S.rainT = 0; A.rain(2.2); A.giggle(); S.fx.say(S.cl.x, S.cl.y - 110, '哗啦啦，送给你们！', { s: 26, life: 2.2 }); }
        else { A.giggle(); S.fx.burst('heart', S.cl.x, S.cl.y - 40, 6, { speed: 120, up: 80, cols: ['#f58fa6', '#ffd1dd'], life: 1.2 }); }
        S.tap('cloud'); return true;
      }
      if (SB.hitEll(x, y, 470, 880, 70, 70)) { S.lamb.bleat = 1; S.lamb.wave = 1; A.bleat(1.1); A.bell(); S.fx.say(470, 820, '再见啦～常来玩！', { s: 22 }); S.tap('lamb'); return true; }
      return false;
    },
    hints(S) { return [[S.cl.x, S.cl.y, 'cloud'], [470, 880, 'lamb']]; },
  };

  /* ================= 10 · 晚安 (goodnight — LAST page, left half only) ================= */
  // last view => only the LEFT half (x 0..800) is shown. Compose everything in that band.
  const G10 = { gy: () => 740 };
  DEF[10] = {
    name: 'goodnight',
    bg(ctx, r) {
      // right half: a quiet endpaper to match the cover's inside
      P.endpaper(ctx, r, 800, 1600, '#d7c9e4');
      // left half: the cosy night scene — lamb home in its little pen, cloud a star in the sky
      ctx.save(); ctx.beginPath(); ctx.rect(0, 0, 800, 960); ctx.clip();
      SB.tex(ctx, (c) => c.rect(0, 0, 800, 620), '#38417e', { r, box: [0, 0, 800, 620], dens: 320, len: 44, lw: 3, a: 0.3, grad: (c) => { const g = c.createLinearGradient(0, 0, 0, 620); g.addColorStop(0, '#222a5e'); g.addColorStop(0.6, '#434d8c'); g.addColorStop(1, '#7d79aa'); c.fillStyle = g; c.fillRect(0, 0, 800, 620); } });
      for (let i = 0; i < 60; i++) { const x = r() * 800, y = r() * 540; const s = 1 + r() * 2.4; ctx.fillStyle = `rgba(255,255,235,${0.4 + r() * 0.5})`; ctx.beginPath(); SB.star4(ctx, x, y, s, r() * 6, 0.3); ctx.fill(); }
      // rolling night meadow
      const far = SB.ridge(0, 820, 36, (x) => 600 + Math.sin(x * 0.006) * 24, r, 4);
      P.land(ctx, r, far, 960, '#3e5a4a', { dens: 240, len: 20, lw: 2.2, a: 0.3, sc: '#4a6a56' });
      const front = SB.ridge(0, 820, 36, (x) => 720 + Math.sin(x * 0.004 + 1) * 16, r, 2);
      P.land(ctx, r, front, 960, '#33503f', P.grassOpts({ dens: 120, sc: '#3f6049' }));
      // little farmhouse with a warm glowing window
      const hx = 250, hy = 720;
      ctx.fillStyle = '#8a5a3a'; for (let i = 0; i < 7; i++) ctx.fillRect(150 + i * 26, hy - 8, 5, 20);
      P.house(ctx, r, hx, hy, 120, 78, '#c05340', { wall: '#e9e0d2', win: '#f6c84a' });
      // warm glow from window
      ctx.save(); ctx.globalCompositeOperation = 'lighter'; const g = ctx.createRadialGradient(hx, hy - 50, 4, hx, hy - 50, 120); g.addColorStop(0, 'rgba(255,210,120,0.5)'); g.addColorStop(1, 'rgba(255,210,120,0)'); ctx.fillStyle = g; ctx.fillRect(hx - 120, hy - 170, 240, 240); ctx.restore();
      SB.roundTree(ctx, r, 650, 760, 240, '#3f6049');
      P.bush(ctx, r, 120, 880, 150, 64, '#33503f');
      ctx.restore();
      // the dividing shadow between the two halves (near the spine)
      ctx.fillStyle = 'rgba(40,30,50,0.14)'; ctx.fillRect(774, 0, 26, 960);
    },
    init(S) {
      S.lamb = { bleat: 0, blink: 0, sleepy: 1 };
      S.cloudStar = { tw: 0, say: 0 };
      S.moon = { rock: 0 };
      S.z = 0; S.night = 0;
    },
    update(S, dt) {
      const t = S.t;
      S.night += dt;
      S.lamb.bleat = Math.max(0, S.lamb.bleat - dt * 1.2);
      S.cloudStar.say = Math.max(0, S.cloudStar.say - dt);
      S.cloudStar.tw = (Math.sin(t * 2) * 0.5 + 0.5);
      S.moon.rock = Math.max(0, S.moon.rock - dt);
      // sleepy 'z's drift from the lamb
      S.z += dt; if (S.z > 1.6) { S.z = 0; S.fx.add({ type: 'z', x: 430, y: 660, vx: 18, vy: -40, life: 2.6, s: 0.9, c: '#b9c6ef' }); }
    },
    draw(ctx, S) {
      const t = S.t;
      // moon, bigger & warm, up in the left sky
      C.moon(ctx, { x: 170, y: 190, s: 1.0, t, rock: S.moon.rock });
      // the little cloud, now a glowing star-friend watching over from the sky
      const cx = 560, cy = 240;
      ctx.save();
      const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, 70); g.addColorStop(0, `rgba(255,250,210,${0.4 + S.cloudStar.tw * 0.4})`); g.addColorStop(1, 'rgba(255,250,210,0)');
      ctx.fillStyle = g; ctx.fillRect(cx - 70, cy - 70, 140, 140);
      ctx.restore();
      C.cloud(ctx, { x: cx, y: cy, s: 0.4, t, mood: 'laugh', float: 0.6, wave: 0.3 + Math.sin(t * 4) * 0.3, glow: 0.3, look: [-0.4, 0.5] });
      // a dotted "friendship" line of tiny stars linking cloud and lamb
      ctx.save(); ctx.globalAlpha = 0.5 + S.cloudStar.tw * 0.3; ctx.fillStyle = '#fff3b0';
      for (let i = 0; i < 7; i++) { const u = i / 7; const x = SB.lerp(cx, 410, u) + Math.sin(t * 2 + i) * 4, y = SB.lerp(cy + 20, 640, u); ctx.beginPath(); SB.star4(ctx, x, y, 3 + Math.sin(t * 3 + i) * 1.5, i, 0.3); ctx.fill(); }
      ctx.restore();
      // lamb, curled up sleepy by its home, looking up at its friend
      C.lamb(ctx, { x: 410, y: 720, s: 0.95, f: -1, t, bleat: S.lamb.bleat, blink: S.lamb.bleat > 0.1 ? 0 : (Math.sin(t * 1.5) > 0.6 ? 1 : S.lamb.blink), happy: S.lamb.bleat > 0.1, look: [-0.5, -0.8] });
    },
    drawTop(ctx, S) {
      // "THE END" ribbon, centred in the left page
      ctx.save();
      const bob = Math.sin(S.t * 2) * 3;
      SB.outlineText(ctx, '晚 安，小云朵', 400, 110 + bob, 46, '#ffe9a6', 'rgba(40,40,90,0.85)', 10, 900, 'center');
      SB.outlineText(ctx, '· 全 文 完 ·', 400, 165 + bob, 22, '#e9d9ff', 'rgba(40,40,90,0.7)', 6, 700, 'center');
      ctx.restore();
    },
    text: { x: 400, y: 870, size: 28, align: 'center', w: 680, col: '#f3ecff', halo: 'rgba(40,40,90,0.9)', lines: [{ t: '从那天起，每当棉棉抬起头，' }, { t: '天上总有一朵小云朵，对着它笑。' }, { t: '因为呀——好朋友，永远在一起。' }] },
    hover(S, x, y) { return SB.hitEll(x, y, 410, 650, 90, 90) || SB.hitCirc(x, y, 560, 240, 60) || SB.hitCirc(x, y, 170, 190, 90); },
    tap(S, x, y) {
      if (SB.hitEll(x, y, 410, 650, 90, 90)) { S.lamb.bleat = 1; A.bleat(1.0); A.bell(); S.fx.say(470, 580, '晚安～', { s: 24 }); S.fx.burst('heart', 500, 400, 5, { speed: 90, up: 120, g: -20, cols: ['#f58fa6', '#ffd1dd'], life: 1.6 }); S.tap('lamb'); return true; }
      if (SB.hitCirc(x, y, 560, 240, 60)) { S.cloudStar.say = 1.4; A.twinkle(3); A.giggle(); S.fx.burst('star', 560, 240, 10, { speed: 150, cols: ['#ffe27a', '#fff'], life: 1.3 }); S.fx.say(560, 160, '做个好梦哦！', { s: 22, side: -1 }); S.tap('cloud'); return true; }
      if (SB.hitCirc(x, y, 170, 190, 90)) { S.moon.rock = 1.2; A.twinkle(1); S.fx.burst('spark', 170, 190, 8, { speed: 130, cols: ['#fff3b0', '#fff'] }); S.tap('moon'); return true; }
      return false;
    },
    hints(S) { return [[410, 650, 'lamb'], [560, 240, 'cloud']]; },
  };
})();
