# tavvkkj — link in bio

Página estática pessoal. HTML, CSS e JavaScript nativos; Vite serve apenas como build/dev server.

## Rodar

```bash
npm install
npm run dev
```

## Conteúdo

- Links: `src/data/links.json`
- Identidade e SEO: `src/data/identity.json`
- Easter eggs: `src/data/easter-eggs.json`

`npm run generate` reconstrói o HTML semântico estático a partir desses dados.

## A ideia: um arquivo de partida

Você não chega numa página — você retoma a partida de alguém.

A entrada é uma tela de seleção de save: uma placa entalhada flutuando numa
sala escura, com cantos que se abrem quando você chega perto, e abaixo dela o
**slot 02, vazio** — porque uma seleção de save com um arquivo só não lê como
seleção de save (e é o estado honesto deste site: existe um save).

Todo número na placa é medido, nenhum é enfeite (`src/scripts/save.js`):

| campo | de onde vem |
| --- | --- |
| `LOCAL` | o banco onde este arquivo foi salvo |
| `TEMPO` | tempo real na sala, contado **só com a aba visível** — uma aba esquecida aberta a noite inteira não reivindica a noite inteira |
| `PARTIDAS` | quantas vezes este arquivo já foi carregado |
| `%` | quanto deste lugar você descobriu de fato: vem dos easter eggs encontrados |

Nada disso sai do dispositivo — é o mesmo `localStorage` que os eggs já usavam.
Um save de quem já esteve aqui está genuinamente mais avançado que o de um
estranho, e o relógio corre enquanto você olha a placa.

O arquivo não é uma fantasia que a página tira depois da abertura: o rodapé
carrega a **mesma** porcentagem, na mesma gramática (rótulo mono, sulco
entalhado com um entalhe por detalhe), e ela sobe na hora em que você acha
algo. Achar vira escrita no arquivo, e o aviso diz isso: o que você achou à
esquerda, `SALVO` à direita.

Escolher o save não troca de tela: a câmera desce para dentro da sala que já
estava ali atrás.

A linha do tempo tem três batidas, com vocabulário de metroidvania em vez de
"transição cinematográfica":

`confirmar → descida → aterrissagem → a sala se resolve`

- **confirmar** — a placa recebe o peso, a moldura acende, os esporos da sala
  são puxados na direção dela. Nada se move ainda: a escolha precisa registrar.
- **descida** — o save sobe e sai por cima da câmera enquanto o campo desce em
  riscos ao redor. Não estamos atravessando uma porta; estamos caindo.
- **aterrissagem** — o ar é deslocado rente ao chão, o campo assenta, e a sala
  onde caímos passa a ser a sala da página.

### O ponto estrutural: não existe segunda cena

A página **nunca** foi um segundo layout escondido atrás da abertura. Ela fica
no fluxo normal do documento o tempo inteiro, invisível apenas pela própria
coreografia de entrada, e a abertura resolve **esses mesmos elementos** até o
lugar de repouso deles. O alvo de cada transição é literalmente `transform:
none`. Duas regras protegem isso e não devem ser quebradas:

1. **Nada anima um wrapper em volta do conteúdo.** Um `.bio-page` com
   transform/blur/opacity próprios roda num relógio diferente do dos filhos —
   é exatamente o que fazia o último quadro da abertura e o primeiro quadro do
   idle serem dois estados diferentes.
2. **Nada muda propriedade de layout durante a transição — `overflow` acima de
   tudo.** A calha da barra de rolagem fica reservada a sessão inteira em
   `base.css`; travar o scroll com `overflow: hidden` remove a barra, o
   viewport cresce pela largura dela, e todo elemento centralizado desliza meia
   barra pro lado num único quadro. O lock é comportamental (`cinema.js`) e não
   toca em nenhum valor computado.

Verificação: com as transições pausadas e percorridas quadro a quadro pela Web
Animations API, o último quadro da abertura bate com o layout de repouso em
`dx 0 · dy 0 · dop 0` para todos os elementos, e `clientWidth` não muda em
nenhum momento.

## Camadas

- `src/scripts/ambient.js` — o campo persistente por trás da abertura **e** da
  página, nunca destruído entre as duas: esporos subindo numa térmica lenta,
  uma poça de luz fria acima e brasas carregando o sinal quente. Na descida,
  os mesmos esporos viram riscos verticais com comprimento proporcional à
  profundidade. Um rAF, DPR limitado, pausa com a aba oculta, densidade menor
  no mobile.
- `src/scripts/cinema.js` — a placa de save, a coreografia e o lock de scroll
  que não mexe em layout.
