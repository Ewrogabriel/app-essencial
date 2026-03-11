import { useQuery } from "@tanstack/react-query";
import { patientService } from "../services/patientService";
import { useClinic } from "@/modules/clinic/hooks/useClinic";

interface UsePacientesOptions {
    status?: "ativo" | "inativo";
    enabled?: boolean;
}

export function usePacientes(options: UsePacientesOptions = {}) {
    const { status = "ativo", enabled = true } = options;
    const { activeClinicId } = useClinic();

    return useQuery({
        queryKey: ["pacientes", status, activeClinicId],
        queryFn: () => patientService.getPatients(activeClinicId, status),
        enabled,
    });
}

export function usePacientesBasic(options: UsePacientesOptions = {}) {
    const { status = "ativo", enabled = true } = options;
    const { activeClinicId } = useClinic();

    return useQuery({
        queryKey: ["pacientes-basic", status, activeClinicId],
        queryFn: () => patientService.getPatientBasic(activeClinicId, status),
        enabled,
    });
}

export function usePaciente(pacienteId: string | undefined) {
    return useQuery({
        queryKey: ["paciente", pacienteId],
        queryFn: async () => {
            if (!pacienteId) return null;
            return patientService.getPatientById(pacienteId);
        },
        enabled: !!pacienteId,
    });
}

export function usePacienteByUserId(userId: string | undefined) {
    return useQuery({
        queryKey: ["paciente-by-userid", userId],
        queryFn: async () => {
            if (!userId) return null;
            return patientService.getPatientByUserId(userId);
        },
        enabled: !!userId,
    });
}
