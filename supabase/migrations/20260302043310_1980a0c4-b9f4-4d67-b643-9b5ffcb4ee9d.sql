
-- Table for fixed plan prices managed by admin
CREATE TABLE public.precos_planos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  descricao text,
  frequencia_semanal integer NOT NULL DEFAULT 1,
  modalidade text NOT NULL DEFAULT 'grupo',
  valor numeric NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL
);

ALTER TABLE public.precos_planos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "precos_planos_admin_all" ON public.precos_planos FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "precos_planos_auth_select" ON public.precos_planos FOR SELECT
  USING (true);

CREATE TRIGGER update_precos_planos_updated_at
  BEFORE UPDATE ON public.precos_planos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Table for patient-specific discounts
CREATE TABLE public.descontos_pacientes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  preco_plano_id uuid REFERENCES public.precos_planos(id) ON DELETE SET NULL,
  percentual_desconto numeric NOT NULL DEFAULT 0,
  motivo text,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL
);

ALTER TABLE public.descontos_pacientes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "descontos_admin_all" ON public.descontos_pacientes FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "descontos_prof_select" ON public.descontos_pacientes FOR SELECT
  USING (has_role(auth.uid(), 'profissional'::app_role));

CREATE POLICY "descontos_patient_select" ON public.descontos_pacientes FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM pacientes p WHERE p.id = descontos_pacientes.paciente_id AND p.user_id = auth.uid()
  ));

CREATE TRIGGER update_descontos_pacientes_updated_at
  BEFORE UPDATE ON public.descontos_pacientes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add RG field to pacientes for contracts
ALTER TABLE public.pacientes ADD COLUMN IF NOT EXISTS rg text;
