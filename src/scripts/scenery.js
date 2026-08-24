const PAD = 70;
const MAX_CACHE = 4;
const cache = new Map();

const rgba = (c, a) => `rgba(${Math.round(c[0])}, ${Math.round(c[1])}, ${Math.round(c[2])}, ${a})`;
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
const INK = [4, 5, 9];

const rand = (seed) => {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
};

const makeLayer = (w, h, dpr, draw) => {
  const canvas = document.createElement('canvas');
  canvas.width = Math.ceil((w + PAD * 2) * dpr);
  canvas.height = Math.ceil((h + PAD * 2) * dpr);
  const g = canvas.getContext('2d');
  g.setTransform(dpr, 0, 0, dpr, PAD * dpr, PAD * dpr);
  draw(g);
  return canvas;
};

const jagged = (g, points, wobble, next) => {
  g.beginPath();
  g.moveTo(points[0][0], points[0][1]);
  for (let i = 1; i < points.length; i += 1) {
    const [x0, y0] = points[i - 1];
    const [x1, y1] = points[i];
    const steps = Math.max(2, Math.round(Math.hypot(x1 - x0, y1 - y0) / 26));
    for (let s = 1; s <= steps; s += 1) {
      const t = s / steps;
      const nx = x0 + (x1 - x0) * t + (next() - 0.5) * wobble;
      const ny = y0 + (y1 - y0) * t + (next() - 0.5) * wobble;
      g.lineTo(nx, ny);
    }
  }
};

const body = (g, y0, y1, top, bottom) => {
  const grad = g.createLinearGradient(0, y0, 0, y1);
  grad.addColorStop(0, top);
  grad.addColorStop(1, bottom);
  return grad;
};

const speckle = (g, x, y, w, h, next, colour, count, size) => {
  g.save();
  g.clip();
  for (let i = 0; i < count; i += 1) {
    const sx = x + next() * w;
    const sy = y + next() * h;
    const r = size * (0.3 + next() * 0.9);
    g.beginPath();
    g.arc(sx, sy, r, 0, Math.PI * 2);
    g.fillStyle = colour;
    g.globalAlpha = 0.1 + next() * 0.5;
    g.fill();
  }
  g.globalAlpha = 1;
  g.restore();
};

const cracks = (g, x, y, w, h, next, colour, count) => {
  g.save();
  g.clip();
  g.strokeStyle = colour;
  for (let i = 0; i < count; i += 1) {
    let cx = x + next() * w;
    let cy = y + next() * h;
    g.beginPath();
    g.moveTo(cx, cy);
    const legs = 2 + Math.floor(next() * 3);
    for (let l = 0; l < legs; l += 1) {
      cx += (next() - 0.5) * w * 0.28;
      cy += next() * h * 0.2;
      g.lineTo(cx, cy);
    }
    g.globalAlpha = 0.1 + next() * 0.22;
    g.lineWidth = 0.6 + next();
    g.stroke();
  }
  g.globalAlpha = 1;
  g.restore();
};

const rim = (g, x0, y0, x1, y1, colour, width) => {
  const grad = g.createLinearGradient(x0, y0, x1, y1);
  grad.addColorStop(0, colour);
  grad.addColorStop(0.55, colour.replace(/[\d.]+\)$/, '0)'));
  grad.addColorStop(1, colour.replace(/[\d.]+\)$/, '0)'));
  g.strokeStyle = grad;
  g.lineWidth = width;
  g.stroke();
};

const fog = (g, w, h, colour, from, to) => {
  const grad = g.createLinearGradient(0, -PAD, 0, h + PAD);
  grad.addColorStop(0, colour(from));
  grad.addColorStop(1, colour(to));
  g.fillStyle = grad;
  g.fillRect(-PAD, -PAD, w + PAD * 2, h + PAD * 2);
};

