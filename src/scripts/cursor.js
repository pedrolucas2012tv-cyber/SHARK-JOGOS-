const INTERACTIVE = 'a, button, [role="button"], .save-slot, input, [tabindex]:not([tabindex="-1"])';

export function initCursor({ reduceMotion }) {
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (reduceMotion || !fine) return;

  const glow = document.createElement('div');
  glow.className = 'signal-cursor';
  glow.setAttribute('aria-hidden', 'true');
  const dot = document.createElement('div');
  dot.className = 'signal-cursor__dot';
  glow.append(dot);
  document.body.append(glow);

  const pos = { x: innerWidth / 2, y: innerHeight / 2 };
  const target = { x: pos.x, y: pos.y };
  const dotPos = { x: pos.x, y: pos.y };
  let raf = 0;
  let last = 0;
  let visible = false;

  const follow = (current, to, halfLife, dt) => current + (to - current) * (1 - 2 ** (-dt / halfLife));

  const tick = (now) => {
    const dt = last ? Math.min(now - last, 64) : 16.7;
    last = now;
    pos.x = follow(pos.x, target.x, 52, dt);
    pos.y = follow(pos.y, target.y, 52, dt);
    dotPos.x = follow(dotPos.x, target.x, 17, dt);
    dotPos.y = follow(dotPos.y, target.y, 17, dt);
    glow.style.transform = `translate3d(${pos.x}px, ${pos.y}px, 0)`;
    dot.style.transform = `translate3d(${dotPos.x - pos.x}px, ${dotPos.y - pos.y}px, 0)`;
    if (Math.abs(target.x - pos.x) > 0.1 || Math.abs(target.y - pos.y) > 0.1) {
      raf = requestAnimationFrame(tick);
    } else {
      raf = 0;
      last = 0;
    }
  };
  const wake = () => { if (!raf) { last = 0; raf = requestAnimationFrame(tick); } };

  addEventListener('pointermove', (event) => {
    if (event.pointerType && event.pointerType !== 'mouse') return;
    target.x = event.clientX;
    target.y = event.clientY;
    if (!visible) {
      visible = true;
      glow.classList.add('is-visible');

      document.body.classList.add('has-signal-cursor');
    }
    const overInteractive = event.target instanceof Element && event.target.closest(INTERACTIVE);
    glow.classList.toggle('is-hot', Boolean(overInteractive));
    wake();
  }, { passive: true });

  addEventListener('pointerdown', () => glow.classList.add('is-press'));
  addEventListener('pointerup', () => glow.classList.remove('is-press'));
  document.addEventListener('pointerleave', () => { visible = false; glow.classList.remove('is-visible'); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(raf); raf = 0; last = 0; } });
}
