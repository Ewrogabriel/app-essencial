ALTER TABLE public.matriculas
ADD CONSTRAINT matriculas_profissional_id_fkey
FOREIGN KEY (profissional_id) REFERENCES public.profiles(user_id) ON DELETE CASCADE;