const abismo = (theme, w, h, dpr) => {
  const { cold, ember } = theme;
  const stone = mix(INK, cold, 0.16);
  const lit = (a) => rgba(mix(cold, [255, 255, 255], 0.25), a);

  const far = makeLayer(w, h, dpr, (g) => {
    const next = rand(11);
    fog(g, w, h, (a) => rgba(mix(INK, cold, 0.26), a), 0.3, 0.1);
    g.beginPath();
    g.moveTo(-PAD, h + PAD);
    g.lineTo(-PAD, h * 0.42);
    const teeth = 16;
    for (let i = 0; i <= teeth; i += 1) {
      const t = i / teeth;
      const x = -PAD + t * (w + PAD * 2);
      const bite = Math.sin(t * Math.PI) ** 2;
      const y = h * (0.42 - bite * 0.3) + (next() - 0.5) * h * 0.06;
      g.lineTo(x, y);
    }
    g.lineTo(w + PAD, h + PAD);
    g.closePath();
    g.fillStyle = body(g, h * 0.1, h + PAD, rgba(mix(INK, cold, 0.12), 0.85), rgba(INK, 0.92));
    g.fill();
    g.beginPath();
    g.moveTo(w * 0.3, h + PAD);
    g.lineTo(w * 0.3, h * 0.5);
    g.quadraticCurveTo(w * 0.5, h * 0.2, w * 0.7, h * 0.5);
    g.lineTo(w * 0.7, h + PAD);
    g.closePath();
    g.fillStyle = rgba([0, 0, 0], 0.86);
    g.fill();
    speckle(g, w * 0.28, h * 0.2, w * 0.44, h, next, rgba(cold, 1), 40, 1.4);
    for (let i = 0; i < 5; i += 1) {
      const x = -PAD + next() * (w + PAD * 2);
      const y = h * (0.3 + next() * 0.5);
      const r = 40 + next() * 120;
      const glow = g.createRadialGradient(x, y, 0, x, y, r);
      glow.addColorStop(0, rgba(cold, 0.06));
      glow.addColorStop(1, rgba(cold, 0));
      g.fillStyle = glow;
      g.fillRect(x - r, y - r, r * 2, r * 2);
    }
  });

  const mid = makeLayer(w, h, dpr, (g) => {
    const next = rand(29);
    const ceiling = () => {
      g.beginPath();
      g.moveTo(-PAD, -PAD);
      g.lineTo(w + PAD, -PAD);
      g.lineTo(w + PAD, h * 0.05);
      const steps = 18;
      for (let i = steps; i >= 0; i -= 1) {
        const t = i / steps;
        const x = -PAD + t * (w + PAD * 2);
        g.lineTo(x, h * (0.05 + Math.sin(t * 9.3) * 0.022 + next() * 0.03));
      }
      g.closePath();
      g.fillStyle = body(g, -PAD, h * 0.12, rgba(INK, 1), rgba(mix(INK, cold, 0.07), 0.99));
      g.fill();
      speckle(g, -PAD, -PAD, w + PAD * 2, h * 0.14, next, rgba(cold, 1), 30, 1);
    };
    ceiling();
    const spike = (x, len, wid, down) => {
      const base = down ? -PAD : h + PAD;
      const tip = down ? len : h - len;
      jagged(g, [[x - wid, base], [x - wid * 0.34, (base + tip) * 0.5], [x, tip], [x + wid * 0.4, (base + tip) * 0.55], [x + wid, base]], 4, next);
      g.closePath();
      g.fillStyle = body(g, Math.min(base, tip), Math.max(base, tip),
        down ? rgba(stone, 0.98) : rgba(INK, 0.99),
        down ? rgba(INK, 0.99) : rgba(mix(INK, cold, 0.1), 0.98));
      g.fill();
      rim(g, x - wid, base, x + wid * 0.3, tip, lit(0.16), 1.4);
      speckle(g, x - wid, Math.min(base, tip), wid * 2, Math.abs(tip - base), next, rgba(cold, 1), 26, 1.1);
      cracks(g, x - wid, Math.min(base, tip), wid * 2, Math.abs(tip - base), next, rgba(INK, 1), 3);
    };
    [0.02, 0.09, 0.16, 0.24, 0.31, 0.7, 0.77, 0.85, 0.92, 0.98].forEach((c, i) => {
      spike(c * w, h * (0.12 + next() * 0.32), 14 + next() * 42, i % 3 !== 1);
    });
    spike(w * 0.44, h * 0.1, 16 + next() * 18, true);
    spike(w * 0.56, h * 0.08, 14 + next() * 14, true);

    const pillar = (x, top) => {
      const width = 30 + next() * 18;
      const shape = (x0, y0, x1, y1) => { g.beginPath(); g.rect(x0, y0, x1, y1); };
      shape(x - width * 0.9, top - 16, width * 1.8, 16);
      g.fillStyle = rgba(INK, 0.99);
      g.fill();
      g.beginPath();
      g.moveTo(x - width * 0.9, top - 16);
      g.lineTo(x + width * 0.9, top - 16);
      g.strokeStyle = lit(0.16);
      g.lineWidth = 1.2;
      g.stroke();
      shape(x - width / 2, top, width, h + PAD - top);
      g.fillStyle = body(g, top, h, rgba(mix(INK, cold, 0.08), 0.99), rgba(INK, 1));
      g.fill();
      shape(x - width / 2, top, width, h + PAD - top);
      speckle(g, x - width / 2, top, width, h - top, next, rgba(cold, 1), 24, 1);
      g.beginPath();
      g.moveTo(x - width / 2 + 1, top);
      g.lineTo(x - width / 2 + 1, h + PAD);
      g.strokeStyle = lit(0.13);
      g.lineWidth = 1.4;
      g.stroke();
      for (let i = 1; i < 5; i += 1) {
        const y = top + (h - top) * (i / 5);
        g.beginPath();
        g.moveTo(x - width / 2 + 2, y);
        g.lineTo(x + width / 2 - 2, y + (next() - 0.5) * 4);
        g.strokeStyle = rgba([0, 0, 0], 0.55);
        g.lineWidth = 1.4;
        g.stroke();
      }
    };
    pillar(w * 0.2, h * 0.46);
    pillar(w * 0.81, h * 0.4);

    g.beginPath();
    g.moveTo(-PAD, h + PAD);
    g.lineTo(-PAD, h * 0.78);
    const rocks = 14;
    for (let i = 0; i <= rocks; i += 1) {
      const t = i / rocks;
      const x = -PAD + t * (w + PAD * 2);
      const y = h * (0.78 + Math.sin(t * 7.1) * 0.05 + next() * 0.04);
      g.lineTo(x, y);
    }
    g.lineTo(w + PAD, h + PAD);
    g.closePath();
    g.fillStyle = body(g, h * 0.7, h + PAD, rgba(mix(INK, cold, 0.05), 1), rgba([0, 0, 0], 1));
    g.fill();
    speckle(g, -PAD, h * 0.72, w + PAD * 2, h * 0.35, next, rgba(cold, 1), 44, 1.1);
    g.beginPath();
    g.moveTo(-PAD, h * 0.78);
    for (let i = 0; i <= 14; i += 1) {
      const t = i / 14;
      g.lineTo(-PAD + t * (w + PAD * 2), h * (0.78 + Math.sin(t * 7.1) * 0.05));
    }
    g.strokeStyle = lit(0.05);
    g.lineWidth = 1.2;
    g.stroke();
    void ember;
  });

  const near = makeLayer(w, h, dpr, (g) => {
    const next = rand(53);
    const wall = (side) => {
      const sign = side === 'left' ? 1 : -1;
      const edge = side === 'left' ? -PAD : w + PAD;
      const reach = w * (0.12 + next() * 0.05);
      g.beginPath();
      g.moveTo(edge, -PAD);
      const steps = 11;
      for (let i = 1; i <= steps; i += 1) {
        const t = i / steps;
        const bulge = 0.3 + Math.sin(t * 4.2 + sign) * 0.42 + next() * 0.3;
        g.lineTo(edge + sign * reach * bulge, -PAD + (h + PAD * 2) * t);
      }
      g.lineTo(edge, h + PAD);
      g.closePath();
      g.fillStyle = rgba(INK, 0.995);
      g.fill();
      rim(g, edge + sign * reach, h * 0.2, edge + sign * reach * 0.2, h * 0.9, lit(0.22), 2);
      speckle(g, side === 'left' ? -PAD : w - reach, -PAD, reach + PAD, h + PAD * 2, next, rgba(cold, 1), 40, 1.2);
    };
    wall('left');
    wall('right');
    for (const x of [0.04, 0.13, 0.86, 0.95]) {
      const cx = x * w;
      const drop = h * (0.14 + next() * 0.34);
      const bend = (next() - 0.5) * 44;
      g.beginPath();
      g.moveTo(cx, -PAD);
      g.quadraticCurveTo(cx + bend, drop * 0.6, cx + bend * 0.7, drop);
      g.strokeStyle = rgba(INK, 0.99);
      g.lineWidth = 2 + next() * 2;
      g.stroke();
      g.strokeStyle = lit(0.09);
      g.lineWidth = 0.8;
      g.stroke();
      for (let i = 0; i < 2; i += 1) {
        const t = 0.55 + i * 0.3;
        const lx = cx + bend * t * 0.8;
        const ly = drop * t;
        const size = 7 + next() * 8;
        const angle = -0.6 + next() * 1.2;
        g.save();
        g.translate(lx, ly);
        g.rotate(angle);
        g.beginPath();
        g.moveTo(0, 0);
        g.quadraticCurveTo(size * 0.5, -size * 0.32, size, 0);
        g.quadraticCurveTo(size * 0.5, size * 0.3, 0, 0);
        g.closePath();
        g.fillStyle = rgba(INK, 0.99);
        g.fill();
        g.strokeStyle = lit(0.1);
        g.lineWidth = 0.8;
        g.stroke();
        g.restore();
      }
    }
  });

  return [
    { canvas: far, depth: 0.18, alpha: 1 },
    { canvas: mid, depth: 0.55, alpha: 1 },
    { canvas: near, depth: 1.25, alpha: 1 }
  ];
};

