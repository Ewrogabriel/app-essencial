-- Cleanup script: Delete all agendamentos, enrollments, and weekly_schedules
-- This will remove all appointment and enrollment data

-- Delete in correct order (respecting foreign key constraints)
DELETE FROM solicitacoes_remarcacao WHERE agendamento_id IS NOT NULL;
DELETE FROM commissions WHERE agendamento_id IS NOT NULL;
DELETE FROM agendamentos;
DELETE FROM weekly_schedules;
DELETE FROM enrollments;
