-- Categorias personalizáveis dos lançamentos avulsos (o lançamento guarda o nome em transactions.category).
-- kind: 'expense' (saída), 'income' (entrada) ou 'both'.
create table finance_categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  kind       text not null default 'expense' check (kind in ('expense', 'income', 'both')),
  created_at timestamptz not null default now()
);
create unique index finance_categories_name on finance_categories (lower(name));

alter table finance_categories enable row level security;
create policy "finance_categories_owner" on finance_categories for all to authenticated using (true) with check (true);

-- Padrões
insert into finance_categories (name, kind) values
  ('Seguro', 'expense'), ('Equipamento', 'expense'), ('Contador', 'expense'),
  ('Uniforme', 'expense'), ('Impostos', 'expense'), ('Manutenção', 'expense'), ('Reembolso', 'income');

-- Lançamentos antigos (texto livre): alinha a grafia com o padrão e cria as que faltam
update transactions t set category = c.name from finance_categories c where lower(trim(t.category)) = lower(c.name) and t.category <> c.name;
insert into finance_categories (name, kind)
  select trim(category), case when count(distinct kind) > 1 then 'both' else min(kind) end
  from transactions where trim(category) <> '' group by trim(category)
  on conflict do nothing;
