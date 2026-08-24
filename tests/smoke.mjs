import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';

const html = await readFile(new URL('../index.html', import.meta.url), 'utf8');
const baseCss = await readFile(new URL('../src/styles/base/base.css', import.meta.url), 'utf8');
const links = JSON.parse(await readFile(new URL('../src/data/links.json', import.meta.url), 'utf8'));
const identity = JSON.parse(await readFile(new URL('../src/data/identity.json', import.meta.url), 'utf8'));

for (const link of [links.main, ...links.secondary]) {
  assert.ok(html.includes(link.url), `HTML sem o link ${link.id}`);
}
assert.ok(html.includes(identity.bio), 'Bio ausente no HTML estático');
assert.ok(html.includes('application/ld+json'), 'JSON-LD ausente');
assert.ok(html.includes('aria-label="Meus links"'), 'Lista de links sem nome acessível');
assert.ok(html.includes('aria-labelledby="social-title"'), 'Seção social sem nome acessível');
assert.ok(html.includes('data-language="pt-BR"'), 'Opção de português ausente');
assert.ok(html.includes('data-language="en"'), 'Opção de inglês ausente');
assert.ok(!html.includes('{{'), 'Template não foi totalmente processado');
assert.ok(
  baseCss.includes('.js.has-gate body.is-loaded .reveal { opacity: 1;'),
  'Estado pós-portal não sobrescreve o estado oculto com especificidade suficiente'
);
console.log('smoke: conteúdo, links e SEO OK');
