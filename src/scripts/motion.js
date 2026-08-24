const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
const finePointer = matchMedia('(hover: hover) and (pointer: fine)');

const NO_SFX = { move() {}, select() {} };

let rearm = () => {};
export const resetMotion = () => rearm();

export function initMotion({ sfx = NO_SFX } = {}) {
  const root = document.documentElement;
  const revealItems = [...document.querySelectorAll('.reveal')];
  root.classList.add('motion-ready');

  const armed = new WeakMap();
  const arm = (item) => {
    if (reduceMotion.matches) {
      item.classList.add('is-motion-settled');
      return;
    }
    const previous = armed.get(item);
    if (previous) item.removeEventListener('transitionend', previous);
    const settle = (event) => {
      if (event.target !== item || event.propertyName !== 'transform') return;
      item.classList.add('is-motion-settled');
      item.removeEventListener('transitionend', settle);
      armed.delete(item);
    };
    armed.set(item, settle);
    item.addEventListener('transitionend', settle);
  };
  revealItems.forEach(arm);
  rearm = () => revealItems.forEach((item) => {
    item.classList.remove('is-motion-settled');
    arm(item);
  });

  const prepareWords = () => {
    document.querySelectorAll('[data-motion-words]').forEach((element) => {
      const value = element.textContent.trim();
      if (!value) return;
      element.setAttribute('aria-label', value);
      const fragment = document.createDocumentFragment();
      value.split(/\s+/).forEach((word, index, words) => {
        const mask = document.createElement('span');
        const inner = document.createElement('span');
        mask.className = 'motion-word-mask';
        mask.setAttribute('aria-hidden', 'true');
        inner.className = 'motion-word';
        inner.style.setProperty('--word-index', index);
        inner.textContent = word;
        mask.append(inner);
        fragment.append(mask);
        if (index < words.length - 1) fragment.append(' ');
      });
      element.replaceChildren(fragment);
    });
  };
  prepareWords();
  document.addEventListener('languagechange', prepareWords);

  if (reduceMotion.matches || !('IntersectionObserver' in window)) {
    revealItems.forEach((item) => item.classList.add('is-in-view'));
  } else {
    const socialItems = revealItems.filter((item) => item.matches('[data-reveal="social-link"]'));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-in-view');
        observer.unobserve(entry.target);
        if (entry.target.matches('[data-reveal="bio"]')) {
          socialItems.forEach((item) => {
            item.classList.add('is-in-view');
            observer.unobserve(item);
          });
        }
      });
    }, { rootMargin: '0px 0px 18% 0px', threshold: 0.04 });
    revealItems.forEach((item) => observer.observe(item));
  }

  if (finePointer.matches && !reduceMotion.matches) {
    const project = document.querySelector('.project-card');
    const projectArt = project?.querySelector('.project-card__art');
    const avatar = document.querySelector('.profile-avatar');
    let frame = 0;
    let latestPointer;
    let projectActive = false;
    let avatarActive = false;

    const resetProject = () => {
      if (!project || !projectActive) return;
      project.style.cssText = '--art-x:0px;--art-y:0px;--spot-x:50%;--spot-y:50%';
      projectActive = false;
    };
    const resetAvatar = () => {
      if (!avatar || !avatarActive) return;
      avatar.style.cssText = '--avatar-x:0px;--avatar-y:0px';
      avatarActive = false;
    };

    const updatePointerEffects = () => {
      frame = 0;
      const event = latestPointer;
      const target = event?.target instanceof Element ? event.target : null;
      if (project && target && project.contains(target)) {
        const bounds = project.getBoundingClientRect();
        const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 7;
        const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 7;
        const artBounds = projectArt?.getBoundingClientRect() ?? bounds;
        const spotX = Math.min(100, Math.max(0, ((event.clientX - artBounds.left) / artBounds.width) * 100));
        const spotY = Math.min(100, Math.max(0, ((event.clientY - artBounds.top) / artBounds.height) * 100));
        project.style.cssText = `--art-x:${x.toFixed(2)}px;--art-y:${y.toFixed(2)}px;--spot-x:${spotX.toFixed(1)}%;--spot-y:${spotY.toFixed(1)}%`;
        projectActive = true;
      } else resetProject();

      if (avatar && target && avatar.contains(target)) {
        const bounds = avatar.getBoundingClientRect();
        const x = ((event.clientX - bounds.left) / bounds.width - 0.5) * 5;
        const y = ((event.clientY - bounds.top) / bounds.height - 0.5) * 5;
        avatar.style.cssText = `--avatar-x:${x.toFixed(2)}px;--avatar-y:${y.toFixed(2)}px`;
        avatarActive = true;
      } else resetAvatar();
    };

    document.addEventListener('pointermove', (event) => {
      latestPointer = event;
      if (!frame) frame = requestAnimationFrame(updatePointerEffects);
    }, { passive: true });
    document.addEventListener('pointerout', (event) => {
      if (event.relatedTarget) return;
      cancelAnimationFrame(frame);
      frame = 0;
      resetProject();
      resetAvatar();
    }, { passive: true });
  }

  if (!reduceMotion.matches) {
    document.addEventListener('pointerdown', (event) => {
      if (event.button !== 0) return;
      const target = event.target instanceof Element
        ? event.target.closest('.btn, .language-switch button')
        : null;
      if (!target) return;
      const bounds = target.getBoundingClientRect();
      const ripple = document.createElement('span');
      ripple.className = 'motion-ripple';
      ripple.style.cssText = `left:${event.clientX - bounds.left}px;top:${event.clientY - bounds.top}px`;
      target.append(ripple);
      ripple.addEventListener('animationend', () => ripple.remove(), { once: true });
    });
  }

  const MENU = '.social-card, .project-card, .site-signature, .btn, .sound-toggle, .language-switch button, .footer-source';
  let lastMoved = null;
  const arrived = () => document.body.classList.contains('is-loaded');

  const onMove = (event) => {
    const target = event.target instanceof Element ? event.target.closest(MENU) : null;
    if (target === lastMoved) return;
    lastMoved = target;
    if (target && arrived()) sfx.move();
  };
  document.addEventListener('pointerover', onMove);
  document.addEventListener('focusin', (event) => {
    const target = event.target instanceof Element ? event.target.closest(MENU) : null;
    if (!target || target === lastMoved) return;
    lastMoved = target;
    if (arrived()) sfx.move();
  });
  document.addEventListener('pointerleave', () => { lastMoved = null; });

  document.addEventListener('click', (event) => {
    const target = event.target instanceof Element ? event.target.closest(MENU) : null;

    if (!target || target.closest('.sound-toggle') || !arrived()) return;
    sfx.select();

    const row = target.closest('.social-card');
    if (!row || reduceMotion.matches) return;
    row.classList.remove('is-selected');
    requestAnimationFrame(() => row.classList.add('is-selected'));
    row.addEventListener('animationend', () => row.classList.remove('is-selected'), { once: true });
  });
}
