import { createEntryGate } from './entry-gate.js';
import { createMusicPlayer } from './music-player.js';
import { initEasterEggs } from './easter-eggs.js';
import { initI18n } from './i18n.js';
import { initMotion } from './motion.js';
import { resetScrollPosition } from './utils/scroll.js';

const root = document.documentElement;
root.classList.add('has-gate');
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
resetScrollPosition();
addEventListener('pageshow', resetScrollPosition, { once: true });
initI18n();
initMotion();

const image = document.querySelector('[data-js="profile-photo"] img');
image?.addEventListener('error', () => image.closest('[data-js="profile-photo"]')?.classList.add('is-missing'));

const music = createMusicPlayer();
initEasterEggs();

createEntryGate({ onEnter: async () => {
  const started = await music.tryPlay();
  if (!started) document.querySelector('.music')?.classList.add('is-error');
}});