const cidade = (theme, w, h, dpr) => {
  const { cold, warm, ember } = theme;

  const far = makeLayer(w, h, dpr, (g) => {
    const next = rand(7);
    const sky = g.createLinearGradient(0, -PAD, 0, h + PAD);
    sky.addColorStop(0, rgba(mix(INK, cold, 0.36), 0.7));
    sky.addColorStop(0.62, rgba(mix(INK, cold, 0.18), 0.45));
    sky.addColorStop(1, rgba(INK, 0.7));
    g.fillStyle = sky;
    g.fillRect(-PAD, -PAD, w + PAD * 2, h + PAD * 2);
    let x = -PAD;
    while (x < w + PAD) {
      const tw = 34 + next() * 70;
      const top = h * (0.2 + next() * 0.34);
      g.fillStyle = rgba(mix(INK, cold, 0.12), 0.85);
      g.fillRect(x, top, tw, h + PAD - top);
      g.beginPath();
      g.moveTo(x - 4, top);
      g.lineTo(x + tw / 2, top - 20 - next() * 40);
      g.lineTo(x + tw + 4, top);
      g.closePath();
      g.fill();
      const rows = Math.floor((h - top) / 26);
      for (let r = 0; r < rows; r += 1) {
        for (let c = 0; c < 3; c += 1) {
          if (next() > 0.42) continue;
          g.fillStyle = rgba(warm, 0.1 + next() * 0.16);
          g.fillRect(x + 6 + c * (tw - 12) / 3, top + 14 + r * 26, Math.max(3, (tw - 18) / 3), 8);
        }
      }
      x += tw + 10 + next() * 26;
    }
  });

  const mid = makeLayer(w, h, dpr, (g) => {
    const next = rand(17);
    const width = Math.max(96, Math.min(210, w * 0.19));
    const top = h * 0.04;
    const bottom = h * 0.78;
    const arch = (cx) => {
      const half = width / 2;
      g.beginPath();
      g.moveTo(cx - half, bottom);
      g.lineTo(cx - half, top + half);
      g.arc(cx, top + half, half, Math.PI, 0);
      g.lineTo(cx + half, bottom);
      g.closePath();
      const glow = g.createLinearGradient(0, top, 0, bottom);
      glow.addColorStop(0, rgba(warm, 0.34));
      glow.addColorStop(0.55, rgba(warm, 0.12));
      glow.addColorStop(1, rgba(warm, 0.02));
      g.fillStyle = glow;
      g.fill();
      g.strokeStyle = rgba(ember, 0.5);
      g.lineWidth = 2.4;
      g.stroke();
      g.beginPath();
      g.moveTo(cx, top + 6);
      g.lineTo(cx, bottom);
      for (let i = 1; i < 6; i += 1) {
        const y = top + (bottom - top) * (i / 6);
        g.moveTo(cx - half + 2, y);
        g.lineTo(cx + half - 2, y);
      }
      g.strokeStyle = rgba(ember, 0.24);
      g.lineWidth = 1.2;
      g.stroke();
      g.beginPath();
      g.moveTo(cx - half - 14, bottom + 8);
      g.lineTo(cx - half - 14, top + half * 0.6);
      g.lineTo(cx - half - 4, top + half * 0.4);
      g.lineTo(cx - half - 4, bottom + 8);
      g.closePath();
      g.moveTo(cx + half + 14, bottom + 8);
      g.lineTo(cx + half + 14, top + half * 0.6);
      g.lineTo(cx + half + 4, top + half * 0.4);
      g.lineTo(cx + half + 4, bottom + 8);
      g.closePath();
      g.fillStyle = rgba(mix(INK, cold, 0.14), 0.96);
      g.fill();
      g.strokeStyle = rgba(cold, 0.28);
      g.lineWidth = 1.2;
      g.stroke();
    };
    arch(w * 0.11);
    arch(w * 0.89);
    if (w > 900) { arch(w * 0.5); }

    g.beginPath();
    g.moveTo(-PAD, h + PAD);
    g.lineTo(-PAD, h * 0.86);
    let x = -PAD;
    while (x < w + PAD) {
      const step = 40 + next() * 90;
      const level = h * (0.74 + next() * 0.16);
      g.lineTo(x, level);
      g.lineTo(x + step, level);
      x += step;
    }
    g.lineTo(w + PAD, h + PAD);
    g.closePath();
    g.fillStyle = rgba(mix(INK, cold, 0.08), 0.97);
    g.fill();
    g.strokeStyle = rgba(cold, 0.3);
    g.lineWidth = 1.4;
    g.stroke();
  });

  const near = makeLayer(w, h, dpr, (g) => {
    const next = rand(37);
    const rail = h * 0.93;
    g.fillStyle = rgba(INK, 0.99);
    g.fillRect(-PAD, rail + 16, w + PAD * 2, h + PAD - rail);
    g.fillRect(-PAD, rail - 6, w + PAD * 2, 8);
    g.strokeStyle = rgba(ember, 0.22);
    g.lineWidth = 1.4;
    g.beginPath();
    g.moveTo(-PAD, rail - 6);
    g.lineTo(w + PAD, rail - 6);
    g.stroke();
    for (let x = -PAD + 10; x < w + PAD; x += 34) {
      g.beginPath();
      g.moveTo(x, rail + 2);
      g.bezierCurveTo(x - 6, rail + 8, x - 6, rail + 12, x, rail + 18);
      g.bezierCurveTo(x + 6, rail + 12, x + 6, rail + 8, x, rail + 2);
      g.closePath();
      g.fillStyle = rgba(INK, 0.99);
      g.fill();
      g.strokeStyle = rgba(ember, 0.16);
      g.lineWidth = 1;
      g.stroke();
    }
    const corner = (side) => {
      const sign = side === 'left' ? 1 : -1;
      const edge = side === 'left' ? -PAD : w + PAD;
      g.beginPath();
      g.moveTo(edge, -PAD);
      g.lineTo(edge + sign * (w * 0.2 + 60), -PAD);
      g.quadraticCurveTo(edge + sign * (w * 0.08), h * 0.1, edge + sign * 30, h * 0.34);
      g.lineTo(edge, h * 0.34);
      g.closePath();
      g.fillStyle = rgba(INK, 0.98);
      g.fill();
      g.strokeStyle = rgba(ember, 0.2);
      g.lineWidth = 1.6;
      g.stroke();
    };
    corner('left');
    corner('right');
    for (let i = 0; i < 6; i += 1) {
      const x = -PAD + next() * (w + PAD * 2);
      g.beginPath();
      g.moveTo(x, -PAD);
      g.lineTo(x + 2, h * (0.3 + next() * 0.5));
      g.strokeStyle = rgba(mix(warm, [255, 255, 255], 0.3), 0.05);
      g.lineWidth = 10 + next() * 22;
      g.stroke();
    }
  });

  return [
    { canvas: far, depth: 0.14, alpha: 1 },
    { canvas: mid, depth: 0.5, alpha: 1 },
    { canvas: near, depth: 1.35, alpha: 1 }
  ];
};

