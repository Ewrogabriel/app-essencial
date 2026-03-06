-- ====================================================
-- MIGRATION: Adicionar clinic_id às tabelas profiles e pacientes
-- ====================================================

-- Adicionar coluna clinic_id à tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS clinic_id UUID;

-- Adicionar coluna clinic_id à tabela pacientes
ALTER TABLE pacientes ADD COLUMN IF NOT EXISTS clinic_id UUID;

-- Criar índices para melhor performance
CREATE INDEX IF NOT EXISTS idx_profiles_clinic_id ON profiles(clinic_id);
CREATE INDEX IF NOT EXISTS idx_pacientes_clinic_id ON pacientes(clinic_id);

-- Mensagem de conclusão
SELECT 'Migration concluída: clinic_id adicionado às tabelas profiles e pacientes' AS status;
