
-- Drop ALL existing policies on all tables first

-- AGENDAMENTOS
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins podem ver todos os agendamentos" ON public.agendamentos;
  DROP POLICY IF EXISTS "Admins podem ver todos os agendamentos " ON public.agendamentos;
  DROP POLICY IF EXISTS "Profissionais veem seus agendamentos" ON public.agendamentos;
  DROP POLICY IF EXISTS "Profissionais veem seus agendamentos " ON public.agendamentos;
  DROP POLICY IF EXISTS "Admins podem inserir agendamentos" ON public.agendamentos;
  DROP POLICY IF EXISTS "Admins podem inserir agendamentos " ON public.agendamentos;
  DROP POLICY IF EXISTS "Profissionais podem inserir seus agendamentos" ON public.agendamentos;
  DROP POLICY IF EXISTS "Profissionais podem inserir seus agendamentos " ON public.agendamentos;
  DROP POLICY IF EXISTS "Admins podem atualizar agendamentos" ON public.agendamentos;
  DROP POLICY IF EXISTS "Admins podem atualizar agendamentos " ON public.agendamentos;
  DROP POLICY IF EXISTS "Profissionais podem atualizar seus agendamentos" ON public.agendamentos;
  DROP POLICY IF EXISTS "Profissionais podem atualizar seus agendamentos " ON public.agendamentos;
  DROP POLICY IF EXISTS "Admins podem deletar agendamentos" ON public.agendamentos;
  DROP POLICY IF EXISTS "Admins podem deletar agendamentos " ON public.agendamentos;
END $$;

CREATE POLICY "agendamentos_admin_select" ON public.agendamentos FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "agendamentos_prof_select" ON public.agendamentos FOR SELECT USING (profissional_id = auth.uid());
CREATE POLICY "agendamentos_admin_insert" ON public.agendamentos FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "agendamentos_prof_insert" ON public.agendamentos FOR INSERT WITH CHECK (profissional_id = auth.uid());
CREATE POLICY "agendamentos_admin_update" ON public.agendamentos FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "agendamentos_prof_update" ON public.agendamentos FOR UPDATE USING (profissional_id = auth.uid());
CREATE POLICY "agendamentos_admin_delete" ON public.agendamentos FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- AVISOS
DO $$ BEGIN
  DROP POLICY IF EXISTS "Todos autenticados podem ver avisos" ON public.avisos;
  DROP POLICY IF EXISTS "Todos autenticados podem ver avisos " ON public.avisos;
  DROP POLICY IF EXISTS "Admins podem inserir avisos" ON public.avisos;
  DROP POLICY IF EXISTS "Admins podem inserir avisos " ON public.avisos;
  DROP POLICY IF EXISTS "Admins podem atualizar avisos" ON public.avisos;
  DROP POLICY IF EXISTS "Admins podem atualizar avisos " ON public.avisos;
  DROP POLICY IF EXISTS "Admins podem deletar avisos" ON public.avisos;
  DROP POLICY IF EXISTS "Admins podem deletar avisos " ON public.avisos;
END $$;

CREATE POLICY "avisos_auth_select" ON public.avisos FOR SELECT USING (true);
CREATE POLICY "avisos_admin_insert" ON public.avisos FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "avisos_admin_update" ON public.avisos FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "avisos_admin_delete" ON public.avisos FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- COMMISSIONS
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins podem ver commissions" ON public.commissions;
  DROP POLICY IF EXISTS "Admins podem ver commissions " ON public.commissions;
  DROP POLICY IF EXISTS "Profissionais veem suas commissions" ON public.commissions;
  DROP POLICY IF EXISTS "Profissionais veem suas commissions " ON public.commissions;
  DROP POLICY IF EXISTS "Admins podem inserir commissions" ON public.commissions;
  DROP POLICY IF EXISTS "Admins podem inserir commissions " ON public.commissions;
  DROP POLICY IF EXISTS "Admins podem atualizar commissions" ON public.commissions;
  DROP POLICY IF EXISTS "Admins podem atualizar commissions " ON public.commissions;
END $$;