const jardins = (theme, w, h, dpr) => {
  const { cold, warm, ember } = theme;

  const far = makeLayer(w, h, dpr, (g) => {
    const next = rand(13);
    const wash = g.createLinearGradient(0, -PAD, 0, h + PAD);
    wash.addColorStop(0, rgba(mix(INK, cold, 0.4), 0.6));
    wash.addColorStop(0.55, rgba(mix(INK, cold, 0.18), 0.3));
    wash.addColorStop(1, rgba(mix(INK, cold, 0.1), 0.72));
    g.fillStyle = wash;
    g.fillRect(-PAD, -PAD, w + PAD * 2, h + PAD * 2);
    for (let i = 0; i < 5; i += 1) {
      const x = -PAD + next() * (w + PAD);
      g.save();
      g.translate(x, -PAD);
      g.rotate(0.22 + next() * 0.12);
      const shaft = g.createLinearGradient(0, 0, 0, h * 1.1);
      shaft.addColorStop(0, rgba(warm, 0.09));
      shaft.addColorStop(1, rgba(warm, 0));
      g.fillStyle = shaft;
      g.fillRect(0, 0, 40 + next() * 90, h * 1.2);
      g.restore();
    }
    for (let i = 0; i < 30; i += 1) {
      const x = -PAD + next() * (w + PAD * 2);
      const y = h * (0.05 + next() * 0.5);
      const r = 30 + next() * 90;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fillStyle = rgba(mix(INK, cold, 0.14), 0.4);
      g.fill();
    }
  });

  const mid = makeLayer(w, h, dpr, (g) => {
    const next = rand(23);
    const trunk = (x, lean) => {
      g.beginPath();
      g.moveTo(x - 16, h + PAD);
      g.bezierCurveTo(x - 10 + lean * 40, h * 0.6, x - 6 + lean * 70, h * 0.3, x + lean * 90, -PAD);
      g.lineTo(x + 16 + lean * 90, -PAD);
      g.bezierCurveTo(x + 12 + lean * 70, h * 0.3, x + 14 + lean * 40, h * 0.6, x + 18, h + PAD);
      g.closePath();
      g.fillStyle = rgba(mix(INK, cold, 0.07), 0.97);
      g.fill();
      g.strokeStyle = rgba(cold, 0.24);
      g.lineWidth = 1.4;
      g.stroke();
    };
    trunk(w * 0.06, 0.12);
    trunk(w * 0.94, -0.14);
    if (w > 900) trunk(w * 0.34, -0.06);

    const lantern = (x, y) => {
      const halo = g.createRadialGradient(x, y, 0, x, y, 90);
      halo.addColorStop(0, rgba(ember, 0.3));
      halo.addColorStop(1, rgba(ember, 0));
      g.fillStyle = halo;
      g.fillRect(x - 90, y - 90, 180, 180);
      g.beginPath();
      g.moveTo(x, y - 40);
      g.lineTo(x, y - 12);
      g.strokeStyle = rgba(cold, 0.4);
      g.lineWidth = 1.2;
      g.stroke();
      g.beginPath();
      g.ellipse(x, y, 7, 10, 0, 0, Math.PI * 2);
      g.fillStyle = rgba(ember, 0.75);
      g.fill();
    };
    lantern(w * 0.16, h * 0.3);
    lantern(w * 0.85, h * 0.22);
    lantern(w * 0.72, h * 0.52);

    const bush = (x, y, size) => {
      g.beginPath();
      for (let i = 0; i < 9; i += 1) {
        const a = (i / 9) * Math.PI * 2;
        const r = size * (0.6 + next() * 0.6);
        g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r * 0.7);
      }
      g.closePath();
      g.fillStyle = rgba(mix(INK, cold, 0.09), 0.96);
      g.fill();
      g.strokeStyle = rgba(cold, 0.2);
      g.lineWidth = 1.2;
      g.stroke();
    };
    for (let i = 0; i < 7; i += 1) bush(-PAD + next() * (w + PAD * 2), h * (0.96 + next() * 0.1), 40 + next() * 90);
  });

  const near = makeLayer(w, h, dpr, (g) => {
    const next = rand(41);
    const leaf = (x, y, size, angle) => {
      g.save();
      g.translate(x, y);
      g.rotate(angle);
      g.beginPath();
      g.moveTo(0, 0);
      g.bezierCurveTo(size * 0.34, -size * 0.5, size * 0.76, -size * 0.4, size, 0);
      g.bezierCurveTo(size * 0.76, size * 0.4, size * 0.34, size * 0.5, 0, 0);
      g.closePath();
      g.fillStyle = rgba(INK, 0.99);
      g.fill();
      g.strokeStyle = rgba(cold, 0.3);
      g.lineWidth = 1.6;
      g.stroke();
      g.beginPath();
      g.moveTo(size * 0.05, 0);
      g.lineTo(size * 0.95, 0);
      for (let i = 1; i < 6; i += 1) {
        const t = i / 6;
        g.moveTo(size * t, 0);
        g.lineTo(size * (t + 0.12), -size * 0.2 * (1 - t));
        g.moveTo(size * t, 0);
        g.lineTo(size * (t + 0.12), size * 0.2 * (1 - t));
      }
      g.strokeStyle = rgba(cold, 0.2);
      g.lineWidth = 1;
      g.stroke();
      g.restore();
    };
    const span = Math.max(w * 0.3, 240);
    leaf(-PAD - span * 0.1, -PAD + h * 0.06, span, 0.5);
    leaf(-PAD - span * 0.05, h * 0.26, span * 0.75, 0.06);
    leaf(w + PAD + span * 0.1, -PAD + h * 0.04, span, Math.PI - 0.52);
    leaf(w + PAD + span * 0.05, h * 0.3, span * 0.72, Math.PI - 0.05);
    leaf(-PAD - span * 0.08, h + PAD, span * 0.95, -0.7);
    leaf(w + PAD + span * 0.08, h + PAD - h * 0.02, span * 0.9, Math.PI + 0.72);
    for (const [x, drop] of [[0.09, 0.6], [0.22, 0.36], [0.78, 0.42], [0.93, 0.64]]) {
      const cx = x * w;
      g.beginPath();
      g.moveTo(cx, -PAD);
      g.quadraticCurveTo(cx + (next() - 0.5) * 70, h * drop * 0.55, cx + (next() - 0.5) * 50, h * drop);
      g.strokeStyle = rgba(mix(INK, cold, 0.35), 0.9);
      g.lineWidth = 2.6;
      g.stroke();
      for (let i = 1; i < 5; i += 1) {
        const t = i / 5;
        leaf(cx + (next() - 0.5) * 26, h * drop * t, 26 + next() * 26, next() * Math.PI * 2);
      }
    }
  });

  return [
    { canvas: far, depth: 0.16, alpha: 1 },
    { canvas: mid, depth: 0.52, alpha: 1 },
    { canvas: near, depth: 1.3, alpha: 1 }
  ];
};