- `src/scripts/save.js` — o arquivo em si: criação, partidas, tempo de jogo
  (pausado com a aba oculta) e detalhes encontrados. Ele é dono dos números;
  a placa e o rodapé só desenham.
- `src/scripts/save-hud.js` — o medidor do rodapé, que mantém o arquivo vivo
  dentro da página e responde uma vez quando algo é encontrado.
- `src/scripts/sfx.js` — a música (`/audio/real-gone.mp3`) e todo o resto
  sintetizado em runtime, com uma reverb de caverna gerada na hora. Duas
  camadas de síntese: *cerimônia* (confirmar/descer/aterrissar/chegar) e
  *interface* (mover/selecionar num menu).
- `src/scripts/sound-toggle.js` — o interruptor de som na barra superior, que
  lembra a escolha.
- `src/scripts/motion.js` — revelação por scroll, entrada por palavra, efeitos
  de ponteiro e o casamento entre movimento e som de cada interação.
- `src/scripts/ui/panel.js` — a peça única atrás de todo menu: lock de scroll,
  `inert`, cursor de menu (W/S, A/D, ENTER, ESC), armadilha de foco e retorno
  de foco. `createSlider` e `createOptionRow` são as duas linhas que ele sabe
  desenhar.
- `src/scripts/theme.js` — as salas: as três cores que a página deriva, o que o
  ar faz em cada uma, e quais precisam ser destrancadas.
- `src/scripts/keynav.js` — andar pela página com WASD/setas.
- `src/scripts/gamepad.js` — o controle, traduzido para as mesmas teclas.
- `src/scripts/scenery.js` — o cenário de cada sala, desenhado no canvas.
- `src/scripts/options.js` / `confirm-link.js` — a pausa e as portas.
- `src/scripts/input-guard.js` — o menu de contexto desligado, e o aviso.
- `src/styles/tokens/tokens.css` — paleta de pedra fria + osso quente, três
  vozes tipográficas e **curvas de easing nomeadas pela função**
  (`settle`/`drift`/`arrive`/`rise`/`snap`/`glide`), porque repetir um
  `ease-out` em tudo é o que faz uma entrada parecer um truque de CSS só.

## Menus, portas e salas

Depois da abertura o site continua se comportando como jogo, e isso é um
sistema só — `src/scripts/ui/panel.js` — usado por tudo que abre por cima da
página. Um painel garante quatro coisas, e é por isso que existe um em vez de
três diálogos parecidos: a sala atrás fica **imóvel sem tocar em layout**
(`utils/scroll-lock.js`, o mesmo lock da abertura), o conteúdo vira `inert`
(tab e leitor de tela não entram nele), o campo ambiente entra em modo
`paused` — abrir menu é algo que acontece **com o mundo**, não em cima dele —
e o foco volta exatamente de onde saiu.

### Tela de saves

A abertura não é uma porta, é uma tela de seleção — então tem menu: o arquivo,
`OPÇÕES` e o idioma, navegáveis com W/S, A/D e ENTER antes de a página existir.
O painel de opções abre **por cima** da tela de saves e, ao fechar, devolve o
campo ambiente ao modo em que estava (`gate`), em vez de assumir que a página
já foi carregada.

E dá pra voltar: `SAIR PARA OS SAVES` no menu de pausa remove o `is-loaded`, a
sala se desfaz (os mesmos elementos voltam para o estado de entrada, na mesma
coreografia, ao contrário) e a tela de saves volta — mais rápida na volta do
que na primeira vez, porque você já viu a apresentação uma vez.

### Pausa (ESC, ou o botão na barra)

O que é seu: música, efeitos, som ligado/desligado e a sala. No topo, o estado
do arquivo, porque uma tela de pausa que não mostra seu save é um formulário.
Cada linha é operável de três jeitos, e nenhum é o "fallback": A/D no teclado,
os ◄ ► do lado, ou arrastando o sulco. O `<input type="range">` continua
existindo por baixo — é ele que o leitor de tela anuncia e que o ponteiro
arrasta; o desenho por cima é só desenho.

`APAGAR ARQUIVO` é a única coisa destrutiva do site, então é a única que
pergunta duas vezes — e o cursor começa em **cancelar**.

### Portas

Sair vira decisão, não clique: cada link abre um painel que nomeia o destino e
diz para onde ele vai de verdade (`abre github.com em uma nova aba`). Duas
coisas impedem isso de virar o dark pattern que poderia ser — a pergunta se
responde com uma tecla ou um clique, e **todo jeito que o navegador tem de
abrir um link de propósito** (clique do meio, ctrl/cmd, shift) passa direto,
sem painel nenhum. A confirmação é uma batida, não um portão.

### Salas

