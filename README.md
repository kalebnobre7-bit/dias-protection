# Dias Protection — site + configurador

Next.js 15 · React 19 · Tailwind v4 · Framer Motion · TypeScript · Supabase (painel, equipe e frota).

```bash
npm run dev   # http://localhost:3000 → redireciona pra /pt ou /en
```

## Rotas (todas em /pt e /en)

| Rota | O que é |
|---|---|
| `/` | Home: hero, credenciais, serviços, como funciona, fundador, CTA |
| `/servicos` e `/servicos/[slug]` | Lista e página de cada serviço (botão abre o pedido já preenchido) |
| `/sobre` | Trajetória, certificações e reconhecimentos do Gabriel |
| `/equipe` | Fundador + agentes (vêm do painel, via Supabase) + critérios de seleção |
| `/frota` | Categorias de veículo |
| `/solicitar` | Configurador em passos (um por tela, trilha de progresso) → WhatsApp (`?servico=slug` pré-seleciona). Vários serviços por pedido (transporte vira transfer ou diária), armados x desarmados, idioma do motorista e dos agentes, período estimado, viagem intermunicipal, evento, pessoa pública/PPE e "quero sugestão" |
| `/cartao` | Cartão de visita digital: cartão que vira (marca / contato + QR), compartilhar e salvar contato |
| `/contato.vcf` | Download do contato com foto (gerado no build) |
| `/admin` | Painel do Gabriel (só PT, fora do índice dos buscadores). Inclui Propostas: orçamento numerado com itens e documento A4 em `/admin/propostas/documento?id=…` |

## GitHub Pages

A cada push na `main`, `.github/workflows/pages.yml` gera o export estático (`GITHUB_PAGES=true`, basePath `/dias-protection`) e publica em https://kalebnobre7-bit.github.io/dias-protection/. Sem middleware ali: a raiz usa `scripts/pages-index.html` pra escolher o idioma. O build normal (Vercel) não muda.

## Onde mexer

- **Conteúdo** (empresa, trajetória, serviços, categorias de veículo): `src/data/content.ts`. Agentes e veículos reais vêm do Supabase (painel). Itens com ⚠️ aguardam confirmação do Gabriel. Clientes famosos só aparecem com `showNotableClients: true`.
- **Imagens**: `public/images/` (geradas por IA; originais em `docs/imagens-ia/`). `docs/` fica fora do git (tem dados pessoais).
- **Domínio**: definir `NEXT_PUBLIC_SITE_URL` na Vercel (usado no sitemap e no preview de link).
- **Imagens de prévia (WhatsApp/LinkedIn)**: `public/og/*.jpg`, uma por página e idioma, geradas por `node --experimental-strip-types --no-warnings scripts/og-images.mjs` (precisa do Chromium do Playwright). Rodar de novo ao mudar textos ou fotos. São JPG fixos de ~50 KB porque o WhatsApp ignora imagem sem extensão ou acima de ~300 KB.
- **Textos de interface PT/EN**: `src/i18n/dictionaries.ts`
- **Mensagem do WhatsApp**: `src/lib/order.ts` (`buildMessage`)
- **Tokens de marca**: `src/app/globals.css` (`@theme`)
- **Logo**: `public/brand/emblem.svg` e `wordmark.svg` (vetorizados das pranchetas; usados via máscara CSS, herdam `currentColor`)

## Publicar equipe e frota no site

Na aba **Site** do painel, marque os agentes e veículos "no site". O site (Vercel) lê do Supabase no servidor (`src/lib/content.ts`, papel `anon`, revalidação de 60 s), então a mudança aparece em até 1 minuto, sem deploy. O `anon` só enxerga linhas publicadas e ativas e só as colunas públicas: placa, telefone, documento e CNH nunca saem do painel. Fotos de agentes e veículos ficam no bucket público `photos` (Storage). A CNH fica na tabela `agents`, nunca no bucket.

Sem as variáveis do Supabase (build do GitHub Pages), o site usa só o conteúdo local e a Equipe/Frota ficam sem agentes e veículos.

## Painel admin (`/admin`)

Início, Propostas (orçamento numerado por ano, itens com catálogo rápido, desconto, validade, condições; documento A4 para PDF, envio pelo WhatsApp; aceita vira serviço agendado), Serviços (com equipe, veículos, custos e lucro; em orçamento gera proposta), Clientes (com histórico e propostas), Parceiros, Agentes, Veículos (com foto, lugares, blindagem e descrição pra Frota), Financeiro (resumo mensal + lançamentos avulsos) e Site (publicação de Equipe e Frota).

Os dados ficam no Supabase. O login é o Supabase Auth (e-mail e senha do Gabriel, criado à mão em Authentication → Users; o cadastro público está desligado). `src/lib/admin/store.ts` é o repositório (`repo.*` e `useTable`), `auth.ts` faz login/sessão e `storage.ts` envia fotos. Os tipos em `src/lib/admin/types.ts` espelham as tabelas (camelCase ↔ snake_case); `Job.agentIds`/`vehicleIds` viram `job_agents`/`job_vehicles` e os itens da proposta, `proposal_items`. O cálculo de `src/lib/admin/finance.ts` é o mesmo da view `monthly_summary`. Falha ao gravar aparece como aviso no canto da tela (`AdminShell`).

Em produção, `/admin` só abre com `ADMIN_ENABLED=true` (trava no `src/middleware.ts`).

## Supabase

Variáveis (Vercel e `.env.local`): `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (chave publishable, pública) e `ADMIN_ENABLED=true`.

- `supabase/migrations/0001` a `0005`: schema (conteúdo, agentes, frota, clientes, parceiros, serviços com custos, lançamentos, propostas, view `monthly_summary`), RLS e bucket `photos`. Rodar em ordem no SQL Editor. Os catálogos `service_types` e `vehicle_categories` (espelho de `src/data/content.ts`) foram carregados direto no projeto do cliente e não estão nas migrações: num projeto novo, popular essas duas tabelas à parte.
- RLS: `anon` lê só linhas publicadas e ativas; usuário autenticado (Gabriel) lê e escreve tudo.
- ⚠️ O papel `anon` só tem SELECT em colunas públicas de `agents` e `vehicles`: a consulta precisa listar as colunas (não usar `select *`).
