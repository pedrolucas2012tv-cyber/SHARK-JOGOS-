import { onSaveChange, snapshot } from './save.js';
import { t } from './i18n.js';

export function initSaveHud() {
  const mount = document.querySelector('[data-js="save-readout"]');
  if (!mount) return { destroy() {} };

  const bar = mount.querySelector('.save-readout__bar i');
  const value = mount.querySelector('[data-js="save-pct"]');
  const count = mount.querySelector('[data-js="save-count"]');
  let flashTimer;

  const render = (state, { flash = false } = {}) => {
    mount.style.setProperty('--pct', `${state.pct}%`);
    if (bar) bar.style.width = `${state.pct}%`;
    if (value) value.textContent = `${state.pct}%`;
    if (count) count.textContent = `${String(state.secrets).padStart(2, '0')}/${String(state.total).padStart(2, '0')}`;
    mount.setAttribute('aria-label', t('save.aria')
      .replace('{pct}', String(state.pct))
      .replace('{found}', String(state.secrets))
      .replace('{total}', String(state.total)));
    if (!flash) return;

    mount.classList.remove('is-ticking');
    clearTimeout(flashTimer);

    requestAnimationFrame(() => {
      mount.classList.add('is-ticking');
      flashTimer = setTimeout(() => mount.classList.remove('is-ticking'), 1200);
    });
  };

  render(snapshot());
  const stop = onSaveChange((state) => render(state, { flash: true }));
  document.addEventListener('languagechange', () => render(snapshot()));

  return { destroy() { stop(); clearTimeout(flashTimer); } };
}
