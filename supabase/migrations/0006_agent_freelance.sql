-- Agente avulso (freelancer escalado num serviço). Nunca vai para o site.
alter table agents
  add column freelance boolean not null default false;
