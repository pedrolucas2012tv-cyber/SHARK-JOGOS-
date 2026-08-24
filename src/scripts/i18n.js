import { storage } from './utils/storage.js';

const STORAGE_KEY = 'tavvkkj.language';
const DEFAULT_LANGUAGE = 'pt-BR';

const messages = {
  'pt-BR': {
    'meta.description': 'Projeto principal, redes e outros links de tavvkkj.',
    'skip': 'Pular para os links',
    'language.label': 'Escolher idioma',
    'language.pt': 'Usar português',
    'language.en': 'Use English',
    'site.open': 'Abrir tavvkkj.xyz',
    'profile.photoAlt': 'Foto do tavv — um gatinho laranja no escuro',
    'profile.online': 'ONLINE',
    'profile.quote': 'Eles querem que você se sinta mal, pois assim eles se sentem bem.',
    'profile.about': 'Sites · jogos · desenvolvimento web',
    'links.label': 'Meus links',
    'main.badge': 'PROJETO PRINCIPAL',
    'main.description': 'Jogos, mapas e versões para navegador.',
    'main.secret': 'build 0x54',
    'main.status': 'EM DESENVOLVIMENTO',
    'main.updated': 'Projeto independente',
    'main.open': 'Abrir',
    'social.title': 'Outros links',
    'social.intro': 'Redes e outros perfis.',
    'social.count': '04 LINKS',
    'social.github': 'Projetos e código-fonte.',
    'social.youtube': 'Vídeos e projetos.',
    'social.tiktok': 'Vídeos curtos.',
    'social.spotify': 'Minha playlist.',
    'footer.secret': 'PROFILE / TAVV',
    'gate.eyebrow': 'arquivo de partida',
    'gate.slotName': 'profile / tavv',
    'gate.labelArea': 'local',
    'gate.labelTime': 'tempo',
    'gate.labelRuns': 'partidas',
    'gate.labelBuild': 'build',
    'gate.area': 'banco · {room}',
    'gate.build': '0x54',
    'gate.empty': 'slot 02 — vazio',
    'gate.action': 'continuar',
    'gate.enterClick': 'clique ou ENTER para continuar',
    'gate.enterTouch': 'toque para continuar',
    'gate.aria': 'Continuar — carregar o arquivo profile / tavv e descer para os links',
    'gate.ariaReturning': 'Continuar — arquivo profile / tavv, {pct}% descoberto. Carregar e descer para os links',
    'options.open': 'Abrir o menu de pausa',
    'options.eyebrow': 'pausa',
    'options.title': 'opções',
    'options.save': 'progresso {pct}% · tempo {time} · partidas {runs}',
    'options.music': 'música',
    'options.sfx': 'efeitos',
    'options.sound': 'som',
    'options.room': 'sala',
    'options.on': 'ligado',
    'options.off': 'desligado',
    'options.resume': 'retomar',
    'options.erase': 'apagar arquivo',
    'options.quit': 'sair para os saves',
    'options.hint': 'W/S mover · A/D ajustar · ESC voltar',
    'room.abismo': 'o abismo',
    'room.cidade': 'cidade das lágrimas',
    'room.jardins': 'jardins da rainha',
    'room.cristal': 'pico de cristal',
    'room.seda': 'reino de seda',
    'room.estrada': 'a estrada',
    'room.short.abismo': 'abismo',
    'room.short.cidade': 'cidade',
    'room.short.jardins': 'jardins',
    'room.short.cristal': 'cristal',
    'room.short.seda': 'seda',
    'room.short.estrada': 'estrada',
    'enter.eyebrow': 'passagem',
    'enter.title': 'Entrar na fase?',
    'enter.yes': 'entrar',
    'enter.no': 'voltar',
    'enter.hint': 'ENTER confirma · ESC volta',
    'enter.external': 'abre {host} em uma nova aba',
    'enter.internal': 'segue para {host}',
    'erase.eyebrow': 'arquivo',
    'erase.title': 'Apagar o arquivo?',
    'erase.body': 'Tempo, partidas e tudo que você descobriu voltam a zero. Não dá pra desfazer.',
    'erase.yes': 'apagar',
    'erase.no': 'cancelar',
    'erase.hint': 'A/D escolhe · ENTER confirma',
    'keys.move': 'WASD / setas · mover',
    'keys.enter': 'ENTER · entrar',
    'keys.pause': 'ESC · pausa',
    'hint.context': 'menu do navegador desativado nesta sala',
    'sound.on': 'Desligar o som',
    'sound.off': 'Ligar o som',
    'sound.label': 'Som',
    'save.label': 'progresso',
    'save.aria': 'Progresso do arquivo: {pct}% — {found} de {total} detalhes encontrados',
    'save.stored': 'salvo',
    'toast.hold': 'detalhe encontrado',
    'toast.pixel': 'pq q c clicou aq carai',
    'toast.cars': 'ka-chow — a estrada abriu',
    'toast.carsAgain': 'de volta pra estrada'
  },
  en: {
    'meta.description': "tavvkkj's main project, profiles, and links.",
    'skip': 'Skip to the links',
    'language.label': 'Choose language',
    'language.pt': 'Usar português',
    'language.en': 'Use English',
    'site.open': 'Open tavvkkj.xyz',
    'profile.photoAlt': 'A photo of tavv — an orange kitten in the dark',
    'profile.online': 'ONLINE',
    'profile.quote': "They want you to feel bad because that's how they feel better.",
    'profile.about': 'Websites · games · web development',
    'links.label': 'My links',
    'main.badge': 'MAIN PROJECT',
    'main.description': 'Games, maps, and browser versions.',
    'main.secret': 'build 0x54',
    'main.status': 'IN DEVELOPMENT',
    'main.updated': 'Independent project',
    'main.open': 'Open',
    'social.title': 'Other links',
    'social.intro': 'Social profiles and other pages.',
    'social.count': '04 LINKS',
    'social.github': 'Projects and source code.',
    'social.youtube': 'Videos and projects.',
    'social.tiktok': 'Short videos.',
    'social.spotify': 'My playlist.',
    'footer.secret': 'PROFILE / TAVV',
    'gate.eyebrow': 'save file',
    'gate.slotName': 'profile / tavv',
    'gate.labelArea': 'area',
    'gate.labelTime': 'time',
    'gate.labelRuns': 'runs',
    'gate.labelBuild': 'build',
    'gate.area': 'bench · {room}',
    'gate.build': '0x54',
    'gate.empty': 'slot 02 — empty',
    'gate.action': 'continue',
    'gate.enterClick': 'click or ENTER to continue',
    'gate.enterTouch': 'tap to continue',
    'gate.aria': 'Continue — load the profile / tavv file and descend to the links',
    'gate.ariaReturning': 'Continue — profile / tavv file, {pct}% discovered. Load it and descend to the links',
    'options.open': 'Open the pause menu',
    'options.eyebrow': 'paused',
    'options.title': 'options',
    'options.save': 'progress {pct}% · time {time} · runs {runs}',
    'options.music': 'music',
    'options.sfx': 'effects',
    'options.sound': 'sound',
    'options.room': 'room',
    'options.on': 'on',
    'options.off': 'off',
    'options.resume': 'resume',
    'options.erase': 'erase file',
    'options.quit': 'quit to saves',
    'options.hint': 'W/S move · A/D adjust · ESC back',
    'room.abismo': 'the abyss',
    'room.cidade': 'city of tears',
    'room.jardins': "queen's gardens",
    'room.cristal': 'crystal peak',
    'room.seda': 'silk kingdom',
    'room.estrada': 'the road',
    'room.short.abismo': 'abyss',
    'room.short.cidade': 'city',
    'room.short.jardins': 'gardens',
    'room.short.cristal': 'crystal',
    'room.short.seda': 'silk',
    'room.short.estrada': 'road',
    'enter.eyebrow': 'gateway',
    'enter.title': 'Enter the stage?',
    'enter.yes': 'enter',
    'enter.no': 'back',
    'enter.hint': 'ENTER confirms · ESC goes back',
    'enter.external': 'opens {host} in a new tab',
    'enter.internal': 'continues to {host}',
    'erase.eyebrow': 'file',
    'erase.title': 'Erase the file?',
    'erase.body': 'Time, runs and everything you found go back to zero. This cannot be undone.',
    'erase.yes': 'erase',
    'erase.no': 'cancel',
    'erase.hint': 'A/D chooses · ENTER confirms',
    'keys.move': 'WASD / arrows · move',
    'keys.enter': 'ENTER · enter',
    'keys.pause': 'ESC · pause',
    'hint.context': 'browser menu disabled in this room',
    'sound.on': 'Turn sound off',
    'sound.off': 'Turn sound on',
    'sound.label': 'Sound',
    'save.label': 'progress',
    'save.aria': 'File progress: {pct}% — {found} of {total} details found',
    'save.stored': 'saved',
    'toast.hold': 'detail found',
    'toast.pixel': 'pixel found',
    'toast.cars': 'ka-chow — the road opened',
    'toast.carsAgain': 'back on the road'
  }
};

