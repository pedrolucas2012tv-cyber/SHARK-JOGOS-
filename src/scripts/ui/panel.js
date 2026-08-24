import { createScrollLock } from '../utils/scroll-lock.js';

const NEXT = new Set(['ArrowDown', 's', 'S']);
const PREV = new Set(['ArrowUp', 'w', 'W']);
const LESS = new Set(['ArrowLeft', 'a', 'A']);
const MORE = new Set(['ArrowRight', 'd', 'D']);

let openPanel = null;
export const isPanelOpen = () => Boolean(openPanel);
export const closeOpenPanel = (reason) => openPanel?.close(reason);

export function createPanel({
  variant = '',
  eyebrow = '',
  title = '',
  hint = '',
  build,
  onClose,
  ambient,
  sfx,
  reduceMotion = false
}) {
  openPanel?.close('replaced');

  const returnFocus = document.activeElement;
  const content = document.querySelector('#content');
  const previousMode = ambient?.mode ?? 'page';

  const scrim = document.createElement('div');
  scrim.className = `panel-scrim ${variant}`.trim();
  const titleId = `panel-title-${Math.random().toString(36).slice(2, 8)}`;
  scrim.innerHTML = `
    <div class="panel" role="dialog" aria-modal="true" aria-labelledby="${titleId}">
      <span class="panel__corners" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
      <span class="panel__eyebrow"></span>
      <h2 class="panel__title" id="${titleId}"></h2>
      <div class="panel__body"></div>
      <div class="panel__actions"></div>
      <span class="panel__hint"></span>
    </div>`;

  const panel = scrim.querySelector('.panel');

  const scrollLock = createScrollLock({ allowWithin: scrim });
  const setCopy = ({ eyebrow: e = eyebrow, title: t = title, hint: h = hint } = {}) => {
    panel.querySelector('.panel__eyebrow').textContent = e;
    panel.querySelector('.panel__title').textContent = t;
    panel.querySelector('.panel__hint').textContent = h;
  };
  setCopy();

  const body = panel.querySelector('.panel__body');
  const actions = panel.querySelector('.panel__actions');
  const adjusters = new WeakMap();

  const register = (element, { adjust } = {}) => {
    element.dataset.item = '';
    if (adjust) adjusters.set(element, adjust);
    element.addEventListener('pointerenter', () => point(items().indexOf(element)));
    return element;
  };

  const items = () => [...panel.querySelectorAll('[data-item]')].filter((el) => !el.hasAttribute('disabled'));
  let index = 0;

  const point = (next, { sound = true } = {}) => {
    const list = items();
    if (!list.length) return;
    const clamped = (next + list.length) % list.length;
    if (clamped === index && list[clamped]?.classList.contains('is-cursor')) return;
    list.forEach((el) => el.classList.remove('is-cursor'));
    index = clamped;
    const item = list[index];
    item.classList.add('is-cursor');
    item.focus({ preventScroll: true });

    item.scrollIntoView({ block: 'nearest' });
    if (sound) sfx?.move();
  };

  const adjust = (delta) => {
    const item = items()[index];
    const fn = item && adjusters.get(item);
    if (!fn) return false;
    fn(delta);
    sfx?.move();
    return true;
  };

  let closed = false;
  const close = (reason = 'dismiss') => {
    if (closed) return;
    closed = true;
    if (openPanel === api) openPanel = null;
    document.removeEventListener('keydown', onKeydown, true);
    scrollLock.unlock();
    content?.removeAttribute('inert');
    scrim.classList.add('is-closing');
    scrim.classList.remove('is-open');

    if (reason !== 'replaced' && !document.querySelector('.panel-scrim:not(.is-closing)')) {
      document.body.classList.remove('is-paused');
      ambient?.setMode(previousMode);
    }
    if (reason !== 'replaced') sfx?.close();
    const remove = () => scrim.remove();
    if (reduceMotion) remove();
    else setTimeout(remove, 260);

    if (returnFocus instanceof HTMLElement && returnFocus.isConnected) {
      returnFocus.focus({ preventScroll: true });
    }
    onClose?.(reason);
  };

  function onKeydown(event) {
    if (closed) return;
    if (event.key === 'Escape') {

      event.preventDefault();
      event.stopPropagation();
      close('cancel');
      return;
    }
    if (event.key === 'Tab') {

      event.preventDefault();
      point(index + (event.shiftKey ? -1 : 1));
      return;
    }
    if (PREV.has(event.key)) { event.preventDefault(); point(index - 1); return; }
    if (NEXT.has(event.key)) { event.preventDefault(); point(index + 1); return; }
    if (LESS.has(event.key)) { if (adjust(-1)) event.preventDefault(); return; }
    if (MORE.has(event.key)) { if (adjust(1)) event.preventDefault(); return; }
    if (event.key === 'Enter' || event.key === ' ') {
      const item = items()[index];
      if (!item) return;
      event.preventDefault();
      item.classList.add('is-pressed');
      setTimeout(() => item.classList.remove('is-pressed'), 170);
      item.click();
    }
  }

  const api = {
    panel, body, actions, register, close, setCopy,

    addAction({ label, variant: kind = 'ghost', onSelect }) {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `panel-action panel-action--${kind}`;
      button.innerHTML = `<span class="panel-action__label"></span>`;
      button.querySelector('.panel-action__label').textContent = label;
      button.addEventListener('click', () => onSelect?.(api));
      actions.append(register(button));
      return button;
    },
    focusFirst() { point(0, { sound: false }); }
  };

  build?.(api);

  document.body.append(scrim);
  document.body.classList.add('is-paused');
  content?.setAttribute('inert', '');
  scrollLock.lock();
  ambient?.setMode('paused');
  sfx?.resume();
  sfx?.open();
  document.addEventListener('keydown', onKeydown, true);
  scrim.addEventListener('pointerdown', (event) => { if (event.target === scrim) close('cancel'); });

  requestAnimationFrame(() => {
    scrim.classList.add('is-open');
    api.focusFirst();
  });

  openPanel = api;
  return api;
}

