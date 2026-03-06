-- ====================================================
-- MIGRATION: Adicionar clinic_id à tabela pacientes
-- ====================================================

-- Adicionar coluna clinic_id à tabela pacientes
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS clinic_id UUID;

-- Criar índice para melhor performance
CREATE INDEX IF NOT EXISTS idx_pacientes_clinic_id ON pacientes(clinic_id);

-- Mensagem de conclusão
SELECT 'Migration concluída: clinic_id adicionado à tabela pacientes' AS status;