const cristal = (theme, w, h, dpr) => {
  const { cold, warm, ember } = theme;

  const far = makeLayer(w, h, dpr, (g) => {
    const next = rand(19);
    const wash = g.createLinearGradient(0, -PAD, 0, h + PAD);
    wash.addColorStop(0, rgba(mix(INK, cold, 0.34), 0.6));
    wash.addColorStop(0.6, rgba(mix(INK, warm, 0.14), 0.34));
    wash.addColorStop(1, rgba(INK, 0.72));
    g.fillStyle = wash;
    g.fillRect(-PAD, -PAD, w + PAD * 2, h + PAD * 2);
    for (let i = 0; i < 5; i += 1) {
      const x = w * (0.1 + i * 0.2) + (next() - 0.5) * 60;
      g.fillStyle = rgba(mix(INK, cold, 0.1), 0.7);
      g.fillRect(x - 9, h * 0.16, 18, h);
      g.fillRect(x - 60, h * (0.16 + next() * 0.1), 120, 12);
      g.strokeStyle = rgba(cold, 0.16);
      g.lineWidth = 1;
      g.strokeRect(x - 9, h * 0.16, 18, h * 0.6);
    }
    for (let i = 0; i < 40; i += 1) {
      const x = -PAD + next() * (w + PAD * 2);
      const y = h * (0.1 + next() * 0.8);
      const r = 1 + next() * 2.4;
      g.beginPath();
      g.arc(x, y, r, 0, Math.PI * 2);
      g.fillStyle = rgba(ember, 0.1 + next() * 0.3);
      g.fill();
    }
  });

  const mid = makeLayer(w, h, dpr, (g) => {
    const next = rand(31);
    const shard = (x, height, width, up, tilt) => {
      const base = up ? h + PAD : -PAD;
      const tip = up ? h - height : height;
      const lean = tilt * width;
      g.beginPath();
      g.moveTo(x - width, base);
      g.lineTo(x + lean - width * 0.16, tip);
      g.lineTo(x + lean + width * 0.16, tip);
      g.lineTo(x + width, base);
      g.closePath();
      const body = g.createLinearGradient(x, base, x + lean, tip);
      body.addColorStop(0, rgba(INK, 0.97));
      body.addColorStop(0.55, rgba(mix(INK, warm, 0.22), 0.94));
      body.addColorStop(1, rgba(mix(warm, [255, 255, 255], 0.25), 0.55));
      g.fillStyle = body;
      g.fill();
      g.strokeStyle = rgba(ember, 0.42);
      g.lineWidth = 1.6;
      g.stroke();
      g.beginPath();
      g.moveTo(x - width * 0.2, base);
      g.lineTo(x + lean, tip);
      g.moveTo(x + width * 0.35, base);
      g.lineTo(x + lean + width * 0.08, tip);
      g.strokeStyle = rgba(ember, 0.2);
      g.lineWidth = 1;
      g.stroke();
      const halo = g.createRadialGradient(x + lean, tip, 0, x + lean, tip, width * 3);
      halo.addColorStop(0, rgba(ember, 0.22));
      halo.addColorStop(1, rgba(ember, 0));
      g.fillStyle = halo;
      g.fillRect(x + lean - width * 3, tip - width * 3, width * 6, width * 6);
    };
    const cluster = (cx, up) => {
      const n = 3 + Math.floor(next() * 3);
      for (let i = 0; i < n; i += 1) {
        const offset = (i - n / 2) * (18 + next() * 26);
        shard(cx + offset, h * (0.16 + next() * 0.36), 14 + next() * 30, up, (next() - 0.5) * 0.5);
      }
    };
    cluster(w * 0.08, true);
    cluster(w * 0.2, true);
    cluster(w * 0.82, true);
    cluster(w * 0.95, true);
    cluster(w * 0.12, false);
    cluster(w * 0.88, false);
    if (w > 900) { cluster(w * 0.45, true); cluster(w * 0.62, false); }
  });

  const near = makeLayer(w, h, dpr, (g) => {
    const next = rand(43);
    const slab = (side) => {
      const sign = side === 'left' ? 1 : -1;
      const edge = side === 'left' ? -PAD : w + PAD;
      const reach = w * 0.16 + 70;
      g.beginPath();
      g.moveTo(edge, -PAD);
      g.lineTo(edge + sign * reach * 0.5, -PAD);
      g.lineTo(edge + sign * reach, h * 0.3);
      g.lineTo(edge + sign * reach * 0.6, h * 0.72);
      g.lineTo(edge + sign * reach * 1.1, h + PAD);
      g.lineTo(edge, h + PAD);
      g.closePath();
      g.fillStyle = rgba(INK, 0.99);
      g.fill();
      g.strokeStyle = rgba(ember, 0.3);
      g.lineWidth = 2;
      g.stroke();
      g.beginPath();
      g.moveTo(edge + sign * reach * 0.5, -PAD);
      g.lineTo(edge + sign * reach * 0.6, h * 0.72);
      g.strokeStyle = rgba(ember, 0.14);
      g.lineWidth = 1.2;
      g.stroke();
    };
    slab('left');
    slab('right');
    for (let i = 0; i < 8; i += 1) {
      const x = -PAD + next() * (w + PAD * 2);
      const y = h * (0.05 + next() * 0.9);
      const s = 10 + next() * 26;
      g.beginPath();
      g.moveTo(x, y - s);
      g.lineTo(x + s * 0.34, y);
      g.lineTo(x, y + s);
      g.lineTo(x - s * 0.34, y);
      g.closePath();
      g.fillStyle = rgba(INK, 0.96);
      g.fill();
      g.strokeStyle = rgba(ember, 0.34);
      g.lineWidth = 1.2;
      g.stroke();
    }
  });

  return [
    { canvas: far, depth: 0.15, alpha: 1 },
    { canvas: mid, depth: 0.5, alpha: 1 },
    { canvas: near, depth: 1.3, alpha: 1 }
  ];
};

