-- Transporte: 16 categorias (lista do Gabriel, 10/2026). Os ids antigos continuam, só mudam nome e ordem.
insert into vehicle_categories (id, name_pt, name_en, description_pt, description_en, capacity, armored, image_url, sort_order) values
  ('sedan', 'Sedan convencional', 'Conventional sedan', 'Discreto, para agendas urbanas.', 'Discreet, for city schedules.', 3, false, '/images/fleet/sedan.webp', 1),
  ('sedan-blindado', 'Sedan blindado', 'Armored sedan', 'Discrição com blindagem para a cidade.', 'Armored discretion for city schedules.', 3, true, '/images/fleet/sedan-blindado.webp', 2),
  ('sedan-luxo', 'Sedan de luxo convencional', 'Conventional luxury sedan', 'Conforto executivo para agendas de alto padrão.', 'Executive comfort for high-end schedules.', 3, false, '/images/fleet/sedan.webp', 3),
  ('sedan-luxo-blindado', 'Sedan de luxo blindado', 'Armored luxury sedan', 'Alto padrão com blindagem.', 'High-end comfort, armored.', 3, true, '/images/fleet/sedan-blindado.webp', 4),
  ('suv-convencional', 'SUV convencional', 'Conventional SUV', 'Mais espaço para pessoas e bagagem.', 'More room for people and luggage.', 4, false, '/images/fleet/suv.webp', 5),
  ('suv-blindado', 'SUV blindado', 'Armored SUV', 'Blindagem para deslocamentos sensíveis.', 'Armored for sensitive journeys.', 4, true, '/images/fleet/suv-blindado.webp', 6),
  ('suv', 'SUV de luxo convencional', 'Conventional luxury SUV', 'Mais espaço, conforto e bagagem.', 'More room, comfort and luggage space.', 4, false, '/images/fleet/suv.webp', 7),
  ('suv-luxo-blindado', 'SUV de luxo blindado', 'Armored luxury SUV', 'Conforto de alto padrão com blindagem.', 'High-end comfort, armored.', 4, true, '/images/fleet/suv-blindado.webp', 8),
  ('minivan', 'Minivan convencional', 'Conventional minivan', 'Pequenos grupos e famílias.', 'Small groups and families.', 6, false, '/images/fleet/van.webp', 9),
  ('minivan-blindada', 'Minivan blindada', 'Armored minivan', 'Pequenos grupos com blindagem.', 'Small groups, armored.', 6, true, '/images/fleet/van.webp', 10),
  ('van', 'Van convencional', 'Conventional van', 'Grupos e equipes maiores.', 'Larger groups and crews.', 15, false, '/images/fleet/jet-van.webp', 11),
  ('van-blindada', 'Van blindada', 'Armored van', 'Grupos maiores com blindagem.', 'Larger groups, armored.', 15, true, '/images/fleet/jet-van.webp', 12),
  ('jet-van', 'Jet van convencional', 'Conventional Jet Van', 'Comitivas com conforto de primeira classe.', 'Delegations with first-class comfort.', 10, false, '/images/fleet/jet-van.webp', 13),
  ('jet-van-blindada', 'Jet van blindada', 'Armored Jet Van', 'Comitivas com conforto e blindagem.', 'Delegations with comfort and armor.', 10, true, '/images/fleet/jet-van.webp', 14),
  ('helicoptero', 'Helicóptero', 'Helicopter', 'Deslocamento aéreo rápido na cidade e região.', 'Fast air transfers around the city and region.', 4, false, null, 15),
  ('aeronave', 'Aeronave', 'Aircraft', 'Voos executivos fretados.', 'Chartered executive flights.', 8, false, null, 16)
on conflict (id) do update set
  name_pt = excluded.name_pt, name_en = excluded.name_en,
  description_pt = excluded.description_pt, description_en = excluded.description_en,
  capacity = excluded.capacity, armored = excluded.armored,
  image_url = excluded.image_url, sort_order = excluded.sort_order;

-- Calculadora de preço da proposta (custos, margem, impostos). Interna: não vai para o documento.
alter table proposals add column if not exists pricing jsonb;
