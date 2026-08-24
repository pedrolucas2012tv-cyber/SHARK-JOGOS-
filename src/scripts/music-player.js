import { t } from './i18n.js';

export function createMusicPlayer() {
  const mount = document.querySelector('[data-js="music-mount"]');
  if (!mount) return { tryPlay: async () => false };

  const player = document.createElement('div');
  player.className = 'music';
  player.innerHTML = `
    <div class="music__panel" id="music-panel">
      <strong></strong>
      <small></small>
    </div>
    <button class="music__toggle btn btn--ghost btn--icon btn--sm" type="button" aria-expanded="false" aria-controls="music-panel">
      <span class="music__glyph" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M9 18V5l10-2v13M9 9l10-2"/><circle cx="6" cy="18" r="3"/><circle cx="16" cy="16" r="3"/></svg></span>
    </button>`;
  mount.append(player);
  const button = player.querySelector('button');
  const updateCopy = () => {
    player.querySelector('strong').textContent = t('music.title');
    player.querySelector('small').textContent = t('music.note');
    button.setAttribute('aria-label', t(player.classList.contains('is-open') ? 'music.close' : 'music.open'));
  };
  updateCopy();
  document.addEventListener('languagechange', updateCopy);
  button.addEventListener('click', () => {
    const isOpen = player.classList.toggle('is-open');
    button.setAttribute('aria-expanded', String(isOpen));
    button.setAttribute('aria-label', t(isOpen ? 'music.close' : 'music.open'));
  });
  return { tryPlay: async () => false };
}