CREATE POLICY "commissions_admin_select" ON public.commissions FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "commissions_prof_select" ON public.commissions FOR SELECT USING (professional_id = auth.uid());
CREATE POLICY "commissions_admin_insert" ON public.commissions FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "commissions_admin_update" ON public.commissions FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- EVALUATIONS
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins podem ver evaluations" ON public.evaluations;
  DROP POLICY IF EXISTS "Admins podem ver evaluations " ON public.evaluations;
  DROP POLICY IF EXISTS "Profissionais veem suas evaluations" ON public.evaluations;
  DROP POLICY IF EXISTS "Profissionais veem suas evaluations " ON public.evaluations;
  DROP POLICY IF EXISTS "Admins podem inserir evaluations" ON public.evaluations;
  DROP POLICY IF EXISTS "Admins podem inserir evaluations " ON public.evaluations;
  DROP POLICY IF EXISTS "Profissionais podem inserir evaluations" ON public.evaluations;
  DROP POLICY IF EXISTS "Profissionais podem inserir evaluations " ON public.evaluations;
  DROP POLICY IF EXISTS "Admins podem atualizar evaluations" ON public.evaluations;
  DROP POLICY IF EXISTS "Admins podem atualizar evaluations " ON public.evaluations;
END $$;

CREATE POLICY "evaluations_admin_select" ON public.evaluations FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "evaluations_prof_select" ON public.evaluations FOR SELECT USING (profissional_id = auth.uid());
CREATE POLICY "evaluations_admin_insert" ON public.evaluations FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "evaluations_prof_insert" ON public.evaluations FOR INSERT WITH CHECK (profissional_id = auth.uid());
CREATE POLICY "evaluations_admin_update" ON public.evaluations FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- EVOLUTIONS
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins podem ver evolutions" ON public.evolutions;
  DROP POLICY IF EXISTS "Admins podem ver evolutions " ON public.evolutions;
  DROP POLICY IF EXISTS "Profissionais veem suas evolutions" ON public.evolutions;
  DROP POLICY IF EXISTS "Profissionais veem suas evolutions " ON public.evolutions;
  DROP POLICY IF EXISTS "Admins podem inserir evolutions" ON public.evolutions;
  DROP POLICY IF EXISTS "Admins podem inserir evolutions " ON public.evolutions;
  DROP POLICY IF EXISTS "Profissionais podem inserir evolutions" ON public.evolutions;
  DROP POLICY IF EXISTS "Profissionais podem inserir evolutions " ON public.evolutions;
  DROP POLICY IF EXISTS "Admins podem atualizar evolutions" ON public.evolutions;
  DROP POLICY IF EXISTS "Admins podem atualizar evolutions " ON public.evolutions;
END $$;

CREATE POLICY "evolutions_admin_select" ON public.evolutions FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "evolutions_prof_select" ON public.evolutions FOR SELECT USING (profissional_id = auth.uid());
CREATE POLICY "evolutions_admin_insert" ON public.evolutions FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "evolutions_prof_insert" ON public.evolutions FOR INSERT WITH CHECK (profissional_id = auth.uid());
CREATE POLICY "evolutions_admin_update" ON public.evolutions FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

-- EXPENSES
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins podem ver expenses" ON public.expenses;
  DROP POLICY IF EXISTS "Admins podem ver expenses " ON public.expenses;
  DROP POLICY IF EXISTS "Admins podem inserir expenses" ON public.expenses;
  DROP POLICY IF EXISTS "Admins podem inserir expenses " ON public.expenses;
  DROP POLICY IF EXISTS "Admins podem atualizar expenses" ON public.expenses;
  DROP POLICY IF EXISTS "Admins podem atualizar expenses " ON public.expenses;
  DROP POLICY IF EXISTS "Admins podem deletar expenses" ON public.expenses;
  DROP POLICY IF EXISTS "Admins podem deletar expenses " ON public.expenses;
END $$;

CREATE POLICY "expenses_admin_select" ON public.expenses FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "expenses_admin_insert" ON public.expenses FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "expenses_admin_update" ON public.expenses FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "expenses_admin_delete" ON public.expenses FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- MODALIDADES
DO $$ BEGIN
  DROP POLICY IF EXISTS "Todos autenticados podem ver modalidades" ON public.modalidades;
  DROP POLICY IF EXISTS "Todos autenticados podem ver modalidades " ON public.modalidades;
  DROP POLICY IF EXISTS "Admins podem inserir modalidades" ON public.modalidades;
  DROP POLICY IF EXISTS "Admins podem inserir modalidades " ON public.modalidades;
  DROP POLICY IF EXISTS "Admins podem atualizar modalidades" ON public.modalidades;
  DROP POLICY IF EXISTS "Admins podem atualizar modalidades " ON public.modalidades;
  DROP POLICY IF EXISTS "Admins podem deletar modalidades" ON public.modalidades;
  DROP POLICY IF EXISTS "Admins podem deletar modalidades " ON public.modalidades;
