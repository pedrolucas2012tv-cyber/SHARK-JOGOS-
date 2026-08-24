const BUTTONS = { 12: 'ArrowUp', 13: 'ArrowDown', 14: 'ArrowLeft', 15: 'ArrowRight', 0: 'Enter', 1: 'Escape', 9: 'Escape' };
const ONCE = new Set(['Enter', 'Escape']);
const DEAD = 0.55;
const FIRST_REPEAT = 340;
const REPEAT = 130;

export function initGamepad() {
  if (typeof navigator.getGamepads !== 'function') return { stop() {} };

  const held = new Map();
  let raf = 0;

  const send = (key) => {
    const target = document.activeElement instanceof Element ? document.activeElement : document.body;
    target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  };

  const poll = () => {
    raf = 0;
    const pads = [...navigator.getGamepads()].filter(Boolean);
    if (!pads.length) { held.clear(); return; }

    const now = performance.now();
    const down = new Set();
    for (const pad of pads) {
      const axes = pad.axes || [];
      if (axes[0] < -DEAD) down.add('ArrowLeft');
      if (axes[0] > DEAD) down.add('ArrowRight');
      if (axes[1] < -DEAD) down.add('ArrowUp');
      if (axes[1] > DEAD) down.add('ArrowDown');
      pad.buttons.forEach((button, index) => {
        const key = BUTTONS[index];
        if (key && button.pressed) down.add(key);
      });
    }

    for (const key of down) {
      const next = held.get(key);
      if (next === undefined) {
        held.set(key, ONCE.has(key) ? Infinity : now + FIRST_REPEAT);
        send(key);
      } else if (now >= next) {
        held.set(key, now + REPEAT);
        send(key);
      }
    }
    for (const key of [...held.keys()]) if (!down.has(key)) held.delete(key);

    raf = requestAnimationFrame(poll);
  };

  const wake = () => { if (!raf) raf = requestAnimationFrame(poll); };
  addEventListener('gamepadconnected', wake);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { cancelAnimationFrame(raf); raf = 0; held.clear(); }
    else if ([...navigator.getGamepads()].some(Boolean)) wake();
  });
  if ([...navigator.getGamepads()].some(Boolean)) wake();

  return { stop() { cancelAnimationFrame(raf); raf = 0; } };
}
