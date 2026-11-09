-- Proposta com dias não contínuos e traduções digitadas para o documento em inglês
alter table proposals add column if not exists days text[] not null default '{}';
alter table proposals add column if not exists en jsonb not null default '{}'::jsonb;

-- Catálogo de itens: "Mono" no lugar de "monolíngue", como o Gabriel pediu
update settings set proposal = replace(proposal::text, 'monolíngue', 'mono')::jsonb where proposal::text like '%monolíngue%';
