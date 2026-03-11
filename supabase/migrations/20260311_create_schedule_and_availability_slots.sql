-- =====================================================
-- Migration: Create schedule_slots and availability_slots tables
-- Date: 2026-03-11
-- Description: Tabelas de controle de vagas e disponibilidade
--              por profissional e clínica
-- =====================================================

-- ─────────────────────────────────────────
-- 1. AVAILABILITY_SLOTS
--    Define os horários disponíveis de cada profissional
--    por dia da semana (template de disponibilidade)
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.availability_slots (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    clinic_id       UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    day_of_week     SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Dom, 1=Seg ... 6=Sáb
    start_time      TIME NOT NULL,
    end_time        TIME NOT NULL,
    duration_min    INTEGER NOT NULL DEFAULT 50,  -- duração de cada slot em minutos
    max_capacity    INTEGER NOT NULL DEFAULT 1,   -- 1 = individual, >1 = grupo
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT availability_slots_times_check CHECK (end_time > start_time)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_availability_slots_professional ON public.availability_slots(professional_id);
CREATE INDEX IF NOT EXISTS idx_availability_slots_clinic ON public.availability_slots(clinic_id);
CREATE INDEX IF NOT EXISTS idx_availability_slots_day ON public.availability_slots(day_of_week);

-- RLS
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "availability_slots: leitura autenticados"
    ON public.availability_slots FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "availability_slots: escrita admin/gestor/profissional"
    ON public.availability_slots FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'gestor', 'master', 'profissional')
        )
    );


-- ─────────────────────────────────────────
-- 2. SCHEDULE_SLOTS
--    Instâncias reais de slots para uma data específica,
--    gerados a partir da disponibilidade semanal.
--    Controla a capacidade atual de cada horário.
-- ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.schedule_slots (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    professional_id     UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    clinic_id           UUID NOT NULL REFERENCES public.clinicas(id) ON DELETE CASCADE,
    availability_slot_id UUID REFERENCES public.availability_slots(id) ON DELETE SET NULL,
    date                DATE NOT NULL,
    start_time          TIME NOT NULL,
    end_time            TIME NOT NULL,
    duration_min        INTEGER NOT NULL DEFAULT 50,
    max_capacity        INTEGER NOT NULL DEFAULT 1,
    current_capacity    INTEGER NOT NULL DEFAULT 0 CHECK (current_capacity >= 0),
    is_available        BOOLEAN GENERATED ALWAYS AS (current_capacity < max_capacity) STORED,
    is_blocked          BOOLEAN NOT NULL DEFAULT FALSE,
    notes               TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT schedule_slots_capacity_check CHECK (current_capacity <= max_capacity),
    CONSTRAINT schedule_slots_times_check CHECK (end_time > start_time),
    UNIQUE (professional_id, date, start_time)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_schedule_slots_professional ON public.schedule_slots(professional_id);
CREATE INDEX IF NOT EXISTS idx_schedule_slots_clinic ON public.schedule_slots(clinic_id);
CREATE INDEX IF NOT EXISTS idx_schedule_slots_date ON public.schedule_slots(date);
CREATE INDEX IF NOT EXISTS idx_schedule_slots_date_prof ON public.schedule_slots(date, professional_id);
CREATE INDEX IF NOT EXISTS idx_schedule_slots_available ON public.schedule_slots(date, is_available);

-- RLS
ALTER TABLE public.schedule_slots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "schedule_slots: leitura autenticados"
    ON public.schedule_slots FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "schedule_slots: escrita admin/gestor/profissional"
    ON public.schedule_slots FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role IN ('admin', 'gestor', 'master', 'profissional')
        )
    );


-- ─────────────────────────────────────────
-- 3. TRIGGER: updated_at automático
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'trg_availability_slots_updated_at'
    ) THEN
        CREATE TRIGGER trg_availability_slots_updated_at
            BEFORE UPDATE ON public.availability_slots
            FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'trg_schedule_slots_updated_at'
    ) THEN
        CREATE TRIGGER trg_schedule_slots_updated_at
            BEFORE UPDATE ON public.schedule_slots
            FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
    END IF;
END $$;


-- ─────────────────────────────────────────
-- 4. TRIGGER: Atualiza current_capacity baseado em agendamentos
--    Mantém o contador sincronizado automaticamente
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.sync_slot_capacity()
RETURNS TRIGGER AS $$
BEGIN
    -- Incrementa ao agendar
    IF TG_OP = 'INSERT' AND NEW.slot_id IS NOT NULL THEN
        UPDATE public.schedule_slots
        SET current_capacity = current_capacity + 1
        WHERE id = NEW.slot_id;

    -- Decrementa ao cancelar
    ELSIF TG_OP = 'UPDATE'
        AND NEW.slot_id IS NOT NULL
        AND OLD.status != 'cancelado'
        AND NEW.status = 'cancelado' THEN
        UPDATE public.schedule_slots
        SET current_capacity = GREATEST(current_capacity - 1, 0)
        WHERE id = NEW.slot_id;

    -- Restaura ao reativar
    ELSIF TG_OP = 'UPDATE'
        AND NEW.slot_id IS NOT NULL
        AND OLD.status = 'cancelado'
        AND NEW.status != 'cancelado' THEN
        UPDATE public.schedule_slots
        SET current_capacity = current_capacity + 1
        WHERE id = NEW.slot_id;
    END IF;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger
        WHERE tgname = 'trg_agendamentos_sync_slot_capacity'
    ) THEN
        CREATE TRIGGER trg_agendamentos_sync_slot_capacity
            AFTER INSERT OR UPDATE OF status ON public.agendamentos
            FOR EACH ROW EXECUTE FUNCTION public.sync_slot_capacity();
    END IF;