let currentLanguage = DEFAULT_LANGUAGE;

const normalizeLanguage = (value) => {
  const language = String(value || '').toLowerCase();
  if (language === 'en' || language.startsWith('en-')) return 'en';
  if (language === 'pt' || language.startsWith('pt-')) return 'pt-BR';
  return null;
};

export const t = (key) => messages[currentLanguage]?.[key] ?? messages[DEFAULT_LANGUAGE]?.[key] ?? key;
export const getLanguage = () => currentLanguage;

const applyText = () => {
  document.documentElement.lang = currentLanguage;
  document.querySelectorAll('[data-i18n]').forEach((element) => {
    element.textContent = t(element.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-aria-label]').forEach((element) => {
    element.setAttribute('aria-label', t(element.dataset.i18nAriaLabel));
  });
  document.querySelectorAll('[data-i18n-alt]').forEach((element) => {
    element.setAttribute('alt', t(element.dataset.i18nAlt));
  });
  document.querySelectorAll('[data-language]').forEach((button) => {
    const selected = button.dataset.language === currentLanguage;
    button.setAttribute('aria-pressed', String(selected));
    button.setAttribute('aria-label', t(button.dataset.language === 'pt-BR' ? 'language.pt' : 'language.en'));
  });
  document.querySelector('.language-switch')?.setAttribute('data-current-language', currentLanguage);

  const description = t('meta.description');
  document.querySelector('meta[name="description"]')?.setAttribute('content', description);
  document.querySelector('meta[property="og:description"]')?.setAttribute('content', description);
  document.querySelector('meta[name="twitter:description"]')?.setAttribute('content', description);
};

export const setLanguage = (language, { announce = true } = {}) => {
  const normalized = normalizeLanguage(language) ?? DEFAULT_LANGUAGE;
  const changed = normalized !== currentLanguage;
  currentLanguage = normalized;
  storage.set(STORAGE_KEY, currentLanguage);
  const update = () => {
    applyText();
    if (announce && changed) {
      document.dispatchEvent(new CustomEvent('languagechange', { detail: { language: currentLanguage } }));
    }
  };
  const canTransition = announce
    && changed
    && typeof document.startViewTransition === 'function'
    && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (canTransition) document.startViewTransition(update);
  else update();
};

export function initI18n() {
  const queryLanguage = new URLSearchParams(location.search).get('lang');
  const savedLanguage = storage.get(STORAGE_KEY);
  const initialLanguage = normalizeLanguage(queryLanguage)
    ?? normalizeLanguage(savedLanguage)
    ?? normalizeLanguage(navigator.language)
    ?? DEFAULT_LANGUAGE;

  document.querySelectorAll('[data-language]').forEach((button) => {
    button.addEventListener('click', () => setLanguage(button.dataset.language));
  });
  setLanguage(initialLanguage, { announce: false });
  return { t, setLanguage, getLanguage };
}
