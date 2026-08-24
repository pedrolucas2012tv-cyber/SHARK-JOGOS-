import { isPanelOpen } from './ui/panel.js';
import { t } from './i18n.js';

const PREV = new Set(['ArrowUp', 'w', 'W']);
const NEXT = new Set(['ArrowDown', 's', 'S']);
const LEFT = new Set(['ArrowLeft', 'a', 'A']);
const RIGHT = new Set(['ArrowRight', 'd', 'D']);
const TYPING = /^(input|textarea|select)$/i;

const buildRows = () => {
  const rows = [];
  const top = [...document.querySelectorAll(
    '.bio-topline .site-signature, .bio-topline .language-switch button, .bio-topline .sound-toggle, .bio-topline .options-toggle'
  )];
  if (top.length) rows.push(top);
  const main = document.querySelector('.project-card');
  if (main) rows.push([main]);
  document.querySelectorAll('.social-card').forEach((card) => rows.push([card]));
  const footer = [...document.querySelectorAll('.bio-footer .footer-source')];
  if (footer.length) rows.push(footer);
  return rows;
};

export function initKeynav({ sfx, onPause } = {}) {
  let row = 0;
  let col = 0;
  let hint;
  let hintTimer;
  let active = false;

  const showHint = () => {
    if (!hint) {
      hint = document.createElement('div');
      hint.className = 'keyhint';
      hint.setAttribute('aria-hidden', 'true');
      hint.innerHTML = '<span data-key="move"></span><span data-key="enter"></span><span data-key="pause"></span>';
      document.body.append(hint);
      const label = () => {
        hint.querySelector('[data-key="move"]').textContent = t('keys.move');
        hint.querySelector('[data-key="enter"]').textContent = t('keys.enter');
        hint.querySelector('[data-key="pause"]').textContent = t('keys.pause');
      };
      label();
      document.addEventListener('languagechange', label);
    }
    hint.classList.add('is-visible');
    clearTimeout(hintTimer);
    hintTimer = setTimeout(() => hint.classList.remove('is-visible'), 4200);
  };

  const clearCursor = () => {
    document.querySelectorAll('.is-cursor').forEach((el) => el.classList.remove('is-cursor'));
  };

  const land = (rows, { sound = true } = {}) => {
    const target = rows[row]?.[col] ?? rows[row]?.[0];
    if (!target) return;
    clearCursor();
    target.classList.add('is-cursor');
    target.focus({ preventScroll: true });
    target.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    if (sound) sfx?.move();
    document.body.classList.add('is-keynav');
    showHint();
  };

  const sync = (rows) => {
    const focused = document.activeElement;
    if (!(focused instanceof Element)) return;
    for (let r = 0; r < rows.length; r += 1) {
      const c = rows[r].findIndex((item) => item === focused || item.contains(focused));
      if (c >= 0) { row = r; col = c; return; }
    }
  };

  document.addEventListener('keydown', (event) => {
    if (event.metaKey || event.ctrlKey || event.altKey) return;
    if (!document.body.classList.contains('is-loaded')) return;
    if (isPanelOpen()) return;
    const target = event.target;
    if (target instanceof Element && (TYPING.test(target.tagName) || target.isContentEditable)) return;

    if (event.key === 'Escape') {
      if (!onPause) return;
      event.preventDefault();
      onPause();
      return;
    }

    const rows = buildRows();
    if (!rows.length) return;

    if (PREV.has(event.key) || NEXT.has(event.key)) {
      event.preventDefault();
      sync(rows);
      const step = PREV.has(event.key) ? -1 : 1;

      row = (row + step + rows.length) % rows.length;
      col = Math.min(col, rows[row].length - 1);
      active = true;
      land(rows);
      return;
    }

    if (LEFT.has(event.key) || RIGHT.has(event.key)) {
      sync(rows);
      const step = LEFT.has(event.key) ? -1 : 1;
      const next = col + step;

      if (next < 0 || next >= rows[row].length) { if (active) sfx?.deny(); return; }
      event.preventDefault();
      col = next;
      active = true;
      land(rows);
      return;
    }

    if (event.key === 'Enter' || event.key === ' ') {
      if (!active) return;
      sync(rows);
      const item = rows[row]?.[col];
      if (!item || item !== document.activeElement) return;
      event.preventDefault();
      item.click();
    }
  });

  document.addEventListener('pointerdown', () => {
    if (!active) return;
    active = false;
    clearCursor();
    document.body.classList.remove('is-keynav');
    hint?.classList.remove('is-visible');
  });

  return { showHint };
}
