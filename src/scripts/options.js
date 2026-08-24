import { createPanel, createSlider, createOptionRow, isPanelOpen, closeOpenPanel } from './ui/panel.js';
import { availableThemes, getTheme, setTheme } from './theme.js';
import { snapshot } from './save.js';
import { storage } from './utils/storage.js';
import { t } from './i18n.js';

const roomLabels = (rooms) => rooms.map((theme) => t(`room.${theme.id}`));

export function initOptions({ ambient, sfx, reduceMotion, onQuit }) {
  const mount = document.querySelector('[data-js="options-mount"]');
  let button;
  if (mount) {
    button = document.createElement('button');
    button.className = 'options-toggle btn btn--ghost btn--icon btn--sm';
    button.type = 'button';

    button.innerHTML = `
      <span class="options-toggle__glyph" aria-hidden="true">
        <i></i><i></i><i></i>
      </span>`;
    const sync = () => button.setAttribute('aria-label', t('options.open'));
    sync();
    document.addEventListener('languagechange', sync);
    button.addEventListener('click', () => open());
    mount.append(button);
  }

  const open = () => {
    if (isPanelOpen()) { closeOpenPanel('cancel'); return; }
    const save = snapshot();

    createPanel({
      variant: 'panel-scrim--options',
      eyebrow: t('options.eyebrow'),
      title: t('options.title'),
      hint: t('options.hint'),
      ambient,
      sfx,
      reduceMotion,
      build(api) {

        const summary = document.createElement('p');
        summary.className = 'panel-save u-mono';
        summary.textContent = t('options.save')
          .replace('{pct}', String(save.pct))
          .replace('{time}', save.playTime)
          .replace('{runs}', String(save.runs).padStart(2, '0'));
        api.body.append(summary);

        const music = createSlider({
          label: t('options.music'),
          value: sfx.getVolume('music'),
          onInput: (value) => sfx.setVolume('music', value)
        });
        api.body.append(music.row);
        api.register(music.focusTarget, { adjust: music.adjust });

        const effects = createSlider({
          label: t('options.sfx'),
          value: sfx.getVolume('sfx'),
          onInput: (value) => {
            sfx.setVolume('sfx', value);

            sfx.move();
          }
        });
        api.body.append(effects.row);
        api.register(effects.focusTarget, { adjust: effects.adjust });

        const sound = createOptionRow({
          label: t('options.sound'),
          options: [t('options.off'), t('options.on')],
          index: sfx.enabled ? 1 : 0,
          onChange: (index) => sfx.setEnabled(index === 1)
        });
        api.body.append(sound.row);
        api.register(sound.focusTarget, { adjust: sound.adjust });

        const rooms = availableThemes();
        const room = createOptionRow({
          label: t('options.room'),
          options: roomLabels(rooms),
          index: Math.max(0, rooms.indexOf(getTheme())),
          onChange: (index) => setTheme(rooms[index].id)
        });
        api.body.append(room.row);
        api.register(room.focusTarget, { adjust: room.adjust });

        api.addAction({ label: t('options.resume'), variant: 'primary', onSelect: (panel) => panel.close('resume') });
        if (onQuit && !document.body.classList.contains('has-entry-gate')) {
          api.addAction({
            label: t('options.quit'),
            onSelect: (panel) => { panel.close('quit'); onQuit(); }
          });
        }

        api.addAction({ label: t('options.erase'), variant: 'danger', onSelect: () => confirmErase({ ambient, sfx, reduceMotion }) });
      }
    });
  };

  return { open };
}

function confirmErase({ ambient, sfx, reduceMotion }) {
  createPanel({
    variant: 'panel-scrim--danger',
    eyebrow: t('erase.eyebrow'),
    title: t('erase.title'),
    hint: t('erase.hint'),
    ambient,
    sfx,
    reduceMotion,
    build(api) {
      const line = document.createElement('p');
      line.className = 'panel-text';
      line.textContent = t('erase.body');
      api.body.append(line);
      api.addAction({ label: t('erase.no'), onSelect: (panel) => panel.close('cancel') });
      api.addAction({
        label: t('erase.yes'),
        variant: 'danger',
        onSelect: (panel) => {
          storage.set('tavvkkj.eggs', []);
          storage.set('tavvkkj.save', { created: Date.now(), runs: 1, playMs: 0 });

          storage.set('tavvkkj.room', 'abismo');
          panel.close('erased');

          location.reload();
        }
      });
    }
  });
}