END $$;

CREATE POLICY "modalidades_auth_select" ON public.modalidades FOR SELECT USING (true);
CREATE POLICY "modalidades_admin_insert" ON public.modalidades FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "modalidades_admin_update" ON public.modalidades FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "modalidades_admin_delete" ON public.modalidades FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- PACIENTES
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins podem ver todos os pacientes" ON public.pacientes;
  DROP POLICY IF EXISTS "Admins podem ver todos os pacientes " ON public.pacientes;
  DROP POLICY IF EXISTS "Profissionais veem seus pacientes" ON public.pacientes;
  DROP POLICY IF EXISTS "Profissionais veem seus pacientes " ON public.pacientes;
  DROP POLICY IF EXISTS "Admins podem inserir pacientes" ON public.pacientes;
  DROP POLICY IF EXISTS "Admins podem inserir pacientes " ON public.pacientes;
  DROP POLICY IF EXISTS "Profissionais podem inserir seus pacientes" ON public.pacientes;
  DROP POLICY IF EXISTS "Profissionais podem inserir seus pacientes " ON public.pacientes;
  DROP POLICY IF EXISTS "Admins podem atualizar pacientes" ON public.pacientes;
  DROP POLICY IF EXISTS "Admins podem atualizar pacientes " ON public.pacientes;
  DROP POLICY IF EXISTS "Profissionais podem atualizar seus pacientes" ON public.pacientes;
  DROP POLICY IF EXISTS "Profissionais podem atualizar seus pacientes " ON public.pacientes;
  DROP POLICY IF EXISTS "Admins podem deletar pacientes" ON public.pacientes;
  DROP POLICY IF EXISTS "Admins podem deletar pacientes " ON public.pacientes;
END $$;

CREATE POLICY "pacientes_admin_select" ON public.pacientes FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "pacientes_prof_select" ON public.pacientes FOR SELECT USING (profissional_id = auth.uid());
CREATE POLICY "pacientes_admin_insert" ON public.pacientes FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "pacientes_prof_insert" ON public.pacientes FOR INSERT WITH CHECK (profissional_id = auth.uid());
CREATE POLICY "pacientes_admin_update" ON public.pacientes FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "pacientes_prof_update" ON public.pacientes FOR UPDATE USING (profissional_id = auth.uid());
CREATE POLICY "pacientes_admin_delete" ON public.pacientes FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- PAGAMENTOS
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins podem ver todos os pagamentos" ON public.pagamentos;
  DROP POLICY IF EXISTS "Admins podem ver todos os pagamentos " ON public.pagamentos;
  DROP POLICY IF EXISTS "Profissionais veem seus pagamentos" ON public.pagamentos;
  DROP POLICY IF EXISTS "Profissionais veem seus pagamentos " ON public.pagamentos;
  DROP POLICY IF EXISTS "Admins podem inserir pagamentos" ON public.pagamentos;
  DROP POLICY IF EXISTS "Admins podem inserir pagamentos " ON public.pagamentos;
  DROP POLICY IF EXISTS "Profissionais podem inserir seus pagamentos" ON public.pagamentos;
  DROP POLICY IF EXISTS "Profissionais podem inserir seus pagamentos " ON public.pagamentos;
  DROP POLICY IF EXISTS "Admins podem atualizar pagamentos" ON public.pagamentos;
  DROP POLICY IF EXISTS "Admins podem atualizar pagamentos " ON public.pagamentos;
  DROP POLICY IF EXISTS "Profissionais podem atualizar seus pagamentos" ON public.pagamentos;
  DROP POLICY IF EXISTS "Profissionais podem atualizar seus pagamentos " ON public.pagamentos;
  DROP POLICY IF EXISTS "Admins podem deletar pagamentos" ON public.pagamentos;
  DROP POLICY IF EXISTS "Admins podem deletar pagamentos " ON public.pagamentos;
END $$;

