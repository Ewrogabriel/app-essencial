
-- 1. Create produtos table
CREATE TABLE public.produtos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  preco NUMERIC NOT NULL DEFAULT 0,
  estoque INTEGER NOT NULL DEFAULT 0,
  foto_url TEXT,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "produtos_admin_all" ON public.produtos FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "produtos_auth_select" ON public.produtos FOR SELECT USING (true);

CREATE TRIGGER update_produtos_updated_at BEFORE UPDATE ON public.produtos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. Add 'suspenso' to status_plano enum
ALTER TYPE public.status_plano ADD VALUE IF NOT EXISTS 'suspenso';

-- 3. Add FK from planos.profissional_id to profiles.user_id
ALTER TABLE public.planos
ADD CONSTRAINT planos_profissional_id_fkey
FOREIGN KEY (profissional_id) REFERENCES public.profiles(user_id);
