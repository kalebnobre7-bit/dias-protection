-- Proposta como link: o cliente abre a proposta comercial pelo link (sem PDF) e aceita digitando o nome.
-- O mesmo share_links serve para serviço (credenciamento) ou proposta; cada link aponta para um dos dois.
alter table share_links add column if not exists proposal_id uuid references proposals (id) on delete cascade;
alter table share_links alter column job_id drop not null;
alter table share_links drop constraint if exists share_links_target;
alter table share_links add constraint share_links_target check (num_nonnulls(job_id, proposal_id) = 1);
create index if not exists share_links_proposal_idx on share_links (proposal_id);

alter table proposals add column if not exists accepted_name text;
alter table proposals add column if not exists accepted_at timestamptz;

-- Credenciamento: agora ignora links de proposta (antes todo link tinha serviço)
create or replace function credential_share(p_token uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  l share_links;
  j jobs;
begin
  select * into l from share_links where id = p_token;
  if not found or l.job_id is null or l.revoked or l.expires_at < (now() at time zone 'America/Sao_Paulo')::date then
    return null;
  end if;
  update share_links set views = views + 1, last_view_at = now() where id = l.id;
  select * into j from jobs where id = l.job_id;
  return jsonb_build_object(
    'expiresAt', l.expires_at,
    'startsAt', j.starts_at,
    'endsAt', j.ends_at,
    'days', j.days,
    'team', coalesce((
      select jsonb_agg(jsonb_build_object(
        'name', a.name, 'role', a.role_pt, 'kind', a.kind, 'photoUrl', a.photo_url,
        'documentId', a.document_id, 'cnhUrl', case when a.kind = 'driver' then a.cnh_url end
      ) order by a.kind, a.name)
      from job_agents ja join agents a on a.id = ja.agent_id
      where ja.job_id = j.id
    ), '[]'::jsonb),
    'vehicles', coalesce((
      select jsonb_agg(jsonb_build_object('model', v.model, 'plate', v.plate, 'color', v.color, 'photoUrl', v.photo_url) order by v.model)
      from job_vehicles jv join vehicles v on v.id = jv.vehicle_id
      where jv.job_id = j.id
    ), '[]'::jsonb)
  );
end $$;

-- Link de proposta válido (não revogado e dentro do prazo) → a proposta; senão null
create or replace function proposal_link(p_token uuid) returns share_links
language sql stable security definer set search_path = public as $$
  select * from share_links
  where id = p_token and proposal_id is not null and not revoked
    and expires_at >= (now() at time zone 'America/Sao_Paulo')::date;
$$;
revoke all on function proposal_link(uuid) from public, anon, authenticated;

-- Só o que a proposta comercial mostra: sem planilha de custos, margem, notas internas,
-- contato do cliente, contato/documento da equipe nem placa dos veículos. Conta o acesso.
create or replace function proposal_share(p_token uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  l share_links;
  p proposals;
begin
  l := proposal_link(p_token);
  if l.id is null then
    return null;
  end if;
  update share_links set views = views + 1, last_view_at = now() where id = l.id;
  select * into p from proposals where id = l.proposal_id;
  return jsonb_build_object(
    'expiresAt', l.expires_at,
    'proposal', jsonb_build_object(
      'number', p.number, 'title', p.title, 'status', p.status, 'issuedAt', p.issued_at, 'validUntil', p.valid_until,
      'serviceIds', p.service_ids, 'summary', p.summary, 'period', p.period, 'startDate', p.start_date,
      'endDate', p.end_date, 'days', p.days, 'en', p.en, 'nature', p.nature, 'guards', p.guards,
      'location', p.location, 'discount', p.discount, 'paymentTerms', p.payment_terms, 'terms', p.terms,
      'acceptedName', p.accepted_name, 'acceptedAt', p.accepted_at,
      'items', coalesce((
        select jsonb_agg(jsonb_build_object('id', i.id, 'description', i.description, 'detail', i.detail, 'qty', i.qty, 'unit', i.unit, 'unitPrice', i.unit_price) order by i.sort_order)
        from proposal_items i where i.proposal_id = p.id
      ), '[]'::jsonb)
    ),
    -- Da planilha, só a categoria de cada item (agrupa a tabela de investimento como no PDF)
    'categories', case when p.pricing is null then null else coalesce((
      select jsonb_object_agg(c ->> 'id', c ->> 'category') from jsonb_array_elements(p.pricing -> 'costs') c
    ), '{}'::jsonb) end,
    'client', (select jsonb_build_object('name', c.name, 'company', c.company, 'language', c.language) from clients c where c.id = p.client_id),
    'team', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', a.id, 'name', a.name, 'rolePt', a.role_pt, 'roleEn', a.role_en, 'bioPt', a.bio_pt, 'bioEn', a.bio_en,
        'languages', a.languages, 'yearsExperience', a.years_experience, 'photoUrl', a.photo_url
      ) order by u.ord)
      from unnest(p.agent_ids) with ordinality u(id, ord) join agents a on a.id = u.id
    ), '[]'::jsonb),
    'fleet', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id', v.id, 'model', v.model, 'categoryId', v.category_id, 'year', v.year, 'color', v.color,
        'capacity', v.capacity, 'armored', v.armored, 'descriptionPt', v.description_pt, 'descriptionEn', v.description_en,
        'photoUrl', v.photo_url, 'photos', v.photos
      ) order by u.ord)
      from unnest(p.vehicle_ids) with ordinality u(id, ord) join vehicles v on v.id = u.id
    ), '[]'::jsonb),
    'company', (select s.company from settings s where s.id = 'app')
  );
end $$;

-- Aceite pelo link: só proposta em rascunho ou enviada, uma vez. Já aceita → devolve o aceite que existe.
-- Link inválido, nome curto ou proposta recusada/vencida → null.
create or replace function accept_proposal(p_token uuid, p_name text) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  l share_links;
  p proposals;
  n text := left(btrim(coalesce(p_name, '')), 120);
begin
  l := proposal_link(p_token);
  if l.id is null or length(n) < 3 then
    return null;
  end if;
  select * into p from proposals where id = l.proposal_id for update;
  if p.accepted_at is not null then
    return jsonb_build_object('acceptedName', p.accepted_name, 'acceptedAt', p.accepted_at);
  end if;
  if p.status not in ('draft', 'sent') then
    return null;
  end if;
  update proposals set status = 'accepted', accepted_name = n, accepted_at = now() where id = p.id
  returning accepted_name, accepted_at into p.accepted_name, p.accepted_at;
  return jsonb_build_object('acceptedName', p.accepted_name, 'acceptedAt', p.accepted_at);
end $$;

revoke all on function proposal_share(uuid) from public;
revoke all on function accept_proposal(uuid, text) from public;
grant execute on function proposal_share(uuid) to anon, authenticated;
grant execute on function accept_proposal(uuid, text) to anon, authenticated;
