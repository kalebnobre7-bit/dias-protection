-- "Proposta aceita → serviço agendado" cria o serviço antes de o Gabriel marcar a data.
-- Sem data o serviço não entra em nenhum mês (nem na view monthly_summary), igual ao painel.
alter table jobs alter column starts_at drop not null;
