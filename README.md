# tavvkkj — link in bio

Página estática pessoal construída com a linguagem visual “Midnight Archive” do site principal `tavvkkj.xyz`. A implementação usa HTML, CSS e JavaScript nativos; Vite serve apenas como build/dev server.

## Rodar

```bash
npm install
npm run dev
```

## Conteúdo

- Links: `src/data/links.json`
- Identidade e SEO: `src/data/identity.json`
- Easter eggs: `src/data/easter-eggs.json`

`npm run generate` reconstrói o HTML semântico estático a partir desses dados. O áudio não foi fornecido; o player exibe um fallback honesto e não baixa nenhum arquivo.

## Build e checagem

```bash
npm test
npm run build
```

O portal é progressive enhancement: sem JavaScript ele não existe e os cinco links permanecem disponíveis. A interface compartilha com o site principal os mesmos tokens de superfície, sinal vermelho, Inter, JetBrains Mono e estados de interação, preservando uma composição própria de link-in-bio.