const seda = (theme, w, h, dpr) => {
  const { cold, warm, ember } = theme;

  const far = makeLayer(w, h, dpr, (g) => {
    const next = rand(59);
    const wash = g.createLinearGradient(0, -PAD, 0, h + PAD);
    wash.addColorStop(0, rgba(mix(INK, warm, 0.3), 0.62));
    wash.addColorStop(0.6, rgba(mix(INK, cold, 0.14), 0.32));
    wash.addColorStop(1, rgba(INK, 0.74));
    g.fillStyle = wash;
    g.fillRect(-PAD, -PAD, w + PAD * 2, h + PAD * 2);
    let x = -PAD;
    while (x < w + PAD) {
      const tw = 40 + next() * 80;
      const top = h * (0.24 + next() * 0.3);
      g.fillStyle = rgba(mix(INK, warm, 0.13), 0.7);
      g.fillRect(x, top, tw, h + PAD - top);
      g.beginPath();
      g.moveTo(x - 6, top);
      g.lineTo(x + tw / 2, top - 40 - next() * 70);
      g.lineTo(x + tw + 6, top);
      g.closePath();
      g.fill();
      g.beginPath();
      g.arc(x + tw / 2, top - 16, 4, 0, Math.PI * 2);
      g.fillStyle = rgba(ember, 0.4);
      g.fill();
      x += tw + 16 + next() * 40;
    }
  });

  const mid = makeLayer(w, h, dpr, (g) => {
    const next = rand(61);
    const anchors = [];
    for (let i = 0; i < 10; i += 1) anchors.push([-PAD + next() * (w + PAD * 2), -PAD + next() * (h * 0.7)]);
    g.strokeStyle = rgba(warm, 0.22);
    g.lineWidth = 1.2;
    for (let i = 0; i < anchors.length; i += 1) {
      for (let j = i + 1; j < anchors.length; j += 1) {
        const [x0, y0] = anchors[i];
        const [x1, y1] = anchors[j];
        if (Math.hypot(x1 - x0, y1 - y0) > w * 0.34) continue;
        g.beginPath();
        g.moveTo(x0, y0);
        g.quadraticCurveTo((x0 + x1) / 2, (y0 + y1) / 2 + 30 + next() * 40, x1, y1);
        g.stroke();
      }
    }
    const cocoon = (x, y, size) => {
      g.beginPath();
      g.moveTo(x, y - size * 1.5);
      g.bezierCurveTo(x + size, y - size * 0.6, x + size * 0.8, y + size, x, y + size * 1.4);
      g.bezierCurveTo(x - size * 0.8, y + size, x - size, y - size * 0.6, x, y - size * 1.5);
      g.closePath();
      g.fillStyle = rgba(mix(INK, warm, 0.24), 0.95);
      g.fill();
      g.strokeStyle = rgba(warm, 0.34);
      g.lineWidth = 1.4;
      g.stroke();
      for (let i = 1; i < 5; i += 1) {
        const t = i / 5;
        g.beginPath();
        g.moveTo(x - size * 0.9 * Math.sin(t * Math.PI), y - size * 1.4 + size * 2.8 * t);
        g.lineTo(x + size * 0.9 * Math.sin(t * Math.PI), y - size * 1.4 + size * 2.8 * t);
        g.strokeStyle = rgba(warm, 0.2);
        g.lineWidth = 1;
        g.stroke();
      }
    };
    cocoon(w * 0.1, h * 0.34, 20 + next() * 12);
    cocoon(w * 0.9, h * 0.26, 22 + next() * 12);
    cocoon(w * 0.78, h * 0.6, 15 + next() * 10);
    if (w > 900) cocoon(w * 0.42, h * 0.2, 18);
  });

  const near = makeLayer(w, h, dpr, (g) => {
    const next = rand(67);
    const drape = (edge, sign) => {
      g.beginPath();
      g.moveTo(edge, -PAD);
      g.lineTo(edge + sign * (w * 0.22 + 80), -PAD);
      g.bezierCurveTo(edge + sign * (w * 0.12), h * 0.26, edge + sign * (w * 0.2), h * 0.5, edge + sign * 40, h + PAD);
      g.lineTo(edge, h + PAD);
      g.closePath();
      g.fillStyle = rgba(INK, 0.98);
      g.fill();
      g.strokeStyle = rgba(warm, 0.28);
      g.lineWidth = 2;
      g.stroke();
      for (let i = 1; i < 6; i += 1) {
        const t = i / 6;
        g.beginPath();
        g.moveTo(edge + sign * (w * 0.2 * (1 - t) + 30), -PAD);
        g.quadraticCurveTo(edge + sign * (w * 0.1), h * 0.4, edge + sign * (20 + t * 30), h + PAD);
        g.strokeStyle = rgba(warm, 0.1);
        g.lineWidth = 1.2;
        g.stroke();
      }
    };
    drape(-PAD, 1);
    drape(w + PAD, -1);
    for (const x of [0.08, 0.16, 0.84, 0.93]) {
      const cx = x * w;
      const drop = h * (0.3 + next() * 0.4);
      g.beginPath();
      g.moveTo(cx, -PAD);
      g.quadraticCurveTo(cx + (next() - 0.5) * 50, drop * 0.6, cx + (next() - 0.5) * 30, drop);
      g.strokeStyle = rgba(warm, 0.4);
      g.lineWidth = 1.8;
      g.stroke();
      g.beginPath();
      g.arc(cx + (next() - 0.5) * 30, drop, 4.5, 0, Math.PI * 2);
      g.fillStyle = rgba(ember, 0.5);
      g.fill();
    }
  });

  return [
    { canvas: far, depth: 0.16, alpha: 1 },
    { canvas: mid, depth: 0.5, alpha: 1 },
    { canvas: near, depth: 1.28, alpha: 1 }
  ];
};