END $$;


-- ─────────────────────────────────────────
-- 5. RPC: generate_day_slots
--    Gera automaticamente os schedule_slots para um
--    profissional em uma data específica,
--    baseado nos availability_slots cadastrados.
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.generate_day_slots(
    p_professional_id UUID,
    p_date            DATE,
    p_clinic_id       UUID DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_day_of_week  SMALLINT;
    v_avail        RECORD;
    v_slot_start   TIME;
    v_slot_end     TIME;
BEGIN
    -- Dia da semana da data (0=Dom, 1=Seg, ..., 6=Sáb)
    v_day_of_week := EXTRACT(DOW FROM p_date)::SMALLINT;

    -- Para cada slot de disponibilidade do profissional neste dia
    FOR v_avail IN
        SELECT *
        FROM public.availability_slots
        WHERE professional_id = p_professional_id
          AND day_of_week = v_day_of_week
          AND is_active = TRUE
          AND (p_clinic_id IS NULL OR clinic_id = p_clinic_id)
    LOOP
        v_slot_start := v_avail.start_time;

        -- Gera slots dentro da janela de disponibilidade
        WHILE v_slot_start < v_avail.end_time LOOP
            v_slot_end := v_slot_start + (v_avail.duration_min || ' minutes')::INTERVAL;

            -- Só gera se o slot completo couber na janela
            IF v_slot_end <= v_avail.end_time THEN
                INSERT INTO public.schedule_slots (
                    professional_id,
                    clinic_id,
                    availability_slot_id,
                    date,
                    start_time,
                    end_time,
                    duration_min,
                    max_capacity,
                    current_capacity
                ) VALUES (
                    p_professional_id,
                    v_avail.clinic_id,
                    v_avail.id,
                    p_date,
                    v_slot_start,
                    v_slot_end,
                    v_avail.duration_min,
                    v_avail.max_capacity,
                    0
                )
                ON CONFLICT (professional_id, date, start_time) DO NOTHING;
            END IF;

            v_slot_start := v_slot_end;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ─────────────────────────────────────────
-- 6. RPC: book_appointment (com controle de concorrência)
--    Reserva um slot e cria o agendamento atomicamente
-- ─────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.book_appointment(
    p_paciente_id      UUID,
    p_profissional_id  UUID,
    p_slot_id          UUID,
    p_data_horario     TIMESTAMPTZ,
    p_duracao_minutos  INTEGER,
    p_tipo_atendimento TEXT,
    p_tipo_sessao      TEXT,
    p_observacoes      TEXT DEFAULT NULL,
    p_created_by       UUID DEFAULT NULL,
    p_clinic_id        UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_slot       RECORD;
    v_agendamento_id UUID;
BEGIN
    -- Lock otimista no slot para evitar double-booking
    SELECT * INTO v_slot
    FROM public.schedule_slots
    WHERE id = p_slot_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Slot não encontrado.';
    END IF;

    IF v_slot.is_blocked THEN
        RAISE EXCEPTION 'Este horário está bloqueado.';
    END IF;

    IF v_slot.current_capacity >= v_slot.max_capacity THEN
        RAISE EXCEPTION 'Este horário está sem vagas disponíveis.';
    END IF;

    -- Cria o agendamento
    INSERT INTO public.agendamentos (
        paciente_id,
        profissional_id,
        slot_id,
        data_horario,
        duracao_minutos,
        tipo_atendimento,
        tipo_sessao,
        status,
        observacoes,
        created_by,
        clinic_id
    ) VALUES (
        p_paciente_id,
        p_profissional_id,
        p_slot_id,
        p_data_horario,
        p_duracao_minutos,
        p_tipo_atendimento,
        p_tipo_sessao,
        'agendado',
        p_observacoes,
        p_created_by,
        p_clinic_id
    )
    RETURNING id INTO v_agendamento_id;

    RETURN v_agendamento_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Concede permissão de execução das RPCs
GRANT EXECUTE ON FUNCTION public.generate_day_slots(UUID, DATE, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.book_appointment(UUID, UUID, UUID, TIMESTAMPTZ, INTEGER, TEXT, TEXT, TEXT, UUID, UUID) TO authenticated;
