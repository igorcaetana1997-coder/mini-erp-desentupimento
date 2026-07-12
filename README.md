# Real Leader Desentupidora — Painel (Mini ERP)

Aplicação web em Next.js (App Router) + Prisma/**PostgreSQL (hospedado na
[Neon](https://neon.tech))**, com login de três perfis (admin, técnico e
parceiro), cadastro de clientes, ordens de serviço com agenda e financeiro,
conclusão com assinatura do cliente e recibo em PDF. Pronta pra deploy na
**Vercel**. Identidade visual (logo, cores e fonte) da **Real Leader
Desentupidora**.

## 0. Identidade visual

- Logo em `public/logo-*.png`. `logo-icon*` vem de `ICONE.pdf` e
  `logo-stacked*` de `RL ( LOGO 1 ).pdf` (versão empilhada, usada no login).
  `logo-horizontal-outline.png` (barra superior e recibo) é o PNG oficial
  exportado pela empresa (`LOGO-PARA-CAMISA-(-SEM-O-NUMERO-).png`, já com o
  fundo branco sólido por trás) — usado sem nenhuma edição, só redimensionado.
  As demais versões `*-outline.png` (ícone/empilhada) têm um contorno branco
  gerado por mim (mesmo efeito do site oficial) pra ficarem legíveis em fundo
  escuro.
- Cores exatas da logo (lidas diretamente dos comandos de preenchimento do PDF,
  não estimadas por amostragem de pixel): navy `#142D65` e vermelho `#A02018`.
  Amber `#E8A33D`
  segue como cor de apoio (avaliação em estrelas, status "aberta").
- Fonte **Poppins** (mesma usada no site oficial, realleaderdesentupidora.com.br).
- **Barra superior**: replica o cabeçalho do site oficial — fundo quase preto
  (`#0F0F0F`), logo com contorno branco e item de navegação ativo em verde
  neon `#C6FE1F` com texto preto, igual ao destaque usado no menu do site.
  Esse visual da barra é fixo — não muda com o modo claro/escuro.
- **Modo claro/escuro**: botão de sol/lua na barra superior alterna o tema do
  restante do painel (cards, textos, fundos). A preferência fica salva no
  navegador (`localStorage`) e, na primeira visita, segue a preferência do
  sistema operacional. As cores do tema vêm de variáveis CSS em
  `app/globals.css` (`:root` para claro, `.dark` para escuro) — botões e
  selos coloridos (navy/vermelho/verde/amber) não mudam de tom entre os
  temas, só o fundo, os cards e o texto neutro.

## 1. Pré-requisitos

- **Node.js LTS (18 ou 20)**: https://nodejs.org — este projeto não roda sem ele.
  Verifique depois de instalar:
  ```
  node -v
  npm -v
  ```
- **Conta grátis na [Neon](https://neon.tech)** com um projeto/banco Postgres
  criado. No painel do projeto, em "Connection Details", você vai encontrar
  duas connection strings: uma **pooled** (host termina em `-pooler`) e uma
  **direta** (sem `-pooler`) — as duas são usadas no passo de instalação.

## 2. Instalação

Dentro da pasta `mini-erp-desentupimento`:

```
cp .env.example .env
```

Edite o `.env` e cole as connection strings da Neon em `DATABASE_URL` (a
**pooled**) e `DIRECT_URL` (a **direta**), e gere um `NEXTAUTH_SECRET` novo
(`openssl rand -base64 32`). Veja os comentários do `.env.example` para
detalhes de cada variável.

```
npm install
npx prisma migrate deploy
npm run db:seed
```

Isso cria as 7 tabelas no banco Postgres da Neon e popula com um usuário
admin, um técnico de demonstração e alguns clientes/OS de exemplo.

> Este projeto rodava em SQLite local até 2026-07-11 e foi migrado para
> PostgreSQL/Neon para funcionar em produção na Vercel (o SQLite grava num
> arquivo local, que não sobrevive entre deploys/instâncias serverless). Os
> dados antigos do SQLite (`prisma/dev.db`, se ainda existir na sua máquina)
> **não são transferidos automaticamente** — o banco novo começa vazio.

**Credenciais de demonstração:**
- Admin: `admin@empresa.com` / `admin123`
- Técnico: `carlos@empresa.com` / `tecnico123`

Troque essas senhas (ou crie novos usuários) antes de usar em produção.

## 3. Rodando localmente

```
npm run dev
```

Acesse http://localhost:3000 — você será redirecionado para `/login`.

## 4. Acessando pelo celular do técnico

Para o técnico abrir o painel dele pelo celular na mesma rede Wi-Fi:

```
npx next dev -H 0.0.0.0
```

Depois descubra o IP da sua máquina na rede (`ipconfig` no Windows, procure por
"Endereço IPv4") e acesse `http://SEU-IP:3000` pelo navegador do celular.

Para uso fora de casa/oficina (internet), publique o projeto na Vercel (ver
seção 5.1 abaixo) e ajuste `NEXTAUTH_URL` para a URL pública do deploy.

## 5. Deploy na Vercel

O projeto já usa Postgres (Neon), então não depende de sistema de arquivos
local — funciona direto em produção serverless.

1. Suba o projeto pra um repositório Git (GitHub/GitLab/Bitbucket) e importe
   na Vercel (https://vercel.com/new), ou rode `npx vercel` direto da pasta do
   projeto.
2. No painel da Vercel, em **Settings → Environment Variables**, cadastre:
   - `DATABASE_URL` — connection string **pooled** da Neon.
   - `DIRECT_URL` — connection string **direta** da Neon.
   - `NEXTAUTH_SECRET` — um valor aleatório (pode ser o mesmo do `.env` local
     ou gerar outro com `openssl rand -base64 32`).
   - `NEXTAUTH_URL` — a URL pública do deploy (ex.: `https://seu-projeto.vercel.app` ou o
     domínio próprio, ex.: `https://erp.realleaderdesentupidora.com.br`).
   - `RESEND_API_KEY` — API Key gerada no painel da [Resend](https://resend.com), usada
     para enviar o e-mail de "esqueci minha senha".
   - `NEXT_PUBLIC_SENTRY_DSN` — DSN do projeto no [Sentry](https://sentry.io) (aba
     "Configure Next.js SDK" → "Copy DSN"), usado para monitoramento de erros.
   - `CRON_SECRET` — valor aleatório que protege a rota do cron diário de WhatsApp
     (`openssl rand -base64 32`).
   - `ZAPI_INSTANCE_ID`, `ZAPI_TOKEN`, `ZAPI_CLIENT_TOKEN` — **opcionais**; só preencha quando
     decidir ativar a automação de WhatsApp (ver seção 6).
3. Deploy. O script `build` (`package.json`) já roda
   `prisma migrate deploy && next build`, então qualquer migration pendente é
   aplicada automaticamente no banco Neon a cada deploy — não precisa de
   passo manual.
4. Se quiser popular o banco de produção com os dados de demonstração, rode
   `npm run db:seed` localmente uma vez, apontando o `.env` pras variáveis de
   produção (ou use `vercel env pull` pra baixar as variáveis da Vercel).

## 6. Como funciona

### Login e papéis
- **Login** (`/login`): autenticação via NextAuth (credenciais + senha com hash).
  Aceita tanto o e-mail quanto um nome de usuário opcional (`username`,
  definido na criação do técnico/parceiro ou editável direto no banco pro
  admin) — ambos podem ser usados no mesmo campo pra entrar.
- **Painel** (`/painel`, somente admin): cadastro de clientes, técnicos,
  parceiros e ordens de serviço, agenda do dia, Visão Geral e financeiro.
- **Técnico** (`/tecnico`): lista apenas as OS atribuídas ao usuário logado (o
  filtro é feito no servidor, não no navegador), pensada para tela de celular.
- **Parceiro** (`/parceiro`): mesmo formato do técnico, mas lista só as OS
  terceirizadas vinculadas àquele parceiro (`parceiroId`). O acesso é criado
  pelo admin na tela do parceiro (ver "Login do parceiro" abaixo) — o
  parceiro não se cadastra sozinho.
- Cada papel só acessa a própria área: um técnico que tentar abrir `/painel`
  ou `/parceiro`, ou um parceiro que tentar abrir `/painel` ou `/tecnico`, é
  redirecionado automaticamente pra área dele (bloqueado no `middleware.js` e
  também nas rotas de API).

### Fluxo da OS
`aberta → andamento → concluída`, com um ramo à parte `recusada`:
- **Avançar** (aberta → andamento): um toque, sem exigir nada extra.
- **Recusar** (só o técnico dono, só enquanto está aberta): exige motivo.
  O admin pode depois **reatribuir a outro técnico e reabrir** a OS recusada.
- **Concluir** (andamento → concluída): abre um modal com **assinatura do
  cliente obrigatória** (desenhada num canvas), e campos opcionais de
  materiais usados, forma de pagamento e nota de avaliação (1 a 5).
- A avaliação pode ser registrada/alterada depois da conclusão também,
  direto no card da OS.

### Agenda
Cada OS tem uma **data e horário agendado da visita** (`scheduledAt`),
separado da data de abertura (`createdAt`, automática). A tela **Agenda**
(`/painel/agenda`) lista as OS de um dia escolhido, em ordem de horário.

### Financeiro
Cada OS tem forma de pagamento (dinheiro/Pix/cartão/boleto), vencimento
opcional, e um **valor pago** (`valorPago`) — o status pago/parcial/pendente
não é escolhido manualmente, é **calculado** a partir de `valorPago` vs o
valor da OS (`lib/paymentStatus.js`). No card da OS, o **admin** tem um botão
**"Registrar pagamento"**: digita quanto o cliente pagou (pode ser menos que
o valor total, registrando um pagamento **parcial**) — se ficar faltando
algo, um alerta "⚠ Falta receber R$X" aparece no card pra qualquer um que
veja a OS (admin, técnico ou parceiro). Isso é separado do fluxo
aberta/andamento/concluída, pode ser registrado a qualquer momento.

A tela **Financeiro** (`/painel/financeiro`) reúne:
- Faturamento do período filtrado por data e por técnico (total faturado,
  pago — soma real de `valorPago`, já refletindo pagamentos parciais —,
  pendente, quebra por técnico e por parceiro), somando o valor das OS
  concluídas.
- **Lançamento de despesas** (combustível, material, manutenção, salário,
  outro): formulário simples (descrição, categoria, valor, data), lista do
  período com opção de remover, e total por categoria.
- **Comissões** de parceiros e de técnicos (ver seção "Terceirização e
  comissões" abaixo), calculadas só sobre OS concluídas **e totalmente
  pagas** do período (pagamento parcial ainda não gera comissão).
- **Saldo líquido** do período = total pago − despesas − comissão paga a
  parceiros + comissão recebida de parceiros − comissão paga a técnicos.
- Botão **Exportar CSV** com as OS e despesas do período, e botão
  **"Imprimir / salvar PDF"** (mesmo padrão do recibo: `window.print()`,
  sem lib nova) — o menu superior e os botões somem na impressão, e os
  cards coloridos viram preto e branco pra não gastar tinta.

O modelo `Despesa` é independente da OS (custos gerais do negócio, não
atrelados a um atendimento específico).

### Edição de valor e edição geral da OS
- **Técnico ou parceiro dono** da OS podem editar o **valor do serviço**
  ("Editar valor do serviço" no card), mas só enquanto ela está **aberta ou
  em andamento** — depois de concluída, o valor já fechou. Faz sentido: só na
  hora do atendimento dá pra saber se o serviço é mais simples ou mais
  complexo do que o combinado por telefone.
- **Admin** pode editar **qualquer OS já criada, em qualquer status**, pelo
  botão **"Editar OS"**: tipo de serviço, técnico, valor, data/horário
  agendado, urgência, forma de pagamento, vencimento e parceria — tudo num
  modal só (`components/EditarOsModal.jsx`), sem precisar excluir e recriar.

### Terceirização e comissões
- **Parceiros** (`/painel/parceiros`): cadastro de terceirizados com quem a
  empresa troca serviços — nome, telefone, e-mail, documento e observações,
  com histórico de OS por parceiro (igual ao histórico de cliente).
- Ao criar uma OS, é possível marcar que ela é **terceirizada**: escolher o
  parceiro, o tipo (**"Repassei a ele"** — a empresa recebe uma comissão por
  indicar/passar o serviço — ou **"Recebi dele"** — a empresa paga uma
  comissão a quem indicou) e o percentual. O valor da OS é sempre o **valor
  total do serviço**; a comissão é calculada como % sobre esse total.
- **Comissão do técnico próprio** não é um percentual fixo por técnico: é uma
  **tabela de faixas por faturamento mensal**, configurável em
  **Visão Geral → Configurar faixas de comissão** (ex.: a partir de R$0 = 5%,
  a partir de R$5.000 = 12%). A faixa atingida pelo total faturado pelo
  técnico no período vale sobre **todo** o valor, não progressivamente — é
  pensado pra estimular o técnico a faturar mais no mês. O cálculo é sempre
  derivado no relatório (não fica gravado na OS), então mudar as faixas
  recalcula automaticamente os meses seguintes.

### Login do parceiro
Na tela do parceiro (`/painel/parceiros/[id]`), a seção **"Acesso ao
sistema"** deixa o admin criar um login (e-mail + senha) pra aquele parceiro
— reaproveita a mesma tabela `User` de admin/técnico, só com
`role: "parceiro"` e um `parceiroId` apontando pra qual parceiro aquele login
representa. Cada parceiro só pode ter um login. Depois de logado, o parceiro
cai em `/parceiro` (mesmo formato mobile do técnico) e só vê as OS
vinculadas a ele — pode editar o valor delas (ver acima) e ver a própria
comissão no card, mas não tem acesso ao financeiro geral da empresa.

### Visão Geral (dashboard)
A tela **Visão Geral** (`/painel/visao-geral`) dá um panorama rápido do mês
selecionado, sem duplicar o detalhamento do Financeiro:
- OS em aberto/andamento (situação atual), taxa de conclusão, faturamento
  pago/pendente do mês e ticket médio.
- **Produção por técnico**: faturamento do mês, faixa de comissão atingida e
  valor da comissão — considera todas as OS concluídas do mês (pagas ou não),
  diferente do Financeiro, que só soma comissão sobre OS já pagas.
- **Produção por parceiro**: faturamento e comissão (a pagar ou a receber)
  por parceiro no mês.
- Botão **Exportar CSV** em cada ranking.
- Seção **Configurar faixas de comissão**: cadastro simples da tabela de
  faixas usada no cálculo da comissão do técnico (ver acima).

### Cliente: cadastro completo, CEP e histórico
- Cadastro com **nome, telefone, e-mail, CPF/CNPJ e data de aniversário**.
- Endereço **estruturado**: CEP (autopreenche logradouro/bairro/cidade/UF
  consultando o [ViaCEP](https://viacep.com.br) no blur do campo, API pública
  e gratuita, sem chave — se falhar, tudo continua editável manualmente),
  logradouro, **número**, **complemento**, bairro, cidade e UF, cada um em seu
  próprio campo. Onde o app mostra o endereço, ele é montado a partir desses
  campos por `lib/formatEndereco.js`.
- Campo de **observações gerais** (acesso ao imóvel, ponto de referência,
  animais no local etc.), visível tanto no cadastro quanto em cada OS do
  técnico.
- Clicar num cliente no painel abre `/painel/clientes/[id]`, com os dados e o
  **histórico completo de OS** daquele cliente.

### Materiais usados
Campo de texto livre na OS, editável pelo técnico dono (ou admin) a qualquer
momento antes da conclusão, e também no próprio modal de conclusão.

### Fotos do serviço
O técnico pode anexar fotos (câmera do celular ou galeria) em qualquer OS que
não esteja recusada. As imagens são redimensionadas **no navegador** (até
~900px, JPEG) antes de enviar, e guardadas como base64 numa tabela própria
(`FotoServico`) — não depende de nenhum serviço de storage externo.

### Conclusão: recibo em PDF e WhatsApp
Toda OS concluída tem um link "Ver recibo / gerar PDF" que abre
`/ordens/[id]/recibo` (acessível pelo admin ou pelo técnico dono, mesmo fora
do `/painel`). A página tem uma versão imprimível (CSS `@media print`) — o
botão "Imprimir / salvar PDF" usa a função de impressão do próprio navegador
(`window.print()`), sem depender de nenhuma biblioteca de PDF. Há também um
link que abre o WhatsApp do cliente (`wa.me`) com uma mensagem pronta; anexar
o PDF salvo é manual, já que não há integração paga de envio automático.

### Excluir OS
O admin pode excluir uma ordem de serviço definitivamente (qualquer status),
com uma confirmação inline antes de apagar ("Excluir OS" → "Confirmar
exclusão"). Ao excluir, as fotos anexadas àquela OS também são removidas. Isso
é diferente de "recusar": recusar mantém o histórico, excluir apaga de vez —
use para corrigir um cadastro feito por engano, não para o fluxo normal.

### Listas completas e exclusão de cadastros
No painel, os cartões de Clientes, Técnicos, Parceiros e Ordens de serviço
mostram só os 3 primeiros registros, com um link **"Ver mais"** que leva pra
uma página com a lista completa (`/painel/clientes`, `/painel/tecnicos`,
`/painel/parceiros`, `/painel/ordens`). Clientes, técnicos e parceiros podem
ser excluídos (com confirmação inline), mas a exclusão é **bloqueada** se
existir alguma OS vinculada — a mensagem de erro explica quantas e pede pra
excluir/reatribuir as OS antes.

### Recuperação e alteração de senha
- **"Esqueci minha senha"** (`/esqueci-senha`, link na tela de login): o usuário informa o
  e-mail e recebe (via [Resend](https://resend.com)) um link de redefinição válido por
  **1 hora** e de **uso único**. A resposta da API é sempre a mesma mensagem genérica,
  mesmo se o e-mail não existir, pra não revelar quais e-mails estão cadastrados.
- **Redefinir senha** (`/redefinir-senha?token=...`): o link do e-mail leva pra essa página,
  onde o usuário define a nova senha. O token é guardado no banco só como **hash SHA-256**
  (`lib/passwordReset.js`), nunca em texto puro.
- **Alterar senha** (`/conta/senha`, ícone de chave na barra superior, qualquer papel
  logado): pede a senha atual + a nova, sem depender de e-mail — para quem já está logado
  e só quer trocar a senha.

### Monitoramento de erros (Sentry)
Erros não tratados (tanto no servidor/API quanto no navegador) são capturados
automaticamente pelo [Sentry](https://sentry.io) (`@sentry/nextjs`), configurado em
`sentry.client.config.js`, `sentry.server.config.js`, `sentry.edge.config.js` e
`instrumentation.js`, com `next.config.mjs` envolvido por `withSentryConfig`. Sem o
`NEXT_PUBLIC_SENTRY_DSN` preenchido no `.env`/Vercel, a aplicação funciona normalmente,
só não envia nada pro Sentry.

### Busca e filtro na lista de OS
A lista completa (`/painel/ordens`) tem um campo de busca (por cliente, tipo de serviço
ou técnico) e um filtro por status (aberta/andamento/concluída/recusada), iguais em
espírito ao filtro já usado nas visões de técnico/parceiro — filtragem no navegador,
sem chamada nova à API.

### Notificações automáticas de status (WhatsApp/SMS) — não implementado, só estruturado
`lib/notifications.js` exporta `notifyClienteStatusChange(evento, { cliente, os })`, chamada (sem
quebrar o fluxo principal se falhar) nos momentos de recusa, avanço para "em andamento" e
conclusão. Hoje ela só loga no console do servidor — é um ponto de extensão pronto, mas separado
da automação agendada descrita abaixo.

### Automação de WhatsApp: acompanhamento pós-serviço e aniversário do cliente
Duas mensagens automáticas, disparadas 1x por dia por um **Vercel Cron Job**
(`vercel.json` → `app/api/cron/notificacoes-diarias/route.js`, protegida por `CRON_SECRET`):

- **Acompanhamento pós-serviço**: 15 dias depois de uma OS ser concluída (`OrdemServico.concluidaEm`),
  pergunta ao cliente se ficou tudo certo. Cada OS só recebe essa mensagem uma vez
  (`OrdemServico.followUpEnviadoEm`).
- **Aniversário**: no dia do aniversário do cliente (`Cliente.dataNascimento`), manda uma mensagem
  de parabéns. Cada cliente só recebe uma vez por ano (`Cliente.ultimoParabensAno`).

O envio de verdade acontece via **Z-API** (`lib/whatsapp.js`), mas fica **dormente** enquanto as
variáveis `ZAPI_INSTANCE_ID`/`ZAPI_TOKEN`/`ZAPI_CLIENT_TOKEN` não estiverem preenchidas — a rota
do cron confere isso logo no início e, se não configurado, responde
`{ enviado: false, motivo: "Z-API não configurado ainda" }` sem tocar no banco (nenhuma OS ou
aniversário é marcado como "enviado" só porque o cron rodou desligado). Assim que as 3 variáveis
forem cadastradas (crie a instância em [z-api.io](https://z-api.io) e escaneie o QR Code com o
WhatsApp da empresa), a automação passa a funcionar sozinha a partir do próximo disparo diário,
sem precisar mexer em nenhum código.

## 7. Estrutura

```
app/
  login/                      página + formulário de login
  esqueci-senha/               solicitar link de redefinição de senha (público)
  redefinir-senha/             definir nova senha a partir do link recebido (público)
  conta/senha/                 alterar senha estando logado (qualquer papel)
  global-error.jsx             error boundary raiz (reporta pro Sentry)
  painel/                     painel administrativo
    clientes/                  lista completa de clientes (+ exclusão)
    clientes/[id]/             detalhe do cliente + histórico de OS
    tecnicos/                   lista completa de técnicos (+ exclusão)
    parceiros/                  lista completa de parceiros/terceirizados (+ exclusão)
    parceiros/[id]/             detalhe do parceiro + histórico de OS
    ordens/                     lista completa de OS (mesmas ações do painel)
    agenda/                     OS do dia, ordenadas por horário
    financeiro/                 faturamento + despesas + comissões + saldo (período/técnico/parceiro)
    visao-geral/                dashboard do mês: pipeline, produção por técnico/parceiro, faixas de comissão
  tecnico/                     visão mobile do técnico (somente as OS dele)
  parceiro/                    visão mobile do parceiro (somente as OS dele, edita valor)
  ordens/[id]/recibo/          recibo imprimível/PDF (admin, técnico ou parceiro dono)
  api/
    auth/[...nextauth]         rota do NextAuth
    auth/esqueci-senha          POST (gera token + envia e-mail via Resend) — resposta sempre genérica
    auth/redefinir-senha        POST (valida token + define nova senha)
    auth/senha                  PATCH (troca de senha estando logado, qualquer papel)
    clientes                   GET / POST (cadastro completo) — POST só admin
    clientes/[id]              GET (cliente + histórico) / PATCH / DELETE (bloqueia se tiver OS) — só admin
    tecnicos                   GET / POST (criar técnico) — só admin
    tecnicos/[id]               DELETE (OS dele ficam sem técnico) — só admin
    parceiros                  GET / POST — só admin
    parceiros/[id]              GET (parceiro + histórico + login) / PATCH / DELETE (bloqueia se tiver OS) — só admin
    parceiros/[id]/acesso        POST (cria login do parceiro) — só admin
    faixas-comissao             GET / POST (faixa de comissão do técnico) — só admin
    faixas-comissao/[id]        PATCH / DELETE — só admin
    ordens                     GET (filtrado por papel, inclusive parceiro) / POST (aceita parceria) — só admin
    ordens/[id]                PATCH geral (materiais/avaliação só técnico; valor técnico/parceiro dono até concluir;
                                admin edita tudo + valorPago) / DELETE (exclui, só admin)
    ordens/[id]/avancar        PATCH aberta -> andamento
    ordens/[id]/recusar        PATCH aberta -> recusada (só técnico dono, motivo obrigatório)
    ordens/[id]/concluir       PATCH andamento -> concluida (assinatura obrigatória)
    ordens/[id]/fotos          GET / POST (fotos em base64)
    despesas                   GET / POST (lançar despesa) — só admin
    despesas/[id]              DELETE — só admin
    relatorios/financeiro      GET agregado (faturamento + despesas + comissões + saldo) — só admin
    relatorios/dashboard        GET agregado do mês (pipeline + ranking técnico/parceiro) — só admin
    cron/notificacoes-diarias   GET (protegida por CRON_SECRET) — dispara follow-up 15 dias + aniversário via Z-API
components/
  Ticket, Stamp, TicketActions  card da OS + botões de ação por status/papel
  ConcluirOsModal, RecusarOsModal, EditarOsModal, SignaturePad
  ClientForm, OsForm, TopBar, EmptyState
  ThemeProvider, ThemeToggle     modo claro/escuro (contexto + botão sol/lua)
lib/
  prisma.js, auth.js            cliente Prisma e configuração do NextAuth
  notifications.js              stub para WhatsApp/SMS (ver seção 5)
  resizeImage.js                redimensiona fotos no navegador antes do upload
  formatEndereco.js              monta a linha de endereço a partir dos campos estruturados do cliente
  comissaoTecnico.js             calcularFaixa(faixas, totalFaturado) — regra da faixa de comissão do técnico
  exportCsv.js                   downloadCsv(filename, headers, rows) — exportação client-side, sem lib externa
  paymentStatus.js                getStatusPagamento(os) — deriva pago/parcial/pendente a partir de valorPago
  email.js                        sendPasswordResetEmail(to, resetUrl) via Resend
  passwordReset.js                generateResetToken() / hashToken() — token de redefinição de senha
  whatsapp.js                     isWhatsappConfigured() / sendWhatsappMessage() via Z-API (ver seção 6)
prisma/                        schema.prisma, seed.js e migrations/
middleware.js                   protege /painel, /tecnico, /parceiro e /ordens por login/papel
vercel.json                     agendamento do cron diário de notificações (Vercel Cron Jobs)
```

## 8. Comandos úteis do Prisma

```
npx prisma studio         # navegador visual do banco Postgres (Neon)
npx prisma migrate dev    # criar nova migração após mudar o schema (ambiente local)
npx prisma migrate deploy # aplicar migrações pendentes sem perder dados (ex: produção/Vercel)
```

⚠️ `npx prisma migrate reset` apaga **todos os dados** do banco apontado pelo `.env` — cuidado
pra não rodar isso apontando pro banco Neon de produção.
