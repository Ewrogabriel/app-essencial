import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
import { toast } from "@/hooks/use-toast";
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
      <DialogContent className="sm:max-w-[420px]">
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

          <div className="space-y-2">
            <Label>Novo Horário</Label>
            <Input type="time" value={time} onChange={(e) => setTime(e.target.value)} />
          </div>

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
          <Button onClick={handleSubmit} disabled={loading || !date || (isPatient && !motivo)}>
            {loading ? "Enviando..." : isPatient ? "Solicitar Remarcação" : "Remarcar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
