# Dias Protection — site + configurador

Next.js 15 · React 19 · Tailwind v4 · Framer Motion · TypeScript · Supabase (painel).

```bash
cp .env.example .env.local   # URL e anon key do projeto Supabase (só o painel precisa)
npm run dev                  # http://localhost:3000 → redireciona pra /pt ou /en
npm run check                # lint + typecheck + prettier + testes (o que o CI roda em cada PR)
```

## Qualidade

| Comando | O que faz |
|---|---|
| `npm run lint` / `lint:fix` | ESLint (`next/core-web-vitals` + `next/typescript`, config em `eslint.config.mjs`) |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run format` / `format:check` | Prettier (`.prettierrc`: 140 colunas, aspas duplas, vírgula final; Markdown fica de fora) |
| `npm test` / `test:watch` | Vitest (`vitest.config.mts`), só regras puras: `src/lib/order.test.ts` (mensagem do WhatsApp), `src/lib/admin/finance.test.ts` (resumo mensal), `src/lib/admin/proposals.test.ts` (numeração e totais), `src/lib/admin/rows.test.ts` (painel ↔ Postgres) e `src/lib/admin/migrate.test.ts` (importação) |

`.github/workflows/ci.yml` roda tudo isso e o export estático em cada PR e em push na `main`. O deploy do Pages (`pages.yml`) só ganhou as variáveis do Supabase.

## Rotas (todas em /pt e /en)

| Rota | O que é |
|---|---|
| `/` | Home: hero, credenciais, serviços, como funciona, fundador, CTA |
| `/servicos` e `/servicos/[slug]` | Lista e página de cada serviço (botão abre o pedido já preenchido) |
| `/sobre` | Trajetória, certificações e reconhecimentos do Gabriel |
| `/equipe` | Fundador + agentes (vêm do painel na Fase B) + critérios de seleção |
| `/frota` | Categorias de veículo |
| `/solicitar` | Configurador em passos (um por tela, trilha de progresso) → WhatsApp (`?servico=slug` pré-seleciona). Vários serviços por pedido (transporte vira transfer ou diária), armados x desarmados, idioma do motorista e dos agentes, período estimado, viagem intermunicipal, evento, pessoa pública/PPE e "quero sugestão" |
| `/cartao` | Cartão de visita digital: cartão que vira (marca / contato + QR), compartilhar e salvar contato |
| `/contato.vcf` | Download do contato com foto (gerado no build) |
| `/admin` | Painel do Gabriel (só PT, fora do índice dos buscadores). Inclui Propostas: orçamento numerado com itens e documento A4 em `/admin/propostas/documento?id=…` |

## GitHub Pages

A cada push na `main`, `.github/workflows/pages.yml` gera o export estático (`GITHUB_PAGES=true`, basePath `/dias-protection`) e publica em https://kalebnobre7-bit.github.io/dias-protection/. Sem middleware ali: a raiz usa `scripts/pages-index.html` pra escolher o idioma. O build normal (Vercel) não muda. O painel funciona nos dois (é todo client-side), desde que `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` existam no build: na Vercel em Environment Variables, no GitHub em Settings → Secrets and variables → Actions → **Variables**.

## Onde mexer

- **Conteúdo** (empresa, trajetória, serviços, frota): `src/data/content.ts`. Itens com ⚠️ aguardam confirmação do Gabriel. Clientes famosos só aparecem com `showNotableClients: true`. Serviços e categorias também vivem no banco (`service_types`, `vehicle_categories`) porque o painel referencia os slugs: ao mudar o catálogo, gere a migration de novo com `node --experimental-strip-types --no-warnings scripts/catalog-sql.mjs`.
- **Imagens**: `public/images/` (geradas por IA; originais em `docs/imagens-ia/`). `docs/` fica fora do git (tem dados pessoais).
- **Domínio**: definir `NEXT_PUBLIC_SITE_URL` na Vercel (usado no sitemap e no preview de link).
- **Imagens de prévia (WhatsApp/LinkedIn)**: `public/og/*.jpg`, uma por página e idioma, geradas por `node --experimental-strip-types --no-warnings scripts/og-images.mjs` (precisa do Chromium do Playwright). Rodar de novo ao mudar textos ou fotos. São JPG fixos de ~50 KB porque o WhatsApp ignora imagem sem extensão ou acima de ~300 KB.
- **Textos de interface PT/EN**: `src/i18n/dictionaries.ts`
- **Mensagem do WhatsApp**: `src/lib/order.ts` (`buildMessage`)
- **Tokens de marca**: `src/app/globals.css` (`@theme`)
- **Logo**: `public/brand/emblem.svg` e `wordmark.svg` (vetorizados das pranchetas; usados via máscara CSS, herdam `currentColor`)

## Publicar equipe e frota no site

O site ainda é estático, então o que aparece em **Equipe** e **Frota** passa pela aba **Site** do painel: marque os agentes e veículos "no site" e clique em **Publicar no site**. O painel grava `src/data/published.json` no repositório pela API do GitHub (token fine-grained com *Contents: Read and write*, salvo só naquele navegador) e o GitHub Pages republica em ~2 min. O site lê esse JSON no build (`src/lib/content.ts`); as fotos agora são links do Supabase Storage (bucket `photos`), não mais data URL. Placa, telefone e documento nunca saem do painel. A Fase 3 troca isso por leitura direta do Supabase.

## Painel admin (`/admin`)

Início, Propostas (orçamento numerado por ano, itens com catálogo rápido, desconto, validade, condições; documento A4 para PDF, envio pelo WhatsApp; aceita vira serviço agendado), Serviços (com equipe, veículos, custos e lucro; em orçamento gera proposta), Clientes (com histórico e propostas), Parceiros, Agentes, Veículos (com foto, lugares, blindagem e descrição pra Frota), Financeiro (resumo mensal + lançamentos avulsos), Site (publicação de Equipe e Frota) e Dados (backup, importação, migração do painel antigo, apagar tudo).

Tudo grava no Supabase: Postgres com RLS (só usuário autenticado lê e escreve; o público só vê colunas publicadas), Supabase Auth com e-mail e senha (sessão persistente no navegador) e Storage para fotos. O painel continua client-side, por isso roda no export estático do GitHub Pages igual à Vercel.

- `src/lib/admin/store.ts`: repositório (`repo.*` e `useTable`) sobre o Supabase, com cache por tabela invalidado a cada gravação e recarga quando a aba volta ao foco. Erros de rede ou permissão aparecem num aviso no rodapé do painel.
- `src/lib/admin/rows.ts`: tradução camelCase ↔ snake_case (`""` ↔ `null`, horário local ↔ `timestamptz`, `numeric` ↔ número). `Job.agentIds`/`vehicleIds` viram `job_agents`/`job_vehicles`; `Proposal.items` vira `proposal_items`.
- `src/lib/admin/auth.ts`: `signIn`, `signOut`, `useSession` (Supabase Auth).
- `src/lib/admin/photos.ts`: upload redimensionado (480px) para o bucket `photos`; URL pública fica no registro.
- `src/lib/admin/finance.ts` faz o mesmo cálculo da view `monthly_summary`.

## Supabase: configurar do zero

1. Crie o projeto em https://supabase.com e rode, em ordem, os arquivos de `supabase/migrations/` no SQL Editor (ou `supabase db push` com a CLI): `0001_init` (schema, RLS, bucket), `0002` a `0004` (imagem de categoria, propostas, campos públicos de veículo), `0005_catalog` (serviços e categorias do site; gerado de `content.ts`) e `0006` (`jobs.starts_at` anulável, porque "proposta aceita → serviço" nasce sem data). Validados num Postgres 16 local. Se precisar mudar o schema, crie uma migration nova em vez de editar as antigas.
2. Em Authentication → Users, crie o usuário do Gabriel (e-mail + senha). Qualquer usuário autenticado é admin; não deixe cadastro aberto (Authentication → Providers → Email → desligue *Allow new users to sign up*).
3. Copie Project URL e anon key (Settings → API) para `.env.local`, para a Vercel e para as Variables do repositório no GitHub. A anon key é pública por desenho: o RLS é quem protege.
4. ⚠️ O papel `anon` só tem SELECT nas colunas públicas de `agents` e `vehicles`: qualquer consulta do site precisa listar as colunas (nunca `select *`). As listas estão em `src/lib/admin/rows.ts`.

## Migrar o que já estava no painel antigo

O painel da Fase A gravava no `localStorage` do navegador (chave `dias-admin:db:v1`). Abra o painel novo **no mesmo navegador**, faça login e vá em **Dados**: ele detecta os dados antigos, mostra a contagem e tem os botões **Importar no Supabase** (ids de exemplo viram UUID, fotos em data URL sobem para o Storage, referências são conferidas) e **Baixar JSON** (cópia de segurança). Depois, **Apagar cópia antiga**.

Pela linha de comando, com um JSON exportado: `SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… node --experimental-strip-types --no-warnings scripts/import-json.mjs dados.json` (mesmo código da aba Dados; a service role key ignora o RLS e nunca vai para o navegador). A importação usa upsert: rodar de novo atualiza em vez de duplicar.

## Fase 3 — publicação sem token no navegador

Trocar `getSiteContent()` em `src/lib/content.ts` pra ler Equipe e Frota do Supabase e decidir o deploy (Vercel com ISR, ou Pages com rebuild por webhook). Os tipos em `src/lib/types.ts` já espelham as tabelas (`name` ↔ `name_pt`/`name_en`).
