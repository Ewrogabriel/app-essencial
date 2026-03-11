import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { appointmentService } from "../services/appointmentService";
import { useClinic } from "@/modules/clinic/hooks/useClinic";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { StatusAgendamento } from "@/types/entities";
import type { Agendamento } from "@/modules/appointments/types/appointment";

interface UseAgendamentosOptions {
    pacienteId?: string;
    enabled?: boolean;
}

export function useAgendamentos(options: UseAgendamentosOptions = {}) {
    const { activeClinicId } = useClinic();
    return useQuery({
        queryKey: ["agendamentos", activeClinicId, options.pacienteId],
        queryFn: async () => {
            let query = supabase
                .from("agendamentos")
                .select(`
          id,
          data_horario,
          status,
          tipo_atendimento,
          profissional_id,
          paciente_id,
          valor_sessao,
          duracao_minutos,
          pacientes (id, nome, telefone)
        `);

            if (activeClinicId) query = query.eq("clinic_id", activeClinicId);
            if (options.pacienteId) query = query.eq("paciente_id", options.pacienteId);

            const { data, error } = await query.order("data_horario", { ascending: true });
            if (error) throw error;
            return data as any as Agendamento[];
        },
        enabled: options.enabled ?? true,
        staleTime: 1000 * 60 * 5, // 5 minutos de cache
    });
}

export function useUpdateAgendamentoStatus() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, status }: { id: string; status: StatusAgendamento }) =>
            appointmentService.updateStatus(id, status),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["agendamentos"] });
            toast.success("Status atualizado!");
        },
    });
}

export function useAgendamentoCheckin() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, type }: { id: string; type: "paciente" | "profissional" }) =>
            appointmentService.checkin(id, type),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["agendamentos"] });
            toast.success("Check-in realizado! ✅");
        },
    });
}

export function useRescheduleAgendamento() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, newDate, profissionalId }: { id: string; newDate: Date; profissionalId: string }) =>
            appointmentService.reschedule(id, newDate, profissionalId),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["agendamentos"] });
            toast.success("Sessão reagendada!");
        },
    });
}

export function useScheduleSlots(options: { professionalId?: string; date: string; clinicId: string | null }) {
    return useQuery({
        queryKey: ["schedule_slots", options.professionalId, options.date, options.clinicId],
        queryFn: () => appointmentService.getScheduleSlots(options),
        enabled: !!options.date,
    });
}

export function useBookAppointment() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (params: Parameters<typeof appointmentService.bookAppointment>[0]) =>
            appointmentService.bookAppointment(params),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["agendamentos"] });
            queryClient.invalidateQueries({ queryKey: ["schedule_slots"] });
            toast.success("Agendamento realizado com sucesso! 📅");
        },
        onError: (error: any) => {
            toast.error(error.message || "Erro ao realizar agendamento");
        }
    });
}
