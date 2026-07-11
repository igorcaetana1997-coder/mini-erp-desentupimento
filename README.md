# Real Leader Desentupidora — Painel (Mini ERP)

Aplicação web em Next.js (App Router) + Prisma/SQLite, com login de dois perfis
(admin e técnico), cadastro de clientes, ordens de serviço com agenda e
financeiro, conclusão com assinatura do cliente e recibo em PDF. Identidade
visual (logo, cores e fonte) da **Real Leader Desentupidora**.

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

Instale o **Node.js LTS (18 ou 20)**: https://nodejs.org — este projeto não roda sem ele.
Verifique depois de instalar:

```
node -v
npm -v
```

## 2. Instalação

### Instalação nova (do zero)

Dentro da pasta `mini-erp-desentupimento`:

```
npm install
npx prisma migrate dev
npm run db:seed
```

Isso cria o banco `prisma/dev.db` (SQLite), aplica todas as migrações (incluindo
os campos de financeiro/agenda/fotos/etc.) e popula com um usuário admin, um
técnico de demonstração e alguns clientes/OS de exemplo.

### Atualizando uma instalação que já existia

Se você já tinha o projeto rodando antes desta evolução (financeiro, agenda,
histórico, materiais, conclusão/assinatura/PDF, avaliação, CEP, fotos, recusa),
**não rode `migrate dev` de novo** — use `migrate deploy`, que só aplica as
migrações novas sem tocar nos dados que já existem:

```
npm install
npx prisma migrate deploy
npx prisma generate
```

A migração `evolucao_v2` renomeia a coluna `date` da OS para `scheduledAt`
(agora com data **e** hora) preservando os valores já cadastrados. A migração
`cliente_completo` renomeia a coluna `address` do Cliente para `logradouro` e
adiciona os campos de endereço/aniversário/e-mail/documento. Em todos os
casos as colunas novas são opcionais — nenhuma OS, cliente ou despesa
existente é apagado.

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

Para uso fora de casa/oficina (internet), será necessário publicar o projeto em
um servidor (Vercel, Railway, VPS, etc.) — nesse caso troque o SQLite por um
banco hospedado (Postgres, por exemplo) ou mantenha o arquivo SQLite em um
volume persistente, e ajuste `NEXTAUTH_URL` no `.env` para a URL pública.

## 5. Como funciona

### Login e papéis
- **Login** (`/login`): autenticação via NextAuth (credenciais + senha com hash).
- **Painel** (`/painel`, somente admin): cadastro de clientes, técnicos e
  ordens de serviço, agenda do dia e financeiro (faturamento + despesas).
- **Técnico** (`/tecnico`): lista apenas as OS atribuídas ao usuário logado (o
  filtro é feito no servidor, não no navegador), pensada para tela de celular.
- Um técnico que tentar acessar `/painel` é redirecionado automaticamente para
  `/tecnico` (bloqueado no `middleware.js` e também nas rotas de API).

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
Cada OS tem forma de pagamento (dinheiro/Pix/cartão/boleto), status de
pagamento (pago/pendente) e vencimento opcional. No card da OS, o **admin**
tem um botão **"Confirmar pagamento"** para dar baixa manualmente assim que
recebe o comprovante/confirmação do banco (com opção de desfazer em caso de
engano) — isso é separado do fluxo aberta/andamento/concluída, pode ser
confirmado a qualquer momento.

A tela **Financeiro** (`/painel/financeiro`) reúne:
- Faturamento do período filtrado por data e por técnico (total faturado,
  pago, pendente, quebra por técnico e por parceiro), somando o valor das OS
  concluídas.
- **Lançamento de despesas** (combustível, material, manutenção, salário,
  outro): formulário simples (descrição, categoria, valor, data), lista do
  período com opção de remover, e total por categoria.