CREATE POLICY "pagamentos_admin_select" ON public.pagamentos FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "pagamentos_prof_select" ON public.pagamentos FOR SELECT USING (profissional_id = auth.uid());
CREATE POLICY "pagamentos_admin_insert" ON public.pagamentos FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "pagamentos_prof_insert" ON public.pagamentos FOR INSERT WITH CHECK (profissional_id = auth.uid());
CREATE POLICY "pagamentos_admin_update" ON public.pagamentos FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "pagamentos_prof_update" ON public.pagamentos FOR UPDATE USING (profissional_id = auth.uid());
CREATE POLICY "pagamentos_admin_delete" ON public.pagamentos FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- PLANOS
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins podem ver todos os planos" ON public.planos;
  DROP POLICY IF EXISTS "Admins podem ver todos os planos " ON public.planos;
  DROP POLICY IF EXISTS "Profissionais veem seus planos" ON public.planos;
  DROP POLICY IF EXISTS "Profissionais veem seus planos " ON public.planos;
  DROP POLICY IF EXISTS "Admins podem inserir planos" ON public.planos;
  DROP POLICY IF EXISTS "Admins podem inserir planos " ON public.planos;
  DROP POLICY IF EXISTS "Profissionais podem inserir seus planos" ON public.planos;
  DROP POLICY IF EXISTS "Profissionais podem inserir seus planos " ON public.planos;
  DROP POLICY IF EXISTS "Admins podem atualizar planos" ON public.planos;
  DROP POLICY IF EXISTS "Admins podem atualizar planos " ON public.planos;
  DROP POLICY IF EXISTS "Profissionais podem atualizar seus planos" ON public.planos;
  DROP POLICY IF EXISTS "Profissionais podem atualizar seus planos " ON public.planos;
  DROP POLICY IF EXISTS "Admins podem deletar planos" ON public.planos;
  DROP POLICY IF EXISTS "Admins podem deletar planos " ON public.planos;
END $$;

CREATE POLICY "planos_admin_select" ON public.planos FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "planos_prof_select" ON public.planos FOR SELECT USING (profissional_id = auth.uid());
CREATE POLICY "planos_admin_insert" ON public.planos FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "planos_prof_insert" ON public.planos FOR INSERT WITH CHECK (profissional_id = auth.uid());
CREATE POLICY "planos_admin_update" ON public.planos FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "planos_prof_update" ON public.planos FOR UPDATE USING (profissional_id = auth.uid());
CREATE POLICY "planos_admin_delete" ON public.planos FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- PROFILES
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins podem ver todos os perfis" ON public.profiles;
  DROP POLICY IF EXISTS "Admins podem ver todos os perfis " ON public.profiles;
  DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil" ON public.profiles;
  DROP POLICY IF EXISTS "Usuários podem ver seu próprio perfil " ON public.profiles;
  DROP POLICY IF EXISTS "Admins podem atualizar todos os perfis" ON public.profiles;
  DROP POLICY IF EXISTS "Admins podem atualizar todos os perfis " ON public.profiles;
  DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil" ON public.profiles;
  DROP POLICY IF EXISTS "Usuários podem atualizar seu próprio perfil " ON public.profiles;
  DROP POLICY IF EXISTS "Usuários podem criar seu próprio perfil" ON public.profiles;
  DROP POLICY IF EXISTS "Usuários podem criar seu próprio perfil " ON public.profiles;
END $$;

CREATE POLICY "profiles_admin_select" ON public.profiles FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "profiles_self_select" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "profiles_admin_update" ON public.profiles FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "profiles_self_update" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "profiles_self_insert" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- USER_ROLES
DO $$ BEGIN
  DROP POLICY IF EXISTS "Admins podem ver todas as roles" ON public.user_roles;
  DROP POLICY IF EXISTS "Admins podem ver todas as roles " ON public.user_roles;
  DROP POLICY IF EXISTS "Admins podem inserir roles" ON public.user_roles;
  DROP POLICY IF EXISTS "Admins podem atualizar roles" ON public.user_roles;
  DROP POLICY IF EXISTS "Admins podem deletar roles" ON public.user_roles;
END $$;

CREATE POLICY "roles_select" ON public.user_roles FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR auth.uid() = user_id);
CREATE POLICY "roles_admin_insert" ON public.user_roles FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "roles_admin_update" ON public.user_roles FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "roles_admin_delete" ON public.user_roles FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin role to current user
INSERT INTO public.user_roles (user_id, role)
VALUES ('655471c4-0b68-4dfe-ae13-c1fcb01fd2ed', 'admin')
ON CONFLICT DO NOTHING;

-- Add gestor and paciente to app_role enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'gestor' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')) THEN
    ALTER TYPE public.app_role ADD VALUE 'gestor';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'paciente' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')) THEN
    ALTER TYPE public.app_role ADD VALUE 'paciente';
  END IF;
END $$;
