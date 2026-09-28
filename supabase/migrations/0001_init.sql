-- Dias Protection — schema inicial
-- Público (anon) só lê o que está publicado; qualquer usuário autenticado é admin
-- (só existe o login do Gabriel, criado manualmente no painel do Supabase).

create extension if not exists "pgcrypto";

-- ───────── Conteúdo do site ─────────

create table company_settings (
  id              smallint primary key default 1 check (id = 1), -- linha única
  legal_name      text not null,
  brand_name      text not null,
  founder_name    text not null,
  tagline         text not null default '',
  founder_photo   text,
  linkedin        text not null default '',
  founder_role_pt text not null default '',
  founder_role_en text not null default '',
  founder_bio_pt  text not null default '',
  founder_bio_en  text not null default '',
  about_pt        text not null default '',
  about_en        text not null default '',
  whatsapp        text not null,          -- só dígitos com DDI
  email           text not null default '',
  instagram       text not null default '',
  city            text not null default '',
  updated_at      timestamptz not null default now()
);

create table service_types (
  id             text primary key,        -- slug: usado em ?servico=
  name_pt        text not null,
  name_en        text not null,
  summary_pt     text not null default '',
  summary_en     text not null default '',
  description_pt text not null default '',
  description_en text not null default '',
  includes_pt    text[] not null default '{}',
  includes_en    text[] not null default '{}',
  ideal_for_pt   text not null default '',
  ideal_for_en   text not null default '',
  image_url      text,
  sort_order     int not null default 0,
  published      boolean not null default true,
  created_at     timestamptz not null default now()
);

create table vehicle_categories (
  id             text primary key,
  name_pt        text not null,
  name_en        text not null,
  description_pt text not null default '',
  description_en text not null default '',
  capacity       int not null default 4 check (capacity > 0),
  armored        boolean not null default false,
  sort_order     int not null default 0,
  published      boolean not null default true,
  created_at     timestamptz not null default now()
);

-- Perfil tipo currículo
create table agents (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  role_pt          text not null default '',
  role_en          text not null default '',
  bio_pt           text not null default '',
  bio_en           text not null default '',
  languages        text[] not null default '{}',
  years_experience int check (years_experience >= 0),
  certifications   text[] not null default '{}',
  photo_url        text,
  -- dados internos (não aparecem no site)
  phone            text,
  document_id      text,                  -- CPF / registro de vigilante
  notes            text,
  active           boolean not null default true,
  published        boolean not null default false,
  sort_order       int not null default 0,
  created_at       timestamptz not null default now()
);

-- Frota real (interna); o site mostra só as categorias
create table vehicles (
  id           uuid primary key default gen_random_uuid(),
  category_id  text references vehicle_categories (id) on delete set null,
  model        text not null,
  plate        text,
  color        text,
  year         int,
  owner        text not null default 'own' check (owner in ('own', 'partner')),
  partner_id   uuid,                      -- fk adicionada abaixo
  active       boolean not null default true,
  notes        text,
  created_at   timestamptz not null default now()
);

-- ───────── Operação ─────────

create table clients (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  company     text,
  phone       text,
  email       text,
  language    text check (language in ('pt', 'en', 'other')),
  notes       text,
  created_at  timestamptz not null default now()
);

create table partners (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  kind        text not null default 'supplier', -- hotel, locadora, fornecedor, freelancer…
  contact     text,
  phone       text,
  email       text,
  notes       text,
  created_at  timestamptz not null default now()
);

alter table vehicles
  add constraint vehicles_partner_fk foreign key (partner_id) references partners (id) on delete set null;

-- Serviço prestado: centro do histórico e do financeiro
create table jobs (
  id              uuid primary key default gen_random_uuid(),
  client_id       uuid references clients (id) on delete set null,
  service_type_id text references service_types (id) on delete set null,
  starts_at       timestamptz not null,
  ends_at         timestamptz,
  origin          text,
  destination     text,
  status          text not null default 'scheduled'
                  check (status in ('quote', 'scheduled', 'done', 'canceled')),
  price           numeric(12, 2) not null default 0,  -- valor cobrado
  payment_status  text not null default 'pending' check (payment_status in ('pending', 'paid')),
  paid_at         date,
  notes           text,
  created_at      timestamptz not null default now()
);

create table job_agents (
  job_id   uuid references jobs (id) on delete cascade,
  agent_id uuid references agents (id) on delete restrict,
  primary key (job_id, agent_id)
);

