import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Clock, Plus, Trash2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const DIAS_SEMANA = [
  { value: 1, label: "Segunda" },
  { value: 2, label: "Terça" },
  { value: 3, label: "Quarta" },
  { value: 4, label: "Quinta" },
  { value: 5, label: "Sexta" },
  { value: 6, label: "Sábado" },
  { value: 0, label: "Domingo" },
];

const DisponibilidadeProfissional = () => {
  const { user, isAdmin, isGestor } = useAuth();
  const queryClient = useQueryClient();
  const [selectedProfissional, setSelectedProfissional] = useState<string>(user?.id || "");
  const [newSlot, setNewSlot] = useState({ dia_semana: 1, hora_inicio: "07:00", hora_fim: "08:00", max_pacientes: 1 });
  const [loading, setLoading] = useState(false);

  const profId = (isAdmin || isGestor) ? selectedProfissional : (user?.id || "");

  const { data: profissionais = [] } = useQuery({
    queryKey: ["profissionais-disp"],
    queryFn: async () => {
      const { data } = await (supabase.from("profiles") as any).select("id, user_id, nome").order("nome");
      return data ?? [];
    },
    enabled: isAdmin || isGestor,
  });

  const { data: slots = [], refetch } = useQuery({
    queryKey: ["disponibilidade", profId],
    queryFn: async () => {
      const { data } = await (supabase.from("disponibilidade_profissional") as any)
        .select("*")
        .eq("profissional_id", profId)
        .eq("ativo", true)
        .order("dia_semana")
        .order("hora_inicio");
      return data ?? [];
    },
    enabled: !!profId,
  });

  const handleAddSlot = async () => {
    if (!profId) return;
    setLoading(true);
    const { error } = await (supabase.from("disponibilidade_profissional") as any).insert({
      profissional_id: profId,
      dia_semana: newSlot.dia_semana,
      hora_inicio: newSlot.hora_inicio,
      hora_fim: newSlot.hora_fim,
      max_pacientes: newSlot.max_pacientes,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Horário adicionado! ✅" });
      refetch();
    }
    setLoading(false);
  };

  const handleDeleteSlot = async (id: string) => {
    await (supabase.from("disponibilidade_profissional") as any).delete().eq("id", id);
    toast({ title: "Horário removido" });
    refetch();
  };

  const slotsByDay = DIAS_SEMANA.map(dia => ({
    ...dia,
    slots: slots.filter((s: any) => s.dia_semana === dia.value),
  })).filter(d => d.slots.length > 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Clock className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-[Plus_Jakarta_Sans]">Disponibilidade</h1>
          <p className="text-muted-foreground">Configure os horários disponíveis e o limite de pacientes por slot.</p>
        </div>
      </div>

      {(isAdmin || isGestor) && (
        <Card>
          <CardContent className="pt-4">
            <Label>Profissional</Label>
            <Select value={selectedProfissional} onValueChange={setSelectedProfissional}>
              <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
              <SelectContent>
                {profissionais.map((p: any) => (
                  <SelectItem key={p.id} value={p.user_id}>{p.nome}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Adicionar Horário</CardTitle>
          <CardDescription>Defina dia, faixa horária e limite de pacientes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-5 items-end">
            <div className="space-y-1">
              <Label>Dia</Label>
              <Select value={String(newSlot.dia_semana)} onValueChange={v => setNewSlot({ ...newSlot, dia_semana: Number(v) })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DIAS_SEMANA.map(d => (
                    <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Início</Label>
              <Input type="time" value={newSlot.hora_inicio} onChange={e => setNewSlot({ ...newSlot, hora_inicio: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Fim</Label>
              <Input type="time" value={newSlot.hora_fim} onChange={e => setNewSlot({ ...newSlot, hora_fim: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Máx. Pacientes</Label>
              <Input type="number" min={1} max={20} value={newSlot.max_pacientes} onChange={e => setNewSlot({ ...newSlot, max_pacientes: Number(e.target.value) })} />
            </div>
            <Button onClick={handleAddSlot} disabled={loading}>
              <Plus className="h-4 w-4 mr-1" /> Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {slotsByDay.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Nenhum horário configurado ainda.</p>
            </CardContent>
          </Card>
        ) : (
          slotsByDay.map(dia => (
            <Card key={dia.value}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{dia.label}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {dia.slots.map((slot: any) => (
                    <div key={slot.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/30">
                      <div>
                        <span className="text-sm font-medium">{slot.hora_inicio?.slice(0, 5)} - {slot.hora_fim?.slice(0, 5)}</span>
                        <Badge variant="secondary" className="ml-2 text-xs">
                          máx {slot.max_pacientes} pac.
                        </Badge>
                      </div>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDeleteSlot(slot.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default DisponibilidadeProfissional;
