-- =====================================================
-- Migration: Fix schedule table schema
-- Date: 2026-03-14
-- Fixes PGRST205 / "Erro ao buscar horários disponíveis"
--
-- Root cause: 20260311132200_scheduling_capacity_refactor.sql sorts
-- before 20260311_create_schedule_and_availability_slots.sql
-- alphabetically (char '1' < char '_'), so it ran first and created
-- both tables with an older, leaner schema. The second migration used
-- CREATE TABLE IF NOT EXISTS, so the richer columns it defined were
-- never actually added.
--
-- This migration is idempotent: every ALTER TABLE is guarded by an
-- IF NOT EXISTS check so re-running it is safe.
-- =====================================================


-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Fix availability_slots — add missing columns
-- ─────────────────────────────────────────────────────────────────────────────

-- day_of_week: canonical column name used by generate_day_slots.
-- Copy from weekday when the old column exists; default to 0 otherwise.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'availability_slots'
          AND column_name  = 'day_of_week'
    ) THEN
        ALTER TABLE public.availability_slots ADD COLUMN day_of_week SMALLINT;

        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name   = 'availability_slots'
              AND column_name  = 'weekday'
        ) THEN
            UPDATE public.availability_slots SET day_of_week = weekday::SMALLINT;
        ELSE
            UPDATE public.availability_slots SET day_of_week = 0;
        END IF;

        ALTER TABLE public.availability_slots
            ALTER COLUMN day_of_week SET NOT NULL;
    END IF;
END $$;

-- CHECK constraint for day_of_week (add only when absent)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.check_constraints cc
        JOIN information_schema.constraint_column_usage ccu
          ON cc.constraint_name = ccu.constraint_name
        WHERE ccu.table_schema = 'public'
          AND ccu.table_name   = 'availability_slots'
          AND ccu.column_name  = 'day_of_week'
    ) THEN
        ALTER TABLE public.availability_slots
            ADD CONSTRAINT chk_availability_slots_day_of_week
            CHECK (day_of_week BETWEEN 0 AND 6);
    END IF;
END $$;

-- is_active: whether this weekly template is currently active
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'availability_slots'
          AND column_name  = 'is_active'
    ) THEN
        ALTER TABLE public.availability_slots
            ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
    END IF;
END $$;

-- duration_min: slot length in minutes (copy from slot_duration when present)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'availability_slots'
          AND column_name  = 'duration_min'
    ) THEN
        ALTER TABLE public.availability_slots
            ADD COLUMN duration_min INTEGER NOT NULL DEFAULT 50;

        IF EXISTS (
            SELECT 1 FROM information_schema.columns
            WHERE table_schema = 'public'
              AND table_name   = 'availability_slots'
              AND column_name  = 'slot_duration'
        ) THEN
            UPDATE public.availability_slots SET duration_min = slot_duration;
        END IF;
    END IF;
END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Fix schedule_slots — add missing columns
-- ─────────────────────────────────────────────────────────────────────────────

-- availability_slot_id: FK back to the template that generated this slot
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'schedule_slots'
          AND column_name  = 'availability_slot_id'
    ) THEN
        ALTER TABLE public.schedule_slots
            ADD COLUMN availability_slot_id UUID
            REFERENCES public.availability_slots(id) ON DELETE SET NULL;
    END IF;
END $$;

-- duration_min: slot length in minutes
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'schedule_slots'
          AND column_name  = 'duration_min'
    ) THEN
        ALTER TABLE public.schedule_slots
            ADD COLUMN duration_min INTEGER NOT NULL DEFAULT 50;
    END IF;
END $$;

-- is_blocked: manually blocked slots (e.g. professional on leave)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'schedule_slots'
          AND column_name  = 'is_blocked'
    ) THEN
        ALTER TABLE public.schedule_slots
            ADD COLUMN is_blocked BOOLEAN NOT NULL DEFAULT FALSE;
    END IF;
END $$;

-- notes: optional free-text annotation for the slot
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'schedule_slots'
          AND column_name  = 'notes'
    ) THEN
        ALTER TABLE public.schedule_slots ADD COLUMN notes TEXT;
    END IF;
END $$;

-- is_available: STORED GENERATED column — true when there is room left.
-- PostgreSQL 12+ supports ADD COLUMN ... GENERATED ALWAYS AS ... STORED.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name   = 'schedule_slots'
          AND column_name  = 'is_available'
    ) THEN
        ALTER TABLE public.schedule_slots
            ADD COLUMN is_available BOOLEAN
            GENERATED ALWAYS AS (current_capacity < max_capacity) STORED;
    END IF;
END $$;


-- ─────────────────────────────────────────────────────────────────────────────
-- 3. Re-create generate_day_slots
--    Ensures the function body references the corrected column names
--    (day_of_week, is_active, duration_min) that now exist on both tables.
-- ─────────────────────────────────────────────────────────────────────────────
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
    v_day_of_week := EXTRACT(DOW FROM p_date)::SMALLINT;

    FOR v_avail IN
        SELECT * FROM public.availability_slots
        WHERE professional_id = p_professional_id
          AND day_of_week     = v_day_of_week
          AND is_active       = TRUE
          AND (p_clinic_id IS NULL OR clinic_id = p_clinic_id)
    LOOP
        v_slot_start := v_avail.start_time;
        WHILE v_slot_start < v_avail.end_time LOOP
            v_slot_end := v_slot_start + (v_avail.duration_min || ' minutes')::INTERVAL;
            IF v_slot_end <= v_avail.end_time THEN
                INSERT INTO public.schedule_slots (
                    professional_id, clinic_id, availability_slot_id,
                    date, start_time, end_time, duration_min, max_capacity, current_capacity
                ) VALUES (
                    p_professional_id, v_avail.clinic_id, v_avail.id,
                    p_date, v_slot_start, v_slot_end, v_avail.duration_min, v_avail.max_capacity, 0
                )
                ON CONFLICT (professional_id, date, start_time) DO NOTHING;
            END IF;
            v_slot_start := v_slot_end;
        END LOOP;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.generate_day_slots(UUID, DATE, UUID) TO authenticated;
