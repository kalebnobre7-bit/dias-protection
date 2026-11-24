-- Link de credenciamento: a portaria do evento/condomínio abre a equipe e os veículos do serviço
-- sem PDF solto (LGPD). O código do link é o id; vale até expires_at (inclusive) e pode ser revogado.
create table if not exists share_links (
  id           uuid primary key default gen_random_uuid(),
  job_id       uuid not null references jobs (id) on delete cascade,
  expires_at   date not null,
  revoked      boolean not null default false,
  views        integer not null default 0,
  last_view_at timestamptz,
  created_at   timestamptz not null default now()
);
create index if not exists share_links_job_idx on share_links (job_id);

alter table share_links enable row level security;
drop policy if exists "admin all" on share_links;
create policy "admin all" on share_links for all to authenticated using (true) with check (true);
revoke all on share_links from anon;

-- Único caminho público: com código válido devolve só o necessário para credenciar
-- (sem telefone; CNH só de motorista) e conta o acesso. Código inválido, vencido ou revogado → null.
create or replace function credential_share(p_token uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare
  l share_links;
  j jobs;
begin
  select * into l from share_links where id = p_token;
  if not found or l.revoked or l.expires_at < (now() at time zone 'America/Sao_Paulo')::date then
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

revoke all on function credential_share(uuid) from public;
grant execute on function credential_share(uuid) to anon, authenticated;
