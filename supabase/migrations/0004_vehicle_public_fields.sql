-- Veículos publicados na página Frota (com foto e detalhes; a placa nunca é pública)
alter table vehicles
  add column published      boolean not null default false,
  add column photo_url      text,
  add column description_pt text not null default '',
  add column description_en text not null default '',
  add column capacity       int check (capacity is null or capacity > 0),
  add column armored        boolean not null default false;

-- O site (anon) só lê colunas públicas dos veículos publicados; listar as colunas na consulta
create policy "vehicles_public_read" on vehicles
  for select to anon
  using (published and active);
revoke select on vehicles from anon;
grant select (id, category_id, model, color, year, published, photo_url, description_pt, description_en, capacity, armored) on vehicles to anon;