Seis áreas, e cada uma é o que **o ar está fazendo** — não um filtro de cor —
mais um **cenário próprio** desenhado no canvas (`src/scripts/scenery.js`) e
uma composição própria de gradientes na camada de fundo. Nada de recolorir a
mesma imagem: o abismo tem estalactites, a cidade tem os vitrais arqueados, o
cristal tem lascas, a estrada tem a pista fugindo para o ponto de fuga.

O cenário é desenhado **com peso nas bordas**: a coluna de conteúdo ocupa o
centro, então tudo que for desenhado atrás dela é trabalho perdido. Trocar de
sala faz cross-fade entre os dois cenários (formas não interpolam, alpha sim)
enquanto a paleta e o campo de partículas fazem lerp normalmente.

| sala | o ar |
| --- | --- |
| o abismo | esporos subindo, uma brasa quente no escuro |
| cidade das lágrimas | chuva: tudo cai, em riscos, sem balanço |
| jardins da rainha | pétalas lentas, o maior balanço de todas |
| pico de cristal | ar quase parado, e tudo nele pega a luz |
| reino de seda | poeira quente subindo devagar no dourado |
| a estrada 🔒 | neon sobre asfalto: o ar atravessa a tela de lado, em rastros |

Cada sala tem a própria música, em `public/audio/<sala>.mp3`:

| sala | faixa |
| --- | --- |
| abismo | Hollow Knight (tema principal) |
| cidade | City of Tears |
| jardins | Queen's Gardens |
| cristal | Crystal Peak |
| seda | Bonebottom (Silksong) |
| estrada | Real Gone — Sheryl Crow |

Trocar de sala faz cross-fade entre as faixas. Uma sala sem arquivo não
quebra: o `play()` rejeitado é o sinal e o drone sintetizado assume aquela
sala até o mp3 existir.

A sexta sala não aparece no menu até ser encontrada — **digite `cars`** em
qualquer lugar da página. Ela é a única cujo ar anda na horizontal (`drift` e
`dash` no campo), a única que não é subterrânea, e conta como um dos seis
detalhes do arquivo. Apagar o arquivo fecha a estrada junto.

Uma sala reescreve só três triplas de cor (`--deep-rgb`, `--accent-rgb`,
`--ember-rgb`) num `[data-room]`, e como todo componente já transiciona borda,
sombra e brilho, **a página inteira faz cross-fade de graça**. O canvas
interpola a própria paleta e os parâmetros do campo — inclusive `dir`, que é
um número e não uma flag: a chuva não começa a cair, os esporos desaceleram,
param e viram. A sala escolhida é parte do save, e a placa de entrada diz onde
o arquivo foi largado: `banco · cidade`.

## Teclado

WASD e as setas andam pela página como se andaria por um menu: W/S entre
linhas, A/D dentro de uma linha, ENTER abre o que estiver sob o cursor, ESC
pausa. Duas decisões que valem manter:

1. **O cursor É o foco.** Mover chama `.focus()` no elemento real, então leitor
   de tela, `:focus-visible` e a ideia que o navegador tem de onde você está
   continuam de acordo. A classe `is-cursor` existe só porque foco
   programático não é garantido como foco de teclado em todo motor, e um
   cursor invisível é um cursor quebrado.
2. **Controle funciona.** A Gamepad API está ligada (`src/scripts/gamepad.js`):
   d-pad e analógico movem, A confirma, B/Start voltam. Ele não duplica
   lógica nenhuma — sintetiza os mesmos eventos de teclado no elemento
   focado, com repetição própria (340ms para começar, 130ms depois), então
   tudo que responde ao teclado responde ao controle de graça.
3. **Nunca briga com o navegador.** Digitando num campo, com qualquer
   modificador segurado, com painel aberto, com a abertura ainda rolando —
   nesses casos essas teclas não são nossas e a gente não encosta nelas.

Linhas dão a volta; dentro de uma linha, para nas pontas (sair de um lado e
reaparecer no outro lê como glitch, não como movimento). A legenda de
controles aparece na primeira tecla e some sozinha — legenda permanente é
tutorial que nunca acaba.

## Botão direito

O menu de contexto é desligado: isto é uma sala, e o menu do navegador é a
única coisa na tela que não faz parte dela. Dito com todas as letras porque é
uma troca real: isso também tira "abrir em nova aba" e "copiar endereço" do
mouse. O custo é aceito de propósito e mantido pequeno — clique com
modificador continua abrindo link normalmente, o caminho por teclado não é
tocado, e na primeira vez a página **avisa** em vez de comer o gesto em
silêncio, que é o que faz um menu bloqueado parecer defeito.

## Som

Duas barras sob um master, porque são três trabalhos diferentes e um volume só
para todos é justamente o que todo mundo desliga:

