
-- Add codigo_acesso column to pacientes table
ALTER TABLE public.pacientes ADD COLUMN IF NOT EXISTS codigo_acesso text UNIQUE;
CREATE INDEX IF NOT EXISTS idx_pacientes_codigo_acesso ON public.pacientes(codigo_acesso);

-- Create paciente_sessions table for access code login
CREATE TABLE IF NOT EXISTS public.paciente_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  paciente_id uuid NOT NULL REFERENCES public.pacientes(id) ON DELETE CASCADE,
  session_token text UNIQUE NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_paciente_sessions_token ON public.paciente_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_paciente_sessions_paciente ON public.paciente_sessions(paciente_id);

-- Enable RLS
ALTER TABLE public.paciente_sessions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert sessions (login flow uses anon key)
CREATE POLICY "paciente_sessions_anon_insert" ON public.paciente_sessions
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- Allow reading own sessions
CREATE POLICY "paciente_sessions_anon_select" ON public.paciente_sessions
  FOR SELECT TO anon, authenticated
  USING (true);

-- Allow deleting expired sessions
CREATE POLICY "paciente_sessions_anon_delete" ON public.paciente_sessions
  FOR DELETE TO anon, authenticated
  USING (true);
