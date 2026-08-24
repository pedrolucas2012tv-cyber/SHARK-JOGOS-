import { storage } from './utils/storage.js';
import { hasSecret } from './save.js';

const STORAGE_KEY = 'tavvkkj.room';

export const THEMES = [
  {
    id: 'abismo',
    track: '/audio/abismo.mp3',

    cold: [86, 122, 178], warm: [255, 120, 110], spore: [198, 214, 240], ember: [255, 176, 128],
    field: { dir: -1, speed: 1, sway: 1, twinkle: 1, streak: 0, size: 1, drift: 0, dash: 0 }
  },
  {
    id: 'cidade',
    track: '/audio/cidade.mp3',

    cold: [74, 122, 196], warm: [140, 190, 255], spore: [176, 206, 245], ember: [206, 230, 255],
    field: { dir: 1, speed: 3.4, sway: 0.15, twinkle: 0.5, streak: 1, size: 0.8, drift: 0, dash: 0 }
  },
  {
    id: 'jardins',
    track: '/audio/jardins.mp3',

    cold: [92, 152, 108], warm: [226, 128, 158], spore: [214, 224, 190], ember: [236, 168, 190],
    field: { dir: -1, speed: 0.62, sway: 2.6, twinkle: 0.8, streak: 0, size: 1.25, drift: 0, dash: 0 }
  },
  {
    id: 'cristal',
    track: '/audio/cristal.mp3',

    cold: [138, 104, 196], warm: [240, 110, 200], spore: [232, 214, 250], ember: [255, 160, 226],
    field: { dir: -1, speed: 0.35, sway: 0.5, twinkle: 2.8, streak: 0, size: 0.9, drift: 0, dash: 0 }
  },
  {
    id: 'seda',
    track: '/audio/seda.mp3',

    cold: [176, 140, 84], warm: [255, 196, 104], spore: [240, 222, 186], ember: [255, 214, 150],
    field: { dir: -1, speed: 0.8, sway: 1.4, twinkle: 1.2, streak: 0, size: 1.1, drift: 0, dash: 0 }
  },
  {
    id: 'estrada',
    track: '/audio/estrada.mp3',

    secret: 'cars',
    cold: [96, 168, 186], warm: [255, 138, 64], spore: [255, 214, 170], ember: [255, 128, 84],
    field: { dir: -0.12, speed: 0.9, sway: 0.55, twinkle: 1.7, streak: 0, size: 0.85, drift: -5.4, dash: 1 }
  }
];

export const isUnlocked = (theme) => !theme.secret || hasSecret(theme.secret);
export const availableThemes = () => THEMES.filter(isUnlocked);

const listeners = new Set();
let current = THEMES[0];

export const getTheme = () => current;
export const themeIndex = () => THEMES.indexOf(current);

export const onThemeChange = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};

export const setTheme = (id, { persist = true } = {}) => {
  const next = THEMES.find((theme) => theme.id === id) ?? THEMES[0];
  const changed = next !== current;
  current = next;
  document.documentElement.dataset.room = current.id;
  if (persist) storage.set(STORAGE_KEY, current.id);
  if (!changed) return current;

  const root = document.documentElement;
  root.classList.add('is-room-shifting');
  clearTimeout(setTheme.timer);
  setTheme.timer = setTimeout(() => root.classList.remove('is-room-shifting'), 620);
  listeners.forEach((fn) => fn(current));
  return current;
};

export const cycleTheme = (delta) => {
  const list = availableThemes();
  const index = (list.indexOf(current) + delta + list.length) % list.length;
  return setTheme(list[index].id);
};

export const initTheme = () => {
  const saved = THEMES.find((theme) => theme.id === storage.get(STORAGE_KEY, THEMES[0].id));
  return setTheme(saved && isUnlocked(saved) ? saved.id : THEMES[0].id, { persist: false });
};
