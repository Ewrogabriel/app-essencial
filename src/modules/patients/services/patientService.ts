import { supabase } from "@/integrations/supabase/client";
import { handleError } from "../../shared/utils/errorHandler";
import type { Paciente, PacienteBasic } from "@/types/entities";

/**
 * Column list for full patient queries.
 * Matches the Paciente interface (avoids SELECT *).
 */
const PATIENT_COLUMNS =
    "id, nome, email, telefone, cpf, data_nascimento, status, tipo_atendimento, profissional_id, user_id, observacoes, foto_url, created_at, updated_at" as const;

export const patientService = {
    async getPatients(activeClinicId: string | null, status: "ativo" | "inativo" = "ativo"): Promise<Paciente[]> {
        try {
            if (activeClinicId) {
                const { data: clinicPacientes, error: cpError } = await supabase
                    .from("clinic_pacientes")
                    .select("paciente_id")
                    .eq("clinic_id", activeClinicId);

                if (cpError) throw cpError;

                const ids = clinicPacientes?.map((cp) => cp.paciente_id) ?? [];
                if (!ids.length) return [];

                const { data, error } = await supabase
                    .from("pacientes")
                    .select(PATIENT_COLUMNS)
                    .in("id", ids)
                    .eq("status", status)
                    .order("nome");

                if (error) throw error;
                return (data || []) as Paciente[];
            }

            const { data, error } = await supabase
                .from("pacientes")
                .select(PATIENT_COLUMNS)
                .eq("status", status)
                .order("nome");

            if (error) throw error;
            return (data || []) as Paciente[];
        } catch (error) {
            handleError(error, "Erro ao buscar lista de pacientes.");
            return [];
        }
    },

    async getPatientBasic(activeClinicId: string | null, status: "ativo" | "inativo" = "ativo"): Promise<PacienteBasic[]> {
        try {
            if (activeClinicId) {
                const { data: clinicPacientes, error: cpError } = await supabase
                    .from("clinic_pacientes")
                    .select("paciente_id")
                    .eq("clinic_id", activeClinicId);

                if (cpError) throw cpError;

                const ids = clinicPacientes?.map((cp) => cp.paciente_id) ?? [];
                if (!ids.length) return [];

                const { data, error } = await supabase
                    .from("pacientes")
                    .select("id, nome")
                    .in("id", ids)
                    .eq("status", status)
                    .order("nome");

                if (error) throw error;
                return data as PacienteBasic[];
            }

            const { data, error } = await supabase
                .from("pacientes")
                .select("id, nome")
                .eq("status", status)
                .order("nome");

            if (error) throw error;
            return data as PacienteBasic[];
        } catch (error) {
            handleError(error, "Erro ao buscar lista básica de pacientes.");
            return [];
        }
    },

    async getPatientById(id: string): Promise<Paciente | null> {
        try {
            const { data, error } = await supabase
                .from("pacientes")
                .select(PATIENT_COLUMNS)
                .eq("id", id)
                .single();

            if (error) throw error;
            return data as Paciente;
        } catch (error) {
            handleError(error, "Erro ao buscar detalhes do paciente.");
            return null;
        }
    },

    async getPatientByUserId(userId: string): Promise<Paciente | null> {
        try {
            const { data, error } = await supabase
                .from("pacientes")
                .select(PATIENT_COLUMNS)
                .eq("user_id", userId)
                .maybeSingle();

            if (error) throw error;
            return data as Paciente | null;
        } catch (error) {
            handleError(error, "Erro ao buscar paciente por user_id.");
            return null;
        }
    },
};
