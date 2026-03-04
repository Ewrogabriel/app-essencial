ALTER TABLE public.pagamentos ADD COLUMN IF NOT EXISTS matricula_id UUID REFERENCES public.matriculas(id) ON DELETE SET NULL;
