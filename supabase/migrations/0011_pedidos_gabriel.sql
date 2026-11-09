-- Pedidos do Gabriel (30/10/2026): serviço com vários tipos e dias avulsos, cadastro de motoristas,
-- solicitações do site virando proposta, categorias de custo e catálogo novos.

-- Serviço: mais de um tipo (service_type_id segue sendo o primeiro, usado nos relatórios) e dias não contínuos
alter table jobs add column if not exists service_type_ids text[] not null default '{}';
alter table jobs add column if not exists days text[] not null default '{}'; -- 'YYYY-MM-DD'
update jobs set service_type_ids = array[service_type_id] where service_type_id is not null and service_type_ids = '{}';

-- Motoristas usam a mesma tabela dos agentes
alter table agents add column if not exists kind text not null default 'agent' check (kind in ('agent', 'driver'));

-- Pedidos feitos em /solicitar: o site só insere, quem lê é o painel
create table if not exists site_requests (
  id          uuid primary key,
  payload     jsonb not null,
  status      text not null default 'new' check (status in ('new', 'converted', 'archived')),
  proposal_id uuid references proposals (id) on delete set null,
  created_at  timestamptz not null default now()
);

alter table site_requests enable row level security;
drop policy if exists "site requests insert" on site_requests;
create policy "site requests insert" on site_requests for insert to anon
  with check (status = 'new' and proposal_id is null and pg_column_size(payload) < 16384);
drop policy if exists "admin all" on site_requests;
create policy "admin all" on site_requests for all to authenticated using (true) with check (true);
revoke all on site_requests from anon;
grant insert on site_requests to anon;

-- Categorias de custo pedidas: entram depois das que já existem, sem repetir
update settings s
set costs = jsonb_set(s.costs, '{categories}', (
  select jsonb_agg(c order by ord)
  from (
    select c, min(ord) as ord
    from (
      select value as c, ordinality as ord
      from jsonb_array_elements(s.costs -> 'categories') with ordinality
      union all
      select to_jsonb(name), 1000 + ordinality
      from unnest(array['Motorista', 'Comissão', 'Aluguel Veículo', 'Transporte', 'Amenidades']) with ordinality as n (name, ordinality)
    ) todas
    group by c
  ) unicas
))
where s.costs ? 'categories';

-- Catálogo da proposta na lista pedida
update settings
set proposal = jsonb_set(proposal, '{presets}', '[
  {"description": "Agente monolíngue desarmado", "detail": "Diária de até 12h", "unit": "diária", "unitPrice": 0},
  {"description": "Agente monolíngue armado", "detail": "Diária de até 12h", "unit": "diária", "unitPrice": 0},
  {"description": "Agente bilíngue desarmado", "detail": "Diária de até 12h", "unit": "diária", "unitPrice": 0},
  {"description": "Agente bilíngue armado", "detail": "Diária de até 12h", "unit": "diária", "unitPrice": 0},
  {"description": "Motorista monolíngue", "detail": "Diária de até 12h", "unit": "diária", "unitPrice": 0},
  {"description": "Motorista bilíngue", "detail": "Diária de até 12h", "unit": "diária", "unitPrice": 0},
  {"description": "Transfer monolíngue", "detail": "Deslocamento ponto a ponto, com motorista", "unit": "transfer", "unitPrice": 0},
  {"description": "Transfer bilíngue", "detail": "Deslocamento ponto a ponto, com motorista", "unit": "transfer", "unitPrice": 0}
]'::jsonb)
where proposal ? 'presets';
