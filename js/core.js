/* 小云朵回家 · core utilities, textures, painters, particles */
(function () {
  'use strict';
  const SB = (window.SB = window.SB || {});
  SB.SW = 1600; SB.SH = 960; SB.PW = 800;
  SB.RS = 1; // current raster scale while painting backgrounds
  SB.FONT = "'Yuanti SC','PingFang SC','Hiragino Sans GB','Microsoft YaHei',sans-serif";

  SB.rng = (seed) => {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  const clamp = (SB.clamp = (v, a, b) => (v < a ? a : v > b ? b : v));
  SB.lerp = (a, b, t) => a + (b - a) * t;
  SB.ease = {
    inOut: (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2),
    out: (t) => 1 - Math.pow(1 - t, 3),
    outBack: (t) => { const c1 = 1.7, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); },
    outElastic: (t) => (t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1),
    inQ: (t) => t * t,
  };
  SB.tri = (x) => 1 - Math.abs(((x % 2) + 2) % 2 - 1) * 2; // -1..1 triangle

  /* ---------- colour ---------- */
  const hslCache = new Map();
  function hexToHsl(hex) {
    let c = hslCache.get(hex);
    if (c) return c;
    let h = hex.replace('#', '');
    if (h.length === 3) h = h.split('').map((x) => x + x).join('');
    const r = parseInt(h.substr(0, 2), 16) / 255, g = parseInt(h.substr(2, 2), 16) / 255, b = parseInt(h.substr(4, 2), 16) / 255;
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
    let H = 0, S = 0; const L = (mx + mn) / 2;
    if (mx !== mn) {
      const d = mx - mn;
      S = L > 0.5 ? d / (2 - mx - mn) : d / (mx + mn);
      if (mx === r) H = (g - b) / d + (g < b ? 6 : 0);
      else if (mx === g) H = (b - r) / d + 2;
      else H = (r - g) / d + 4;
      H *= 60;
    }
    c = [H, S * 100, L * 100];
    hslCache.set(hex, c);
    return c;
  }
  SB.hexToHsl = hexToHsl;
  SB.hsl = (h, s, l, a = 1) => `hsla(${h.toFixed(1)},${clamp(s, 0, 100).toFixed(1)}%,${clamp(l, 0, 100).toFixed(1)}%,${a.toFixed(3)})`;
  SB.jit = (hex, r, dl = 7, ds = 6, dh = 4, a = 1) => {
    const [h, s, l] = hexToHsl(hex);
    return SB.hsl(h + (r() - 0.5) * 2 * dh, s + (r() - 0.5) * 2 * ds, l + (r() - 0.5) * 2 * dl, a);
  };
  SB.shade = (hex, dl, a = 1, ds = 0) => { const [h, s, l] = hexToHsl(hex); return SB.hsl(h, s + ds, l + dl, a); };
  SB.rgba = (hex, a) => { const [h, s, l] = hexToHsl(hex); return SB.hsl(h, s, l, a); };

  /* ---------- paths ---------- */
  SB.smooth = (ctx, pts, closed = true, move = true) => {
    const n = pts.length;
    const g = (i) => (closed ? pts[(i + n) % n] : pts[clamp(i, 0, n - 1)]);
    if (move) ctx.moveTo(pts[0][0], pts[0][1]); else ctx.lineTo(pts[0][0], pts[0][1]);
    const m = closed ? n : n - 1;
    for (let i = 0; i < m; i++) {
      const p0 = g(i - 1), p1 = g(i), p2 = g(i + 1), p3 = g(i + 2);
      ctx.bezierCurveTo(p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6, p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6, p2[0], p2[1]);
    }
    if (closed) ctx.closePath();
  };
  SB.poly = (ctx, pts) => { ctx.moveTo(pts[0][0], pts[0][1]); for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]); ctx.closePath(); };
  SB.blobPts = (cx, cy, rx, ry, n, amp, r) => {
    const out = []; const ph = r() * 6.28;
    for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2 + ph; const k = 1 + (r() - 0.5) * 2 * amp; out.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]); }
    return out;
  };
  SB.ridge = (x0, x1, step, fy, r, amp = 0) => { const pts = []; for (let x = x0; x <= x1 + 0.01; x += step) pts.push([x, fy(x) + (r() - 0.5) * 2 * amp]); return pts; };
  SB.interpY = (pts, x) => {
    if (x <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const a = pts[i - 1], b = pts[i]; return SB.lerp(a[1], b[1], (x - a[0]) / (b[0] - a[0])); }
    return pts[pts.length - 1][1];
  };
  SB.landPath = (top, bottom) => (c) => { SB.smooth(c, top, false); c.lineTo(top[top.length - 1][0], bottom); c.lineTo(top[0][0], bottom); c.closePath(); };
  SB.circles = (list) => (c) => { for (const p of list) { c.moveTo(p[0] + p[2], p[1]); c.arc(p[0], p[1], p[2], 0, Math.PI * 2); } };
  SB.star4 = (ctx, x, y, r, rot = 0, k = 0.3) => {
    for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4 + rot - Math.PI / 2; const rr = i % 2 ? r * k : r; const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.closePath();
  };
  SB.star5 = (ctx, x, y, r, rot = 0) => {
    for (let i = 0; i < 10; i++) { const a = (i * Math.PI) / 5 + rot - Math.PI / 2; const rr = i % 2 ? r * 0.45 : r; const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.closePath();
  };
  SB.heart = (ctx, x, y, s) => {
    ctx.moveTo(x, y + s * 0.35);
    ctx.bezierCurveTo(x - s * 1.1, y - s * 0.35, x - s * 0.45, y - s * 1.05, x, y - s * 0.45);
    ctx.bezierCurveTo(x + s * 0.45, y - s * 1.05, x + s * 1.1, y - s * 0.35, x, y + s * 0.35);
    ctx.closePath();
  };
  SB.ell = (ctx, x, y, rx, ry, rot = 0) => { ctx.moveTo(x + Math.cos(rot) * rx, y + Math.sin(rot) * rx); ctx.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot, 0, Math.PI * 2); };
  SB.fillEll = (ctx, x, y, rx, ry, col, rot = 0) => { ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, y, Math.abs(rx), Math.abs(ry), rot, 0, Math.PI * 2); ctx.fill(); };
  SB.fillCirc = (ctx, x, y, r, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, Math.abs(r), 0, Math.PI * 2); ctx.fill(); };

  /* ---------- crayon texture fill ---------- */
  SB.tex = (ctx, pathFn, base, o = {}) => {
    const r = o.r || Math.random;
    const [bx, by, bw, bh] = o.box || [0, 0, SB.SW, SB.SH];
    ctx.save();
    ctx.beginPath(); pathFn(ctx);
    if (!o.nofill) {
      if (o.shadow) { ctx.shadowColor = o.shadow; ctx.shadowBlur = (o.shadowBlur || 14) * SB.RS; ctx.shadowOffsetY = (o.shadowY || 0) * SB.RS; }
      ctx.fillStyle = base; ctx.fill();
      ctx.shadowColor = 'transparent';
    }
    ctx.clip();
    if (o.grad) o.grad(ctx, bx, by, bw, bh);
    const n = o.n != null ? o.n : Math.floor((bw * bh) / (o.dens || 700));
    ctx.lineCap = 'round';
    const ang = o.ang || 0, aj = o.aj != null ? o.aj : 0.25, len = o.len || 26, lw = o.lw || 2.6, sc = o.sc || base;
    const A = o.a != null ? o.a : 0.35;
    for (let i = 0; i < n; i++) {
      const x = bx + r() * bw, y = by + r() * bh;
      const L = len * (0.35 + r() * 0.9);
      const a = ang + (r() - 0.5) * 2 * aj;
      ctx.strokeStyle = SB.jit(sc, r, o.dl || 9, o.ds || 8, o.dh || 4, A * (0.35 + r() * 0.8));
      ctx.lineWidth = lw * (0.5 + r());
      const dx = (Math.cos(a) * L) / 2, dy = (Math.sin(a) * L) / 2;
      ctx.beginPath();
      ctx.moveTo(x - dx, y - dy);
      ctx.quadraticCurveTo(x + (r() - 0.5) * L * 0.25, y + (r() - 0.5) * L * 0.25, x + dx, y + dy);
      ctx.stroke();
    }
    if (o.speck) {
      const sp = o.speck;
      for (let i = 0; i < sp.n; i++) {
        ctx.fillStyle = sp.c[Math.floor(r() * sp.c.length)];
        ctx.globalAlpha = (sp.a != null ? sp.a : 0.6) * (0.5 + r() * 0.5);
        const s = (sp.s || 2) * (0.4 + r());
        ctx.beginPath(); ctx.arc(bx + r() * bw, by + r() * bh, s, 0, 6.283); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }
    if (o.after) o.after(ctx, r);
    ctx.restore();
    if (o.rim) {
      ctx.save(); ctx.beginPath(); pathFn(ctx); ctx.clip();
      ctx.strokeStyle = o.rim; ctx.lineWidth = o.rimW || 5; ctx.beginPath(); pathFn(ctx); ctx.stroke();
      ctx.restore();
    }
  };

  /* ---------- grain ---------- */
  let grainCv = null, mottleCv = null;
  SB.grainCanvas = () => {
    if (grainCv) return grainCv;
    const c = document.createElement('canvas'); c.width = c.height = 256;
    const g = c.getContext('2d'); const id = g.createImageData(256, 256);
    for (let i = 0; i < id.data.length; i += 4) { const v = 128 + (Math.random() - 0.5) * 120; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    g.putImageData(id, 0, 0); grainCv = c; return c;
  };
  SB.mottleCanvas = () => {
    if (mottleCv) return mottleCv;
    const c = document.createElement('canvas'); c.width = c.height = 512;
    const g = c.getContext('2d'); g.fillStyle = 'rgb(128,128,128)'; g.fillRect(0, 0, 512, 512);
    const r = SB.rng(77);
    for (let i = 0; i < 900; i++) {
      const x = r() * 512, y = r() * 512, rad = 6 + r() * 40, v = r() < 0.5 ? 0 : 255;
      for (const ox of [-512, 0, 512]) for (const oy of [-512, 0, 512]) {
        const gr = g.createRadialGradient(x + ox, y + oy, 0, x + ox, y + oy, rad);
        gr.addColorStop(0, `rgba(${v},${v},${v},0.05)`); gr.addColorStop(1, `rgba(${v},${v},${v},0)`);
        g.fillStyle = gr; g.fillRect(x + ox - rad, y + oy - rad, rad * 2, rad * 2);
      }
    }
    // paper fibres
    g.lineCap = 'round';
    for (let i = 0; i < 260; i++) {
      const x = r() * 512, y = r() * 512, a = r() * 6.28, L = 6 + r() * 22;
      g.strokeStyle = r() < 0.5 ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)';
      g.lineWidth = 0.6 + r() * 0.8;
      g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + 0.5) * L * 0.5, y + Math.sin(a + 0.5) * L * 0.5, x + Math.cos(a) * L, y + Math.sin(a) * L); g.stroke();
    }
    mottleCv = c; return c;
  };
  // applies grain in device pixel space (call with identity transform)
  SB.grainPass = (ctx, w, h, a1 = 0.16, a2 = 0.5) => {
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'overlay';
    ctx.globalAlpha = a1; ctx.fillStyle = ctx.createPattern(SB.grainCanvas(), 'repeat'); ctx.fillRect(0, 0, w, h);
    if (a2 > 0) { ctx.globalCompositeOperation = 'soft-light'; ctx.globalAlpha = a2; ctx.fillStyle = ctx.createPattern(SB.mottleCanvas(), 'repeat'); ctx.fillRect(0, 0, w, h); }
    ctx.restore();
  };

  /* ---------- text helpers ---------- */
  SB.outlineText = (ctx, text, x, y, size, fill, stroke, sw, weight = 700, align = 'left') => {
    ctx.font = `${weight} ${size}px ${SB.FONT}`;
    ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.lineJoin = 'round';
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = sw; ctx.strokeText(text, x, y); }
    ctx.fillStyle = fill; ctx.fillText(text, x, y);
  };
  SB.roundRect = (ctx, x, y, w, h, r) => {
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  };

  /* ---------- particles ---------- */
  SB.FX = class {
    constructor() { this.p = []; }
    add(o) { const q = Object.assign({ t: 0, life: 1, x: 0, y: 0, vx: 0, vy: 0, g: 0, rot: 0, vr: 0, s: 1, c: '#fff', a: 1 }, o); this.p.push(q); return q; }
    burst(type, x, y, n, o = {}) {
      for (let i = 0; i < n; i++) {
        const a = Math.random() * Math.PI * 2, sp = (o.speed || 160) * (0.4 + Math.random() * 0.8);
        this.add(Object.assign({ type, x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (o.up || 0), life: (o.life || 0.9) * (0.7 + Math.random() * 0.6), s: (o.s || 1) * (0.6 + Math.random() * 0.8), c: o.cols ? o.cols[i % o.cols.length] : o.c || '#ffd84a', g: o.g || 0, rot: Math.random() * 6, vr: (Math.random() - 0.5) * 6, drag: o.drag || 0.2 }, o.extra || {}));
      }
    }
    say(x, y, text, o = {}) { return this.add(Object.assign({ type: 'say', x, y, text, life: o.life || 1.8, s: o.s || 30, c: o.c || '#4a3a34' }, o)); }
    pop(x, y, text, o = {}) { return this.add(Object.assign({ type: 'text', x, y, text, vy: -60, life: 1.3, s: 38, c: '#e5673c' }, o)); }
    update(dt) {
      for (const q of this.p) {
        q.t += dt; q.vy += q.g * dt;
        if (q.drag) { const k = Math.pow(q.drag, dt); q.vx *= k; q.vy *= k; }
        q.x += q.vx * dt; q.y += q.vy * dt; q.rot += q.vr * dt;
        if (q.onUpdate) q.onUpdate(q, dt);
      }
      this.p = this.p.filter((q) => q.t < q.life);
    }
    draw(ctx) {
      for (const q of this.p) {
        const k = q.t / q.life;
        ctx.save();
        switch (q.type) {
          case 'spark': {
            const s = q.s * 11 * Math.sin(Math.min(1, k * 1.3) * Math.PI);
            ctx.globalAlpha = q.a; ctx.fillStyle = q.c; ctx.beginPath(); SB.star4(ctx, q.x, q.y, s, q.rot * 0.2); ctx.fill();
            break;
          }
          case 'dot': ctx.globalAlpha = q.a * (1 - k); SB.fillCirc(ctx, q.x, q.y, q.s * 4, q.c); break;
          case 'glow': {
            ctx.globalAlpha = q.a * Math.sin(k * Math.PI);
            const g = ctx.createRadialGradient(q.x, q.y, 0, q.x, q.y, q.s * 18); g.addColorStop(0, q.c); g.addColorStop(1, 'rgba(255,255,200,0)');
            ctx.fillStyle = g; ctx.fillRect(q.x - q.s * 18, q.y - q.s * 18, q.s * 36, q.s * 36);
            break;
          }
          case 'heart': ctx.globalAlpha = q.a * (1 - k * k); ctx.fillStyle = q.c; ctx.beginPath(); SB.heart(ctx, q.x, q.y, q.s * 12 * (0.6 + SB.ease.outBack(Math.min(1, k * 3)) * 0.4)); ctx.fill(); break;
          case 'note': {
            ctx.globalAlpha = q.a * (1 - k * k);
            ctx.translate(q.x, q.y); ctx.rotate(Math.sin(q.t * 6) * 0.25);
            SB.outlineText(ctx, q.glyph || '♪', 0, 0, 30 * q.s, q.c, '#fff', 5, 700, 'center');
            break;
          }
          case 'drop': ctx.globalAlpha = q.a * (1 - k * 0.3); ctx.fillStyle = q.c; ctx.beginPath(); ctx.ellipse(q.x, q.y, 2.2 * q.s, 7 * q.s, Math.atan2(q.vx, q.vy) * -1, 0, 6.283); ctx.fill(); break;
          case 'ring': {
            ctx.globalAlpha = q.a * (1 - k); ctx.strokeStyle = q.c; ctx.lineWidth = 2.5 * (1 - k) + 0.5;
            ctx.beginPath(); ctx.ellipse(q.x, q.y, 6 + k * 60 * q.s, (6 + k * 60 * q.s) * 0.3, 0, 0, 6.283); ctx.stroke();
            break;
          }
          case 'petal': case 'leaf': {
            ctx.globalAlpha = q.a * (1 - Math.max(0, k - 0.7) / 0.3);
            ctx.translate(q.x + (q.type === 'leaf' ? Math.sin(q.t * 3 + q.rot) * 10 : 0), q.y); ctx.rotate(q.rot);
            ctx.fillStyle = q.c; ctx.beginPath(); ctx.ellipse(0, 0, (q.type === 'leaf' ? 2.5 : 6) * q.s, (q.type === 'leaf' ? 9 : 4) * q.s, 0, 0, 6.283); ctx.fill();
            break;
          }
          case 'puff': {
            ctx.globalAlpha = q.a * (1 - k) * 0.8; SB.fillCirc(ctx, q.x, q.y, q.s * (10 + k * 26), q.c);
            break;
          }
          case 'gust': {
            // wind stroke: a curled line travelling
            ctx.globalAlpha = q.a * Math.sin(k * Math.PI);
            ctx.strokeStyle = q.c; ctx.lineWidth = 5 * q.s; ctx.lineCap = 'round';
            const L = 140 * q.s;
            ctx.beginPath();
            for (let i = 0; i <= 12; i++) { const u = i / 12; const xx = q.x + Math.cos(q.rot) * u * L - Math.sin(q.rot) * Math.sin(u * 7 + q.t * 8) * 8; const yy = q.y + Math.sin(q.rot) * u * L + Math.cos(q.rot) * Math.sin(u * 7 + q.t * 8) * 8; i ? ctx.lineTo(xx, yy) : ctx.moveTo(xx, yy); }
            ctx.stroke();
            // curl at head
            const hx = q.x + Math.cos(q.rot) * L, hy = q.y + Math.sin(q.rot) * L;
            ctx.beginPath(); ctx.arc(hx, hy - 12 * q.s, 12 * q.s, Math.PI * 0.5, Math.PI * 2.1); ctx.stroke();
            break;
          }
          case 'text': {
            const sc = SB.ease.outBack(Math.min(1, k * 4));
            ctx.globalAlpha = q.a * (k > 0.75 ? 1 - (k - 0.75) / 0.25 : 1);
            ctx.translate(q.x, q.y); ctx.scale(sc, sc); ctx.rotate(q.rot0 || 0);
            SB.outlineText(ctx, q.text, 0, 0, q.s, q.c, '#fffdf6', q.s * 0.28, 800, 'center');
            break;
          }
          case 'say': {
            const sc = SB.ease.outBack(Math.min(1, k * 5));
            ctx.globalAlpha = q.a * (k > 0.82 ? 1 - (k - 0.82) / 0.18 : 1);
            ctx.font = `700 ${q.s}px ${SB.FONT}`;
            const lines = q.text.split('\n');
            const w = Math.max(...lines.map((l) => ctx.measureText(l).width)) + q.s * 1.1, h = lines.length * q.s * 1.3 + q.s * 0.7;
            const side = q.side || 1;
            ctx.translate(q.x, q.y); ctx.scale(sc, sc);
            const bx = side > 0 ? -w * 0.22 : -w * 0.78, by = -h - q.s * 0.8;
            ctx.shadowColor = 'rgba(40,40,60,0.18)'; ctx.shadowBlur = 10; ctx.shadowOffsetY = 3;
            ctx.fillStyle = q.bg || '#fffdf7';
            ctx.beginPath(); SB.roundRect(ctx, bx, by, w, h, Math.min(h / 2, q.s * 0.9)); ctx.fill();
            ctx.beginPath(); ctx.moveTo(side > 0 ? bx + w * 0.16 : bx + w * 0.7, by + h - 2); ctx.lineTo(0, 0); ctx.lineTo(side > 0 ? bx + w * 0.3 : bx + w * 0.84, by + h - 2); ctx.fill();
            ctx.shadowColor = 'transparent';
            lines.forEach((l, i) => SB.outlineText(ctx, l, bx + w / 2, by + q.s * 0.35 + (i + 0.5) * q.s * 1.3, q.s, q.c, null, 0, 700, 'center'));
            break;
          }
          case 'z': {
            ctx.globalAlpha = q.a * Math.sin(k * Math.PI);
            SB.outlineText(ctx, 'z', q.x + Math.sin(q.t * 3) * 8, q.y, q.s * 26 * (0.6 + k * 0.6), q.c, '#fff', 4, 800, 'center');
            break;
          }
          case 'star': {
            ctx.globalAlpha = q.a * (1 - k);
            ctx.fillStyle = q.c; ctx.beginPath(); SB.star5(ctx, q.x, q.y, q.s * 9, q.rot); ctx.fill();
            break;
          }
          case 'custom': q.draw(ctx, q, k); break;
        }
        ctx.restore();
      }
    }
  };

  /* ---------- painters (static backgrounds) ---------- */
  const P = (SB.P = {});
  P.paperTop = (ctx, r, col = '#f4eee1', o = {}) => {
    const off = r() * 10;
    const f = (x) => (o.y || 30) + Math.sin(x * 0.0085 + off) * 11 + Math.sin(x * 0.021 + off * 2) * 5;
    SB.tex(ctx, (c) => { c.moveTo(-5, -5); c.lineTo(1605, -5); for (let x = 1605; x >= -5; x -= 16) c.lineTo(x, f(x)); c.closePath(); }, col, { r, box: [0, 0, 1600, 60], dens: 220, len: 12, lw: 1.5, a: 0.22, speck: { n: 160, c: ['#e0d2b7', '#d6c6a6', '#ffffff'], s: 1.4 }, shadow: 'rgba(40,60,90,0.18)', shadowBlur: 8, shadowY: 2 });
    ctx.save(); ctx.setLineDash([7, 9]); ctx.strokeStyle = o.dash || 'rgba(106,142,196,0.6)'; ctx.lineWidth = 2;
    ctx.beginPath(); for (let x = 0; x <= 1600; x += 8) { const y = f(x) - 12 + Math.sin(x * 0.017 + 1) * 4; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.stroke(); ctx.restore();
    const cols = ['#f29e9e', '#9ec5f2', '#b8a3ee', '#f2cf8e', '#9fd9b8'];
    for (let i = 0; i < 46; i++) { const x = r() * 1600; const y = 4 + r() * (f(x) - 14); SB.fillCirc(ctx, x, y, 1.3 + r() * 1.6, cols[i % 5]); }
    for (let i = 0; i < 12; i++) { const x = 40 + r() * 1520; const y = 8 + r() * (f(x) - 22); ctx.fillStyle = '#f0bf45'; ctx.beginPath(); SB.star4(ctx, x, y, 5 + r() * 5, 0, 0.32); ctx.fill(); }
    return f;
  };
  P.sky = (ctx, r, base = '#72a2dc', o = {}) => {
    const h = o.h || 960;
    SB.tex(ctx, (c) => c.rect(0, 0, 1600, h), base, {
      r, box: [0, 0, 1600, h], dens: o.dens || 330, len: 48, lw: 3.4, ang: 0, aj: 0.05, a: o.a || 0.32, dl: 8, ds: 7,
      grad: (c) => { if (o.glow !== false) { const g = c.createLinearGradient(0, 0, 0, h); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, o.glowCol || 'rgba(255,255,255,0.22)'); c.fillStyle = g; c.fillRect(0, 0, 1600, h); } },
    });
  };
  P.streak = (ctx, x, y, len, th, rot = -0.06, a = 0.93) => {
    ctx.save(); ctx.translate(x, y); ctx.rotate(rot);
    ctx.beginPath(); ctx.moveTo(-len / 2, th * 0.3); ctx.quadraticCurveTo(-len * 0.1, -th * 1.5, len / 2, -th * 0.3); ctx.quadraticCurveTo(0, th * 0.7, -len / 2, th * 0.3);
    ctx.fillStyle = `rgba(255,255,255,${a})`; ctx.fill(); ctx.restore();
  };
  P.cloudPath = (x, y, w, h, r) => {
    const circles = []; const n = Math.max(3, Math.round(w / (h * 0.75)));
    for (let i = 0; i < n; i++) { const u = (i + 0.5) / n; const cx = x - w / 2 + u * w; const rad = h * (0.32 + Math.sin(u * Math.PI) * 0.42) * (0.85 + r() * 0.35); circles.push([cx, y - rad * 0.6, rad]); }
    return (c) => { SB.circles(circles)(c); c.moveTo(x - w / 2, y); SB.roundRect(c, x - w / 2 - h * 0.1, y - h * 0.34, w + h * 0.2, h * 0.36, h * 0.17); };
  };
  P.cloud = (ctx, r, x, y, w, h, col = '#fbfaf5', shade = '#e2e8ef') => {
    const path = P.cloudPath(x, y, w, h, r);
    SB.tex(ctx, path, col, { r, box: [x - w / 2 - h, y - h * 1.3, w + h * 2, h * 1.5], dens: 160, len: 18, lw: 2, a: 0.18, sc: '#dde4ec', after: (c) => { SB.fillEll(c, x, y + h * 0.06, w * 0.58, h * 0.26, SB.rgba(shade, 0.85)); } });
  };
  P.forest = (ctx, r, top, bottom, o = {}) => {
    const pal = o.pal || ['#173d2a', '#1d4a33', '#245a3c', '#2c6a45', '#35794f', '#43885a'];
    const path = (c) => { SB.poly(c, top.concat([[top[top.length - 1][0], bottom], [top[0][0], bottom]])); };
    const minY = Math.min(...top.map((p) => p[1])); const x0 = top[0][0], x1 = top[top.length - 1][0];
    const sx = o.sx || 7, sy = o.sy || 7.5, th = o.th || 15;
    const tree = (x, y, h, w, col) => { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y - h); ctx.lineTo(x + w / 2, y); ctx.lineTo(x - w / 2, y); ctx.closePath(); ctx.fill(); };
    const pick = (x, y) => {
      const n = Math.sin(x * 0.013 + y * 0.004 + (o.ph || 0)) * 0.5 + Math.sin(x * 0.004 - y * 0.012 + 2) * 0.5;
      let lightK = o.light ? (1 - (y - minY) / (bottom - minY)) * 0.8 : 0;
      let idx = Math.floor((n * 0.5 + 0.5 + lightK * 0.3) * pal.length * 0.999 + (r() - 0.5) * 2.4);
      return pal[clamp(idx, 0, pal.length - 1)];
    };
    ctx.save();
    if (o.shadow) { ctx.shadowColor = o.shadow; ctx.shadowBlur = 16 * SB.RS; }
    ctx.beginPath(); path(ctx); ctx.fillStyle = o.base || pal[1]; ctx.fill(); ctx.shadowColor = 'transparent';
    ctx.clip();
    for (let y = minY; y < bottom + th; y += sy) {
      for (let x = x0 - 10; x < x1 + 10; x += sx * (0.8 + r() * 0.4)) {
        const h = th * (0.7 + r() * 0.6);
        tree(x + (r() - 0.5) * 3, y + (r() - 0.5) * 3, h, h * (0.5 + r() * 0.15), pick(x, y));
      }
    }
    if (o.haze) { const g = ctx.createLinearGradient(0, minY, 0, bottom); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, o.haze); ctx.fillStyle = g; ctx.fillRect(x0, minY, x1 - x0, bottom - minY); }
    ctx.restore();
    // ridge silhouette trees
    for (let x = x0; x <= x1; x += sx * 0.9) {
      const y = SB.interpY(top, x) + 5;
      const h = th * (0.8 + r() * 0.6);
      tree(x + (r() - 0.5) * 3, y, h, h * 0.55, pick(x, y));
    }
    return path;
  };
  P.land = (ctx, r, top, bottom, base, o = {}) => {
    const path = SB.landPath(top, bottom); const minY = Math.min(...top.map((p) => p[1]));
    SB.tex(ctx, path, base, Object.assign({ r, box: [top[0][0], minY - 10, top[top.length - 1][0] - top[0][0], bottom - minY + 10] }, o));
    return path;
  };
  P.grassOpts = (extra) => Object.assign({ ang: -Math.PI / 2, aj: 0.35, len: 15, lw: 2.2, dens: 130, a: 0.45, dl: 10 }, extra || {});
  P.water = (ctx, r, path, box, base = '#4db7c6', o = {}) => {
    SB.tex(ctx, path, base, {
      r, box, dens: 260, len: 44, lw: 3, aj: 0.04, a: 0.4, sc: o.sc || '#63c6d2', shadow: o.shadow,
      after: (c) => {
        c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 2; c.lineCap = 'round';
        const n = (box[2] * box[3]) / (o.waveDens || 4200);
        for (let i = 0; i < n; i++) {
          const x = box[0] + r() * box[2], y = box[1] + r() * box[3], w = 4 + r() * 5;
          c.globalAlpha = 0.5 + r() * 0.5;
          c.beginPath(); c.moveTo(x - w, y); c.quadraticCurveTo(x - w / 2, y - 4, x, y); c.quadraticCurveTo(x + w / 2, y - 4, x + w, y); c.stroke();
        }
        c.globalAlpha = 1;
      },
    });
  };
  P.sandOpts = (box, extra) => Object.assign({ box, dens: 700, len: 14, lw: 1.8, a: 0.28, speck: { n: Math.floor((box[2] * box[3]) / 140), c: ['#bca98b', '#a8977c', '#d88e8e', '#8ea8cb', '#ffffff', '#c9b28d'], s: 1.4, a: 0.7 } }, extra || {});
  P.pine = (ctx, r, x, y, h, col = '#2c6a45', o = {}) => {
    ctx.save();
    SB.fillEll(ctx, x, y, h * 0.16, h * 0.025, 'rgba(0,0,0,0.12)');
    ctx.fillStyle = o.trunk || '#5b3d2b'; ctx.fillRect(x - h * 0.028, y - h * 0.22, h * 0.056, h * 0.22);
    const tiers = o.tiers || 5;
    for (let i = 0; i < tiers; i++) {
      const top = y - h + i * h * 0.15, bot = top + h * 0.3 + i * h * 0.015, hw = h * (0.1 + i * 0.045);
      const pts = [[x, top]]; const teeth = 5 + i;
      for (let k = 0; k <= teeth; k++) { const u = k / teeth; pts.push([x + hw - u * 2 * hw, bot + (k % 2 ? -h * 0.03 : 0) + Math.sin(u * 3.14) * h * 0.015]); }
      const c = SB.shade(col, -i * 2.5);
      SB.tex(ctx, (cx) => SB.poly(cx, pts), c, { r, box: [x - hw, top, hw * 2, bot - top + 5], dens: 60, len: 12, lw: 2, ang: 0.6, aj: 0.6, a: 0.5, dl: 12, shadow: 'rgba(0,0,0,0.18)', shadowBlur: 6, shadowY: 3 });
    }
    ctx.restore();
  };
  P.bush = (ctx, r, x, y, w, h, col = '#5d9a4a') => {
    const list = []; const n = Math.max(3, Math.round(w / (h * 0.6)));
    for (let i = 0; i < n; i++) { const u = (i + 0.5) / n; list.push([x - w / 2 + u * w, y - h * 0.4 - Math.sin(u * Math.PI) * h * 0.25, h * (0.35 + Math.sin(u * Math.PI) * 0.25)]); }
    const path = (c) => { SB.circles(list)(c); c.moveTo(x - w / 2, y); c.rect(x - w / 2, y - h * 0.45, w, h * 0.45); };
    SB.tex(ctx, path, col, { r, box: [x - w / 2 - h, y - h * 1.2, w + h * 2, h * 1.3], dens: 60, len: 10, lw: 2.2, aj: 3, a: 0.55, dl: 12, shadow: 'rgba(0,0,0,0.15)', shadowBlur: 8, shadowY: 3, after: (c) => { for (let i = 0; i < w / 10; i++) SB.fillCirc(c, x - w / 2 + r() * w, y - r() * h, 1.5 + r() * 2, SB.shade(col, 14, 0.7)); } });
  };
  P.house = (ctx, r, x, y, w, h, roof = '#d9573f', o = {}) => {
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.15)'; ctx.shadowBlur = 5 * SB.RS; ctx.shadowOffsetY = 2 * SB.RS;
    ctx.fillStyle = o.wall || '#f5f2eb'; ctx.fillRect(x - w / 2, y - h, w, h);
    ctx.shadowColor = 'transparent';
    ctx.fillStyle = 'rgba(0,0,0,0.08)'; ctx.fillRect(x + w * 0.15, y - h, w * 0.35, h);
    ctx.fillStyle = roof; ctx.beginPath(); ctx.moveTo(x - w / 2 - w * 0.08, y - h); ctx.lineTo(x - w * 0.2, y - h - h * 0.55); ctx.lineTo(x + w * 0.25, y - h - h * 0.55); ctx.lineTo(x + w / 2 + w * 0.06, y - h); ctx.closePath(); ctx.fill();
    ctx.fillStyle = o.win || '#3d5a7a';
    const nw = Math.max(1, Math.round(w / 22));
    for (let i = 0; i < nw; i++) ctx.fillRect(x - w / 2 + (i + 0.5) * (w / nw) - 3.5, y - h * 0.7, 7, 7);
    ctx.restore();
  };
  P.flowerDot = (ctx, x, y, s, col) => {
    for (let i = 0; i < 5; i++) { const a = (i / 5) * 6.283; SB.fillCirc(ctx, x + Math.cos(a) * s, y + Math.sin(a) * s, s * 0.8, col); }
    SB.fillCirc(ctx, x, y, s * 0.6, '#f7d24a');
  };
  P.grassTufts = (ctx, r, x0, x1, fy, n, col) => {
    ctx.save(); ctx.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const x = x0 + r() * (x1 - x0), y = fy(x) + r() * 12; const h = 8 + r() * 12;
      ctx.strokeStyle = SB.jit(col, r, 10); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x - 5, y - h * 0.8); ctx.quadraticCurveTo(x - 2, y - 2, x, y); ctx.quadraticCurveTo(x + 1, y - h * 0.5, x + 1, y - h); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + 2, y - 2, x + 6, y - h * 0.7); ctx.stroke();
    }
    ctx.restore();
  };
  P.endpaper = (ctx, r, x0, x1, bg = '#dbeaf4') => {
    ctx.save(); ctx.beginPath(); ctx.rect(x0, 0, x1 - x0, 960); ctx.clip();
    SB.tex(ctx, (c) => c.rect(x0, 0, x1 - x0, 960), bg, { r, box: [x0, 0, x1 - x0, 960], dens: 500, len: 30, lw: 2.4, a: 0.25 });
    let row = 0;
    for (let y = 40; y < 1000; y += 110, row++) {
      for (let x = x0 + (row % 2 ? 55 : 0) + 20; x < x1 + 60; x += 110) {
        const k = (Math.floor(x / 110) + row) % 3;
        if (k === 0) { ctx.save(); ctx.globalAlpha = 0.9; SB.C.cloud(ctx, { x, y, s: 0.28, mood: 'happy', t: 0, float: 0 }); ctx.restore(); }
        else if (k === 1) { ctx.save(); ctx.globalAlpha = 0.85; SB.C.lamb(ctx, { x, y: y + 22, s: 0.26, t: 0 }); ctx.restore(); }
        else { ctx.fillStyle = '#f3c75a'; ctx.beginPath(); SB.star4(ctx, x, y, 9, 0.2, 0.34); ctx.fill(); SB.fillCirc(ctx, x + 18, y + 14, 2.5, '#f3a0a0'); }
      }
    }
    ctx.restore();
  };
  P.creamPaper = (ctx, r, x0, x1, col = '#f7f1e4') => {
    SB.tex(ctx, (c) => c.rect(x0, 0, x1 - x0, 960), col, { r, box: [x0, 0, x1 - x0, 960], dens: 900, len: 20, lw: 1.6, a: 0.2, speck: { n: 500, c: ['#d9c9a8', '#e7dcc4', '#c9b894'], s: 1.2, a: 0.5 } });
  };
})();
