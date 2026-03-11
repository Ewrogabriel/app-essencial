export interface Agendamento {
    id: string;
    paciente_id: string;
    profissional_id: string;
    clinic_id?: string;
    data_horario: string;
    duracao_minutos: number;
    tipo_atendimento: string;
    tipo_sessao: string;
    status: string;
    observacoes: string | null;
    slot_id?: string;
    valor_sessao?: number;
    checkin_paciente?: boolean;
    checkin_profissional?: boolean;
    checkin_paciente_at?: string | null;
    checkin_profissional_at?: string | null;
    pacientes?: {
        id: string;
        nome: string;
        telefone?: string;
    } | null;
    profiles?: {
        nome: string;
    } | null;
}
