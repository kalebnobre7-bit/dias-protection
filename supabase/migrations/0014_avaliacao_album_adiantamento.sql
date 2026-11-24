-- Equipe: favorito, nota de 1 a 5 e lista negra (não aparece na escala nem na proposta)
alter table agents add column if not exists favorite boolean not null default false;
alter table agents add column if not exists rating smallint check (rating between 1 and 5);
alter table agents add column if not exists blacklisted boolean not null default false;

-- Veículos: álbum de fotos além da capa (até 5), vai no PDF da proposta
alter table vehicles add column if not exists photos text[] not null default '{}';

-- Custos do serviço: adiantamento ao fornecedor antes de pagar o total
alter table job_costs add column if not exists advance numeric(12,2) not null default 0;
