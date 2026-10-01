/* scenes B: spread 3 (the plan / meadow path), 4 (the pond), 5 (the forest) */
(function () {
  'use strict';
  const SB = window.SB, P = SB.P, C = SB.C, A = SB.A;
  const DEF = SB.DEF;
  const TAU = Math.PI * 2;

  /* ================= 3 · 下定决心 (meadow path, meet the duck) ================= */
  const G3 = { gy: (x) => 806 + Math.sin(x * 0.0035 + 1.2) * 14 };
  DEF[3] = {
    name: 'plan',
    bg(ctx, r) {
      P.sky(ctx, r, '#7fb0e4');
      P.paperTop(ctx, r);
      P.streak(ctx, 360, 420, 300, 11, -0.05); P.streak(ctx, 1180, 380, 240, 9, -0.07);
      P.cloud(ctx, r, 300, 230, 230, 72); P.cloud(ctx, r, 1300, 300, 200, 64);
      const m = SB.meadow(ctx, r, { forest: false, pal: { far: '#9ec0b6', mid: '#a4d079', front: '#7cbb57', frontS: '#93cf69' } });
      G3.midY = m.midY;
      // a winding dirt path leading off to the right (where the journey will go)
      ctx.save();
      const path = (c) => {
        c.moveTo(380, 960); c.bezierCurveTo(460, 870, 760, 850, 900, 806);
        c.bezierCurveTo(1120, 742, 1360, 760, 1600, 700);
        c.lineTo(1600, 760); c.bezierCurveTo(1360, 820, 1150, 802, 940, 866);
        c.bezierCurveTo(780, 910, 540, 930, 470, 960); c.closePath();
      };
      SB.tex(ctx, path, '#d8b784', { r, box: [360, 690, 1240, 270], dens: 420, len: 14, lw: 1.8, a: 0.3, sc: '#c7a271', speck: { n: 220, c: ['#b89468', '#e4c59a', '#a9855c'], s: 1.6, a: 0.6 } });
      ctx.strokeStyle = 'rgba(150,110,70,0.25)'; ctx.lineWidth = 2; ctx.setLineDash([3, 14]); ctx.lineCap = 'round';
      ctx.beginPath(); c2(ctx); ctx.stroke(); ctx.setLineDash([]);
      function c2(c) { c.moveTo(430, 920); c.bezierCurveTo(620, 860, 860, 848, 1000, 800); c.bezierCurveTo(1240, 724, 1420, 752, 1600, 712); }
      ctx.restore();
      SB.roundTree(ctx, r, 150, 760, 280, '#5f9e4c');
      SB.roundTree(ctx, r, 1500, 560, 140, '#6aa954');
      P.bush(ctx, r, 1420, 900, 170, 66, '#5a954a');
      // signpost pointing onward
      ctx.save(); ctx.translate(1150, 740);
      ctx.fillStyle = '#8a5a3a'; ctx.fillRect(-5, -70, 10, 90);
      ctx.fillStyle = '#c98a4a'; ctx.beginPath(); ctx.moveTo(8, -66); ctx.lineTo(78, -66); ctx.lineTo(96, -52); ctx.lineTo(78, -38); ctx.lineTo(8, -38); ctx.closePath(); ctx.fill();
      SB.outlineText(ctx, '天 空', 44, -52, 20, '#fff', '#7a4a28', 4, 800, 'center');
      ctx.restore();
    },
    init(S) {
      S.lamb = { x: 560, f: 1, run: 0, ph: 0, bleat: 0, nod: 0 };
      S.cl = { x: 700, y: 690, bob: 0, mood: 'sad', hop: 0, hv: 0, say: 0 };
      S.duck = { x: 1240, y: 812, f: -1, quack: 0, flap: 0, waddle: 0, ph: 0, point: 0, seen: 0 };
      S.bulb = 0; S.flowers = [[460, 880, '#f59ab0'], [980, 816, '#f7d24a'], [1420, 760, '#b8a0f2']].map(([x, y, c], i) => ({ x, y, c, open: 0 }));
    },
    enter(S) { S.duck.seen = 0; },
    update(S, dt) {
      const L = S.lamb, cl = S.cl, d = S.duck;
      L.bleat = Math.max(0, L.bleat - dt * 1.3); L.nod = Math.max(0, L.nod - dt * 2);
      cl.say = Math.max(0, cl.say - dt); cl.bob = Math.sin(S.t * 2) * 6;
      if (cl.hv || cl.hop > 0) { cl.hv -= 1400 * dt; cl.hop += cl.hv * dt; if (cl.hop <= 0) { cl.hop = 0; cl.hv = 0; } }
      d.quack = Math.max(0, d.quack - dt * 1.6); d.flap = Math.max(0, d.flap - dt * 2); d.point = Math.max(0, d.point - dt * 0.7); d.ph += dt;
      if (S.bulb > 0) S.bulb = Math.max(0, S.bulb - dt * 0.5);
      for (const f of S.flowers) f.open = Math.min(1, f.open + (f.tg ? dt * 5 : 0));
      // first time we settle, the duck notices
      if (!d.seen && S.t > 1.4) { d.seen = 1; d.quack = 1; A.quack(1, 1); S.fx.say(d.x - 10, d.y - 70, '嘎！你好呀！', { s: 26, side: -1 }); }
    },
    draw(ctx, S) {
      const t = S.t, L = S.lamb, cl = S.cl, d = S.duck;
      for (const f of S.flowers) drawFlower(ctx, f, t);
      // small thought bulb above cloud/lamb when idea strikes
      C.cloud(ctx, { x: cl.x, y: cl.y - cl.hop, s: 0.82, t, mood: cl.say > 0 ? 'wow' : cl.mood, float: 0.5, shadowY: G3.gy(cl.x) - cl.y + cl.hop + 24, shadowK: 0.8, look: [0.5, 0] });
      C.lamb(ctx, { x: L.x, y: G3.gy(L.x), s: 1.0, f: L.f, t, run: L.run, legPh: L.ph, bleat: L.bleat, headRot: -L.nod * 0.3, look: [0.7, 0] });
      // duck
      C.duck(ctx, { x: d.x, y: d.y, s: 1.15, f: d.f, t, quack: d.quack, flap: d.flap, seed: 2 });
      if (d.point > 0) { // duck points a wing up toward the sky
        ctx.save(); ctx.globalAlpha = SB.clamp(d.point, 0, 1);
        SB.outlineText(ctx, '↑', d.x - 36, d.y - 96, 46, '#e8774e', '#fff', 7, 900, 'center');
        ctx.restore();
      }
      if (S.bulb > 0) { // lightbulb idea
        ctx.save(); ctx.globalAlpha = Math.sin(Math.min(1, S.bulb * 2) * Math.PI) * 0.5 + 0.5;
        const bx = cl.x, by = cl.y - 150 - cl.hop;
        const g = ctx.createRadialGradient(bx, by, 2, bx, by, 40); g.addColorStop(0, 'rgba(255,240,150,0.9)'); g.addColorStop(1, 'rgba(255,240,150,0)');
        ctx.fillStyle = g; ctx.fillRect(bx - 40, by - 40, 80, 80);
        SB.outlineText(ctx, '💡', bx, by, 40, '#f6c84a', null, 0, 700, 'center');
        ctx.restore();
      }
    },
    text: { x: 90, y: 128, size: 34, w: 600, lines: [{ t: '“别哭，小云朵！我帮你回家。”棉棉说。' }, { t: '可是，天空那么高，要怎么上去呢？' }, { t: '“嘎——我知道！”池塘边的鸭子大声说。' }] },
    hover(S, x, y) { const L = S.lamb, cl = S.cl, d = S.duck; return SB.hitEll(x, y, L.x + 20, G3.gy(L.x) - 90, 100, 90) || SB.hitEll(x, y, cl.x, cl.y - cl.hop, 80, 55) || SB.hitEll(x, y, d.x, d.y - 30, 70, 60) || S.flowers.some((f) => SB.hitCirc(x, y, f.x, f.y - 50, 32)); },
    tap(S, x, y) {
      const L = S.lamb, cl = S.cl, d = S.duck;
      if (SB.hitEll(x, y, L.x + 20, G3.gy(L.x) - 90, 100, 90)) { L.bleat = 1; L.nod = 1; A.bleat(1.05); A.bell(); S.fx.say(L.x + 70, G3.gy(L.x) - 170, '交给我吧！', { s: 26 }); S.tap('lamb'); return true; }
      if (SB.hitEll(x, y, cl.x, cl.y - cl.hop, 80, 55)) { cl.say = 1.4; cl.hv = 420; S.bulb = 1.6; A.giggle(); S.fx.burst('heart', cl.x, cl.y - 70, 5, { speed: 110, up: 70, cols: ['#f58fa6', '#ffd1dd'], life: 1.1 }); S.fx.say(cl.x + 20, cl.y - 70, '谢谢你！', { s: 26 }); S.tap('cloud'); return true; }
      if (SB.hitEll(x, y, d.x, d.y - 30, 70, 60)) { d.quack = 1; d.flap = 1; d.point = 1.6; A.quack(1, 2); S.fx.say(d.x - 20, d.y - 90, '跟我去池塘！', { s: 26, side: -1 }); S.fx.burst('note', d.x, d.y - 40, 3, { speed: 60, up: 50, cols: ['#5d95d6'], life: 1.2, glyph: '♪' }); S.tap('duck'); return true; }
      for (const f of S.flowers) if (SB.hitCirc(x, y, f.x, f.y - 50, 32)) { f.tg = 1; A.pop(1.1); A.note(5, 0.5, 0.08); S.fx.burst('petal', f.x, f.y - 50, 7, { speed: 140, up: 50, g: 120, cols: [f.c, '#fff'], life: 1.2 }); S.tap('flower'); return true; }
      return false;
    },
    hints(S) { return [[S.duck.x, S.duck.y - 30, 'duck'], [S.cl.x, S.cl.y - 40, 'cloud'], [S.lamb.x + 20, G3.gy(S.lamb.x) - 100, 'lamb']]; },
  };

  /* ================= 4 · 池塘 (the pond — duck's idea fails) ================= */
  const G4 = { water: 640 };
  DEF[4] = {
    name: 'pond',
    bg(ctx, r) {
      P.sky(ctx, r, '#8bbbe8', { h: 640 });
      P.paperTop(ctx, r);
      P.cloud(ctx, r, 420, 210, 240, 74); P.cloud(ctx, r, 1240, 170, 200, 60);
      // far reeds / bank
      const bank = SB.ridge(0, 1600, 40, (x) => 600 + Math.sin(x * 0.004) * 20, r, 4);
      P.land(ctx, r, bank, 700, '#8cc06a', P.grassOpts({ dens: 200 }));
      // water
      const wtop = SB.ridge(0, 1600, 30, (x) => G4.water + Math.sin(x * 0.01) * 6, r, 2);
      const wpath = (c) => { SB.smooth(c, wtop, false); c.lineTo(1600, 960); c.lineTo(0, 960); c.closePath(); };
      P.water(ctx, r, wpath, [0, G4.water, 1600, 320], '#4bb6cc', { sc: '#67c9d6', shadow: 'rgba(30,80,100,0.2)', waveDens: 3400 });
      // sky reflection shimmer
      ctx.save(); ctx.beginPath(); wpath(ctx); ctx.clip();
      ctx.globalAlpha = 0.18; ctx.fillStyle = '#fff';
      for (let i = 0; i < 5; i++) P.streak(ctx, 300 + i * 300, 720 + i * 30, 220, 7, 0.02, 0.5);
      ctx.restore();
      // lily pads
      for (const [px, py, s] of [[300, 760, 1], [540, 850, 1.3], [1120, 800, 1.1], [1380, 880, 1.2], [860, 900, 1.4]]) {
        ctx.save(); ctx.translate(px, py); ctx.scale(s, s);
        SB.fillEll(ctx, 0, 4, 46, 16, 'rgba(20,80,70,0.25)');
        SB.body(ctx, (c) => { c.moveTo(0, 0); c.arc(0, 0, 42, 0.35, TAU - 0.35); c.closePath(); }, '#4f9a52', { sb: [0, -20, 0, 20] });
        SB.fillCirc(ctx, 6, -6, 18, 'rgba(255,255,255,0.12)');
        if (s > 1.25) { SB.body(ctx, (c) => { for (let k = 0; k < 6; k++) { const a = k / 6 * TAU; c.moveTo(0, -14); c.ellipse(Math.cos(a) * 10, -14 + Math.sin(a) * 10, 9, 5, a, 0, TAU); } }, '#f6b6d0', {}); SB.fillCirc(ctx, 0, -14, 6, '#f7d24a'); }
        ctx.restore();
      }
      P.bush(ctx, r, 90, 700, 150, 70, '#5a954a');
      // cat-tail reeds
      ctx.save(); ctx.strokeStyle = '#4c8a3a'; ctx.lineWidth = 5; ctx.lineCap = 'round';
      for (const rx of [120, 160, 1500, 1540, 1470]) { ctx.beginPath(); ctx.moveTo(rx, 700); ctx.quadraticCurveTo(rx + 8, 560, rx + 4, 470); ctx.stroke(); ctx.fillStyle = '#8a5a32'; ctx.beginPath(); SB.roundRect(ctx, rx - 2, 440, 12, 48, 6); ctx.fill(); }
      ctx.restore();
    },
    init(S) {
      S.cl = { x: 820, y: 500, mood: 'sad', bob: 0, dunk: 0, wet: 0, say: 0, tryT: 0, phase: 0 };
      S.lamb = { x: 300, y: 600, f: 1, bleat: 0, worry: 0 };
      S.duck = { x: 760, y: 640, f: 1, quack: 0, flap: 0, dive: 0, seed: 1, swim: 0 };
      S.ducklings = [0, 1, 2].map((i) => ({ i, x: 620 + i * 50, y: 660 + (i % 2) * 12, ph: i * 1.3, quack: 0 }));
      S.fish = [{ x: 1150, y: 780, a: 0, flip: 0 }, { x: 1300, y: 840, a: 2, flip: 0 }];
      S.frog = { x: 480, y: 806, croak: 0, hop: 0, hv: 0 };
      S.ripples = [];
    },
    update(S, dt) {
      const cl = S.cl, d = S.duck;
      cl.bob = Math.sin(S.t * 2) * 7; cl.say = Math.max(0, cl.say - dt);
      cl.wet = Math.max(0, cl.wet - dt * 0.4);
      // the "try to float up by diving" gag runs on tap: phase 1 duck dunks cloud, it only sinks & bobs back heavier
      if (cl.phase === 1) {
        cl.tryT += dt;
        cl.dunk = Math.sin(SB.clamp(cl.tryT * 2.2, 0, Math.PI)) * 90;
        if (cl.tryT > 1.5) { cl.phase = 2; cl.tryT = 0; cl.wet = 1; A.splash(1.1); S.ripples.push({ x: cl.x, y: G4.water + 20, t: 0 }); S.fx.pop(cl.x, cl.y - 120, '噗噜噜…', { s: 40, c: '#4bb6cc' }); S.fx.burst('drop', cl.x, G4.water, 16, { speed: 240, up: 180, g: 700, cols: ['#8ccff0', '#fff'], life: 0.9 }); S.lamb.worry = 2; }
      } else cl.dunk *= Math.pow(0.02, dt);
      if (cl.phase === 2) { cl.tryT += dt; if (cl.tryT > 1.2 && cl.say <= 0) { cl.say = 2.4; S.fx.say(cl.x + 20, cl.y - 70, '呼……云朵\n太重啦，沉下去了', { s: 28, life: 2.6 }); cl.phase = 3; } }
      S.lamb.worry = Math.max(0, S.lamb.worry - dt); S.lamb.bleat = Math.max(0, S.lamb.bleat - dt * 1.3);
      d.quack = Math.max(0, d.quack - dt * 1.6); d.flap = Math.max(0, d.flap - dt * 2);
      d.dive = cl.phase === 1 ? 0.4 : Math.max(0, d.dive - dt * 2);
      for (const b of S.ducklings) { b.ph += dt * 2; b.quack = Math.max(0, b.quack - dt * 2); }
      for (const f of S.fish) { f.a += dt * 0.7; f.flip = Math.max(0, f.flip - dt * 2); f.x = (f.x + dt * 18 * (f.flip ? 4 : 1)); if (f.x > 1600) f.x = -40; }
      const fr = S.frog; fr.croak = Math.max(0, fr.croak - dt * 1.5); if (fr.hv || fr.hop > 0) { fr.hv -= 1400 * dt; fr.hop += fr.hv * dt; if (fr.hop <= 0) { fr.hop = 0; fr.hv = 0; } }
      for (const rp of S.ripples) rp.t += dt; S.ripples = S.ripples.filter((rp) => rp.t < 1.4);
    },
    draw(ctx, S) {
      const t = S.t, cl = S.cl, d = S.duck;
      // ripples on water
      for (const rp of S.ripples) { const k = rp.t / 1.4; ctx.save(); ctx.globalAlpha = (1 - k) * 0.6; ctx.strokeStyle = '#fff'; ctx.lineWidth = 2; ctx.beginPath(); ctx.ellipse(rp.x, rp.y, 10 + k * 90, (10 + k * 90) * 0.3, 0, 0, TAU); ctx.stroke(); ctx.restore(); }
      // fish under the surface
      for (const f of S.fish) { ctx.save(); ctx.globalAlpha = 0.75; C.fish(ctx, { x: f.x, y: f.y, s: 1, t, rot: Math.sin(f.a) * 0.2 }); ctx.restore(); }
      // frog on a pad
      C.frog(ctx, { x: S.frog.x, y: S.frog.y - S.frog.hop, s: 1.1, t, croak: S.frog.croak });
      // ducklings
      for (const b of S.ducklings) { const yy = b.y + Math.sin(b.ph) * 3; C.duck(ctx, { x: b.x, y: yy, s: 0.5, baby: true, t, seed: b.ph, quack: b.quack, water: '#4bb6cc' }); }
      // mama duck
      C.duck(ctx, { x: d.x, y: d.y, s: 1.15, f: d.f, t, quack: d.quack, flap: d.flap, dive: d.dive, seed: 1, water: '#4bb6cc' });
      // the cloud, bobbing / being dunked
      C.cloud(ctx, { x: cl.x, y: cl.y + cl.bob + cl.dunk, s: 0.85, t, mood: cl.phase >= 2 ? 'sad' : cl.say > 0 ? 'wow' : 'sad', float: 0.5, look: [0, 0.3], noTears: cl.phase < 2 });
      if (cl.wet > 0.1) { // drips off a wet cloud
        for (let i = 0; i < 3; i++) if (Math.random() < 0.3) S.fx.add({ type: 'drop', x: cl.x + (Math.random() - 0.5) * 120, y: cl.y + 40, vy: 120, g: 400, life: 0.6, c: '#8ccff0' });
      }
      // lamb watching from the bank, worried
      C.lamb(ctx, { x: S.lamb.x, y: S.lamb.y, s: 0.95, f: 1, t, bleat: S.lamb.bleat, headRot: S.lamb.worry > 0 ? Math.sin(t * 6) * 0.12 : 0, look: [0.8, -0.2] });
    },
    text: { x: 980, y: 128, size: 32, w: 560, align: 'left', lines: [{ t: '“跳进水里，就能漂上天啦！”鸭子说。' }, { t: '可是——噗噜噜！云朵喝饱了水，' }, { t: '变得好重好重，一下子沉到了水底。' }] },
    hover(S, x, y) { const cl = S.cl, d = S.duck; return SB.hitEll(x, y, cl.x, cl.y + cl.bob + cl.dunk, 85, 55) || SB.hitEll(x, y, d.x, d.y - 30, 70, 55) || SB.hitEll(x, y, S.lamb.x, S.lamb.y - 70, 90, 80) || SB.hitCirc(x, y, S.frog.x, S.frog.y - 10, 40) || S.ducklings.some((b) => SB.hitCirc(x, y, b.x, b.y, 30)) || S.fish.some((f) => SB.hitCirc(x, y, f.x, f.y, 34)); },
    tap(S, x, y) {
      const cl = S.cl, d = S.duck;
      if (SB.hitEll(x, y, cl.x, cl.y + cl.bob + cl.dunk, 85, 55)) {
        if (cl.phase === 0) { cl.phase = 1; cl.tryT = 0; d.dive = 0.4; d.quack = 1; A.quack(1, 1); A.splash(0.8); S.ripples.push({ x: cl.x, y: G4.water + 10, t: 0 }); S.tap('cloud'); S.tap('try'); return true; }
        cl.say = 2; A.sniff(); S.fx.say(cl.x + 20, cl.y - 70, '这个办法\n不行啦……', { s: 28, life: 2.2 }); return true;
      }
      if (SB.hitEll(x, y, d.x, d.y - 30, 70, 55)) { d.quack = 1; d.flap = 1; A.quack(1, 2); S.fx.say(d.x + 20, d.y - 90, '嘎嘎！试试看嘛！', { s: 24 }); S.tap('duck'); return true; }
      if (SB.hitEll(x, y, S.lamb.x, S.lamb.y - 70, 90, 80)) { S.lamb.bleat = 1; A.bleat(1.1); A.bell(); S.fx.say(S.lamb.x + 60, S.lamb.y - 140, '小心呀！', { s: 24 }); S.tap('lamb'); return true; }
      if (SB.hitCirc(x, y, S.frog.x, S.frog.y - 10, 40)) { S.frog.croak = 1; S.frog.hv = 420; A.croak(); S.fx.say(S.frog.x + 10, S.frog.y - 70, '呱！', { s: 24 }); S.tap('frog'); return true; }
      for (const b of S.ducklings) if (SB.hitCirc(x, y, b.x, b.y, 30)) {
        b.quack = 1; A.quack(1.6, 1); S.tap('baby');
        const n = b.i + 1; // 1,2,3
        S.fx.pop(b.x, b.y - 40, String(n), { s: 46, c: '#e8774e', life: 1.1 });
        A.note(b.i + 3, 0.5, 0.1);
        S.counted = S.counted || new Set(); S.counted.add(n);
        if (S.counted.size === 3 && !S.countedAll) { S.countedAll = 1; setTimeout(() => { S.duck.quack = 1; A.quack(1, 2); S.fx.say(S.duck.x + 20, S.duck.y - 90, '一、二、三，\n一共三只小鸭子！', { s: 24, life: 2.8 }); }, 500); }
        return true;
      }
      for (const f of S.fish) if (SB.hitCirc(x, y, f.x, f.y, 34)) { f.flip = 1; A.pop(1.4); A.splash(0.5); S.ripples.push({ x: f.x, y: G4.water + 8, t: 0 }); S.fx.burst('drop', f.x, f.y - 10, 6, { speed: 130, up: 90, g: 500, cols: ['#8ccff0'], life: 0.6 }); S.tap('fish'); return true; }
      return false;
    },
    hints(S) { return [[S.cl.x, S.cl.y, 'cloud'], [S.frog.x, S.frog.y - 10, 'frog'], [S.ducklings[1].x, S.ducklings[1].y, 'baby']]; },
  };

  /* ================= 5 · 森林 (the forest — bear's idea) ================= */
  const G5 = { gy: (x) => 854 + Math.sin(x * 0.004 + 2) * 10 };
  DEF[5] = {
    name: 'forest',
    bg(ctx, r) {
      // dappled forest light
      SB.tex(ctx, (c) => c.rect(0, 0, 1600, 960), '#bfe3b0', { r, box: [0, 0, 1600, 700], dens: 500, len: 36, lw: 2.6, a: 0.22, grad: (c) => { const g = c.createLinearGradient(0, 0, 0, 700); g.addColorStop(0, 'rgba(255,250,210,0.5)'); g.addColorStop(1, 'rgba(120,170,110,0.3)'); c.fillStyle = g; c.fillRect(0, 0, 1600, 700); } });
      // light shafts
      ctx.save(); ctx.globalCompositeOperation = 'lighter';
      for (const [sx, w] of [[300, 90], [760, 130], [1200, 100]]) { const g = ctx.createLinearGradient(sx, 0, sx + 160, 700); g.addColorStop(0, 'rgba(255,250,200,0.4)'); g.addColorStop(1, 'rgba(255,250,200,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(sx, 0); ctx.lineTo(sx + w, 0); ctx.lineTo(sx + w + 160, 700); ctx.lineTo(sx + 160, 700); ctx.closePath(); ctx.fill(); }
      ctx.restore();
      // forest floor
      const floor = SB.ridge(0, 1600, 40, (x) => 760 + Math.sin(x * 0.004 + 1) * 18, r, 4);
      P.land(ctx, r, floor, 960, '#6cac55', P.grassOpts({ dens: 150, sc: '#7bbb55' }));
      // big trees framing left & right
      P.pine(ctx, r, 150, 820, 620, '#2c6a45', { tiers: 6 });
      P.pine(ctx, r, 1480, 870, 680, '#2f7049', { tiers: 7 });
      SB.roundTree(ctx, r, 420, 790, 300, '#4f8a3e');
      SB.roundTree(ctx, r, 1240, 760, 260, '#58924a');
      // mushrooms, logs, ferns
      for (const [mx, my, s, cc] of [[560, 880, 1, '#e46a5a'], [600, 892, 0.7, '#f0a24a'], [1080, 900, 1.1, '#e46a5a'], [1010, 908, 0.6, '#f0a24a']]) {
        ctx.save(); ctx.translate(mx, my); ctx.scale(s, s);
        ctx.fillStyle = '#f3ead5'; ctx.beginPath(); SB.roundRect(ctx, -7, -16, 14, 20, 6); ctx.fill();
        SB.body(ctx, (c) => { c.moveTo(-22, -14); c.quadraticCurveTo(0, -40, 22, -14); c.closePath(); }, cc, { sb: [0, -30, 0, 0] });
        for (let i = 0; i < 5; i++) SB.fillCirc(ctx, -14 + i * 7, -20 - Math.sin(i) * 4, 2.6, '#fff');
        ctx.restore();
      }
      // mossy log
      ctx.save(); ctx.translate(820, 905);
      SB.body(ctx, (c) => c.ellipse(0, 0, 120, 26, 0, 0, TAU), '#8a6646', { sb: [0, -26, 0, 26] });
      SB.fillEll(ctx, -120, 0, 16, 24, '#6b4a30'); SB.fillEll(ctx, -120, 0, 9, 14, '#8a6646');
      for (let i = 0; i < 20; i++) SB.fillCirc(ctx, -110 + i * 11, -22 + Math.sin(i) * 3, 7, '#6fae55');
      ctx.restore();
    },
    init(S) {
      S.cl = { x: 820, y: 760, mood: 'sad', bob: 0, fly: 0, flyT: 0, vy: 0, say: 0, phase: 0, spin: 0 };
      S.bear = { x: 560, y: 880, f: 1, wave: 0, reach: 0, yawn: 0, throwT: 0, blow: 0 };
      S.lamb = { x: 300, y: 880, f: 1, bleat: 0, look: [0.8, 0] };
      S.sq = { x: 1180, y: 720, flick: 0, hop: 0, hv: 0, chat: 0 };
      S.bird = { cx: 980, cy: 420, a: 0, sing: 0, perch: 1 };
      S.owl = { x: 1360, y: 480, open: 1, hoot: 0, rot: 0 };
      S.leaves = [];
    },
    update(S, dt) {
      const cl = S.cl, bear = S.bear;
      cl.bob = Math.sin(S.t * 2) * 6; cl.say = Math.max(0, cl.say - dt);
      // bear throws cloud upward: it flies up, overshoots, bonks a branch, drifts back down
      if (cl.phase === 1) {
        cl.flyT += dt; cl.vy -= 0; cl.fly = 1;
        const u = cl.flyT;
        cl.y = 760 - Math.sin(SB.clamp(u * 1.6, 0, Math.PI)) * 420;
        cl.spin += dt * 10;
        if (u > 0.9 && cl.phase === 1) { cl.phase = 2; A.thud(); S.fx.pop(cl.x, 320, '咚！', { s: 44, c: '#9a6644' }); S.fx.burst('leaf', cl.x, 340, 14, { speed: 160, up: 40, g: 160, cols: ['#8fcf6a', '#f0b84a', '#e88a4a'], life: 2 }); for (let i = 0; i < 10; i++) S.leaves.push({ x: cl.x + (Math.random() - 0.5) * 200, y: 340, vx: (Math.random() - 0.5) * 60, vy: 20, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 4, c: ['#8fcf6a', '#f0b84a', '#e88a4a'][i % 3] }); }
      } else if (cl.phase === 2) {
        cl.flyT += dt; cl.spin *= Math.pow(0.1, dt);
        cl.y += (760 - cl.y) * Math.min(1, dt * 2.2) + Math.sin(S.t * 3) * 0.5;
        if (Math.abs(cl.y - 760) < 8 && cl.say <= 0) { cl.phase = 3; cl.fly = 0; cl.say = 2.6; S.fx.say(cl.x + 20, cl.y - 70, '哎哟！太用力了，\n我撞到树啦！', { s: 28, life: 2.6 }); }
      } else { cl.fly = Math.max(0, cl.fly - dt * 3); }
      bear.wave = Math.max(0, bear.wave - dt * 1.4); bear.reach = Math.max(0, bear.reach - dt * 1.5); bear.yawn = Math.max(0, bear.yawn - dt * 0.8); bear.blow = Math.max(0, bear.blow - dt * 2);
      S.lamb.bleat = Math.max(0, S.lamb.bleat - dt * 1.3);
      const sq = S.sq; sq.flick = Math.max(0, sq.flick - dt * 2); sq.chat = Math.max(0, sq.chat - dt); if (sq.hv || sq.hop > 0) { sq.hv -= 1500 * dt; sq.hop += sq.hv * dt; if (sq.hop <= 0) { sq.hop = 0; sq.hv = 0; } }
      S.bird.a += dt * 1.2; S.bird.sing = Math.max(0, S.bird.sing - dt * 1.5);
      S.owl.hoot = Math.max(0, S.owl.hoot - dt * 1.4);
      for (const lf of S.leaves) { lf.vy += 60 * dt; lf.x += lf.vx * dt; lf.y += lf.vy * dt; lf.rot += lf.vr * dt; } S.leaves = S.leaves.filter((lf) => lf.y < 980);
    },
    draw(ctx, S) {
      const t = S.t, cl = S.cl, bear = S.bear;
      // owl in a tree hollow
      C.owl(ctx, { x: S.owl.x, y: S.owl.y, s: 1.5, t, open: S.owl.open, hoot: S.owl.hoot, rot: S.owl.rot });
      // bird
      const bx = S.bird.cx + Math.sin(S.bird.a) * 30, by = S.bird.cy + Math.sin(S.bird.a * 1.5) * 10;
      C.bird(ctx, { x: bx, y: by, s: 1.1, t, sing: S.bird.sing, col: '#e8894a', belly: '#fbe7c6' }); S.bird.x = bx; S.bird.y = by;
      // squirrel on a branch stub
      C.squirrel(ctx, { x: S.sq.x, y: S.sq.y - S.sq.hop, s: 1.1, f: -1, t, flick: S.sq.flick });
      // falling leaves
      for (const lf of S.leaves) { ctx.save(); ctx.translate(lf.x, lf.y); ctx.rotate(lf.rot); ctx.fillStyle = lf.c; ctx.beginPath(); ctx.ellipse(0, 0, 4, 11, 0, 0, TAU); ctx.fill(); ctx.restore(); }
      // lamb
      C.lamb(ctx, { x: S.lamb.x, y: S.lamb.y, s: 0.95, f: 1, t, bleat: S.lamb.bleat, look: S.lamb.look });
      // bear
      C.bear(ctx, { x: bear.x, y: bear.y, s: 1.0, f: 1, t, wave: bear.wave, reach: bear.reach, yawn: bear.yawn, blow: bear.blow, happy: cl.phase === 0 });
      // cloud (flying / bobbing)
      ctx.save(); if (cl.fly > 0.1) { ctx.translate(cl.x, cl.y + cl.bob); ctx.rotate(Math.sin(cl.spin) * 0.5 * cl.fly); ctx.translate(-cl.x, -(cl.y + cl.bob)); }
      C.cloud(ctx, { x: cl.x, y: cl.y + cl.bob, s: 0.82, t, mood: cl.fly > 0.3 ? 'wow' : cl.say > 0 ? 'sad' : 'sad', float: cl.fly > 0.1 ? 0 : 0.5, armsUp: cl.fly > 0.3 ? 1 : 0, look: [0, cl.fly > 0.1 ? -0.5 : 0.2] });
      ctx.restore();
    },
    text: { x: 90, y: 128, size: 32, w: 560, lines: [{ t: '大熊说：“我力气大，把你抛上去！”' }, { t: '呼——咚！云朵飞得太高，' }, { t: '一下子撞到了大树，又飘了下来。' }] },
    hover(S, x, y) { const cl = S.cl, bear = S.bear; return SB.hitEll(x, y, cl.x, cl.y + cl.bob, 85, 55) || SB.hitEll(x, y, bear.x, bear.y - 150, 120, 150) || SB.hitEll(x, y, S.lamb.x, S.lamb.y - 70, 90, 80) || SB.hitCirc(x, y, S.sq.x, S.sq.y - 40, 44) || SB.hitCirc(x, y, S.owl.x, S.owl.y, 60) || SB.hitCirc(x, y, S.bird.x, S.bird.y, 40); },
    tap(S, x, y) {
      const cl = S.cl, bear = S.bear;
      if (SB.hitEll(x, y, bear.x, bear.y - 150, 120, 150)) {
        if (cl.phase === 0) { cl.phase = 1; cl.flyT = 0; cl.spin = 0; bear.reach = 1.4; A.grr(); setTimeout(() => A.boing(true), 220); S.fx.say(bear.x + 70, bear.y - 300, '抓稳啦！嘿——哟！', { s: 26 }); S.tap('bear'); S.tap('try'); return true; }
        bear.wave = 1; A.grr(); S.fx.say(bear.x + 80, bear.y - 300, '对不住，用力过头了…', { s: 24 }); return true;
      }
      if (SB.hitEll(x, y, cl.x, cl.y + cl.bob, 85, 55)) { if (cl.phase >= 3 || cl.phase === 0) { cl.say = 2; A.sniff(); S.fx.say(cl.x + 20, cl.y - 70, '还是回不了家…', { s: 26, life: 2 }); } S.tap('cloud'); return true; }
      if (SB.hitEll(x, y, S.lamb.x, S.lamb.y - 70, 90, 80)) { S.lamb.bleat = 1; A.bleat(1.1); A.bell(); S.fx.say(S.lamb.x + 60, S.lamb.y - 150, '别放弃！这个办法不行，\n我们就换一个！', { s: 22, life: 2.8 }); S.tap('lamb'); return true; }
      if (SB.hitCirc(x, y, S.sq.x, S.sq.y - 40, 44)) { S.sq.flick = 1.4; S.sq.hv = 460; S.sq.chat = 1; A.squeak(); S.fx.say(S.sq.x + 10, S.sq.y - 110, '吱吱！加油！', { s: 22 }); S.tap('sq'); return true; }
      if (SB.hitCirc(x, y, S.owl.x, S.owl.y, 60)) { S.owl.hoot = 1; A.hoot(); S.fx.say(S.owl.x, S.owl.y - 70, '呼——去找风婆婆吧', { s: 22, side: -1 }); S.tap('owl'); return true; }
      if (SB.hitCirc(x, y, S.bird.x, S.bird.y, 40)) { S.bird.sing = 1; A.chirp(4); S.fx.burst('note', S.bird.x, S.bird.y - 20, 3, { speed: 60, up: 50, cols: ['#e8894a', '#f7d24a'], life: 1.2, glyph: '♫' }); S.tap('bird'); return true; }
      return false;
    },
    hints(S) { return [[S.bear.x, S.bear.y - 160, 'bear'], [S.owl.x, S.owl.y, 'owl'], [S.sq.x, S.sq.y - 40, 'sq']]; },
  };

  function drawFlower(ctx, f, t) {
    ctx.save(); ctx.translate(f.x, f.y - 2); ctx.rotate(Math.sin(t * 1.6 + f.x) * 0.05);
    ctx.strokeStyle = '#4c8a3a'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(-5, -24, 0, -46); ctx.stroke();
    ctx.translate(0, -50);
    const o = SB.ease.outElastic(Math.min(1, f.open || 0.001));
    if ((f.open || 0) < 0.05) SB.body(ctx, (c) => c.ellipse(0, 0, 8, 12, 0, 0, TAU), f.c, {});
    else { for (let i = 0; i < 6; i++) { const a = (i / 6) * TAU; SB.body(ctx, (c) => c.ellipse(Math.cos(a) * 14 * o, Math.sin(a) * 14 * o, 11 * o, 7 * o, a, 0, TAU), f.c, {}); } SB.fillCirc(ctx, 0, 0, 8 * o, '#f7d24a'); }
    ctx.restore();
  }
})();
