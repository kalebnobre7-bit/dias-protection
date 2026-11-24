-- Serviços: horários reais de cada dia ([{ date, group, start, end }]); group "all" ou agent/driver/vehicle
alter table jobs add column if not exists shifts jsonb not null default '[]';

-- Custos do serviço: data-limite de pagamento e linhas de hora extra geradas pelo cálculo
alter table job_costs add column if not exists due_date date;
alter table job_costs add column if not exists overtime_hours numeric(6,2) not null default 0;
alter table job_costs add column if not exists vehicle_id uuid references vehicles(id) on delete set null;
