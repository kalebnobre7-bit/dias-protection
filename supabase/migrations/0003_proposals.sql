-- Propostas comerciais / orçamentos (painel → documento A4)
create table proposals (
  id            uuid primary key default gen_random_uuid(),
  number        text not null unique,            -- "2026-001", sequencial por ano
  client_id     uuid references clients (id) on delete set null,
  job_id        uuid references jobs (id) on delete set null,
  title         text not null,
  status        text not null default 'draft' check (status in ('draft', 'sent', 'accepted', 'declined', 'expired')),
  issued_at     date not null default current_date,
  valid_until   date not null,
  service_ids   text[] not null default '{}',
  summary       text not null default '',
  period        text not null default '',
  location      text not null default '',
  discount      numeric(12, 2) not null default 0,
  payment_terms text not null default '',
  terms         text not null default '',
  notes         text not null default '',
  created_at    timestamptz not null default now()
);

create table proposal_items (
  id          uuid primary key default gen_random_uuid(),
  proposal_id uuid not null references proposals (id) on delete cascade,
  description text not null,
  detail      text not null default '',
  qty         numeric(10, 2) not null default 1,
  unit        text not null default 'un.',
  unit_price  numeric(12, 2) not null default 0,
  sort_order  int not null default 0
);

alter table proposals enable row level security;
alter table proposal_items enable row level security;
-- Só o dono do painel (authenticated) lê e escreve; nada é público
create policy "proposals_owner" on proposals for all to authenticated using (true) with check (true);
create policy "proposal_items_owner" on proposal_items for all to authenticated using (true) with check (true);
