-- Configurações do painel (uma linha, id 'app'): dados da empresa nos documentos e padrões das propostas.
-- Campo ausente cai no padrão do código (src/lib/admin/settings.ts).
create table settings (
  id         text primary key default 'app',
  company    jsonb not null default '{}',
  proposal   jsonb not null default '{}',
  created_at timestamptz not null default now()
);

alter table settings enable row level security;
create policy "settings_owner" on settings for all to authenticated using (true) with check (true);
