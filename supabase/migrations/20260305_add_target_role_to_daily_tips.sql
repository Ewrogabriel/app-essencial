-- Add target_role column to daily_tips
ALTER TABLE public.daily_tips ADD COLUMN IF NOT EXISTS target_role TEXT DEFAULT 'todos';

-- Update existing tips to 'profissional' if any (assuming existing ones were for staff)
UPDATE public.daily_tips SET target_role = 'profissional' WHERE target_role = 'todos';

-- Insert a sample patient tip
INSERT INTO public.daily_tips (titulo, conteudo, target_role) 
VALUES ('Hidratação é Chave', 'Lembre-se de beber água antes e depois das sessões de Pilates para ajudar na recuperação muscular.', 'paciente');
