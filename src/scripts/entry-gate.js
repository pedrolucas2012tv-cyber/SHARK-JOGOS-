import { t } from './i18n.js';
import { resetScrollPosition } from './utils/scroll.js';

export function createEntryGate({ onEnter }) {
  document.body.classList.add('has-entry-gate');
  const gate = document.createElement('div');
  gate.className = 'entry-gate';
  gate.tabIndex = 0;
  gate.setAttribute('role', 'dialog');
  gate.setAttribute('aria-modal', 'true');
  gate.setAttribute('aria-labelledby', 'entry-gate-title');
  gate.innerHTML = `
    <section class="entry-gate__dialog">
      <header class="entry-gate__head">
        <h2 id="entry-gate-title">${t('gate.title')}</h2>
        <img class="entry-gate__mark" src="/images/site-icon.png" alt="" width="34" height="34">
      </header>
      <div class="entry-gate__body">
        <p>${t('gate.body')}</p>
        <div class="entry-gate__status">
          <i aria-hidden="true"></i>
          <span><strong>${t('gate.status')}</strong><small>${t('gate.note')}</small></span>
        </div>
      </div>
      <footer class="entry-gate__footer">
        <button class="btn btn--secondary" type="button" data-enter>${t('gate.enter')}</button>
      </footer>
    </section>`;

  let entered = false;
  const enter = async () => {
    if (entered) return;
    entered = true;
    resetScrollPosition();
    document.body.classList.remove('has-entry-gate');
    gate.classList.add('is-exiting');
    document.body.classList.add('is-loaded');
    await onEnter?.();
    setTimeout(() => {
      gate.remove();
      document.querySelector('#page-title')?.focus({ preventScroll: true });
    }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 1 : 260);
  };
  gate.querySelector('[data-enter]').addEventListener('click', enter);
  gate.addEventListener('pointerdown', (event) => {
    if (event.target === gate) enter();
  });
  gate.addEventListener('keydown', (event) => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); enter(); }
  });
  document.body.append(gate);
  requestAnimationFrame(() => gate.focus({ preventScroll: true }));
}
