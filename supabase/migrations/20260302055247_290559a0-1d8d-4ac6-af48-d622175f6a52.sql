
-- Table for holidays (visible to all, managed by admin/gestor)
CREATE TABLE public.feriados (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  data date NOT NULL,
  descricao text NOT NULL,
  created_by uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.feriados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "feriados_select_all" ON public.feriados FOR SELECT USING (true);
CREATE POLICY "feriados_admin_insert" ON public.feriados FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));
CREATE POLICY "feriados_admin_update" ON public.feriados FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));
CREATE POLICY "feriados_admin_delete" ON public.feriados FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'gestor'::app_role));

-- Table for professional blocked dates/times
CREATE TABLE public.bloqueios_profissional (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profissional_id uuid NOT NULL,
  data date NOT NULL,
  hora_inicio time,
  hora_fim time,
  dia_inteiro boolean NOT NULL DEFAULT true,
  motivo text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bloqueios_profissional ENABLE ROW LEVEL SECURITY;

CREATE POLICY "bloqueios_select_all" ON public.bloqueios_profissional FOR SELECT USING (true);
CREATE POLICY "bloqueios_prof_insert" ON public.bloqueios_profissional FOR INSERT WITH CHECK (profissional_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "bloqueios_prof_update" ON public.bloqueios_profissional FOR UPDATE USING (profissional_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "bloqueios_prof_delete" ON public.bloqueios_profissional FOR DELETE USING (profissional_id = auth.uid() OR has_role(auth.uid(), 'admin'::app_role));
