ALTER TABLE public.agendamentos ADD COLUMN IF NOT EXISTS matricula_id UUID REFERENCES public.matriculas(id) ON DELETE CASCADE;