export function createSlider({ label, value, onInput, format = (v) => `${Math.round(v * 100)}` }) {
  const row = document.createElement('label');
  row.className = 'panel-row panel-row--slider';
  row.innerHTML = `
    <span class="panel-row__label"></span>
    <span class="panel-row__control">
      <input type="range" min="0" max="100" step="1">
      <span class="panel-row__track" aria-hidden="true"><i></i></span>
    </span>
    <span class="panel-row__value u-mono"></span>`;
  const input = row.querySelector('input');
  const fill = row.querySelector('.panel-row__track i');
  const readout = row.querySelector('.panel-row__value');
  row.querySelector('.panel-row__label').textContent = label;
  input.value = String(Math.round(value * 100));
  input.setAttribute('aria-label', label);

  const paint = () => {
    const v = Number(input.value) / 100;
    fill.style.width = `${input.value}%`;
    readout.textContent = format(v);
    row.style.setProperty('--fill', `${input.value}%`);
  };
  paint();
  input.addEventListener('input', () => { paint(); onInput(Number(input.value) / 100); });

  return {
    row,
    focusTarget: input,

    adjust(delta) {
      input.value = String(Math.min(100, Math.max(0, Number(input.value) + delta * 5)));
      paint();
      onInput(Number(input.value) / 100);
    }
  };
}

export function createOptionRow({ label, options, index: startIndex = 0, onChange }) {
  const row = document.createElement('div');
  row.className = 'panel-row panel-row--option';
  row.innerHTML = `
    <span class="panel-row__label"></span>
    <button class="panel-row__stepper" type="button" data-step="-1" tabindex="-1" aria-hidden="true">◄</button>
    <button class="panel-row__option" type="button"><span></span></button>
    <button class="panel-row__stepper" type="button" data-step="1" tabindex="-1" aria-hidden="true">►</button>`;
  const value = row.querySelector('.panel-row__option');
  const valueText = value.querySelector('span');
  row.querySelector('.panel-row__label').textContent = label;
  let current = startIndex;
  const labels = options;

  const paint = () => {
    valueText.textContent = labels[current];
    value.setAttribute('aria-label', `${row.querySelector('.panel-row__label').textContent}: ${labels[current]}`);
  };
  const step = (delta) => {
    current = (current + delta + labels.length) % labels.length;
    paint();
    onChange(current);
  };
  paint();
  value.addEventListener('click', () => step(1));
  row.querySelectorAll('[data-step]').forEach((button) => {
    button.addEventListener('click', (event) => { event.stopPropagation(); step(Number(button.dataset.step)); });
  });

  return { row, focusTarget: value, adjust: step };
}
