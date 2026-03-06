-- Clear all agendamentos and related data
-- This will delete all appointments and their related records

DELETE FROM solicitacoes_remarcacao;
DELETE FROM commissions WHERE agendamento_id IS NOT NULL;
DELETE FROM agendamentos;
