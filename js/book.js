/* 小云朵回家 · book engine: layout, live page composition, realistic page curl, input, narration UI */
(function () {
  'use strict';
  const SB = window.SB;
  const { SW, SH, PW } = SB;
  const W = PW, H = SH;
  const A = SB.A;

  const cv = document.getElementById('book');
  const ctx = cv.getContext('2d');
  const scenes = SB.SCENES;
  const LAST = scenes.length - 1;
  const params = new URLSearchParams(location.search);

  const B = (SB.book = {
    view: 0, flip: null, peek: { dir: 1, ym: 1, amt: 0, target: 0 },
    autoRead: true, started: false, k: 1, cx: 0, cy: 0, dpr: 1, RS: 1, reading: -1, readingView: -1,
  });
  SB.hitCirc = (x, y, cx, cy, r) => (x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r;
  SB.hitEll = (x, y, cx, cy, rx, ry) => ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1;
  SB.hitRect = (x, y, x0, y0, w, h) => x >= x0 && x <= x0 + w && y >= y0 && y <= y0 + h;

  /* ---------- per-view runtime ---------- */
  const RT = scenes.map(() => null);
  const getRT = (v) => {
    if (!RT[v]) {
      const S = { t: 0, fx: new SB.FX(), tapped: new Set(), idle: 0, v, hintT: 0, textIn: 0, frame: -1 };
      S.tap = (id) => S.tapped.add(id);
      if (scenes[v].init) scenes[v].init(S);
      RT[v] = S;
    }
    return RT[v];
  };
  B.rt = getRT;

  /* ---------- canvases ---------- */
  const bgCache = new Map(); // v -> canvas
  const live = [];
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const hasSide = (v, side) => v >= 0 && v <= LAST && !(v === 0 && side === 'L') && !(v === LAST && side === 'R');

  function paintBg(v) {
    if (bgCache.has(v)) return bgCache.get(v);
    const RS = B.RS; SB.RS = RS;
    const c = mk(Math.round(SW * RS), Math.round(SH * RS));
    const g = c.getContext('2d');
    g.setTransform(RS, 0, 0, RS, 0, 0);
    g.fillStyle = '#f4efe3'; g.fillRect(0, 0, SW, SH);
    const sc = scenes[v];
    const r = SB.rng(1000 + v * 7919);
    sc.bg(g, r);
    SB.grainPass(g, c.width, c.height, sc.grain != null ? sc.grain : 0.14, 0.55);
    bgCache.set(v, c);
    // keep memory modest: drop far-away caches
    for (const key of [...bgCache.keys()]) if (Math.abs(key - B.view) > 2) bgCache.delete(key);
    return c;
  }
  let prefetchQ = [];
  function prefetch() {
    prefetchQ = [B.view + 1, B.view - 1, B.view + 2].filter((v) => v >= 0 && v <= LAST && !bgCache.has(v));
    const step = () => {
      if (!prefetchQ.length) return;
      if (B.flip && B.flip.mode === 'drag') { setTimeout(step, 200); return; }
      paintBg(prefetchQ.shift());
      setTimeout(step, 60);
    };
    setTimeout(step, 400);
  }

  let frameNo = 0;
  function composeView(v, slot) {
    const S = getRT(v);
    if (!live[slot] || live[slot].width !== Math.round(SW * B.RS)) live[slot] = mk(Math.round(SW * B.RS), Math.round(SH * B.RS));
    const c = live[slot]; const g = c.getContext('2d');
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.drawImage(paintBg(v), 0, 0);
    g.setTransform(B.RS, 0, 0, B.RS, 0, 0);
    const sc = scenes[v];
    if (sc.draw) sc.draw(g, S);
    drawText(g, sc, S, v);
    S.fx.draw(g);
    if (sc.drawTop) sc.drawTop(g, S);
    return c;
  }
  function updateView(v, dt) {
    const S = getRT(v);
    if (S.frame === frameNo) return;
    S.frame = frameNo;
    S.t += dt; S.idle += dt; S.textIn += dt;
    S.fx.update(dt);
    const sc = scenes[v];
    if (sc.update) sc.update(S, dt);
    // hint sparkles on untouched hotspots
    S.hintT += dt;
    if (sc.hints && S.hintT > 1.3 && v === B.view && !B.flip) {
      S.hintT = 0;
      const hs = sc.hints(S).filter((h) => !S.tapped.has(h[2]));
      if (hs.length) { const h = hs[Math.floor(Math.random() * hs.length)]; S.fx.add({ type: 'spark', x: h[0] + (Math.random() - 0.5) * 40, y: h[1] + (Math.random() - 0.5) * 30, life: 0.9, s: 1.1, c: '#fff6c2', vy: -10 }); }
    }
  }

  /* ---------- text ---------- */
  function wrapLines(g, text, maxW) {
    const out = []; let cur = '';
    for (const ch of text) {
      if (g.measureText(cur + ch).width > maxW && cur) {
        // don't start a line with punctuation
        if (/[，。！？、”；：…—]/.test(ch)) { cur += ch; out.push(cur); cur = ''; continue; }
        out.push(cur); cur = ch;
      } else cur += ch;
    }
    if (cur) out.push(cur);
    return out;
  }
  function drawText(g, sc, S, v) {
    const T = sc.text; if (!T) return;
    const size = T.size || 34, lh = size * (T.lh || 1.55);
    g.save();
    g.font = `700 ${size}px ${SB.FONT}`; g.textBaseline = 'middle'; g.lineJoin = 'round';
    let y = T.y;
    S.textBoxes = [];
    T.lines.forEach((L, i) => {
      const a = SB.clamp((S.textIn - 0.35 - i * 0.35) / 0.6, 0, 1);
      const sub = wrapLines(g, L.t, T.w || 620);
      const box = { x: T.x - 10, y: y - lh / 2, w: 0, h: sub.length * lh, i };
      sub.forEach((s) => {
        const tw = g.measureText(s).width;
        const x = T.align === 'center' ? T.x - tw / 2 : T.align === 'right' ? T.x - tw : T.x;
        box.w = Math.max(box.w, tw + 20); box.x = Math.min(box.x, x - 10);
        g.globalAlpha = a;
        const dy = (1 - SB.ease.out(a)) * 14;
        if (B.reading === i && B.readingView === v) {
          g.fillStyle = 'rgba(255,214,90,0.55)';
          g.beginPath(); SB.roundRect(g, x - 8, y - size * 0.5 + dy + size * 0.45, tw + 16, size * 0.5, size * 0.25); g.fill();
        }
        if (T.halo !== false) { g.strokeStyle = T.halo || 'rgba(255,253,245,0.92)'; g.lineWidth = size * 0.32; g.strokeText(s, x, y + dy); }
        g.fillStyle = L.who && L.who !== 'n' ? (T.qcol || '#b8483a') : (T.col || '#3e3230');
        g.fillText(s, x, y + dy);
        y += lh;
      });
      S.textBoxes.push(box);
      y += T.gap || 6;
    });
    // speaker icon
    if (A.canSpeak() && T.icon !== false) {
      const ix = T.align === 'center' ? T.x : T.align === 'right' ? T.x + 50 : T.x - 46, iy = T.align === 'center' ? y + 18 : T.y;
      S.speaker = [ix, iy];
      g.globalAlpha = SB.clamp(S.textIn - 0.3, 0, 1);
      const pulse = B.readingView === v && B.reading >= 0 ? 1 + Math.sin(S.t * 8) * 0.08 : 1;
      g.translate(ix, iy); g.scale(pulse, pulse);
      g.fillStyle = 'rgba(255,253,245,0.9)'; g.beginPath(); g.arc(0, 0, 21, 0, 6.283); g.fill();
      g.fillStyle = '#e8774e';
      g.beginPath(); g.moveTo(-9, -5); g.lineTo(-3, -5); g.lineTo(4, -11); g.lineTo(4, 11); g.lineTo(-3, 5); g.lineTo(-9, 5); g.closePath(); g.fill();
      g.strokeStyle = '#e8774e'; g.lineWidth = 2.6; g.lineCap = 'round';
      g.beginPath(); g.arc(5, 0, 7, -0.8, 0.8); g.stroke(); g.beginPath(); g.arc(5, 0, 12, -0.8, 0.8); g.stroke();
    }
    g.restore();
  }
  B.read = (v = B.view, only = null) => {
    const T = scenes[v].text; if (!T) return;
    const tag = (L, idx) => Object.assign({}, L, { _key: v + '-' + idx });
    const lines = only != null ? [tag(T.lines[only], only)] : T.lines.map(tag);
    A.onLine = (i) => { B.reading = i < 0 ? -1 : only != null ? only : i; B.readingView = v; };
    A.speak(lines, () => { B.reading = -1; });
  };

  /* ---------- layout ---------- */
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    B.dpr = dpr;
    cv.width = Math.round(innerWidth * dpr); cv.height = Math.round(innerHeight * dpr);
    const availW = innerWidth - (innerWidth > 900 ? 150 : 40), availH = innerHeight - (innerHeight > 600 ? 120 : 70);
    B.k = Math.min(availW / (SW + 60), availH / (SH + 50));
    B.cx = innerWidth / 2; B.cy = innerHeight / 2 - (innerHeight > 600 ? 12 : 0);
    const RS = SB.clamp(Math.round(B.k * dpr * 4) / 4, 0.75, 2);
    if (RS !== B.RS) { B.RS = RS; bgCache.clear(); }
    SB.RS = RS;
  }
  window.addEventListener('resize', resize);

  /* ---------- flip geometry ---------- */
  const clipHalf = (poly, M, n, keepFoldSide) => {
    const out = []; const side = (p) => ((p[0] - M[0]) * n[0] + (p[1] - M[1]) * n[1]) * (keepFoldSide ? 1 : -1);
    for (let i = 0; i < poly.length; i++) {
      const a = poly[i], b = poly[(i + 1) % poly.length]; const sa = side(a), sb = side(b);
      if (sa >= 0) out.push(a);
      if ((sa >= 0) !== (sb >= 0)) { const t = sa / (sa - sb); out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]); }
    }
    return out;
  };
  const RECT = [[0, 0], [W, 0], [W, H], [0, H]];
  function constrain(P) {
    let [x, y] = P;
    // bottom spine point (0,H): distance <= W
    let dx = x, dy = y - H, d = Math.hypot(dx, dy);
    if (d > W) { x = (dx / d) * W; y = H + (dy / d) * W; }
    const D = Math.hypot(W, H); dx = x; dy = y; d = Math.hypot(dx, dy);
    if (d > D) { x = (dx / d) * D; y = (dy / d) * D; }
    return [x, y];
  }
  function geom(Pin) {
    const P = constrain(Pin);
    const Cx = W, Cy = H;
    let vx = Cx - P[0], vy = Cy - P[1]; let len = Math.hypot(vx, vy);
    if (len < 0.5) { vx = 1; vy = 0; len = 0.5; }
    const n = [vx / Math.hypot(vx, vy), vy / Math.hypot(vx, vy)];
    const M = [(Cx + P[0]) / 2, (Cy + P[1]) / 2];
    const keep = clipHalf(RECT, M, n, false), fold = clipHalf(RECT, M, n, true);
    const md = 2 * (M[0] * n[0] + M[1] * n[1]);
    const refl = [1 - 2 * n[0] * n[0], -2 * n[0] * n[1], -2 * n[0] * n[1], 1 - 2 * n[1] * n[1], md * n[0], md * n[1]];
    const reflPt = (p) => { const s = 2 * ((p[0] - M[0]) * n[0] + (p[1] - M[1]) * n[1]); return [p[0] - s * n[0], p[1] - s * n[1]]; };
    return { P, n, M, keep, fold, refl, reflPt, len };
  }

  /* ---------- drawing the book ---------- */
  const shiftFor = (v) => (v === 0 ? -W / 2 : v === LAST ? W / 2 : 0);
  function pathPoly(g, pts) { g.beginPath(); if (!pts.length) return; g.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) g.lineTo(pts[i][0], pts[i][1]); g.closePath(); }

  function drawDesk(g) {
    const w = cv.width, h = cv.height;
    const gr = g.createRadialGradient(w / 2, h * 0.45, h * 0.1, w / 2, h / 2, Math.max(w, h) * 0.75);
    gr.addColorStop(0, '#fbf1e2'); gr.addColorStop(0.6, '#efdcc2'); gr.addColorStop(1, '#d6bb98');
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
    g.save(); g.globalAlpha = 0.35; g.globalCompositeOperation = 'multiply';
    g.fillStyle = g.createPattern(SB.mottleCanvas(), 'repeat'); g.fillRect(0, 0, w, h); g.restore();
  }
  // live images of halves
  let imgs = {};
  function half(g, v, side) {
    const c = imgs[v]; if (!c) return;
    const rs = B.RS;
    if (side === 'L') g.drawImage(c, 0, 0, W * rs, H * rs, -W, 0, W, H);
    else g.drawImage(c, W * rs, 0, W * rs, H * rs, 0, 0, W, H);
  }
  function boards(g, leftA, rightA) {
    g.save();
    const m = 13;
    const col = '#335f86';
    g.shadowColor = 'rgba(60,40,20,0.35)'; g.shadowBlur = 40 * B.k * B.dpr; g.shadowOffsetY = 18 * B.k * B.dpr;
    g.fillStyle = col;
    if (leftA > 0) { g.globalAlpha = leftA; g.beginPath(); SB.roundRect(g, -W - m, -m, W + m, H + 2 * m, 16); g.fill(); }
    if (rightA > 0) { g.globalAlpha = rightA; g.beginPath(); SB.roundRect(g, 0, -m, W + m, H + 2 * m, 16); g.fill(); }
    g.restore();
    // page stack edges
    const views = LAST;
    const leftN = Math.min(7, Math.round((B.view / views) * 7)), rightN = Math.min(7, Math.round(((views - B.view) / views) * 7));
    g.save();
    for (let i = 0; i < rightN && rightA > 0.5; i++) { g.fillStyle = i % 2 ? '#e9e1cf' : '#f7f1e3'; g.fillRect(W - 1 + i * 0.9, 2 + i * 0.6, 2, H - 4 - i * 1.2); }
    for (let i = 0; i < leftN && leftA > 0.5; i++) { g.fillStyle = i % 2 ? '#e9e1cf' : '#f7f1e3'; g.fillRect(-W - 1 - i * 0.9, 2 + i * 0.6, 2, H - 4 - i * 1.2); }
    g.restore();
  }
  function gutter(g, hasL, hasR) {
    g.save();
    if (hasR) { const gr = g.createLinearGradient(0, 0, 70, 0); gr.addColorStop(0, 'rgba(60,40,30,0.32)'); gr.addColorStop(0.25, 'rgba(60,40,30,0.12)'); gr.addColorStop(1, 'rgba(60,40,30,0)'); g.fillStyle = gr; g.fillRect(0, 0, 70, H); const g2 = g.createLinearGradient(W - 40, 0, W, 0); g2.addColorStop(0, 'rgba(255,255,255,0)'); g2.addColorStop(1, 'rgba(90,70,50,0.10)'); g.fillStyle = g2; g.fillRect(W - 40, 0, 40, H); }
    if (hasL) { const gr = g.createLinearGradient(0, 0, -70, 0); gr.addColorStop(0, 'rgba(60,40,30,0.32)'); gr.addColorStop(0.25, 'rgba(60,40,30,0.12)'); gr.addColorStop(1, 'rgba(60,40,30,0)'); g.fillStyle = gr; g.fillRect(-70, 0, 70, H); const g2 = g.createLinearGradient(-W + 40, 0, -W, 0); g2.addColorStop(0, 'rgba(255,255,255,0)'); g2.addColorStop(1, 'rgba(90,70,50,0.10)'); g.fillStyle = g2; g.fillRect(-W, 0, 40, H); }
    if (hasL && hasR) { g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(-1, 0, 2, H); }
    g.restore();
  }

  function drawFlip(g, F) {
    const { dir, ym } = F; const v = B.view, v2 = v + dir;
    const sideF = dir > 0 ? 'R' : 'L', sideO = dir > 0 ? 'L' : 'R';
    const G = geom(F.P);
    const prog = SB.clamp((W - G.P[0]) / (2 * W), 0, 1);
    const frame = () => { g.translate(0, H / 2); g.scale(dir, ym); g.translate(0, -H / 2); };
    const real = (vv, side) => { if (!hasSide(vv, side)) return; g.save(); frame(); half(g, vv, side); g.restore(); };
    g.save(); frame();
    // static other page
    if (hasSide(v, sideO)) real(v, sideO);
    // keep part of front page
    if (G.keep.length > 2) { g.save(); pathPoly(g, G.keep); g.clip(); real(v, sideF); g.restore(); }
    // revealed page
    if (G.fold.length > 2 && hasSide(v2, sideF)) {
      g.save(); pathPoly(g, G.fold); g.clip(); real(v2, sideF);
      const sw = 20 + Math.sin(prog * Math.PI) * 140;
      const gr = g.createLinearGradient(G.M[0], G.M[1], G.M[0] + G.n[0] * sw, G.M[1] + G.n[1] * sw);
      gr.addColorStop(0, 'rgba(40,30,30,0.45)'); gr.addColorStop(1, 'rgba(40,30,30,0)');
      g.fillStyle = gr; g.fillRect(-W * 2, -H, W * 4, H * 3);
      g.restore();
    }
    // drop shadow of flipped leaf
    if (G.fold.length > 2) {
      const rp = G.fold.map(G.reflPt);
      g.save();
      g.beginPath(); g.rect(-W, 0, 2 * W, H); g.clip();
      g.shadowColor = `rgba(30,20,20,${0.35 * Math.sin(prog * Math.PI) + 0.08})`; g.shadowBlur = 30 * B.k * B.dpr; g.shadowOffsetX = -8 * B.k * B.dpr * dir;
      g.fillStyle = 'rgba(0,0,0,0.25)'; pathPoly(g, rp); g.fill();
      g.restore();
      // the flipped leaf (back side)
      g.save();
      g.transform(...G.refl);
      pathPoly(g, G.fold); g.clip();
      g.save(); g.scale(-1, 1); real(v2, sideO === 'L' ? 'L' : 'R'); if (!hasSide(v2, sideO)) { g.fillStyle = '#f5efe2'; g.fillRect(-W, 0, W, H); } g.restore();
      // lighting across the curl: in pre-reflection coords the leaf lies on the fold side
      const d = Math.min(G.len * 0.5, W);
      const lg = g.createLinearGradient(G.M[0], G.M[1], G.M[0] + G.n[0] * d, G.M[1] + G.n[1] * d);
      lg.addColorStop(0, 'rgba(30,20,20,0.28)'); lg.addColorStop(0.12, 'rgba(255,255,255,0.20)'); lg.addColorStop(0.35, 'rgba(255,255,255,0.04)'); lg.addColorStop(1, 'rgba(40,30,30,0.14)');
      g.fillStyle = lg; g.fillRect(-W * 2, -H, W * 4, H * 3);
      g.restore();
      // crease highlight on front
      g.save(); pathPoly(g, G.keep); g.clip();
      const cg = g.createLinearGradient(G.M[0], G.M[1], G.M[0] - G.n[0] * 30, G.M[1] - G.n[1] * 30);
      cg.addColorStop(0, 'rgba(40,30,30,0.18)'); cg.addColorStop(1, 'rgba(40,30,30,0)');
      g.fillStyle = cg; g.fillRect(-W * 2, -H, W * 4, H * 3); g.restore();
    }
    g.restore();
    return prog;
  }

  /* ---------- frame loop ---------- */
  let last = performance.now();
  const hand = { t: 0 };
  function loop(ts) {
    const dt = Math.min(0.05, (ts - last) / 1000); last = ts; frameNo++;
    const F = B.flip;
    // advance flip animation
    if (F && F.mode === 'anim') {
      F.at += dt / F.dur; const u = SB.ease.inOut(Math.min(1, F.at));
      F.P = [SB.lerp(F.P0[0], F.P1[0], u), SB.lerp(F.P0[1], F.P1[1], u) - Math.sin(u * Math.PI) * F.lift];
      if (F.at >= 1) finishFlip(F);
    }
    const pk = B.peek; pk.amt += (pk.target - pk.amt) * Math.min(1, dt * 10);

    // update + compose visible views
    const vis = new Set([B.view]); if (B.flip) vis.add(B.view + B.flip.dir); else if (pk.amt > 0.01) vis.add(B.view + pk.dir);
    imgs = {}; let slot = 0;
    for (const v of vis) { if (v < 0 || v > LAST) continue; updateView(v, dt); imgs[v] = composeView(v, slot++); }

    // draw
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    drawDesk(ctx);
    let prog = 0, target = B.view;
    const fl = B.flip || (pk.amt > 0.01 && hasSide(B.view, pk.dir > 0 ? 'R' : 'L') ? { dir: pk.dir, ym: pk.ym, P: [W - pk.amt * 70 - pk.dx, H - pk.amt * 55 - pk.dy], peek: true } : null);
    if (fl) { const G = geom(fl.P); prog = SB.clamp((W - G.P[0]) / (2 * W), 0, 1); target = B.view + fl.dir; }
    const e = SB.ease.inOut(prog);
    const shift = SB.lerp(shiftFor(B.view), shiftFor(target), fl ? e : 0);
    const k = B.k * B.dpr;
    ctx.setTransform(k, 0, 0, k, (B.cx + shift * B.k) * B.dpr, (B.cy - (H / 2) * B.k) * B.dpr);
    const leftA = hasSide(B.view, 'L') ? (fl && fl.dir > 0 ? 1 : fl && !hasSide(target, 'L') ? 1 - e : 1) : fl && fl.dir > 0 ? e : 0;
    const rightA = hasSide(B.view, 'R') ? (fl && fl.dir < 0 && !hasSide(target, 'R') ? 1 - e : 1) : fl && fl.dir < 0 ? e : 0;
    boards(ctx, fl && fl.dir > 0 && !hasSide(B.view, 'L') ? e : leftA, fl && fl.dir > 0 && !hasSide(target, 'R') ? 1 - e : rightA);
    if (fl) {
      drawFlip(ctx, fl);
      gutter(ctx, hasSide(B.view, 'L') || hasSide(target, 'L'), hasSide(B.view, 'R') || hasSide(target, 'R'));
    } else {
      half(ctx, B.view, 'L'); half(ctx, B.view, 'R');
      gutter(ctx, hasSide(B.view, 'L'), hasSide(B.view, 'R'));
      drawHand(ctx, dt);
      drawCornerHint(ctx);
    }
    requestAnimationFrame(loop);
  }

  function drawCornerHint(g) {
    // gentle curled corner invitation on the right page
    if (!hasSide(B.view, 'R') || B.view === LAST || B.peek.amt > 0.01) return;
    const S = getRT(B.view);
    const a = SB.clamp((S.idle - 6) / 1.5, 0, 1) * (0.6 + 0.4 * Math.sin(S.t * 3));
    if (a <= 0.01) return;
    g.save(); g.globalAlpha = a;
    g.translate(W - 60, H - 34);
    SB.outlineText(g, '翻页 ›', 0, 0, 26, '#8a6a4a', 'rgba(255,253,245,0.9)', 7, 700, 'center');
    g.restore();
  }
  function drawHand(g, dt) {
    const sc = scenes[B.view]; const S = getRT(B.view);
    if (!sc.hints || S.idle < 5 || !B.started) return;
    const hs = sc.hints(S).filter((h) => !S.tapped.has(h[2])); if (!hs.length) return;
    const h = hs[Math.floor(S.idle / 4) % hs.length];
    const tt = (S.idle % 4) / 4; const a = Math.sin(Math.min(1, tt * 1.2) * Math.PI);
    const press = Math.max(0, Math.sin(tt * Math.PI * 6)) * 10;
    g.save(); g.globalAlpha = a * 0.95;
    g.translate(h[0] - SW / 2 + 22, h[1] + 28 + press); g.rotate(-0.35);
    // cartoon hand
    g.fillStyle = '#fff'; g.strokeStyle = '#5a4034'; g.lineWidth = 3.5; g.lineJoin = 'round';
    g.beginPath();
    g.moveTo(-6, 0); g.lineTo(-6, -42); g.arc(0, -42, 6, Math.PI, 0); g.lineTo(6, -14);
    g.arc(12, -14, 6, Math.PI, 0); g.arc(24, -12, 6, Math.PI, 0); g.arc(36, -9, 6, Math.PI, 0);
    g.lineTo(42, 14); g.quadraticCurveTo(40, 36, 18, 38); g.lineTo(4, 38); g.quadraticCurveTo(-14, 30, -20, 10); g.lineTo(-24, -2); g.quadraticCurveTo(-24, -10, -14, -6); g.closePath();
    g.fill(); g.stroke();
    if (press > 6) { g.strokeStyle = '#f7b84a'; g.lineWidth = 3; for (let i = 0; i < 3; i++) { const aa = -2.2 + i * 0.6; g.beginPath(); g.moveTo(Math.cos(aa) * 18, -52 + Math.sin(aa) * 18); g.lineTo(Math.cos(aa) * 28, -52 + Math.sin(aa) * 28); g.stroke(); } }
    g.restore();
  }

  /* ---------- flip control ---------- */
  function canFlip(dir) { return !B.flip && B.view + dir >= 0 && B.view + dir <= LAST; }
  B.go = (dir, speed = 1, cb) => {
    if (!canFlip(dir)) return false;
    A.stopSpeech();
    const ym = 1;
    const P0 = [W - 2 - B.peek.amt * 70, H - 2 - B.peek.amt * 55];
    B.flip = { dir, ym, mode: 'anim', P: P0, P0, P1: [-W, H], at: 0, dur: 1.05 / speed, lift: 170, done: true, cb };
    A.page();
    return true;
  };
  function finishFlip(F) {
    if (F.done) {
      B.view += F.dir; B.flip = null;
      const S = getRT(B.view); S.idle = 0; S.textIn = 0;
      if (scenes[B.view].enter) scenes[B.view].enter(S);
      prefetch(); updateDots();
      if (F.cb) F.cb();
      else if (B.autoRead && B.started) setTimeout(() => { if (!B.flip && B.view === S.v) B.read(); }, 650);
    } else B.flip = null;
  }
  B.jump = (target) => {
    const dir = target > B.view ? 1 : -1;
    const step = () => { if (B.view === target) { const S = getRT(B.view); if (B.autoRead) setTimeout(() => B.read(), 500); return; } B.go(dir, 2.6, step); };
    step();
  };

  /* ---------- pointer ---------- */
  const toBook = (e) => {
    const r = cv.getBoundingClientRect();
    const sx = e.clientX - r.left, sy = e.clientY - r.top;
    const shift = shiftFor(B.view);
    return [(sx - B.cx - shift * B.k) / B.k, (sy - (B.cy - (H / 2) * B.k)) / B.k];
  };
  const toFrame = (b, dir, ym) => [b[0] * dir, ym > 0 ? b[1] : H - b[1]];
  let down = null;
  cv.addEventListener('pointerdown', (e) => {
    if (!B.started) return;
    A.init();
    cv.setPointerCapture(e.pointerId);
    const b = toBook(e);
    down = { b, t: performance.now(), x: e.clientX, y: e.clientY, moved: false, id: e.pointerId };
    if (B.flip) return;
    const edge = 115;
    let dir = 0;
    if (b[0] > W - edge && b[0] < W + 30 && b[1] > -20 && b[1] < H + 20 && hasSide(B.view, 'R') && canFlip(1)) dir = 1;
    else if (b[0] < -W + edge && b[0] > -W - 30 && b[1] > -20 && b[1] < H + 20 && hasSide(B.view, 'L') && canFlip(-1)) dir = -1;
    if (dir) startDrag(dir, b);
  });
  function startDrag(dir, b) {
    const ym = b[1] < H * 0.4 ? -1 : 1;
    const f = toFrame(b, dir, ym);
    const C = [W, H];
    B.flip = { dir, ym, mode: 'drag', off: [C[0] - f[0], C[1] - f[1]], P: [C[0] - 1, C[1] - 1], hist: [] };
    const fr = [f[0] + B.flip.off[0], f[1] + B.flip.off[1]]; B.flip.P = fr;
    A.stopSpeech(); A.page();
  }
  cv.addEventListener('pointermove', (e) => {
    const b = toBook(e);
    const F = B.flip;
    if (F && F.mode === 'drag') {
      const f = toFrame(b, F.dir, F.ym);
      F.P = [f[0] + F.off[0], f[1] + F.off[1]];
      F.hist.push([performance.now(), F.P[0]]); if (F.hist.length > 6) F.hist.shift();
      return;
    }
    if (down && !F) {
      const dx = e.clientX - down.x, dy = e.clientY - down.y;
      if (Math.hypot(dx, dy) > 12) down.moved = true;
      // swipe on touch to turn
      if (e.pointerType !== 'mouse' && Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        const dir = dx < 0 ? 1 : -1; if (canFlip(dir) && hasSide(B.view, dir > 0 ? 'R' : 'L')) { startDrag(dir, [dir > 0 ? W - 5 : -W + 5, b[1]]); down = null; return; }
      }
    }
    if (!B.started) return;
    // corner peek
    const pk = B.peek; pk.target = 0;
    if (!F) {
      const nearR = hasSide(B.view, 'R') && canFlip(1) && b[0] > W - 120 && b[0] < W + 20 && (b[1] > H - 120 || b[1] < 120) && b[1] < H + 20 && b[1] > -20;
      const nearL = hasSide(B.view, 'L') && canFlip(-1) && b[0] < -W + 120 && b[0] > -W - 20 && (b[1] > H - 120 || b[1] < 120) && b[1] < H + 20 && b[1] > -20;
      if (nearR || nearL) {
        pk.dir = nearR ? 1 : -1; pk.ym = b[1] < H / 2 ? -1 : 1; pk.target = 1;
        const f = toFrame(b, pk.dir, pk.ym); pk.dx = SB.clamp((W - f[0]) * 0.35, 0, 40); pk.dy = SB.clamp((H - f[1]) * 0.35, 0, 40);
      }
    }
    // cursor + scene hover / brush
    const sx = b[0] + W, sy = b[1];
    let pointer = pk.target > 0;
    if (!F && sy >= 0 && sy <= H && hasSide(B.view, sx < W ? 'L' : 'R')) {
      const sc = scenes[B.view], S = getRT(B.view);
      if (sc.hover && sc.hover(S, sx, sy)) pointer = true;
      if (S.textBoxes && S.textBoxes.some((t) => SB.hitRect(sx, sy, t.x, t.y, t.w, t.h))) pointer = true;
      if (S.speaker && SB.hitCirc(sx, sy, S.speaker[0], S.speaker[1], 26)) pointer = true;
      if (sc.move) { if (S._mx != null) sc.move(S, sx, sy, sx - S._mx, sy - S._my); S._mx = sx; S._my = sy; }
    }
    cv.style.cursor = F && F.mode === 'drag' ? 'grabbing' : pointer ? 'pointer' : 'default';
  });
  const endPointer = (e) => {
    const F = B.flip;
    if (F && F.mode === 'drag') {
      let vel = 0; if (F.hist.length > 1) { const a = F.hist[0], z = F.hist[F.hist.length - 1]; vel = (z[1] - a[1]) / Math.max(1, z[0] - a[0]); }
      const G = geom(F.P); const complete = G.P[0] < W * 0.35 || vel < -0.8;
      F.mode = 'anim'; F.P0 = G.P; F.at = 0; F.lift = complete ? 60 : 0; F.done = complete;
      F.P1 = complete ? [-W, H] : [W, H];
      F.dur = SB.clamp(Math.hypot(F.P1[0] - G.P[0], F.P1[1] - G.P[1]) / 1900, 0.25, 0.8);
      if (!complete) A.page();
      down = null; return;
    }
    if (down && !down.moved && !F) {
      const b = down.b; const sx = b[0] + W, sy = b[1];
      if (sy >= 0 && sy <= H && sx >= 0 && sx <= SW && hasSide(B.view, sx < W ? 'L' : 'R')) tapScene(sx, sy);
    }
    down = null;
  };
  cv.addEventListener('pointerup', endPointer);
  cv.addEventListener('pointercancel', endPointer);
  cv.addEventListener('pointerleave', () => { B.peek.target = 0; });

  function tapScene(x, y) {
    const sc = scenes[B.view], S = getRT(B.view);
    S.idle = 0;
    if (S.speaker && SB.hitCirc(x, y, S.speaker[0], S.speaker[1], 28)) { A.pop(1.4); B.read(); return; }
    if (S.textBoxes) { const tb = S.textBoxes.find((t) => SB.hitRect(x, y, t.x, t.y, t.w, t.h)); if (tb) { B.read(B.view, tb.i); return; } }
    if (sc.tap && sc.tap(S, x, y)) return;
    // default: a little sparkle wherever the child touches
    S.fx.burst('spark', x, y, 5, { speed: 90, life: 0.6, s: 0.7, cols: ['#fff6c2', '#ffd1e0', '#cfe8ff'] });
    A.note(Math.floor(Math.random() * 6) + 2, 0.4, 0.05);
  }

  /* ---------- keyboard ---------- */
  window.addEventListener('keydown', (e) => {
    if (!B.started) return;
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') { e.preventDefault(); B.go(1); }
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') { e.preventDefault(); B.go(-1); }
  });

  /* ---------- HTML UI ---------- */
  const $ = (id) => document.getElementById(id);
  function updateDots() {
    const d = $('dots'); if (!d) return;
    d.innerHTML = '';
    for (let i = 0; i <= LAST; i++) {
      const b = document.createElement('button'); b.className = 'dot' + (i === B.view ? ' on' : ''); b.setAttribute('aria-label', `第${i}页`);
      b.onclick = () => { A.init(); if (i !== B.view && !B.flip) B.jump(i); };
      d.appendChild(b);
    }
    $('prev').disabled = B.view === 0; $('next').disabled = B.view === LAST;
  }
  function bindUI() {
    $('prev').onclick = () => { A.init(); B.go(-1); };
    $('next').onclick = () => { A.init(); B.go(1); };
    const tog = (id, get, set) => { const el = $(id); const sync = () => el.classList.toggle('off', !get()); el.onclick = () => { A.init(); set(!get()); sync(); }; sync(); };
    tog('bRead', () => B.autoRead, (v) => { B.autoRead = v; if (!v) A.stopSpeech(); else B.read(); });
    tog('bMusic', () => A.musicOn, (v) => A.setMusic(v));
    tog('bSound', () => !A.muted, (v) => A.setMuted(!v));
    $('bFull').onclick = () => { if (!document.fullscreenElement) document.documentElement.requestFullscreen && document.documentElement.requestFullscreen(); else document.exitFullscreen(); };
    $('start').onclick = () => {
      A.init(); B.started = true;
      $('intro').classList.add('gone');
      setTimeout(() => { $('intro').style.display = 'none'; }, 900);
      const S = getRT(B.view); S.idle = 0; S.textIn = 0;
      if (scenes[B.view].enter) scenes[B.view].enter(S);
      if (B.autoRead) setTimeout(() => B.read(), 700);
    };
    if (!A.canSpeak()) $('bRead').style.display = 'none';
  }

  /* ---------- boot ---------- */
  resize(); bindUI();
  const pv = parseInt(params.get('v') || '0', 10);
  if (pv > 0 && pv <= LAST) { B.view = pv; }
  if (params.has('auto')) { B.started = true; $('intro').style.display = 'none'; B.autoRead = false; }
  const pt = parseFloat(params.get('t') || '0');
  if (pt > 0) { const S = getRT(B.view); if (scenes[B.view].enter) scenes[B.view].enter(S); for (let i = 0; i < pt * 30; i++) { frameNo++; updateView(B.view, 1 / 30); } }
  else { const S = getRT(B.view); if (scenes[B.view].enter) scenes[B.view].enter(S); }
  if (params.has('tap')) { const [x, y] = params.get('tap').split(',').map(Number); setTimeout(() => tapScene(x, y), 50); }
  if (params.has('flip')) { const P = params.get('flip').split(',').map(Number); B.flip = { dir: P[2] || 1, ym: 1, mode: 'drag', P: [P[0], P[1]], hist: [] }; }
  updateDots(); prefetch();
  requestAnimationFrame((t) => { last = t; loop(t); });
})();
