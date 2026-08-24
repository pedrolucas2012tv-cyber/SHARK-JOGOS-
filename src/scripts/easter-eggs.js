import config from '../data/easter-eggs.json';
import { storage } from './utils/storage.js';
import { t } from './i18n.js';

export function initEasterEggs() {
  const toast = document.querySelector('[data-js="toast"]');
  const discovered = new Set(storage.get('tavvkkj.eggs', []));
  const save = (id) => { discovered.add(id); storage.set('tavvkkj.eggs', [...discovered]); };
  let toastTimer;
  const showToast = (message) => {
    toast.textContent = message; toast.classList.add('is-visible');
    clearTimeout(toastTimer); toastTimer = setTimeout(() => toast.classList.remove('is-visible'), 2800);
  };

  console.log('%ctavvkkj / source open', 'color:#c6934b;font:600 16px monospace');
  console.log('%cCurioso. O GitHub está logo ali; pelo menos você abriu o console antes de copiar qualquer coisa.', 'color:#a39b8f;font:12px monospace');

  const konami = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let keyBuffer = [];
  let secretTimer;
  addEventListener('keydown', (event) => {
    if (event.key === 'Escape') document.body.classList.remove('secret-mode');
    keyBuffer.push(event.key); keyBuffer = keyBuffer.slice(-konami.length);
    if (keyBuffer.join('|').toLowerCase() === konami.join('|').toLowerCase()) {
      save('konami'); document.body.classList.add('secret-mode'); clearTimeout(secretTimer);
      secretTimer = setTimeout(() => document.body.classList.remove('secret-mode'), 5000);
    }
  });

  const photoConfig = config.eggs.find((egg) => egg.id === 'photo-clicks');
  const photo = document.querySelector('[data-js="profile-photo"]');
  let photoClicks = 0; let photoReset;
  photo?.addEventListener('click', () => {
    photoClicks += 1; clearTimeout(photoReset);
    photoReset = setTimeout(() => { photoClicks = 0; }, photoConfig.resetAfterMs);
    if (photoClicks >= photoConfig.threshold) {
      save('photo-clicks'); photoClicks = 0; photo.classList.remove('is-egg');
      requestAnimationFrame(() => photo.classList.add('is-egg'));
      setTimeout(() => photo.classList.remove('is-egg'), 500);
    }
  });

  const mainLink = document.querySelector('[data-js="link-main"]');
  let holdTimer; let held = false;
  const startHold = () => { held = false; holdTimer = setTimeout(() => { held = true; save('main-link-hold'); mainLink.classList.add('is-secret'); }, 2000); };
  const cancelHold = () => clearTimeout(holdTimer);
  mainLink?.addEventListener('pointerdown', startHold);
  ['pointerup', 'pointercancel', 'pointerleave'].forEach((type) => mainLink?.addEventListener(type, cancelHold));
  mainLink?.addEventListener('click', (event) => {
    if (held) { event.preventDefault(); held = false; showToast(t('toast.hold')); return; }
    if (discovered.has('konami')) mainLink.href = 'https://tavvkkj.xyz?from=secret';
  });

  document.querySelector('[data-js="background-hidden-node"]')?.addEventListener('click', () => {
    save('hidden-pixel'); showToast(t('toast.pixel'));
  });
}
