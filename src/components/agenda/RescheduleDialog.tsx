import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "@/hooks/use-toast";
import { checkAvailability, getAvailableSlots, type AvailabilityCheckResult } from "@/lib/availabilityCheck";
import type { Agendamento } from "./AgendaViews";

interface RescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  agendamento: Agendamento | null;
  onSuccess: () => void;
}

export function RescheduleDialog({ open, onOpenChange, agendamento, onSuccess }: RescheduleDialogProps) {
  const { user, isPatient } = useAuth();
  const [date, setDate] = useState<Date>();
  const [time, setTime] = useState("08:00");
  const [motivo, setMotivo] = useState("");
  const [loading, setLoading] = useState(false);
  const [availabilityResult, setAvailabilityResult] = useState<AvailabilityCheckResult | null>(null);
  const [availableSlots, setAvailableSlots] = useState<{ hora_inicio: string; hora_fim: string; available: number }[]>([]);
  const [checking, setChecking] = useState(false);

  // When date changes, fetch available slots for that day
  useEffect(() => {
    if (!date || !agendamento) {
      setAvailableSlots([]);
      setAvailabilityResult(null);
      return;
    }
    const fetchSlots = async () => {
      const slots = await getAvailableSlots(agendamento.profissional_id, date);
      setAvailableSlots(slots.map(s => ({
        hora_inicio: s.slot.hora_inicio,
        hora_fim: s.slot.hora_fim,
        available: s.available,
      })));
    };
    fetchSlots();
  }, [date, agendamento]);

  // When date + time changes, check availability
  useEffect(() => {
    if (!date || !time || !agendamento) {
      setAvailabilityResult(null);
      return;
    }
    const timer = setTimeout(async () => {
      setChecking(true);
      const [h, m] = time.split(":").map(Number);
      const dt = new Date(date);
      dt.setHours(h, m, 0, 0);
      const result = await checkAvailability(agendamento.profissional_id, dt);
      setAvailabilityResult(result);
      setChecking(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [date, time, agendamento]);

  const canSubmit = (() => {
    if (!date) return false;
    if (isPatient && !motivo) return false;
    if (isPatient && availabilityResult) {
      // Patients can only reschedule to available slots
      if (!availabilityResult.isWithinSchedule) return false;
      if (availabilityResult.isOverCapacity) return false;
    }
    return true;
  })();

  const handleSubmit = async () => {
    if (!date || !agendamento || !user) return;
    setLoading(true);

    const [h, m] = time.split(":").map(Number);
    const novaData = new Date(date);
    novaData.setHours(h, m, 0, 0);

    if (isPatient) {
      // Patient creates a reschedule request
      const { error } = await (supabase.from("solicitacoes_remarcacao") as any).insert({
        agendamento_id: agendamento.id,
        paciente_id: user.id,
        nova_data_horario: novaData.toISOString(),
        motivo: motivo || null,
      });

      if (error) {
        toast({ title: "Erro ao solicitar remarcação", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Solicitação enviada! 📩", description: "O profissional será notificado para aprovar." });
        onOpenChange(false);
        onSuccess();
      }
    } else {
      // Staff directly reschedules
      const { error } = await supabase
        .from("agendamentos")
        .update({ data_horario: novaData.toISOString(), observacoes: motivo ? `Remarcado: ${motivo}` : agendamento.observacoes })
        .eq("id", agendamento.id);

      if (error) {
        toast({ title: "Erro ao remarcar", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Agendamento remarcado! ✅" });
        onOpenChange(false);
        onSuccess();
      }
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px]">
        <DialogHeader>
          <DialogTitle>{isPatient ? "Solicitar Remarcação" : "Remarcar Agendamento"}</DialogTitle>
        </DialogHeader>

        {agendamento && (
          <div className="text-sm text-muted-foreground mb-2">
            Atual: {format(new Date(agendamento.data_horario), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </div>
        )}

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Nova Data</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-full justify-start text-left", !date && "text-muted-foreground")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "dd/MM/yyyy") : "Selecione a data"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Available slots for selected date */}
          {date && availableSlots.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Horários disponíveis neste dia</Label>
              <div className="flex flex-wrap gap-2">
                {availableSlots.map((slot, i) => (
                  <Badge
                    key={i}
                    variant={slot.available > 0 ? "secondary" : "outline"}
                    className={cn(
                      "cursor-pointer text-xs gap-1 transition-colors",
                      slot.available <= 0 && "opacity-50 line-through"
                    )}
                    onClick={() => {
                      if (slot.available > 0) {
                        setTime(slot.hora_inicio.slice(0, 5));
                      }
                    }}
                  >
                    <Clock className="h-3 w-3" />
                    {slot.hora_inicio.slice(0, 5)}-{slot.hora_fim.slice(0, 5)}
                    <span className="font-normal">({slot.available} vaga{slot.available !== 1 ? "s" : ""})</span>
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {date && availableSlots.length === 0 && !checking && (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                O profissional não tem disponibilidade configurada para este dia.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>Novo Horário</Label>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>

          {/* Availability check result */}
          {availabilityResult && (
            <Alert variant={availabilityResult.isWithinSchedule && !availabilityResult.isOverCapacity ? "default" : "destructive"}>
              {availabilityResult.isWithinSchedule && !availabilityResult.isOverCapacity ? (
                <CheckCircle2 className="h-4 w-4" />
              ) : (
                <AlertTriangle className="h-4 w-4" />
              )}
              <AlertDescription className="text-sm">
                {availabilityResult.message}
                {isPatient && (availabilityResult.isOverCapacity || !availabilityResult.isWithinSchedule) && (
                  <span className="block text-xs mt-1 font-medium">
                    Escolha um horário disponível acima para continuar.
                  </span>
                )}
                {!isPatient && availabilityResult.isOverCapacity && (
                  <span className="block text-xs mt-1 opacity-80">
                    Como profissional/admin, você pode remarcar mesmo assim.
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label>Motivo {isPatient ? "(obrigatório)" : "(opcional)"}</Label>
            <Textarea
              placeholder="Informe o motivo da remarcação..."
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={loading || !canSubmit}>
            {loading ? "Enviando..." : isPatient ? "Solicitar Remarcação" : "Remarcar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
