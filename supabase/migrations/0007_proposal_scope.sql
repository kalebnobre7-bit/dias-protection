-- Escopo estruturado da proposta: período (calendário), natureza e seguranças.
-- Datas em texto "YYYY-MM-DD" ('' = não escolhida); natureza: 'daily', 'transfer' ou ''.
alter table proposals
  add column start_date text not null default '',
  add column end_date   text not null default '',
  add column nature     text not null default '',
  add column guards     integer not null default 0;