- **música** — uma faixa por sala, em `public/audio/<sala>.mp3`. São elementos
  `<audio>` em vez de buffers decodificados (5–10 MB devem *streamar* e começar
  no primeiro compasso, não ser baixados inteiros e segurados na memória),
  roteados **por dentro do grafo** e não tocados direto — assim o fader, o mute
  e tudo mais tratam a faixa igual a qualquer voz sintetizada. Cada uma tem um
  ganho próprio na frente do barramento, que é o que permite o cross-fade entre
  salas: começar uma música no volume cheio é um corte, e cortá-la no meio de
  uma frase é um clique. Só a sala atual é baixada.
  Se o arquivo não vier — 404, codec, política —, o `play()` rejeitado é o sinal
  honesto disso, e o **drone sintetizado** assume aquela sala:
  quatro vozes num lá menor sem terça, sweep de ~50s, um sino distante a cada
  10–20s. O site nunca fica com um fader de música controlando silêncio.
- **efeitos** — a cerimônia da abertura e o feedback de menu. A cauda de
  caverna pendura nesse barramento, não no master, para que abaixar efeitos
  leve o próprio reverb junto em vez de deixar um fantasma tocando.

Os faders andam como alvo (`setTargetAtTime`), nunca como salto: arrastar um
slider tem que soar como girar um botão, e ganho em degrau é ruído de zíper.

## Fluidez

Quatro decisões, todas pelo mesmo motivo: movimento que não trava e não
depende do monitor de quem está olhando.

- **Rápido pra entrar, lento pra sair.** Todo estado sob o ponteiro responde
  em `--duration-hover` (200ms) e leva `--duration-leave` (460ms) pra soltar,
  na curva `--ease-glide`. A assimetria é o que dá peso a uma linha em vez de
  um estado que liga e desliga.
- **`--near` e `--breath` são propriedades registradas** (`@property`). Sendo
  `<number>` animáveis, a proximidade do ponteiro passa a ser *transicionável*:
  tirar o mouse da placa apaga a luz em 260ms em vez de zerar num quadro, e
  toda a luz do slab é suavizada pela mesma curva de graça. `--breath` é o
  ciclo lento de respiro — nada nesta página fica perfeitamente parado
  esperando você.
- **Suavização por meia-vida, não por fração de quadro.** `x += (alvo-x)*k`
  faz o cursor ser um objeto diferente em cada tela: crava a 144Hz, arrasta a
  30Hz. Escrito como o tempo pra fechar metade da distância, o rastro é o mesmo
  movimento físico em qualquer taxa e sobrevive a um quadro perdido. O mesmo
  vale pro parallax do campo, que na forma exponencial não pode ultrapassar o
  alvo num engasgo.
- **Rolar é a câmera descendo pela sala**, não a página deslizando sobre um
  desenho: as poças de luz afundam e os esporos fazem parallax por
  profundidade, com wrap — o campo nunca esvazia enquanto você rola por ele.

## Som

O som existe por decisão, não por inércia — um arquivo de partida que te
responde é boa parte do motivo da abertura funcionar. O custo dessa decisão é
pago de forma honesta: o áudio só destrava no gesto de entrada (a política de
autoplay é satisfeita por desenho, não por sorte), existe um interruptor real
na barra superior, a escolha é lembrada, e quem usa `prefers-reduced-motion`
começa no mudo — mas com o interruptor funcionando, porque é preferência e
não bloqueio.

## Acessibilidade

- `prefers-reduced-motion` entrega a experiência **inteira**, não uma versão
  cortada: a sala continua com profundidade, paredes e grão, o marcador de
  seleção continua aparecendo, hover e foco continuam respondendo com luz e
  cor. O que sai é deslocamento e repetição — nenhuma animação em loop, nenhum
  elemento que viaja, escala ou gira. Durações ficam curtas mas **reais**
  (200ms), porque colapsar tudo pra 1ms tira o feedback e faz a página parecer
  quebrada, não calma.
- Foco de teclado recebe exatamente o mesmo desenho que hover — nas linhas de
  link, o mesmo marcador, a mesma varredura de luz, a mesma borda acesa.
- Contraste verificado sobre o estado **carregado** do fundo (amostrando os
  pixels reais do canvas por baixo de cada texto ao longo de vários quadros),
  não só sobre o estado calmo. O bloco de identidade tem um scrim local próprio
  para garantir piso de contraste enquanto a luz do fundo se move.

## Build e checagem

```bash
npm test
npm run build
```

Progressive enhancement: sem JavaScript não existe abertura, não existem
menus nem portas — e os cinco links continuam funcionando como links.
