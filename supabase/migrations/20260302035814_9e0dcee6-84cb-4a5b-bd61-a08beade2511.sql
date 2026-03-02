-- Table for professional availability slots
CREATE TABLE public.disponibilidade_profissional (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profissional_id uuid NOT NULL,
  dia_semana integer NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6),
  hora_inicio time NOT NULL,
  hora_fim time NOT NULL,
  max_pacientes integer NOT NULL DEFAULT 1,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (profissional_id, dia_semana, hora_inicio)
);

ALTER TABLE public.disponibilidade_profissional ENABLE ROW LEVEL SECURITY;

CREATE POLICY "disp_admin_all" ON public.disponibilidade_profissional FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "disp_prof_select" ON public.disponibilidade_profissional FOR SELECT
  USING (true);
CREATE POLICY "disp_prof_manage" ON public.disponibilidade_profissional FOR INSERT
  WITH CHECK (profissional_id = auth.uid());
CREATE POLICY "disp_prof_update" ON public.disponibilidade_profissional FOR UPDATE
  USING (profissional_id = auth.uid());
CREATE POLICY "disp_prof_delete" ON public.disponibilidade_profissional FOR DELETE
  USING (profissional_id = auth.uid());

-- Table for reschedule requests from patients
CREATE TABLE public.solicitacoes_remarcacao (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agendamento_id uuid NOT NULL REFERENCES public.agendamentos(id) ON DELETE CASCADE,
  paciente_id uuid NOT NULL,
  nova_data_horario timestamptz NOT NULL,
  motivo text,
  status text NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovada', 'recusada')),
  respondido_por uuid,
  respondido_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.solicitacoes_remarcacao ENABLE ROW LEVEL SECURITY;

CREATE POLICY "solic_admin_all" ON public.solicitacoes_remarcacao FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "solic_prof_select" ON public.solicitacoes_remarcacao FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.agendamentos a WHERE a.id = agendamento_id AND a.profissional_id = auth.uid()
  ));
CREATE POLICY "solic_prof_update" ON public.solicitacoes_remarcacao FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.agendamentos a WHERE a.id = agendamento_id AND a.profissional_id = auth.uid()
  ));
CREATE POLICY "solic_paciente_select" ON public.solicitacoes_remarcacao FOR SELECT
  USING (paciente_id = auth.uid());
CREATE POLICY "solic_paciente_insert" ON public.solicitacoes_remarcacao FOR INSERT
  WITH CHECK (paciente_id = auth.uid());

-- Trigger for updated_at on disponibilidade
CREATE TRIGGER update_disponibilidade_updated_at
  BEFORE UPDATE ON public.disponibilidade_profissional
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
