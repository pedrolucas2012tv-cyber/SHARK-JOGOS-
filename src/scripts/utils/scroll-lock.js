const SCROLL_KEYS = new Set([' ', 'PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown']);

export function createScrollLock({ allow, onPin, allowWithin } = {}) {

  const scrollable = (event) => {
    if (!allowWithin || !(event.target instanceof Node)) return false;
    if (!allowWithin.contains(event.target)) return false;
    return allowWithin.scrollHeight > allowWithin.clientHeight;
  };
  const swallow = (event) => {
    if (event.ctrlKey) return;
    if (scrollable(event)) return;
    if (event.cancelable) event.preventDefault();
  };
  const swallowKey = (event) => {
    if (!SCROLL_KEYS.has(event.key)) return;
    if (allow?.(event)) return;
    if (event.cancelable) event.preventDefault();
  };
  const pin = () => { onPin?.(); };
  let locked = false;
  return {
    get locked() { return locked; },
    lock() {
      if (locked) return;
      locked = true;
      addEventListener('wheel', swallow, { passive: false });
      addEventListener('touchmove', swallow, { passive: false });
      addEventListener('keydown', swallowKey, { passive: false });
      if (onPin) addEventListener('scroll', pin, { passive: true });
    },
    unlock() {
      if (!locked) return;
      locked = false;
      removeEventListener('wheel', swallow);
      removeEventListener('touchmove', swallow);
      removeEventListener('keydown', swallowKey);
      if (onPin) removeEventListener('scroll', pin);
    }
  };
}
