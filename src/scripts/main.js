import { createCinema } from './cinema.js';
import { createAmbient } from './ambient.js';
import { createSfx } from './sfx.js';
import { initCursor } from './cursor.js';
import { createSoundToggle } from './sound-toggle.js';
import { initEasterEggs } from './easter-eggs.js';
import { initI18n } from './i18n.js';
import { initMotion, resetMotion } from './motion.js';
import { beginRun } from './save.js';
import { initSaveHud } from './save-hud.js';
import { initTheme, onThemeChange } from './theme.js';
import { initOptions } from './options.js';
import { initConfirmLink } from './confirm-link.js';
import { initKeynav } from './keynav.js';
import { initGamepad } from './gamepad.js';
import { initInputGuard } from './input-guard.js';
import { showToast } from './ui/toast.js';
import { t } from './i18n.js';
import { resetScrollPosition } from './utils/scroll.js';

const root = document.documentElement;
root.classList.add('has-gate');
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
resetScrollPosition();
addEventListener('pageshow', resetScrollPosition, { once: true });

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

const measureGutter = () => {
  const gutter = window.innerWidth - document.documentElement.clientWidth;
  root.style.setProperty('--scrollbar-gutter', `${Math.max(0, gutter)}px`);
};
measureGutter();
addEventListener('resize', measureGutter, { passive: true });

initI18n();

const room = initTheme();

beginRun();

const image = document.querySelector('[data-js="profile-photo"] img');
image?.addEventListener('error', () => image.closest('[data-js="profile-photo"]')?.classList.add('is-missing'));

const noop = { setMode() {}, setRoom() {}, impact() {}, start() {}, stop() {}, destroy() {} };
const noSfx = {
  enabled: false, mix: { music: 0, sfx: 0 }, onChange() { return () => {}; }, setEnabled() {},
  setVolume() {}, getVolume() { return 0; }, resume() {}, music() {},
  confirm() {}, dive() {}, land() {}, arrive() {}, move() {}, select() {}, open() {}, close() {}, deny() {}
};
let ambient = noop;
let sfx = noSfx;
try {
  const canvas = document.querySelector('[data-js="ambient"]');
  if (canvas) ambient = createAmbient({ canvas, reduceMotion, room });
  sfx = createSfx({ reduceMotion });
} catch {  }

initMotion({ sfx, reduceMotion });

try { createSoundToggle({ sfx }); } catch {  }
initEasterEggs();
try { initSaveHud(); } catch {  }

onThemeChange((next) => {
  ambient.setRoom(next);
  sfx.setTrack(next.track);
});
sfx.setTrack(room.track);

const options = initOptions({ ambient, sfx, reduceMotion, onQuit: () => quitToSaveSelect() });
try { initConfirmLink({ ambient, sfx, reduceMotion }); } catch {  }
try { initKeynav({ sfx, onPause: options.open }); } catch {  }
try { initGamepad(); } catch {  }
initInputGuard({ onBlocked: () => showToast(t('hint.context')) });
try { initCursor({ reduceMotion }); } catch {  }

const revealContent = () => {
  document.body.classList.remove('has-entry-gate');
  document.body.classList.add('is-loaded');
  document.querySelector('#content')?.removeAttribute('inert');
  document.querySelector('.cinema')?.remove();
};

const startSaveSelect = (returning = false) => {
  try {
    createCinema({ ambient, sfx, reduceMotion, returning, onOptions: options.open });
  } catch {
    revealContent();
  }
};

const quitToSaveSelect = () => {
  if (document.body.classList.contains('has-entry-gate')) return;
  resetScrollPosition();
  document.body.classList.remove('is-loaded');
  resetMotion();
  startSaveSelect(true);
};

startSaveSelect();
