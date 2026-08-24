import { createPanel } from './ui/panel.js';
import { t } from './i18n.js';

const named = (link) => {
  const strong = link.querySelector('.social-card__copy strong, .project-card__title');
  const label = strong?.getAttribute('aria-label') || strong?.textContent?.trim();
  if (label) return label;
  return link.querySelector('.site-signature span')?.textContent?.trim() || link.textContent.trim();
};

const hostOf = (href) => {
  try { return new URL(href, location.href).host.replace(/^www\./, ''); }
  catch { return href; }
};

export function initConfirmLink({ ambient, sfx, reduceMotion }) {
  const iconFor = (link) => {
    const svg = link.querySelector('.social-card__icon svg');
    if (svg) return svg.cloneNode(true);
    const img = link.querySelector('.project-card__art img, img');
    if (!img) return null;
    const copy = img.cloneNode(true);
    copy.removeAttribute('width');
    copy.removeAttribute('height');
    return copy;
  };

  document.addEventListener('click', (event) => {
    if (event.defaultPrevented) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target instanceof Element
      ? event.target.closest('.bio-links a[href], .site-signature[href]')
      : null;
    if (!link || link.dataset.confirmed === 'yes') return;

    event.preventDefault();
    const href = link.getAttribute('href');
    const target = link.getAttribute('target');

    createPanel({
      variant: 'panel-scrim--door',
      eyebrow: t('enter.eyebrow'),
      title: t('enter.title'),
      hint: t('enter.hint'),
      ambient,
      sfx,
      reduceMotion,
      build(api) {
        const dest = document.createElement('span');
        dest.className = 'panel-dest';
        const icon = iconFor(link);
        if (icon) {
          const slot = document.createElement('span');
          slot.className = 'panel-dest__icon';
          slot.append(icon);
          dest.append(slot);
        }
        const copy = document.createElement('span');
        copy.className = 'panel-dest__copy';
        const name = document.createElement('strong');
        name.textContent = named(link);
        const where = document.createElement('small');
        where.textContent = t(target === '_blank' ? 'enter.external' : 'enter.internal').replace('{host}', hostOf(href));
        copy.append(name, where);
        dest.append(copy);
        api.body.append(dest);

        api.addAction({
          label: t('enter.yes'),
          variant: 'primary',
          onSelect: (panel) => {
            sfx?.select();
            panel.close('enter');

            if (target === '_blank') {
              const opened = window.open(href, '_blank', 'noopener,noreferrer');
              if (opened) return;
              link.dataset.confirmed = 'yes';
              link.click();
              delete link.dataset.confirmed;
              return;
            }
            location.href = href;
          }
        });
        api.addAction({ label: t('enter.no'), onSelect: (panel) => panel.close('cancel') });
      }
    });
  });
}
