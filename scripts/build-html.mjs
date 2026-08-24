import { readFile, writeFile } from 'node:fs/promises';

const [template, identityFile, linksFile] = await Promise.all([
  readFile(new URL('../src/index.template.html', import.meta.url), 'utf8'),
  readFile(new URL('../src/data/identity.json', import.meta.url), 'utf8'),
  readFile(new URL('../src/data/links.json', import.meta.url), 'utf8')
]);

const identity = JSON.parse(identityFile);
const links = JSON.parse(linksFile);

const escapeHtml = (value) => String(value)
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;');

const icons = {
  github: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 22v-4c.14-1.24-.36-2.46-1.3-3.2 3.2-.36 6.56-1.57 6.56-7.1A5.54 5.54 0 0 0 18.8 3.85 5.14 5.14 0 0 0 18.65 0S17.5-.37 15 1.47a13.4 13.4 0 0 0-6 0C6.5-.37 5.35 0 5.35 0a5.14 5.14 0 0 0-.15 3.85A5.54 5.54 0 0 0 3.74 7.7c0 5.52 3.36 6.73 6.56 7.1A4 4 0 0 0 9 17.9V22"/><path d="M9 19c-3 .92-3-1.5-4.2-2"/></svg>',
  youtube: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 12s0-3.4-.44-5.03a2.6 2.6 0 0 0-1.83-1.83C18.1 4.7 12 4.7 12 4.7s-6.1 0-7.73.44a2.6 2.6 0 0 0-1.83 1.83C2 8.6 2 12 2 12s0 3.4.44 5.03a2.6 2.6 0 0 0 1.83 1.83c1.63.44 7.73.44 7.73.44s6.1 0 7.73-.44a2.6 2.6 0 0 0 1.83-1.83C22 15.4 22 12 22 12Z"/><path d="m10 9 5 3-5 3Z"/></svg>',
  tiktok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 3v11.5a4.5 4.5 0 1 1-4-4.47"/><path d="M15 3c.55 3.25 2.45 5 5 5"/></svg>',
  spotify: '<svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M7.5 9.2c3.4-1 7.5-.7 10.2.8M8.3 12.4c2.9-.75 6.4-.5 8.8.7M9 15.3c2.3-.52 5-.35 7 .52"/></svg>'
};

const secondaryLinks = links.secondary.map((link, index) => `
  <a class="social-card reveal" style="--reveal-index:${index}" href="${escapeHtml(link.url)}" target="_blank" rel="noopener noreferrer" data-link-id="${escapeHtml(link.id)}" data-reveal="social-link">
    <span class="social-card__icon">${icons[link.icon] ?? ''}</span>
    <span class="social-card__copy"><strong>${escapeHtml(link.label)}</strong><small data-i18n="social.${escapeHtml(link.id)}">${escapeHtml(link.description)}</small></span>
    <span class="social-card__arrow" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M7 17 17 7M8 7h9v9"/></svg></span>
  </a>`).join('');

const structuredData = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Person',
  name: identity.handle,
  alternateName: identity.shortName,
  url: identity.seo.canonical,
  sameAs: links.secondary.map((link) => link.url),
  jobTitle: ['Desenvolvedor', 'Criador de conteúdo']
});

const replacements = {
  '{{title}}': escapeHtml(identity.seo.title),
  '{{description}}': escapeHtml(identity.seo.description),
  '{{canonical}}': escapeHtml(identity.seo.canonical),
  '{{handle}}': escapeHtml(identity.handle),
  '{{shortName}}': escapeHtml(identity.shortName),
  '{{bio}}': escapeHtml(identity.bio),
  '{{mainUrl}}': escapeHtml(links.main.url),
  '{{mainLabel}}': escapeHtml(links.main.label),
  '{{mainDescription}}': escapeHtml(links.main.description),
  '{{mainBadge}}': escapeHtml(links.main.badge),
  '{{secondaryLinks}}': secondaryLinks,
  '{{structuredData}}': structuredData
};

let html = template;
for (const [token, value] of Object.entries(replacements)) html = html.replaceAll(token, value);
await writeFile(new URL('../index.html', import.meta.url), html);
