import { drawRoom, clearScenery } from './scenery.js';

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
const lerp = (a, b, t) => a + (b - a) * t;

const COLD_SHAPE = [[0, 1, 0.13], [0.42, 0.68, 0.07], [1, 0.46, 0]];
const WARM_SHAPE = [[0, 1.16, 0.3], [0.15, 0.88, 0.2], [0.5, 0.5, 0.08], [1, 0.34, 0]];

const mixRgb = (a, b, k) => [
  a[0] + (b[0] - a[0]) * k,
  a[1] + (b[1] - a[1]) * k,
  a[2] + (b[2] - a[2]) * k
];
const rgbString = (base, mul) =>
  `${Math.min(255, Math.round(base[0] * mul))}, ${Math.min(255, Math.round(base[1] * mul))}, ${Math.min(255, Math.round(base[2] * mul))}`;

export function createAmbient({ canvas, reduceMotion, room }) {
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return stub();

  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  let dpr = 1;
  let w = 0;
  let h = 0;
  let particles = [];
  const dust = [];

  const pointer = { tx: 0, ty: 0, x: 0, y: 0 };

  const modes = {
    gate:    { pool: 0.85, poolY: 0.30, warm: 0.55, warmY: 0.50, rise: 1,    fall: 0, gather: 0 },
    confirm: { pool: 0.55, poolY: 0.34, warm: 1.50, warmY: 0.50, rise: 0.3,  fall: 0, gather: 1 },
    dive:    { pool: 0.40, poolY: 0.60, warm: 0.90, warmY: 0.90, rise: 1,    fall: 1, gather: 0 },
    page:    { pool: 0.62, poolY: 0.16, warm: 0.30, warmY: 0.26, rise: 1,    fall: 0, gather: 0 },

    paused:  { pool: 0.7,  poolY: 0.34, warm: 0.62, warmY: 0.5,  rise: 0.34, fall: 0, gather: 0.22 }
  };
  const EASED = ['pool', 'poolY', 'warm', 'warmY', 'rise', 'fall', 'gather'];

  const FIELD_KEYS = ['dir', 'speed', 'sway', 'twinkle', 'streak', 'size', 'drift', 'dash'];
  const paletteOf = (theme) => ({
    cold: [...theme.cold], warm: [...theme.warm], spore: [...theme.spore], ember: [...theme.ember],
    field: { ...theme.field }
  });
  let target = paletteOf(room ?? { cold: [86, 122, 178], warm: [255, 120, 110], spore: [198, 214, 240], ember: [255, 176, 128], field: { dir: -1, speed: 1, sway: 1, twinkle: 1, streak: 0, size: 1, drift: 0, dash: 0 } });
  const live = paletteOf(target);
  const FALLBACK_ROOM = { id: 'abismo', cold: [86, 122, 178], warm: [255, 120, 110], spore: [198, 214, 240], ember: [255, 176, 128] };
  let roomFrom = room ?? FALLBACK_ROOM;
  let roomTo = roomFrom;
  let blend = 1;

  let modeName = 'gate';
  let mode = modes.gate;
  const state = { ...modes.gate, flash: 0, shake: 0, scroll: 0 };

  let scrollTarget = 0;
  const readScroll = () => {
    const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    scrollTarget = clamp(window.scrollY / max, 0, 1);
  };

  const densityFor = (area) => {
    if (reduceMotion) return Math.min(30, Math.round(area / 46000));
    const base = area / (w < 640 ? 21000 : w < 1024 ? 15000 : 12000);
    return clamp(Math.round(base), 20, 110);
  };

  const build = () => {
    const count = densityFor(w * h);
    particles = Array.from({ length: count }, () => {
      const z = Math.random();
      const ember = Math.random() < 0.14;
      return {
        bx: Math.random(),
        by: Math.random(),
        z,

        rise: (0.012 + Math.random() * 0.03) * (0.35 + z),
        sway: 0.0004 + Math.random() * 0.0011,
        phase: Math.random() * Math.PI * 2,
        amp: 0.004 + Math.random() * 0.014,
        r: (0.45 + z * 1.6) * (ember ? 1.3 : 1),
        ember,
        tw: Math.random() * Math.PI * 2,
        tws: 0.5 + Math.random() * 1.3
      };
    });
  };

  const resize = () => {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    build();
  };

  const drawPool = (cx, cy, intensity, radius, base, shape) => {
    if (intensity <= 0.002) return;
    const i = clamp(intensity, 0, 2);
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    for (const [at, mul, alpha] of shape) grad.addColorStop(at, `rgba(${rgbString(base, mul)}, ${alpha * i})`);
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = grad;
    ctx.fillRect(cx - radius, cy - radius, radius * 2, radius * 2);
    ctx.globalCompositeOperation = 'source-over';
  };

  const drawDust = (cx, cy, now) => {
    for (let i = dust.length - 1; i >= 0; i -= 1) {
      const d = dust[i];
      const p = (now - d.t0) / d.life;
      if (p >= 1) { dust.splice(i, 1); continue; }
      if (p < 0) continue;
      const radius = (1 - (1 - p) ** 2.4) * d.max;
      const alpha = (1 - p) ** 2 * d.strength;
      ctx.globalCompositeOperation = 'lighter';
      ctx.beginPath();
      ctx.ellipse(cx, cy, radius, radius * 0.42, 0, 0, Math.PI * 2);
      ctx.lineWidth = lerp(d.width, 0.6, p);
      ctx.strokeStyle = `rgba(226, 214, 190, ${alpha})`;
      ctx.stroke();
      ctx.globalCompositeOperation = 'source-over';
    }
  };

  let raf = 0;
  let last = 0;
  const render = (now) => {
    raf = requestAnimationFrame(render);
    const dt = last ? clamp((now - last) / 16.67, 0, 3) : 1;
    last = now;

    const k = 1 - (1 - 0.055) ** dt;
    for (const key of EASED) state[key] = lerp(state[key], mode[key], k);
    state.flash = lerp(state.flash, 0, 1 - (1 - 0.1) ** dt);
    state.shake = lerp(state.shake, 0, 1 - (1 - 0.14) ** dt);
    state.scroll = lerp(state.scroll, scrollTarget, 1 - (1 - 0.06) ** dt);

    const rk = 1 - (1 - 0.035) ** dt;
    live.cold = mixRgb(live.cold, target.cold, rk);
    live.warm = mixRgb(live.warm, target.warm, rk);
    live.spore = mixRgb(live.spore, target.spore, rk);
    live.ember = mixRgb(live.ember, target.ember, rk);
    for (const key of FIELD_KEYS) live.field[key] = lerp(live.field[key], target.field[key], rk);
    const field = live.field;

    const pk = 1 - (1 - 0.07) ** dt;
    pointer.x = lerp(pointer.x, pointer.tx, pk);
    pointer.y = lerp(pointer.y, pointer.ty, pk);

    ctx.clearRect(0, 0, w, h);

    const shakeY = state.shake * Math.sin(now * 0.05) * 5;
    const parallax = 1 - state.fall * 0.7;
    const px = pointer.x * parallax;
    const py = pointer.y * parallax;

    const camera = state.scroll;
    const poolX = w * 0.5 + px * 34;
    const poolY = h * (state.poolY + camera * 0.26) + py * 24 + shakeY;
    const warmX = w * 0.5 + px * 20;
    const warmY = h * (state.warmY + camera * 0.14) + py * 16 + shakeY;

    drawPool(poolX, poolY, state.pool, Math.min(w, h) * 0.72, live.cold, COLD_SHAPE);

    blend = Math.min(1, blend + dt * 0.014);
    const env = {
      w, h, now, dpr,
      px: px * (1 - state.fall * 0.5),
      py: py * (1 - state.fall * 0.5),
      camera: state.scroll,
      drift: state.fall,
      alpha: 1
    };
    const presence = 1 - state.fall * 0.5;
    if (blend < 1 && roomFrom !== roomTo) {
      drawRoom(ctx, roomFrom, { ...env, alpha: (1 - blend) * presence });
      drawRoom(ctx, roomTo, { ...env, alpha: blend * presence });
    } else {
      drawRoom(ctx, roomTo, { ...env, alpha: presence });
    }

    drawPool(warmX, warmY, state.warm + state.flash * 1.2, Math.min(w, h) * (0.3 + state.gather * 0.06), live.warm, WARM_SHAPE);

    const sporeRgb = `${Math.round(live.spore[0])}, ${Math.round(live.spore[1])}, ${Math.round(live.spore[2])}`;
    const emberRgb = `${Math.round(live.ember[0])}, ${Math.round(live.ember[1])}, ${Math.round(live.ember[2])}`;

    for (const pt of particles) {

      pt.by += field.dir * pt.rise * 0.0016 * field.speed * state.rise * dt;
      pt.by -= pt.rise * 0.06 * state.fall * dt * (0.4 + pt.z);
      pt.phase += pt.sway * 16 * dt;
      if (pt.by < -0.05) { pt.by += 1.1; pt.bx = Math.random(); }
      else if (pt.by > 1.05) { pt.by -= 1.1; pt.bx = Math.random(); }

      if (field.drift < -0.02 || field.drift > 0.02) {
        pt.bx += field.drift * pt.rise * 0.0016 * dt * (0.5 + pt.z);
        if (pt.bx < -0.1) { pt.bx += 1.2; pt.by = Math.random(); }
        else if (pt.bx > 1.1) { pt.bx -= 1.2; pt.by = Math.random(); }
      }

      let x = (pt.bx + Math.sin(pt.phase) * pt.amp * field.sway) * w;

      const span = h * 1.1;
      let y = pt.by * h - camera * h * 0.42 * (0.22 + pt.z * 0.78);
      y = ((y + h * 0.05) % span + span) % span - h * 0.05;
      x += px * (12 + pt.z * 40);
      y += py * (9 + pt.z * 28) + shakeY * (0.4 + pt.z);

      if (state.gather > 0.002) {
        const g = state.gather * (0.3 + pt.z * 0.6);
        x = lerp(x, warmX, g);
        y = lerp(y, warmY, g);
      }

      const swing = clamp(field.twinkle, 0, 3);
      const tw = clamp(0.5 + Math.sin(now * 0.001 * pt.tws + pt.tw) * 0.5 * swing, 0.06, 1.35);
      const alpha = (pt.ember ? 0.55 : 0.3) * tw * (0.45 + pt.z * 0.55) * (1 + state.gather * 0.5);
      const colour = pt.ember
        ? `rgba(${emberRgb}, ${clamp(alpha, 0, 0.9)})`
        : `rgba(${sporeRgb}, ${clamp(alpha, 0, 0.62)})`;

      const streak = state.fall * (18 + pt.z * 74) + field.streak * (7 + pt.z * 26);

      const dash = field.dash * (9 + pt.z * 52);
      if (streak < 1.5 && dash > 1.5) {
        ctx.strokeStyle = colour;
        ctx.lineWidth = pt.r * field.size * 1.4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x + (field.drift < 0 ? dash : -dash), y);
        ctx.stroke();
      } else if (streak > 1.5) {
        ctx.strokeStyle = colour;
        ctx.lineWidth = pt.r * field.size * 1.5;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(x, y);
        ctx.lineTo(x, y + streak);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(x, y, pt.r * field.size * (1 + state.gather * 0.35), 0, Math.PI * 2);
        ctx.fillStyle = colour;
        ctx.fill();
      }
    }

    drawDust(warmX, warmY, now);

    if (state.flash > 0.003) {
      ctx.fillStyle = `rgba(255, 226, 196, ${clamp(state.flash * 0.22, 0, 0.4)})`;
      ctx.fillRect(0, 0, w, h);
    }
  };

  const paintStatic = () => {
    ctx.clearRect(0, 0, w, h);
    drawPool(w * 0.5, h * mode.poolY, mode.pool, Math.min(w, h) * 0.72, live.cold, COLD_SHAPE);
    drawRoom(ctx, roomTo, { w, h, now: 0, px: 0, py: 0, camera: 0, drift: 0, alpha: 1, dpr });
    drawPool(w * 0.5, h * mode.warmY, mode.warm, Math.min(w, h) * 0.3, live.warm, WARM_SHAPE);
    const sporeRgb = live.spore.map(Math.round).join(', ');
    const emberRgb = live.ember.map(Math.round).join(', ');
    for (const pt of particles) {
      ctx.beginPath();
      ctx.arc(pt.bx * w, pt.by * h, pt.r * live.field.size, 0, Math.PI * 2);
      ctx.fillStyle = pt.ember ? `rgba(${emberRgb}, .42)` : `rgba(${sporeRgb}, .28)`;
      ctx.fill();
    }
  };

  const setRoom = (theme) => {
    target = paletteOf(theme);
    if (theme.id !== roomTo.id) {
      roomFrom = roomTo;
      roomTo = theme;
      blend = 0;
    }
    if (!reduceMotion) return;
    Object.assign(live, paletteOf(theme));
    blend = 1;
    roomFrom = roomTo;
    paintStatic();
  };

  const setMode = (name) => {
    modeName = modes[name] ? name : 'gate';
    mode = modes[modeName];
    if (reduceMotion) { Object.assign(state, mode); paintStatic(); }
  };

  const impact = () => {
    if (reduceMotion) return;
    const max = Math.hypot(w, h) * 0.75;
    const t = performance.now();
    dust.push({ t0: t, life: 1100, max, width: 2.4, strength: 0.34 });
    dust.push({ t0: t + 90, life: 1400, max: max * 1.3, width: 1.4, strength: 0.18 });
    state.flash = 1;
    state.shake = 1;
  };

  const onMove = (event) => {
    pointer.tx = clamp((event.clientX / w - 0.5) * 2, -1, 1);
    pointer.ty = clamp((event.clientY / h - 0.5) * 2, -1, 1);
  };
  const onLeave = () => { pointer.tx = 0; pointer.ty = 0; };

  let running = false;
  const start = () => {
    if (running || reduceMotion) return;
    running = true;
    last = 0;
    raf = requestAnimationFrame(render);
  };
  const stop = () => { running = false; cancelAnimationFrame(raf); };

  const onVisibility = () => {
    if (document.hidden) stop();
    else if (!reduceMotion) start();
  };

  let resizeTimer = 0;
  const onResize = () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => { clearScenery(); resize(); readScroll(); if (reduceMotion) paintStatic(); }, 150);
  };

  resize();
  if (reduceMotion) {
    Object.assign(state, mode);
    paintStatic();
  } else {
    if (fine) {
      window.addEventListener('pointermove', onMove, { passive: true });
      document.addEventListener('pointerleave', onLeave, { passive: true });
    }
    readScroll();
    window.addEventListener('scroll', readScroll, { passive: true });
    start();
  }
  window.addEventListener('resize', onResize, { passive: true });
  document.addEventListener('visibilitychange', onVisibility);

  return {
    get mode() { return modeName; },
    setMode,
    setRoom,
    impact,
    start,
    stop,
    get pointer() { return pointer; },
    destroy() {
      stop();
      window.removeEventListener('scroll', readScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerleave', onLeave);
      document.removeEventListener('visibilitychange', onVisibility);
    }
  };
}

function stub() {
  return { mode: 'gate', setMode() {}, setRoom() {}, impact() {}, start() {}, stop() {}, pointer: { x: 0, y: 0 }, destroy() {} };
}