const estrada = (theme, w, h, dpr) => {
  const { cold, warm, ember } = theme;
  const horizon = h * 0.6;

  const far = makeLayer(w, h, dpr, (g) => {
    const next = rand(71);
    const sky = g.createLinearGradient(0, -PAD, 0, horizon);
    sky.addColorStop(0, rgba(mix(INK, cold, 0.26), 0.8));
    sky.addColorStop(1, rgba(mix(INK, warm, 0.2), 0.5));
    g.fillStyle = sky;
    g.fillRect(-PAD, -PAD, w + PAD * 2, horizon + PAD);
    for (let i = 0; i < 90; i += 1) {
      const x = -PAD + next() * (w + PAD * 2);
      const y = -PAD + next() * (horizon * 0.8);
      g.beginPath();
      g.arc(x, y, next() * 1.3, 0, Math.PI * 2);
      g.fillStyle = rgba([255, 248, 230], 0.1 + next() * 0.5);
      g.fill();
    }
    const mesa = (x, width, height) => {
      g.beginPath();
      g.moveTo(x, horizon);
      g.lineTo(x + width * 0.12, horizon - height * 0.86);
      g.lineTo(x + width * 0.2, horizon - height);
      g.lineTo(x + width * 0.8, horizon - height);
      g.lineTo(x + width * 0.9, horizon - height * 0.8);
      g.lineTo(x + width, horizon);
      g.closePath();
      g.fillStyle = rgba(mix(INK, warm, 0.12), 0.9);
      g.fill();
      g.strokeStyle = rgba(ember, 0.16);
      g.lineWidth = 1.2;
      g.stroke();
    };
    mesa(-PAD, w * 0.42, h * 0.2);
    mesa(w * 0.3, w * 0.3, h * 0.12);
    mesa(w * 0.62, w * 0.5, h * 0.24);
    const glow = g.createRadialGradient(w * 0.5, horizon, 0, w * 0.5, horizon, w * 0.5);
    glow.addColorStop(0, rgba(warm, 0.34));
    glow.addColorStop(1, rgba(warm, 0));
    g.fillStyle = glow;
    g.fillRect(0, horizon - w * 0.5, w, w);
  });

  const mid = makeLayer(w, h, dpr, (g) => {
    const road = g.createLinearGradient(0, horizon, 0, h + PAD);
    road.addColorStop(0, rgba(mix(INK, warm, 0.1), 0.96));
    road.addColorStop(1, rgba(INK, 0.99));
    g.beginPath();
    g.moveTo(w * 0.5 - w * 0.028, horizon);
    g.lineTo(w * 0.5 + w * 0.028, horizon);
    g.lineTo(w * 1.6, h + PAD);
    g.lineTo(-w * 0.6, h + PAD);
    g.closePath();
    g.fillStyle = road;
    g.fill();
    g.beginPath();
    g.moveTo(w * 0.5 - w * 0.028, horizon);
    g.lineTo(-w * 0.6, h + PAD);
    g.moveTo(w * 0.5 + w * 0.028, horizon);
    g.lineTo(w * 1.6, h + PAD);
    g.strokeStyle = rgba(ember, 0.4);
    g.lineWidth = 2.4;
    g.stroke();
    g.fillStyle = rgba(mix(INK, warm, 0.06), 0.9);
    g.fillRect(-PAD, horizon, w + PAD * 2, 6);

    const pole = (x, scale) => {
      const base = horizon + (h - horizon) * scale * 0.9;
      const height = (60 + 220 * scale);
      const cx = x;
      g.beginPath();
      g.moveTo(cx - 2 * scale - 1, base);
      g.lineTo(cx - 1, base - height);
      g.lineTo(cx + 1, base - height);
      g.lineTo(cx + 2 * scale + 1, base);
      g.closePath();
      g.fillStyle = rgba(INK, 0.98);
      g.fill();
      g.strokeStyle = rgba(cold, 0.34);
      g.lineWidth = 1;
      g.stroke();
      g.beginPath();
      g.moveTo(cx - 14 * scale, base - height * 0.86);
      g.lineTo(cx + 14 * scale, base - height * 0.86);
      g.moveTo(cx - 10 * scale, base - height * 0.72);
      g.lineTo(cx + 10 * scale, base - height * 0.72);
      g.strokeStyle = rgba(cold, 0.3);
      g.lineWidth = 1.6 * scale + 0.4;
      g.stroke();
    };
    for (const [x, scale] of [[w * 0.42, 0.1], [w * 0.36, 0.2], [w * 0.24, 0.4], [w * 0.04, 0.78], [w * 0.58, 0.1], [w * 0.66, 0.22], [w * 0.79, 0.44], [w * 0.98, 0.8]]) pole(x, scale);
  });

  const near = makeLayer(w, h, dpr, (g) => {
    const next = rand(73);
    const sign = (x, y, scale) => {
      const sw = 120 * scale;
      const sh = 70 * scale;
      g.beginPath();
      g.moveTo(x - 3 * scale, y + sh * 1.6);
      g.lineTo(x - 3 * scale, y);
      g.lineTo(x + 3 * scale, y);
      g.lineTo(x + 3 * scale, y + sh * 1.6);
      g.closePath();
      g.fillStyle = rgba(INK, 0.99);
      g.fill();
      g.beginPath();
      g.roundRect(x - sw / 2, y - sh, sw, sh, 8 * scale);
      g.fillStyle = rgba(INK, 0.98);
      g.fill();
      g.strokeStyle = rgba(ember, 0.6);
      g.lineWidth = 2.4 * scale;
      g.stroke();
      g.beginPath();
      g.roundRect(x - sw / 2 + 9 * scale, y - sh + 9 * scale, sw - 18 * scale, sh - 18 * scale, 5 * scale);
      g.strokeStyle = rgba(cold, 0.5);
      g.lineWidth = 1.6 * scale;
      g.stroke();
      const halo = g.createRadialGradient(x, y - sh / 2, 0, x, y - sh / 2, sw);
      halo.addColorStop(0, rgba(ember, 0.24));
      halo.addColorStop(1, rgba(ember, 0));
      g.fillStyle = halo;
      g.fillRect(x - sw, y - sh / 2 - sw, sw * 2, sw * 2);
    };
    sign(w * 0.13, horizon - 30, 1);
    sign(w * 0.88, horizon - 10, 0.72);

    const rail = (side) => {
      const sign2 = side === 'left' ? 1 : -1;
      const edge = side === 'left' ? -PAD : w + PAD;
      for (let i = 0; i < 5; i += 1) {
        const t = i / 5;
        const x = edge + sign2 * (t * t * w * 0.28 + 10);
        const y = horizon + (h - horizon) * (0.15 + t * 1.1);
        const ph = 30 + t * 150;
        g.fillStyle = rgba(INK, 0.99);
        g.fillRect(x - (3 + t * 8) / 2, y - ph, 3 + t * 8, ph);
        g.strokeStyle = rgba(ember, 0.24);
        g.lineWidth = 1.2;
        g.strokeRect(x - (3 + t * 8) / 2, y - ph, 3 + t * 8, ph);
      }
    };
    rail('left');
    rail('right');
    g.beginPath();
    g.moveTo(-PAD, h + PAD);
    g.lineTo(-PAD, h * 0.9);
    g.quadraticCurveTo(w * 0.2, h * 0.98, w * 0.5, h * 0.95);
    g.quadraticCurveTo(w * 0.8, h * 0.92, w + PAD, h * 0.99);
    g.lineTo(w + PAD, h + PAD);
    g.closePath();
    g.fillStyle = rgba(INK, 0.99);
    g.fill();
    void next;
  });

  return [
    { canvas: far, depth: 0.1, alpha: 1 },
    { canvas: mid, depth: 0.42, alpha: 1 },
    { canvas: near, depth: 1.4, alpha: 1 }
  ];
};

