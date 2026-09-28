# Dias Protection — site + configurador

Next.js 15 · React 19 · Tailwind v4 · Framer Motion · TypeScript. Supabase entra na Fase B.

```bash
npm run dev   # http://localhost:3000 → redireciona pra /pt ou /en
```

## Rotas (todas em /pt e /en)

| Rota | O que é |
|---|---|
| `/` | Home: hero, credenciais, serviços, como funciona, fundador, CTA |
| `/servicos` e `/servicos/[slug]` | Lista e página de cada serviço (botão abre o pedido já preenchido) |
| `/sobre` | Trajetória, certificações e reconhecimentos do Gabriel |
| `/equipe` | Fundador + agentes (vêm do painel na Fase B) + critérios de seleção |
| `/frota` | Categorias de veículo |
| `/solicitar` | Configurador → WhatsApp (`?servico=slug` pré-seleciona) |
| `/cartao` | Cartão de visita digital |
| `/contato.vcf` | Download do contato (gerado no build) |
| `/admin` | Painel do Gabriel (só PT, fora do índice dos buscadores) |

## GitHub Pages

A cada push na `main`, `.github/workflows/pages.yml` gera o export estático (`GITHUB_PAGES=true`, basePath `/dias-protection`) e publica em https://kalebnobre7-bit.github.io/dias-protection/. Sem middleware ali: a raiz usa `scripts/pages-index.html` pra escolher o idioma. O build normal (Vercel) não muda.

## Onde mexer

- **Conteúdo** (empresa, trajetória, serviços, frota, agentes): `src/data/content.ts`. Itens com ⚠️ aguardam confirmação do Gabriel. Clientes famosos só aparecem com `showNotableClients: true`.
- **Imagens**: `public/images/` (geradas por IA; originais em `docs/imagens-ia/`). `docs/` fica fora do git (tem dados pessoais).
- **Domínio**: definir `NEXT_PUBLIC_SITE_URL` na Vercel (usado no sitemap e no preview de link).
- **Textos de interface PT/EN**: `src/i18n/dictionaries.ts`
- **Mensagem do WhatsApp**: `src/lib/order.ts` (`buildMessage`)
- **Tokens de marca**: `src/app/globals.css` (`@theme`)
- **Logo**: `public/brand/emblem.svg` e `wordmark.svg` (vetorizados das pranchetas; usados via máscara CSS, herdam `currentColor`)

## Painel admin (`/admin`)

Início, Serviços (com equipe, veículos, custos e lucro), Clientes (com histórico), Parceiros, Agentes, Veículos e Financeiro (resumo mensal + lançamentos avulsos).

**Enquanto o Supabase não entra:** tudo é client-side e grava no `localStorage` do navegador (`src/lib/admin/store.ts`). Os dados ficam só naquele navegador, e o login é de demonstração (credenciais em `src/lib/admin/seed.ts`, sem segurança real). Vem com dados fictícios de exemplo; "Zerar dados de exemplo" no menu apaga tudo.

**Ao conectar o Supabase:** trocar só `store.ts` (as funções `repo.*` já são assíncronas) e `auth.ts` (Supabase Auth). Tipos em `src/lib/admin/types.ts` espelham as tabelas; `Job.agentIds`/`vehicleIds` viram `job_agents`/`job_vehicles`. O cálculo de `src/lib/admin/finance.ts` é o mesmo da view `monthly_summary`.

## Fase B — Supabase

- `supabase/migrations/0001_init.sql`: schema completo (conteúdo, agentes, frota, clientes, parceiros, serviços com custos, lançamentos, view `monthly_summary`), RLS e bucket `photos`. Validado num Postgres 16 local.
- Trocar `getSiteContent()` em `src/lib/content.ts` pra ler do Supabase. Os tipos em `src/lib/types.ts` já espelham as tabelas (`name` ↔ `name_pt`/`name_en`).
- ⚠️ O papel `anon` só tem SELECT em colunas públicas de `agents`: a consulta precisa listar as colunas (não usar `select *`).
