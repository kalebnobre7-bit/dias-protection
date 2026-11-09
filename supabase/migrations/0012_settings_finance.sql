-- Saldo inicial do Capital em caixa (Financeiro): faltou na 0011
alter table settings add column if not exists finance jsonb not null default '{}'::jsonb;
