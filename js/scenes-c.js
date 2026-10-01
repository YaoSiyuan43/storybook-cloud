/* scenes C: spread 6 (the climb, dusk mountain), 7 (hilltop · Granny Wind asleep), 8 (everyone blows) */
(function () {
  'use strict';
  const SB = window.SB, P = SB.P, C = SB.C, A = SB.A;
  const DEF = SB.DEF;
  const TAU = Math.PI * 2;

  /* ================= 6 · 爬上山 (the climb — dusk) ================= */
  const G6 = {};
  DEF[6] = {
    name: 'climb',
    bg(ctx, r) {
      // golden-hour dusk sky
      SB.tex(ctx, (c) => c.rect(0, 0, 1600, 620), '#f6b36a', { r, box: [0, 0, 1600, 620], dens: 360, len: 46, lw: 3.2, a: 0.3, grad: (c) => { const g = c.createLinearGradient(0, 0, 0, 620); g.addColorStop(0, '#9a7fc4'); g.addColorStop(0.4, '#efa26a'); g.addColorStop(1, '#f8d79a'); c.fillStyle = g; c.fillRect(0, 0, 1600, 620); } });
      C.sun(ctx, { x: 1230, y: 420, s: 1.1, t: 0, happy: true }); // low setting sun
      P.streak(ctx, 500, 300, 320, 12, -0.04, 0.6); P.streak(ctx, 1000, 240, 260, 10, -0.06, 0.55);
      // layered mountain ridges climbing to the right
      const ridge = (fy, col, top) => { const pts = SB.ridge(0, 1600, 36, fy, r, 6); const path = (c) => { SB.smooth(c, pts, false); c.lineTo(1600, 960); c.lineTo(0, 960); c.closePath(); }; P.land(ctx, r, pts, 960, col, { dens: 300, len: 24, lw: 2.4, a: 0.26 }); return pts; };
      ridge((x) => 560 - x * 0.04 + Math.sin(x * 0.006) * 24, '#b98fb0');
      ridge((x) => 650 - x * 0.1 + Math.sin(x * 0.008 + 1) * 20, '#8f6fa0');
      // the winding switchback trail up the big foreground slope
      const slope = SB.ridge(0, 1600, 30, (x) => 820 - x * 0.26 + Math.sin(x * 0.004) * 14, r, 3);
      P.land(ctx, r, slope, 960, '#7a9b5a', P.grassOpts({ dens: 120, sc: '#8fb268', grad: (c) => { const g = c.createLinearGradient(0, 500, 0, 960); g.addColorStop(0, 'rgba(255,220,160,0.28)'); g.addColorStop(1, 'rgba(60,50,30,0.22)'); c.fillStyle = g; c.fillRect(0, 400, 1600, 560); } }));
      G6.sy = (x) => SB.interpY(slope, x);
      // switchback dashed path
      ctx.save(); ctx.strokeStyle = 'rgba(120,90,60,0.4)'; ctx.lineWidth = 26; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.beginPath(); ctx.moveTo(120, 940); ctx.lineTo(520, 820); ctx.lineTo(260, 720); ctx.lineTo(760, 640); ctx.lineTo(560, 560); ctx.lineTo(1080, 500); ctx.lineTo(960, 440); ctx.lineTo(1420, 380); ctx.stroke();
      ctx.strokeStyle = 'rgba(220,195,150,0.5)'; ctx.lineWidth = 18; ctx.stroke();
      ctx.strokeStyle = 'rgba(150,110,70,0.3)'; ctx.setLineDash([2, 16]); ctx.lineWidth = 3; ctx.stroke(); ctx.setLineDash([]);
      ctx.restore();
      // pines along the trail
      P.pine(ctx, r, 220, 760, 300, '#2c6a45', { tiers: 5 }); P.pine(ctx, r, 700, 600, 260, '#2c6a45', { tiers: 5 }); P.pine(ctx, r, 1180, 470, 220, '#2c6a45', { tiers: 4 });
      P.bush(ctx, r, 420, 850, 130, 54, '#5f8a4a');
      // tiny flock of birds heading home
      ctx.save(); ctx.strokeStyle = 'rgba(80,60,80,0.6)'; ctx.lineWidth = 3; ctx.lineCap = 'round';
      for (const [bx, by] of [[380, 220], [430, 236], [470, 224], [520, 246]]) { ctx.beginPath(); ctx.moveTo(bx - 10, by); ctx.quadraticCurveTo(bx, by - 8, bx + 10, by); ctx.stroke(); }
      ctx.restore();
    },
    init(S) {
      S.walk = 0; S.prog = 0; // 0..1 along the trail
      S.lamb = { bleat: 0, pant: 0 };
      S.cl = { say: 0, bob: 0 };
      S.bear = { walk: 0, yawn: 0 };
      S.sq = { hop: 0, hv: 0, flick: 0 };
      S.fireflies = [];
      S.firefT = 0;
      S.sun = { happy: 1 };
    },
    update(S, dt) {
      const t = S.t;
      S.cl.bob = Math.sin(t * 2) * 6; S.cl.say = Math.max(0, S.cl.say - dt);
      S.lamb.bleat = Math.max(0, S.lamb.bleat - dt * 1.3); S.lamb.pant = Math.max(0, S.lamb.pant - dt);
      S.bear.yawn = Math.max(0, S.bear.yawn - dt * 0.6);
      S.sq.flick = Math.max(0, S.sq.flick - dt * 2); if (S.sq.hv || S.sq.hop > 0) { S.sq.hv -= 1500 * dt; S.sq.hop += S.sq.hv * dt; if (S.sq.hop <= 0) { S.sq.hop = 0; S.sq.hv = 0; } }
      // marching gait while "walking"
      S.walk = Math.max(0, S.walk - dt * 2);
      // fireflies appear as it dims
      S.firefT += dt; if (S.firefT > 0.5 && S.fireflies.length < 16) { S.firefT = 0; S.fireflies.push({ x: Math.random() * 1600, y: 500 + Math.random() * 400, ph: Math.random() * 6, a: 0 }); }
      for (const f of S.fireflies) { f.ph += dt * 2; f.x += Math.sin(f.ph) * 12 * dt; f.y += Math.cos(f.ph * 0.7) * 8 * dt; f.a = (Math.sin(f.ph) * 0.5 + 0.5); }
    },
    draw(ctx, S) {
      const t = S.t;
      // the little procession on the trail, climbing
      const walkB = S.walk > 0 ? Math.abs(Math.sin(t * 9)) : 0;
      // positions roughly along the painted switchback (foreground group)
      C.bear(ctx, { x: 980, y: G6.sy(980) + 60, s: 0.92, f: 1, t, walk: S.walk, yawn: S.bear.yawn });
      C.lamb(ctx, { x: 760, y: G6.sy(760) + 50, s: 1.0, f: 1, t, run: S.walk * 0.5, legPh: t * 8, bleat: S.lamb.bleat, look: [0.8, -0.3] });
      // cloud bobbing just above the lamb's back, being carried along
      C.cloud(ctx, { x: 700, y: G6.sy(700) - 40 + S.cl.bob, s: 0.6, t, mood: S.cl.say > 0 ? 'happy' : 'happy', float: 0.6, look: [0.5, 0] });
      C.squirrel(ctx, { x: 1140, y: G6.sy(1140) + 30 - S.sq.hop, s: 0.8, f: 1, t, flick: S.sq.flick });
      // fireflies glow
      for (const f of S.fireflies) { ctx.save(); ctx.globalAlpha = f.a * 0.9; const g = ctx.createRadialGradient(f.x, f.y, 0, f.x, f.y, 14); g.addColorStop(0, 'rgba(255,240,150,0.9)'); g.addColorStop(1, 'rgba(255,240,150,0)'); ctx.fillStyle = g; ctx.fillRect(f.x - 14, f.y - 14, 28, 28); SB.fillCirc(ctx, f.x, f.y, 2.2, '#fff3b0'); ctx.restore(); }
    },
    text: { x: 820, y: 760, size: 32, w: 620, align: 'left', col: '#4a3528', halo: 'rgba(255,245,225,0.95)', lines: [{ t: '猫头鹰说：“山顶上住着风婆婆，' }, { t: '只有她的大风，才能把你送回天上。”' }, { t: '于是，大家手拉手，一起往山上爬。' }] },
    hover(S, x, y) { return SB.hitEll(x, y, 760, G6.sy(760) - 50, 100, 90) || SB.hitEll(x, y, 700, G6.sy(700) - 40, 60, 45) || SB.hitEll(x, y, 980, G6.sy(980) - 90, 110, 130) || SB.hitCirc(x, y, 1140, G6.sy(1140), 44); },
    tap(S, x, y) {
      if (SB.hitEll(x, y, 760, G6.sy(760) - 50, 100, 90)) { S.lamb.bleat = 1; S.walk = 1.2; S.lamb.pant = 1; A.bleat(1.05); A.bell(); S.fx.say(820, G6.sy(760) - 150, '快到啦，加油！', { s: 24 }); S.tap('lamb'); return true; }
      if (SB.hitEll(x, y, 700, G6.sy(700) - 40, 60, 45)) { S.cl.say = 1.4; A.giggle(); S.fx.burst('spark', 700, G6.sy(700) - 80, 6, { speed: 120, cols: ['#ffe27a', '#fff'] }); S.fx.say(720, G6.sy(700) - 90, '就要到家啦！', { s: 22 }); S.tap('cloud'); return true; }
      if (SB.hitEll(x, y, 980, G6.sy(980) - 90, 110, 130)) { S.bear.yawn = 1; S.walk = 1; A.yawn(); S.fx.say(1060, G6.sy(980) - 230, '呼…有点累咯', { s: 22 }); S.tap('bear'); return true; }
      if (SB.hitCirc(x, y, 1140, G6.sy(1140), 44)) { S.sq.flick = 1.4; S.sq.hv = 460; A.squeak(); S.fx.say(1140, G6.sy(1140) - 70, '吱！这边走！', { s: 20 }); S.tap('sq'); return true; }
      return false;
    },
    hints(S) { return [[760, G6.sy(760) - 50, 'lamb'], [700, G6.sy(700) - 40, 'cloud'], [980, G6.sy(980) - 90, 'bear']]; },
  };

  /* ================= 7 · 山顶 · 风婆婆睡着了 ================= */
  const G7 = { gy: () => 820 };
  DEF[7] = {
    name: 'peak',
    bg(ctx, r) {
      // deep dusk → early night sky with first stars
      SB.tex(ctx, (c) => c.rect(0, 0, 1600, 700), '#5a6aa8', { r, box: [0, 0, 1600, 700], dens: 340, len: 44, lw: 3, a: 0.3, grad: (c) => { const g = c.createLinearGradient(0, 0, 0, 700); g.addColorStop(0, '#3b3f7a'); g.addColorStop(0.5, '#6a6fae'); g.addColorStop(1, '#c99bb0'); c.fillStyle = g; c.fillRect(0, 0, 1600, 700); } });
      for (let i = 0; i < 70; i++) { const x = r() * 1600, y = r() * 520; const s = 1 + r() * 2.4; ctx.fillStyle = `rgba(255,255,235,${0.4 + r() * 0.55})`; ctx.beginPath(); SB.star4(ctx, x, y, s, r() * 6, 0.3); ctx.fill(); }
      // the moon, low, not yet woken
      C.moon(ctx, { x: 250, y: 230, s: 0.9, t: 0 });
      // sea of clouds below the peak
      for (let i = 0; i < 6; i++) P.cloud(ctx, r, 100 + i * 300 + (i % 2) * 120, 640 + (i % 2) * 24, 300, 70, '#e9eef7', '#c3cce0');
      // the bald rocky summit
      const peak = SB.ridge(0, 1600, 30, (x) => 760 + Math.sin(x * 0.004 + 1) * 10 - Math.exp(-((x - 800) ** 2) / 90000) * 60, r, 3);
      P.land(ctx, r, peak, 960, '#8a86a0', { dens: 300, len: 22, lw: 2.4, a: 0.26, sc: '#9a96b0', grad: (c) => { const g = c.createLinearGradient(0, 700, 0, 960); g.addColorStop(0, 'rgba(255,230,210,0.2)'); g.addColorStop(1, 'rgba(30,30,60,0.3)'); c.fillStyle = g; c.fillRect(0, 700, 1600, 260); } });
      // scattered rocks + a few hardy grass tufts
      for (const [rx, ry, rs] of [[300, 870, 1], [1300, 900, 1.3], [1120, 850, 0.8]]) { ctx.save(); ctx.translate(rx, ry); ctx.scale(rs, rs); SB.body(ctx, (c) => c.ellipse(0, 0, 48, 28, 0, 0, TAU), '#7d7a94', { sb: [0, -28, 0, 28] }); ctx.restore(); }
      // signpost: 山顶
      ctx.save(); ctx.translate(1420, 820); ctx.fillStyle = '#6a5240'; ctx.fillRect(-5, -80, 10, 90); ctx.fillStyle = '#b98a5c'; ctx.beginPath(); SB.roundRect(ctx, -60, -92, 120, 34, 8); ctx.fill(); SB.outlineText(ctx, '山 顶', 0, -75, 22, '#fff', '#6a4a28', 4, 800, 'center'); ctx.restore();
    },
    init(S) {
      S.wind = { awake: 0, wakeT: 0, snore: 0, blink: 0, blow: 0 };
      S.lamb = { bleat: 0, tiptoe: 0 };
      S.cl = { say: 0, bob: 0 };
      S.bear = { yawn: 0 };
      S.taps = 0; S.z = 0;
    },
    update(S, dt) {
      const t = S.t, w = S.wind;
      S.cl.bob = Math.sin(t * 2) * 6; S.cl.say = Math.max(0, S.cl.say - dt);
      S.lamb.bleat = Math.max(0, S.lamb.bleat - dt * 1.3);
      S.bear.yawn = Math.max(0, S.bear.yawn - dt * 0.6);
      // Granny Wind is asleep (awake stays low) and snores; emits 'z's
      if (w.awake < 0.5) { S.z += dt; if (S.z > 1.1) { S.z = 0; w.snore = 1; A && A.musicOn; S.fx.add({ type: 'z', x: 870, y: 700, vx: 24, vy: -46, life: 2.4, s: 1.1, c: '#cfd6ef' }); } }
      w.snore = Math.max(0, w.snore - dt * 1.2);
      if (w.awake > 0) w.awake = Math.max(0, w.awake - dt * 0.3); // settles back to sleep unless fully woken on page 8
    },
    draw(ctx, S) {
      const t = S.t, w = S.wind;
      // Granny Wind, a big soft swirl-being, dozing on the summit
      C.wind(ctx, { x: 850, y: 640, s: 1.25, t, awake: w.awake, blow: 0, blink: w.awake > 0.5 ? undefined : 1 });
      // our friends gathered, tiptoeing up to her
      C.bear(ctx, { x: 1180, y: 880, s: 0.85, f: -1, t, yawn: S.bear.yawn });
      C.lamb(ctx, { x: 1030, y: 860, s: 0.92, f: -1, t, bleat: S.lamb.bleat, look: [-0.8, -0.2] });
      C.cloud(ctx, { x: 1110, y: 760 + S.cl.bob, s: 0.56, t, mood: 'wow', float: 0.6, look: [-0.6, 0] });
    },
    text: { x: 90, y: 128, size: 32, w: 560, col: '#f3ecff', halo: 'rgba(70,70,120,0.9)', lines: [{ t: '山顶上，风婆婆正呼呼大睡。' }, { t: '“呼……噜……”她睡得好香好香。' }, { t: '轻轻叫醒她，请她帮帮小云朵吧！' }] },
    hover(S, x, y) { return SB.hitEll(x, y, 850, 640, 150, 120) || SB.hitEll(x, y, 1030, 790, 90, 80) || SB.hitEll(x, y, 1110, 760, 60, 45); },
    tap(S, x, y) {
      const w = S.wind;
      if (SB.hitEll(x, y, 850, 640, 150, 120)) {
        S.taps++; w.awake = Math.min(1, w.awake + 0.4); w.wakeT = S.t;
        A.wind(0.8, 0.6);
        if (w.awake >= 0.9) { S.fx.say(900, 540, '唔……谁呀？\n到我家门口啦？', { s: 26, life: 2.6 }); A.yawn(); S.fx.burst('gust', 850, 620, 2, { speed: 60, cols: ['rgba(236,244,252,0.9)'], life: 1 }); }
        else { S.fx.say(900, 540, '呼……噜……', { s: 24, c: '#cfd6ef', life: 1.6 }); }
        S.tap('wind'); return true;
      }
      if (SB.hitEll(x, y, 1030, 790, 90, 80)) { S.lamb.bleat = 1; A.bleat(0.9); A.bell(); S.fx.say(1090, 710, '风婆婆，醒醒～', { s: 22 }); S.tap('lamb'); return true; }
      if (SB.hitEll(x, y, 1110, 760, 60, 45)) { S.cl.say = 1.2; A.sniff(); S.fx.say(1130, 700, '拜托您啦…', { s: 22 }); S.tap('cloud'); return true; }
      return false;
    },
    hints(S) { return [[850, 620, 'wind'], [1030, 790, 'lamb']]; },
  };

  /* ================= 8 · 一起吹！ (everyone blows, the wind rises) ================= */
  const G8 = {};
  DEF[8] = {
    name: 'blow',
    bg(ctx, r) {
      SB.tex(ctx, (c) => c.rect(0, 0, 1600, 700), '#53639e', { r, box: [0, 0, 1600, 700], dens: 340, len: 44, lw: 3, a: 0.3, grad: (c) => { const g = c.createLinearGradient(0, 0, 0, 700); g.addColorStop(0, '#39407e'); g.addColorStop(0.5, '#5f6aa8'); g.addColorStop(1, '#d0a4b4'); c.fillStyle = g; c.fillRect(0, 0, 1600, 700); } });
      for (let i = 0; i < 80; i++) { const x = r() * 1600, y = r() * 540; const s = 1 + r() * 2.6; ctx.fillStyle = `rgba(255,255,235,${0.4 + r() * 0.55})`; ctx.beginPath(); SB.star4(ctx, x, y, s, r() * 6, 0.3); ctx.fill(); }
      C.moon(ctx, { x: 300, y: 210, s: 0.95, t: 0 });
      for (let i = 0; i < 6; i++) P.cloud(ctx, r, 80 + i * 300 + (i % 2) * 110, 650 + (i % 2) * 22, 300, 70, '#e9eef7', '#c3cce0');
      const peak = SB.ridge(0, 1600, 30, (x) => 770 + Math.sin(x * 0.004 + 1) * 10 - Math.exp(-((x - 760) ** 2) / 110000) * 55, r, 3);
      P.land(ctx, r, peak, 960, '#8a86a0', { dens: 300, len: 22, lw: 2.4, a: 0.26, sc: '#9a96b0', grad: (c) => { const g = c.createLinearGradient(0, 700, 0, 960); g.addColorStop(0, 'rgba(255,230,210,0.2)'); g.addColorStop(1, 'rgba(30,30,60,0.3)'); c.fillStyle = g; c.fillRect(0, 700, 1600, 260); } });
      for (const [rx, ry, rs] of [[1360, 900, 1.2], [220, 890, 1]]) { ctx.save(); ctx.translate(rx, ry); ctx.scale(rs, rs); SB.body(ctx, (c) => c.ellipse(0, 0, 46, 26, 0, 0, TAU), '#7d7a94', { sb: [0, -26, 0, 26] }); ctx.restore(); }
    },
    init(S) {
      S.power = 0; // 0..1 total blow effort, rises as children tap each helper
      S.wind = { awake: 1, blow: 0 };
      S.lamb = { blow: 0, bleat: 0 };
      S.bear = { blow: 0 };
      S.sq = { flick: 0 };
      S.cl = { y: 700, bob: 0, lift: 0, mood: 'happy', say: 0 };
      S.gusts = 0; S.ready = 0; S.launched = 0;
    },
    enter(S) { S.power = 0; S.cl.lift = 0; S.cl.y = 700; S.launched = 0; },
    update(S, dt) {
      const t = S.t;
      // power decays slowly; children keep tapping to build it up
      S.power = Math.max(0, S.power - dt * 0.18);
      S.wind.blow = SB.clamp(S.power, 0, 1); S.lamb.blow = SB.clamp(S.power * 1.1, 0, 1); S.bear.blow = SB.clamp(S.power, 0, 1);
      S.lamb.bleat = Math.max(0, S.lamb.bleat - dt * 1.3); S.sq.flick = Math.max(0, S.sq.flick - dt * 2);
      S.cl.say = Math.max(0, S.cl.say - dt); S.cl.bob = Math.sin(t * 3) * 4 * (1 - S.cl.lift);
      // the cloud lifts in proportion to sustained power
      const targetLift = SB.ease.out(S.power);
      S.cl.lift += (targetLift - S.cl.lift) * Math.min(1, dt * 2.5);
      S.cl.y = 700 - S.cl.lift * 140;
      // emit gust streaks while blowing
      S.gusts += dt;
      if (S.power > 0.25 && S.gusts > 0.12) {
        S.gusts = 0;
        S.fx.add({ type: 'gust', x: 300 + Math.random() * 500, y: 560 + Math.random() * 220, rot: -0.2 + Math.random() * 0.2, life: 0.9, s: 0.6 + S.power * 0.8, a: 0.6, c: 'rgba(224,238,252,0.85)' });
      }
      // ready to launch when power is high
      if (S.power > 0.82 && !S.ready) { S.ready = 1; S.cl.say = 2.2; S.fx.say(S.cl.x || 800, 560, '哇！我飞起来啦！', { s: 30, life: 2.2 }); A.sparkle(8, 4); }
      if (S.power <= 0.4) S.ready = 0;
    },
    draw(ctx, S) {
      const t = S.t;
      // Granny Wind, awake, puffing a great gust toward the cloud
      C.wind(ctx, { x: 300, y: 650, s: 1.2, t, awake: 1, blow: S.wind.blow });
      // helpers lined up on the right, all blowing
      C.bear(ctx, { x: 1300, y: 900, s: 0.82, f: -1, t, blow: S.bear.blow });
      C.lamb(ctx, { x: 1130, y: 880, s: 0.9, f: -1, t, bleat: S.lamb.bleat, headRot: -S.lamb.blow * 0.2, look: [-0.8, 0] });
      C.squirrel(ctx, { x: 1420, y: 820, s: 0.7, f: -1, t, flick: S.sq.flick });
      // power meter: little puffed cheeks / a rising arc of light under the cloud
      // the cloud, rising
      const cx = 760; S.cl.x = cx;
      ctx.save();
      if (S.cl.lift > 0.02) { const g = ctx.createRadialGradient(cx, S.cl.y + 40, 10, cx, S.cl.y + 40, 120); g.addColorStop(0, `rgba(224,238,252,${0.5 * S.cl.lift})`); g.addColorStop(1, 'rgba(224,238,252,0)'); ctx.fillStyle = g; ctx.fillRect(cx - 120, S.cl.y - 80, 240, 240); }
      ctx.restore();
      C.cloud(ctx, { x: cx, y: S.cl.y + S.cl.bob, s: 0.85 + S.cl.lift * 0.05, t, mood: S.cl.lift > 0.3 ? 'joy' : 'happy', float: 0.3, armsUp: S.cl.lift, wave: S.cl.lift > 0.4 ? 1 : 0, look: [0, -0.3] });
      // a progress hint arc at the bottom
      ctx.save(); ctx.translate(800, 936); ctx.globalAlpha = 0.9;
      ctx.strokeStyle = 'rgba(255,255,255,0.3)'; ctx.lineWidth = 10; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(0, 0, 120, Math.PI, TAU); ctx.stroke();
      ctx.strokeStyle = '#ffe27a'; ctx.beginPath(); ctx.arc(0, 0, 120, Math.PI, Math.PI + Math.PI * SB.clamp(S.power, 0, 1)); ctx.stroke();
      ctx.restore();
    },
    drawTop(ctx, S) {
      if (S.power < 0.82) { ctx.save(); ctx.globalAlpha = 0.85 * (0.6 + 0.4 * Math.sin(S.t * 4)); SB.outlineText(ctx, '一起用力吹！点点大家 →', 800, 894, 26, '#fff', 'rgba(60,70,120,0.8)', 7, 800, 'center'); ctx.restore(); }
    },
    text: { x: 90, y: 128, size: 32, w: 540, col: '#f3ecff', halo: 'rgba(60,70,120,0.9)', lines: [{ t: '“呼——”风婆婆鼓起腮帮，用力地吹。' }, { t: '棉棉、大熊、小松鼠也一起吹呀吹。' }, { t: '呼呼呼！小云朵，慢慢地飞了起来！' }] },
    hover(S, x, y) { return SB.hitEll(x, y, 300, 650, 150, 120) || SB.hitEll(x, y, 1130, 810, 90, 80) || SB.hitEll(x, y, 1300, 760, 110, 130) || SB.hitCirc(x, y, 1420, 790, 44) || SB.hitEll(x, y, 760, S.cl.y, 90, 60); },
    tap(S, x, y) {
      const bump = (k) => { S.power = SB.clamp(S.power + k, 0, 1); };
      if (SB.hitEll(x, y, 300, 650, 150, 120)) { bump(0.26); S.wind.blow = 1; A.wind(1, 1 + S.power); S.fx.burst('gust', 420, 640, 2, { speed: 70, cols: ['rgba(236,244,252,0.9)'], life: 1, s: 1 }); S.tap('wind'); return true; }
      if (SB.hitEll(x, y, 1130, 810, 90, 80)) { bump(0.2); S.lamb.bleat = 1; A.bleat(1.1); A.bell(); S.fx.add({ type: 'gust', x: 1060, y: 820, rot: Math.PI + 0.1, life: 0.8, s: 0.7, a: 0.6, c: 'rgba(224,238,252,0.85)' }); S.tap('lamb'); return true; }
      if (SB.hitEll(x, y, 1300, 760, 110, 130)) { bump(0.22); S.bear.blow = 1; A.grr(); S.fx.add({ type: 'gust', x: 1210, y: 790, rot: Math.PI + 0.1, life: 0.8, s: 1, a: 0.6, c: 'rgba(224,238,252,0.85)' }); S.tap('bear'); return true; }
      if (SB.hitCirc(x, y, 1420, 790, 44)) { bump(0.16); S.sq.flick = 1.2; A.squeak(); S.tap('sq'); return true; }
      if (SB.hitEll(x, y, 760, S.cl.y, 90, 60)) { S.cl.say = 1.4; A.giggle(); S.fx.burst('heart', 760, S.cl.y - 60, 5, { speed: 110, up: 70, cols: ['#f58fa6', '#ffd1dd'], life: 1.1 }); S.fx.say(780, S.cl.y - 70, '谢谢大家！', { s: 24 }); S.tap('cloud'); return true; }
      return false;
    },
    hints(S) { return [[300, 640, 'wind'], [1130, 810, 'lamb'], [1300, 760, 'bear']]; },
  };
})();
