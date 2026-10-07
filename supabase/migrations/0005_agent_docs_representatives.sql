-- Currículo e CNH do agente (internos: nunca vão para o site)
alter table agents
  add column career  text not null default '',
  add column cnh_url text;

-- Representantes da empresa cliente: [{ id, name, role, contact }]
alter table clients
  add column representatives jsonb not null default '[]'::jsonb;

-- Equipe e veículos apresentados no documento da proposta
alter table proposals
  add column agent_ids   uuid[] not null default '{}',
  add column vehicle_ids uuid[] not null default '{}';
