import config from '../data/easter-eggs.json';
import { hasSecret, recordSecret } from './save.js';
import { setTheme } from './theme.js';
import { showToast } from './ui/toast.js';
import { t } from './i18n.js';

export function initEasterEggs() {

  const found = (message) => showToast(message, { tag: t('save.stored') });

  console.log('%ctavvkkj / save file open', 'color:#ffb27a;font:600 16px monospace');
  console.log('%cCurioso. O GitHub está logo ali; pelo menos você abriu o console antes de copiar qualquer coisa.', 'color:#a8a79f;font:12px monospace');

  const konami = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];

  const password = 'cars';
  let keyBuffer = [];
  let wordBuffer = '';
  let secretTimer;
  addEventListener('keydown', (event) => {
    if (event.key === 'Escape') document.body.classList.remove('secret-mode');
    keyBuffer.push(event.key); keyBuffer = keyBuffer.slice(-konami.length);
    if (keyBuffer.join('|').toLowerCase() === konami.join('|').toLowerCase()) {
      recordSecret('konami'); document.body.classList.add('secret-mode'); clearTimeout(secretTimer);
      secretTimer = setTimeout(() => document.body.classList.remove('secret-mode'), 5000);
    }
    if (event.key.length === 1) wordBuffer = (wordBuffer + event.key.toLowerCase()).slice(-password.length);
    if (wordBuffer !== password) return;
    wordBuffer = '';

    const first = recordSecret('cars');
    setTheme('estrada');
    found(t(first ? 'toast.cars' : 'toast.carsAgain'));
  });

  const photoConfig = config.eggs.find((egg) => egg.id === 'photo-clicks');
  const photo = document.querySelector('[data-js="profile-photo"]');
  let photoClicks = 0; let photoReset;
  photo?.addEventListener('click', () => {
    photoClicks += 1; clearTimeout(photoReset);
    photoReset = setTimeout(() => { photoClicks = 0; }, photoConfig.resetAfterMs);
    if (photoClicks >= photoConfig.threshold) {
      recordSecret('photo-clicks'); photoClicks = 0; photo.classList.remove('is-egg');
      requestAnimationFrame(() => photo.classList.add('is-egg'));
      setTimeout(() => photo.classList.remove('is-egg'), 500);
    }
  });

  const mainLink = document.querySelector('[data-js="link-main"]');
  let holdTimer; let held = false;
  const startHold = () => { held = false; holdTimer = setTimeout(() => { held = true; recordSecret('main-link-hold'); mainLink.classList.add('is-secret'); }, 2000); };
  const cancelHold = () => clearTimeout(holdTimer);
  mainLink?.addEventListener('pointerdown', startHold);
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((type) => mainLink?.addEventListener(type, cancelHold));
  mainLink?.addEventListener('click', (event) => {
    if (held) { event.preventDefault(); held = false; found(t('toast.hold')); return; }
    if (hasSecret('konami')) mainLink.href = 'https://tavvkkj.xyz?from=secret';
  });

  document.querySelector('[data-js="background-hidden-node"]')?.addEventListener('click', () => {
    recordSecret('hidden-pixel'); found(t('toast.pixel'));
  });
}
