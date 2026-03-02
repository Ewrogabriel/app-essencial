
-- Clinic settings table (singleton)
CREATE TABLE public.clinic_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL DEFAULT '',
  cnpj text,
  endereco text,
  numero text,
  bairro text,
  cidade text,
  estado text,
  cep text,
  telefone text,
  whatsapp text,
  email text,
  instagram text,
  logo_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;

-- Everyone authenticated can read
CREATE POLICY "clinic_settings_select" ON public.clinic_settings FOR SELECT USING (true);

-- Only admins can modify
CREATE POLICY "clinic_settings_admin_insert" ON public.clinic_settings FOR INSERT WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "clinic_settings_admin_update" ON public.clinic_settings FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "clinic_settings_admin_delete" ON public.clinic_settings FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

-- Insert default row
INSERT INTO public.clinic_settings (nome, cnpj, endereco, numero, bairro, cidade, estado, telefone, whatsapp, instagram)
VALUES ('Essencial Fisio Pilates', '61.080.977/0001-50', 'Rua Capitão Antônio Ferreira Campos', '46', 'Carmo', 'Barbacena', 'MG', '(32) 98415-2802', '5532984152802', '@essencialfisiopilatesbq');

-- Trigger for updated_at
CREATE TRIGGER update_clinic_settings_updated_at
BEFORE UPDATE ON public.clinic_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