- **Comissões** de parceiros e de técnicos (ver seção "Terceirização e
  comissões" abaixo), calculadas só sobre OS concluídas **e pagas** do
  período, pra refletir o caixa real.
- **Saldo líquido** do período = total pago − despesas − comissão paga a
  parceiros + comissão recebida de parceiros − comissão paga a técnicos.
- Botão **Exportar CSV** com as OS e despesas do período (abre direto no
  Excel/planilhas, sem depender de nenhuma lib de exportação).

O modelo `Despesa` é independente da OS (custos gerais do negócio, não
atrelados a um atendimento específico).

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

### Notificações automáticas (WhatsApp/SMS) — não implementado, só estruturado
Por pedido explícito, **não há envio automático** de mensagens (isso depende
de um serviço pago como Twilio ou Z-API). O que existe é um ponto de extensão
pronto: `lib/notifications.js` exporta `notifyClienteStatusChange(evento, {
cliente, os })`, chamada (sem quebrar o fluxo principal se falhar) nos
momentos de recusa, avanço para "em andamento" e conclusão. Hoje ela só loga
no console do servidor — quando decidir contratar um provedor, a integração
real entra só ali dentro.

## 6. Estrutura

```
app/
  login/                      página + formulário de login
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
  ordens/[id]/recibo/          recibo imprimível/PDF (admin ou técnico dono)
  api/
    auth/[...nextauth]         rota do NextAuth
    clientes                   GET / POST (cadastro completo) — POST só admin
    clientes/[id]              GET (cliente + histórico) / PATCH / DELETE (bloqueia se tiver OS) — só admin
    tecnicos                   GET / POST (criar técnico) — só admin
    tecnicos/[id]               DELETE (OS dele ficam sem técnico) — só admin
    parceiros                  GET / POST — só admin
    parceiros/[id]              GET (parceiro + histórico) / PATCH / DELETE (bloqueia se tiver OS) — só admin
    faixas-comissao             GET / POST (faixa de comissão do técnico) — só admin
    faixas-comissao/[id]        PATCH / DELETE — só admin
    ordens                     GET (filtrado por papel) / POST (aceita parceria) — só admin
    ordens/[id]                PATCH geral (materiais/avaliação/pagamento/parceria; admin edita mais) / DELETE (exclui, só admin)
    ordens/[id]/avancar        PATCH aberta -> andamento
    ordens/[id]/recusar        PATCH aberta -> recusada (só técnico dono, motivo obrigatório)
    ordens/[id]/concluir       PATCH andamento -> concluida (assinatura obrigatória)
    ordens/[id]/fotos          GET / POST (fotos em base64)
    despesas                   GET / POST (lançar despesa) — só admin
    despesas/[id]              DELETE — só admin
    relatorios/financeiro      GET agregado (faturamento + despesas + comissões + saldo) — só admin
    relatorios/dashboard        GET agregado do mês (pipeline + ranking técnico/parceiro) — só admin
components/
  Ticket, Stamp, TicketActions  card da OS + botões de ação por status
  ConcluirOsModal, RecusarOsModal, SignaturePad
  ClientForm, OsForm, TopBar, EmptyState
  ThemeProvider, ThemeToggle     modo claro/escuro (contexto + botão sol/lua)
lib/
  prisma.js, auth.js            cliente Prisma e configuração do NextAuth
  notifications.js              stub para WhatsApp/SMS (ver seção 5)
  resizeImage.js                redimensiona fotos no navegador antes do upload
  formatEndereco.js              monta a linha de endereço a partir dos campos estruturados do cliente
  comissaoTecnico.js             calcularFaixa(faixas, totalFaturado) — regra da faixa de comissão do técnico
  exportCsv.js                   downloadCsv(filename, headers, rows) — exportação client-side, sem lib externa
prisma/                        schema.prisma, seed.js e migrations/
middleware.js                   protege /painel, /tecnico e /ordens por login/papel
```

## 7. Comandos úteis do Prisma

```
npx prisma studio         # navegador visual do banco SQLite
npx prisma migrate dev    # criar nova migração após mudar o schema (ambiente local)
npx prisma migrate deploy # aplicar migrações pendentes sem perder dados (ex: produção)
```