create table job_vehicles (
  job_id     uuid references jobs (id) on delete cascade,
  vehicle_id uuid references vehicles (id) on delete restrict,
  primary key (job_id, vehicle_id)
);

-- Custos do serviço (pagamento de agente, parceiro, combustível, pedágio…)
create table job_costs (
  id          uuid primary key default gen_random_uuid(),
  job_id      uuid not null references jobs (id) on delete cascade,
  description text not null,
  category    text not null default 'other'
              check (category in ('agent', 'partner', 'fuel', 'toll', 'food', 'other')),
  amount      numeric(12, 2) not null check (amount >= 0),
  agent_id    uuid references agents (id) on delete set null,
  partner_id  uuid references partners (id) on delete set null,
  paid        boolean not null default false,
  created_at  timestamptz not null default now()
);

-- Lançamentos avulsos (custos fixos, entradas fora de serviço)
create table transactions (
  id          uuid primary key default gen_random_uuid(),
  kind        text not null check (kind in ('income', 'expense')),
  description text not null,
  category    text not null default 'other',
  amount      numeric(12, 2) not null check (amount >= 0),
  date        date not null default current_date,
  paid        boolean not null default true,
  created_at  timestamptz not null default now()
);

create index jobs_starts_at_idx on jobs (starts_at desc);
create index jobs_client_idx on jobs (client_id);
create index job_costs_job_idx on job_costs (job_id);
create index transactions_date_idx on transactions (date desc);

-- Resumo financeiro por mês (receita de serviços, custos, avulsos, lucro)
create view monthly_summary with (security_invoker = true) as
with months as (
  select date_trunc('month', starts_at)::date as month, sum(price) as revenue,
         sum(price) filter (where payment_status = 'pending') as receivable
  from jobs where status in ('scheduled', 'done') group by 1
),
costs as (
  select date_trunc('month', j.starts_at)::date as month, sum(c.amount) as job_costs
  from job_costs c join jobs j on j.id = c.job_id where j.status in ('scheduled', 'done') group by 1
),
extra as (
  select date_trunc('month', date)::date as month,
         sum(amount) filter (where kind = 'income') as other_income,
         sum(amount) filter (where kind = 'expense') as other_expense
  from transactions group by 1
)
select m.month,
       coalesce(months.revenue, 0)       as revenue,
       coalesce(months.receivable, 0)    as receivable,
       coalesce(costs.job_costs, 0)      as job_costs,
       coalesce(extra.other_income, 0)   as other_income,
       coalesce(extra.other_expense, 0)  as other_expense,
       coalesce(months.revenue, 0) + coalesce(extra.other_income, 0)
         - coalesce(costs.job_costs, 0) - coalesce(extra.other_expense, 0) as profit
from (select month from months union select month from costs union select month from extra) m
left join months using (month)
left join costs using (month)
left join extra using (month)
order by m.month desc;

-- ───────── RLS ─────────

alter table company_settings   enable row level security;
alter table service_types      enable row level security;
alter table vehicle_categories enable row level security;
alter table agents             enable row level security;
alter table vehicles           enable row level security;
alter table clients            enable row level security;
alter table partners           enable row level security;
alter table jobs               enable row level security;
alter table job_agents         enable row level security;
alter table job_vehicles       enable row level security;
alter table job_costs          enable row level security;
alter table transactions       enable row level security;

-- Leitura pública só do conteúdo publicado
create policy "public read settings"   on company_settings   for select to anon using (true);
create policy "public read services"   on service_types      for select to anon using (published);
create policy "public read categories" on vehicle_categories for select to anon using (published);
create policy "public read agents"     on agents             for select to anon using (published and active);

-- Admin (qualquer usuário autenticado) faz tudo
do $$
declare t text;
begin
  foreach t in array array[
    'company_settings', 'service_types', 'vehicle_categories', 'agents', 'vehicles',
    'clients', 'partners', 'jobs', 'job_agents', 'job_vehicles', 'job_costs', 'transactions'
  ] loop
    execute format('create policy "admin all" on %I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- Colunas internas dos agentes não saem pro público
revoke select on agents from anon;
grant select (id, name, role_pt, role_en, bio_pt, bio_en, languages, years_experience,
              certifications, photo_url, sort_order, published, active) on agents to anon;

-- ───────── Storage: fotos ─────────

insert into storage.buckets (id, name, public) values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy "admin upload photos" on storage.objects
  for all to authenticated using (bucket_id = 'photos') with check (bucket_id = 'photos');
