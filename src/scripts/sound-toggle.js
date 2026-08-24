import { t } from './i18n.js';

export function createSoundToggle({ sfx }) {
  const mount = document.querySelector('[data-js="sound-mount"]');
  if (!mount) return { destroy() {} };

  const button = document.createElement('button');
  button.className = 'sound-toggle btn btn--ghost btn--icon btn--sm';
  button.type = 'button';
  button.innerHTML = `
    <span class="sound-toggle__glyph" aria-hidden="true">
      <i style="--i:0"></i><i style="--i:1"></i><i style="--i:2"></i>
    </span>`;
  mount.append(button);

  const sync = () => {
    const on = sfx.enabled;
    button.classList.toggle('is-on', on);
    button.setAttribute('aria-pressed', String(on));
    button.setAttribute('aria-label', t(on ? 'sound.on' : 'sound.off'));
  };
  sync();
  sfx.onChange(sync);
  document.addEventListener('languagechange', sync);

  button.addEventListener('click', () => {
    const next = !sfx.enabled;
    sfx.setEnabled(next);

    if (next) sfx.select();
  });

  return { destroy() { button.remove(); } };
}
