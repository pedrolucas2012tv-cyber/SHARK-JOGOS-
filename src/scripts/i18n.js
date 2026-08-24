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
    'profile.quote': 'Eles querem que você se sinta mal porque assim eles se sentem bem.',
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
    'gate.title': 'tavvkkj',
    'gate.body': 'Projeto principal, redes e outros links.',
    'gate.status': '5 links',
    'gate.note': 'Português · English',
    'gate.enter': 'Continuar',
    'music.title': 'sem faixa',
    'music.note': 'áudio não adicionado',
    'music.open': 'Ver informações da música',
    'music.close': 'Fechar informações da música',
    'toast.hold': 'detalhe encontrado',
    'toast.pixel': 'pq q c clicou aq carai'
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
    'gate.title': 'tavvkkj',
    'gate.body': 'Main project, profiles, and other links.',
    'gate.status': '5 links',
    'gate.note': 'Português · English',
    'gate.enter': 'Continue',
    'music.title': 'no track',
    'music.note': 'audio not added',
    'music.open': 'Show music info',
    'music.close': 'Close music info',
    'toast.hold': 'detail found',
    'toast.pixel': 'pixel found'
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
