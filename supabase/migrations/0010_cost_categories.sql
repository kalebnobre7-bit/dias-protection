-- Categorias de custo do serviço editáveis (Configurações). 'agent' e 'partner' continuam códigos fixos
-- (abrem a escolha do agente/parceiro); as demais passam a guardar o nome da categoria.
alter table job_costs drop constraint if exists job_costs_category_check;
alter table job_costs alter column category set default 'Outros';
alter table settings add column if not exists costs jsonb not null default '{}';

update job_costs set category = case category
  when 'fuel' then 'Combustível' when 'toll' then 'Pedágio' when 'food' then 'Alimentação' when 'other' then 'Outros'
  else category end
where category in ('fuel', 'toll', 'food', 'other');
