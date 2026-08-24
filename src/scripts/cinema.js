import { t, setLanguage } from './i18n.js';
import { snapshot } from './save.js';
import { getTheme, onThemeChange } from './theme.js';
import { resetMotion } from './motion.js';
import { resetScrollPosition } from './utils/scroll.js';
import { createScrollLock } from './utils/scroll-lock.js';

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export function createCinema({ ambient, sfx, reduceMotion, onEnter, onOptions, returning = false }) {
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;

  const scrollLock = createScrollLock({
    allow: (event) => event.target === core,
    onPin: () => { if (window.scrollY !== 0) resetScrollPosition(); }
  });
  document.body.classList.add('has-entry-gate');

  const content = document.querySelector('#content');
  content?.setAttribute('inert', '');

  const scene = document.createElement('div');
  scene.className = 'cinema';
  scene.setAttribute('role', 'dialog');
  scene.setAttribute('aria-modal', 'true');
  scene.setAttribute('aria-labelledby', 'cinema-title');
  if (reduceMotion) scene.classList.add('is-still');

  const stat = (key) => `
    <span class="save-slot__stat">
      <b data-label="${key}"></b><span data-stat="${key}"></span>
    </span>`;

  scene.innerHTML = `
    <div class="cinema__stage">
      <span class="cinema__eyebrow" id="cinema-title"></span>
      <button class="save-slot" type="button" data-enter aria-describedby="cinema-hint">
        <span class="save-slot__glow" aria-hidden="true"></span>
        <span class="save-slot__corners" aria-hidden="true"><i></i><i></i><i></i><i></i></span>
        <span class="save-slot__crest" aria-hidden="true">
          <img src="/images/profile.png" width="56" height="56" alt="">
          <span class="save-slot__ring"></span>
        </span>
        <span class="save-slot__body">
          <span class="save-slot__head">
            <span class="save-slot__name"></span>
            <span class="save-slot__pct" data-stat="pct"></span>
          </span>
          <span class="save-slot__bar" aria-hidden="true"><i></i></span>
          <span class="save-slot__stats">${stat('area')}${stat('time')}${stat('runs')}${stat('build')}</span>
        </span>
        <span class="save-slot__action" aria-hidden="true"></span>
        <span class="save-slot__label sr-only"></span>
      </button>
      <span class="save-ghost" aria-hidden="true"></span>
      <div class="cinema__menu">
        <button class="cinema__option" type="button" data-menu="options"></button>
        <div class="cinema__option cinema__option--split" data-menu="language" role="group">
          <button type="button" data-language="pt-BR">PT</button>
          <span aria-hidden="true">/</span>
          <button type="button" data-language="en">EN</button>
        </div>
      </div>
      <span class="cinema__hint" id="cinema-hint"></span>
    </div>`;

  const core = scene.querySelector('.save-slot');
  const optionsButton = scene.querySelector('[data-menu="options"]');
  const languageRow = scene.querySelector('[data-menu="language"]');
  const eyebrow = scene.querySelector('.cinema__eyebrow');
  const hint = scene.querySelector('.cinema__hint');
  const label = scene.querySelector('.save-slot__label');
  const action = scene.querySelector('.save-slot__action');
  const name = scene.querySelector('.save-slot__name');
  const ghost = scene.querySelector('.save-ghost');
  const bar = scene.querySelector('.save-slot__bar i');
  const setStat = (key, value) => { scene.querySelector(`[data-stat="${key}"]`).textContent = value; };

  const applyCopy = () => {
    const save = snapshot();
    eyebrow.textContent = t('gate.eyebrow');
    name.textContent = t('gate.slotName');
    scene.querySelectorAll('[data-label]').forEach((element) => {
      const key = element.dataset.label;
      element.textContent = t(`gate.label${key[0].toUpperCase()}${key.slice(1)}`);
    });

    setStat('area', t('gate.area').replace('{room}', t(`room.short.${getTheme().id}`)));
    setStat('time', save.playTime);
    setStat('runs', String(save.runs).padStart(2, '0'));
    setStat('build', t('gate.build'));
    setStat('pct', `${save.pct}%`);
    bar.style.setProperty('--pct', `${save.pct}%`);
    ghost.textContent = t('gate.empty');
    action.textContent = t('gate.action');
    optionsButton.textContent = t('options.title');
    languageRow.querySelectorAll('[data-language]').forEach((button) => {
      const selected = button.dataset.language === document.documentElement.lang;
      button.setAttribute('aria-pressed', String(selected));
      button.classList.toggle('is-current', selected);
    });
    hint.textContent = t(fine ? 'gate.enterClick' : 'gate.enterTouch');
    const aria = t(save.pct > 0 ? 'gate.ariaReturning' : 'gate.aria').replace('{pct}', String(save.pct));
    core.setAttribute('aria-label', aria);
    label.textContent = aria;
  };
  applyCopy();
  document.addEventListener('languagechange', applyCopy);
  const stopRoomWatch = onThemeChange(applyCopy);

  let clock = setInterval(() => setStat('time', snapshot().playTime), 1000);
  const stopClock = () => { clearInterval(clock); clock = 0; };

  let magFrame = 0;
  let lastPointer = null;
  const updateLight = () => {
    magFrame = 0;
    const event = lastPointer;
    if (!event) return;
    const rect = core.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dist = Math.hypot(event.clientX - cx, event.clientY - cy);
    const reach = Math.max(window.innerWidth, window.innerHeight) * 0.38;
    const near = Math.max(0, 1 - dist / reach);
    scene.style.setProperty('--near', near.toFixed(3));
    scene.style.setProperty('--lx', `${(((event.clientX - rect.left) / rect.width) * 100).toFixed(1)}%`);
    scene.style.setProperty('--ly', `${(((event.clientY - rect.top) / rect.height) * 100).toFixed(1)}%`);
  };
  const onPointerMove = (event) => {
    lastPointer = event;
    if (!magFrame) magFrame = requestAnimationFrame(updateLight);
  };
  if (fine && !reduceMotion) {
    scene.addEventListener('pointermove', onPointerMove, { passive: true });
    scene.addEventListener('pointerleave', () => {
      cancelAnimationFrame(magFrame);
      magFrame = 0;
      scene.style.setProperty('--near', '0');
    }, { passive: true });
  }

  const rows = [[core], [optionsButton], [...languageRow.querySelectorAll('[data-language]')]];
  let cursor = [0, 0];
  const itemAt = ([r, c]) => rows[r]?.[Math.min(c, rows[r].length - 1)];
  const point = (next, { sound = true } = {}) => {
    const target = itemAt(next);
    if (!target) return;
    scene.querySelectorAll('.is-cursor').forEach((el) => el.classList.remove('is-cursor'));
    cursor = next;
    target.classList.add('is-cursor');
    target.focus({ preventScroll: true });
    if (sound) sfx.move();
  };
  rows.flat().forEach((item, index) => {
    item.addEventListener('pointerenter', () => {
      const r = rows.findIndex((row) => row.includes(item));
      point([r, rows[r].indexOf(item)], { sound: index !== 0 });
    });
  });

  let entered = false;
  const timers = [];
  const later = (fn, ms) => { const id = setTimeout(fn, ms); timers.push(id); return id; };

  const cleanup = () => {
    stopClock();
    timers.forEach(clearTimeout);
    cancelAnimationFrame(magFrame);
    scene.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('keydown', onKeydown, true);
    document.removeEventListener('languagechange', applyCopy);
    stopRoomWatch();
  };

  let released = false;
  const releaseContent = () => {
    if (released) return;
    released = true;
    scrollLock.unlock();
    resetMotion();
    document.body.classList.remove('has-entry-gate');
    document.body.classList.add('is-loaded');
    content?.removeAttribute('inert');

    document.querySelector('#page-title')?.focus({ preventScroll: true });
  };

  let torn = false;
  const teardown = () => {
    if (torn) return;
    torn = true;
    releaseContent();
    scene.remove();
  };
  scene.addEventListener('transitionend', (event) => {
    if (event.target !== scene || event.propertyName !== 'opacity') return;
    if (entered) teardown();
  });

  const enter = async () => {
    if (entered) return;
    entered = true;
    core.setAttribute('aria-disabled', 'true');
    stopClock();
    sfx.resume();

    if (reduceMotion) {

      cleanup();
      ambient.setMode('page');
      scene.classList.add('is-landing', 'is-out');
      releaseContent();
      setTimeout(teardown, 240);
      await onEnter?.();
      return;
    }

    try {

      scene.classList.add('is-choosing');
      ambient.setMode('confirm');
      sfx.confirm();
      await wait(430);

      scene.classList.add('is-diving');
      ambient.setMode('dive');
      sfx.dive();
      await wait(560);

      scene.classList.add('is-landing');
      ambient.setMode('page');
      ambient.impact();
      sfx.land();
      onEnter?.();

      await wait(170);
      releaseContent();
      sfx.arrive();
    } finally {
      cleanup();

      later(teardown, 1400);
    }
  };

  const skip = () => {
    if (!entered) { enter(); return; }
    cleanup();
    ambient.setMode('page');
    scene.classList.add('is-out');
    releaseContent();
    later(teardown, 260);
  };

  const PREV = new Set(['ArrowUp', 'w', 'W']);
  const NEXT = new Set(['ArrowDown', 's', 'S']);
  const LEFT = new Set(['ArrowLeft', 'a', 'A']);
  const RIGHT = new Set(['ArrowRight', 'd', 'D']);

  function onKeydown(event) {
    if (entered || event.metaKey || event.ctrlKey || event.altKey) return;
    if (event.key === 'Escape') { event.preventDefault(); skip(); return; }
    if (PREV.has(event.key) || NEXT.has(event.key)) {
      event.preventDefault();
      const step = PREV.has(event.key) ? -1 : 1;
      point([(cursor[0] + step + rows.length) % rows.length, cursor[1]]);
      return;
    }
    if (LEFT.has(event.key) || RIGHT.has(event.key)) {
      const row = rows[cursor[0]];
      const next = cursor[1] + (LEFT.has(event.key) ? -1 : 1);
      if (next < 0 || next >= row.length) { sfx.deny(); return; }
      event.preventDefault();
      point([cursor[0], next]);
      return;
    }
    if (event.key === 'Enter' || event.key === ' ') {
      const item = itemAt(cursor);
      if (!item || item !== document.activeElement) return;
      event.preventDefault();
      item.click();
    }
  }

  core.addEventListener('click', enter);
  optionsButton.addEventListener('click', () => { sfx.select(); onOptions?.(); });
  languageRow.querySelectorAll('[data-language]').forEach((button) => {
    button.addEventListener('click', () => { sfx.select(); setLanguage(button.dataset.language); });
  });
  scene.addEventListener('pointerdown', (event) => {
    if (entered) return;
    if (event.target.closest('.cinema__menu')) return;
    if (event.target === scene || event.target.closest('.cinema__stage')) enter();
  });
  document.addEventListener('keydown', onKeydown, true);

  later(() => { if (entered && !released) skip(); }, 6000);
  const idleEnter = () => {
    if (entered) return;
    if (document.querySelector('.panel-scrim')) { later(idleEnter, 25000); return; }
    enter();
  };
  later(idleEnter, 25000);

  resetScrollPosition();
  ambient.setMode('gate');
  if (returning) scene.classList.add('is-returning');
  document.body.append(scene);
  scrollLock.lock();
  requestAnimationFrame(() => {
    scene.classList.add('is-ready');
    point([0, 0], { sound: false });
  });

  return { enter, skip };
}