const BUILDERS = { abismo, cidade, jardins, cristal, seda, estrada };

const LIVE = {
  cidade(ctx, theme, env) {
    const { w, h, now, ember } = env;
    const next = rand(97);
    for (let i = 0; i < 7; i += 1) {
      const x = next() * w;
      const speed = 0.00016 + next() * 0.0003;
      const t = ((now * speed) + next()) % 1;
      const y = t * h * 1.1 - h * 0.05;
      const len = 26 + next() * 60;
      const grad = ctx.createLinearGradient(x, y - len, x, y);
      grad.addColorStop(0, rgba(theme.ember, 0));
      grad.addColorStop(1, rgba(theme.ember, 0.22));
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(x, y - len);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, 1.6, 0, Math.PI * 2);
      ctx.fillStyle = rgba(ember, 0.3);
      ctx.fill();
    }
  },
  cristal(ctx, theme, env) {
    const { w, h, now } = env;
    const next = rand(101);
    for (let i = 0; i < 10; i += 1) {
      const x = next() * w;
      const y = next() * h;
      const phase = next() * Math.PI * 2;
      const pulse = Math.max(0, Math.sin(now * 0.0012 + phase));
      if (pulse < 0.02) continue;
      const s = (5 + next() * 12) * pulse;
      ctx.strokeStyle = rgba(theme.ember, 0.5 * pulse);
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x - s, y);
      ctx.lineTo(x + s, y);
      ctx.moveTo(x, y - s);
      ctx.lineTo(x, y + s);
      ctx.stroke();
    }
  },
  estrada(ctx, theme, env) {
    const { w, h, now } = env;
    const horizon = h * 0.6;
    const vx = w * 0.5;
    const travel = (now * 0.00036) % 1;
    for (let i = 0; i < 11; i += 1) {
      const t = ((i / 11) + travel) % 1;
      const depth = t * t * t;
      const y = horizon + depth * (h - horizon);
      const len = 5 + depth * 82;
      const width = 1.4 + depth * 12;
      ctx.fillStyle = rgba([246, 236, 206], 0.1 + depth * 0.55);
      ctx.fillRect(vx - width / 2, y, width, len);
    }
    const pass = (now * 0.00007) % 1;
    const px = -0.2 + pass * 1.4;
    const py = horizon + (px - 0.5) ** 2 * 40;
    const beam = ctx.createRadialGradient(px * w, py, 0, px * w, py, 90);
    beam.addColorStop(0, rgba(theme.ember, 0.5));
    beam.addColorStop(1, rgba(theme.ember, 0));
    ctx.fillStyle = beam;
    ctx.fillRect(px * w - 90, py - 90, 180, 180);
  }
};

const keyFor = (theme, w, h) => `${theme.id}|${w}x${h}`;

const sceneFor = (theme, w, h, dpr) => {
  const key = keyFor(theme, w, h);
  const hit = cache.get(key);
  if (hit) return hit;
  const built = (BUILDERS[theme.id] ?? abismo)(theme, w, h, dpr);
  cache.set(key, built);
  while (cache.size > MAX_CACHE) cache.delete(cache.keys().next().value);
  return built;
};

export const clearScenery = () => cache.clear();

export const drawRoom = (ctx, theme, env) => {
  if (!theme || env.alpha <= 0.004) return;
  const layers = sceneFor(theme, env.w, env.h, env.dpr);
  ctx.save();
  ctx.globalAlpha = env.alpha;
  for (const { canvas, depth } of layers) {
    const dx = -PAD + env.px * depth * 26 + env.drift * depth * 10;
    const dy = -PAD + env.py * depth * 16 + env.camera * depth * 44;
    ctx.drawImage(canvas, dx, dy, env.w + PAD * 2, env.h + PAD * 2);
  }
  LIVE[theme.id]?.(ctx, theme, env);
  ctx.restore();
};
