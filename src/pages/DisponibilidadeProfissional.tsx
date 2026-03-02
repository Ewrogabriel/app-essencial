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
import { Clock, Plus, Trash2, Users, CalendarDays, Copy, Edit2, Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const DIAS_SEMANA = [
  { value: 1, label: "Segunda-feira", short: "Seg" },
  { value: 2, label: "Terça-feira", short: "Ter" },
  { value: 3, label: "Quarta-feira", short: "Qua" },
  { value: 4, label: "Quinta-feira", short: "Qui" },
  { value: 5, label: "Sexta-feira", short: "Sex" },
  { value: 6, label: "Sábado", short: "Sáb" },
  { value: 0, label: "Domingo", short: "Dom" },
];

interface Slot {
  id: string;
  dia_semana: number;
  hora_inicio: string;
  hora_fim: string;
  max_pacientes: number;
}

const DisponibilidadeProfissional = () => {
  const { user, isAdmin, isGestor } = useAuth();
  const queryClient = useQueryClient();
  const [selectedProfissional, setSelectedProfissional] = useState<string>(user?.id || "");
  const [newSlot, setNewSlot] = useState({ dia_semana: 1, hora_inicio: "07:00", hora_fim: "12:00", max_pacientes: 3 });
  const [loading, setLoading] = useState(false);
  const [editingSlot, setEditingSlot] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Partial<Slot>>({});
  const [copyFromDay, setCopyFromDay] = useState<number | null>(null);

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
      return (data ?? []) as Slot[];
    },
    enabled: !!profId,
  });

  const handleAddSlot = async () => {
    if (!profId) return;
    if (newSlot.hora_inicio >= newSlot.hora_fim) {
      toast({ title: "Horário inválido", description: "O horário de início deve ser antes do fim.", variant: "destructive" });
      return;
    }
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

  const handleEditSave = async (id: string) => {
    if (editValues.hora_inicio && editValues.hora_fim && editValues.hora_inicio >= editValues.hora_fim) {
      toast({ title: "Horário inválido", variant: "destructive" });
      return;
    }
    const { error } = await (supabase.from("disponibilidade_profissional") as any)
      .update(editValues)
      .eq("id", id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Horário atualizado! ✅" });
      setEditingSlot(null);
      refetch();
    }
  };

  const handleCopyDay = async (fromDay: number, toDay: number) => {
    const fromSlots = slots.filter(s => s.dia_semana === fromDay);
    if (fromSlots.length === 0) {
      toast({ title: "Nenhum horário para copiar", variant: "destructive" });
      return;
    }
    const records = fromSlots.map(s => ({
      profissional_id: profId,
      dia_semana: toDay,
      hora_inicio: s.hora_inicio,
      hora_fim: s.hora_fim,
      max_pacientes: s.max_pacientes,
    }));
    const { error } = await (supabase.from("disponibilidade_profissional") as any).insert(records);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Horários copiados para ${DIAS_SEMANA.find(d => d.value === toDay)?.label}! ✅` });
      refetch();
    }
  };

  const slotsByDay = DIAS_SEMANA.map(dia => ({
    ...dia,
    slots: slots.filter(s => s.dia_semana === dia.value),
  }));

  const totalSlots = slots.length;
  const totalCapacity = slots.reduce((sum, s) => sum + s.max_pacientes, 0);
  const daysConfigured = new Set(slots.map(s => s.dia_semana)).size;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Clock className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold tracking-tight font-[Plus_Jakarta_Sans]">Disponibilidade</h1>
          <p className="text-muted-foreground">Configure horários de atendimento e capacidade por faixa horária.</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <CalendarDays className="h-8 w-8 text-primary opacity-70" />
            <div>
              <p className="text-2xl font-bold">{daysConfigured}</p>
              <p className="text-xs text-muted-foreground">Dias configurados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <Clock className="h-8 w-8 text-primary opacity-70" />
            <div>
              <p className="text-2xl font-bold">{totalSlots}</p>
              <p className="text-xs text-muted-foreground">Faixas horárias</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4 flex items-center gap-3">
            <Users className="h-8 w-8 text-primary opacity-70" />
            <div>
              <p className="text-2xl font-bold">{totalCapacity}</p>
              <p className="text-xs text-muted-foreground">Vagas totais/semana</p>
            </div>
          </CardContent>
        </Card>
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

      {/* Add Slot Form */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Adicionar Faixa Horária</CardTitle>
          <CardDescription>Defina dia, período e capacidade máxima de pacientes simultâneos</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-5 items-end">
            <div className="space-y-1">
              <Label className="text-xs">Dia da semana</Label>
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
              <Label className="text-xs">Início</Label>
              <Input type="time" value={newSlot.hora_inicio} onChange={e => setNewSlot({ ...newSlot, hora_inicio: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Fim</Label>
              <Input type="time" value={newSlot.hora_fim} onChange={e => setNewSlot({ ...newSlot, hora_fim: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Máx. Pacientes</Label>
              <Input type="number" min={1} max={20} value={newSlot.max_pacientes} onChange={e => setNewSlot({ ...newSlot, max_pacientes: Number(e.target.value) })} />
            </div>
            <Button onClick={handleAddSlot} disabled={loading} className="gap-1">
              <Plus className="h-4 w-4" /> Adicionar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Weekly Grid */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Grade Semanal</CardTitle>
          <CardDescription>Visualize e edite todos os horários. Clique no ícone de copiar para replicar um dia.</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="1" className="w-full">
            <TabsList className="w-full grid grid-cols-7 h-auto">
              {DIAS_SEMANA.map(dia => {
                const daySlots = slots.filter(s => s.dia_semana === dia.value);
                return (
                  <TabsTrigger key={dia.value} value={String(dia.value)} className="flex flex-col gap-0.5 py-2 relative">
                    <span className="text-xs font-medium">{dia.short}</span>
                    {daySlots.length > 0 && (
                      <Badge variant="secondary" className="text-[10px] h-4 px-1">
                        {daySlots.length}
                      </Badge>
                    )}
                  </TabsTrigger>
                );
              })}
            </TabsList>

            {DIAS_SEMANA.map(dia => {
              const daySlots = slots.filter(s => s.dia_semana === dia.value);
              return (
                <TabsContent key={dia.value} value={String(dia.value)} className="mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold">{dia.label}</h3>
                    <div className="flex gap-2">
                      {daySlots.length > 0 && (
                        <Select onValueChange={(v) => handleCopyDay(dia.value, Number(v))}>
                          <SelectTrigger className="w-auto h-8 text-xs gap-1">
                            <Copy className="h-3 w-3" />
                            <span>Copiar para...</span>
                          </SelectTrigger>
                          <SelectContent>
                            {DIAS_SEMANA.filter(d => d.value !== dia.value).map(d => (
                              <SelectItem key={d.value} value={String(d.value)}>{d.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    </div>
                  </div>

                  {daySlots.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground border border-dashed rounded-lg">
                      <Clock className="h-6 w-6 mx-auto mb-2 opacity-30" />
                      <p className="text-sm">Nenhum horário configurado</p>
                      <p className="text-xs mt-1">Use o formulário acima para adicionar</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {daySlots.map(slot => (
                        <div key={slot.id} className="flex items-center justify-between p-3 border rounded-lg bg-muted/20 hover:bg-muted/40 transition-colors">
                          {editingSlot === slot.id ? (
                            <>
                              <div className="flex items-center gap-2 flex-1">
                                <Input
                                  type="time"
                                  className="w-28 h-8 text-sm"
                                  value={editValues.hora_inicio || slot.hora_inicio.slice(0, 5)}
                                  onChange={e => setEditValues({ ...editValues, hora_inicio: e.target.value })}
                                />
                                <span className="text-muted-foreground">—</span>
                                <Input
                                  type="time"
                                  className="w-28 h-8 text-sm"
                                  value={editValues.hora_fim || slot.hora_fim.slice(0, 5)}
                                  onChange={e => setEditValues({ ...editValues, hora_fim: e.target.value })}
                                />
                                <div className="flex items-center gap-1">
                                  <Users className="h-3 w-3 text-muted-foreground" />
                                  <Input
                                    type="number"
                                    min={1}
                                    max={20}
                                    className="w-16 h-8 text-sm"
                                    value={editValues.max_pacientes ?? slot.max_pacientes}
                                    onChange={e => setEditValues({ ...editValues, max_pacientes: Number(e.target.value) })}
                                  />
                                </div>
                              </div>
                              <div className="flex gap-1 ml-2">
                                <Button size="icon" variant="ghost" className="h-7 w-7 text-green-600" onClick={() => handleEditSave(slot.id)}>
                                  <Check className="h-3.5 w-3.5" />
                                </Button>
                                <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditingSlot(null)}>
                                  <X className="h-3.5 w-3.5" />
                                </Button>
                              </div>
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-3">
                                <div className="flex items-center gap-1.5">
                                  <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                                  <span className="text-sm font-medium">
                                    {slot.hora_inicio?.slice(0, 5)} — {slot.hora_fim?.slice(0, 5)}
                                  </span>
                                </div>
                                <Badge variant="secondary" className="text-xs gap-1">
                                  <Users className="h-3 w-3" />
                                  máx {slot.max_pacientes}
                                </Badge>
                              </div>
                              <div className="flex gap-1">
                                <Button
                                  size="icon"
                                  variant="ghost"
                                  className="h-7 w-7"
                                  onClick={() => {
                                    setEditingSlot(slot.id);
                                    setEditValues({
                                      hora_inicio: slot.hora_inicio.slice(0, 5),
                                      hora_fim: slot.hora_fim.slice(0, 5),
                                      max_pacientes: slot.max_pacientes,
                                    });
                                  }}
                                >
                                  <Edit2 className="h-3.5 w-3.5" />
                                </Button>
                                <AlertDialog>
                                  <AlertDialogTrigger asChild>
                                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive">
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </Button>
                                  </AlertDialogTrigger>
                                  <AlertDialogContent>
                                    <AlertDialogHeader>
                                      <AlertDialogTitle>Remover horário?</AlertDialogTitle>
                                      <AlertDialogDescription>
                                        Isso removerá a faixa {slot.hora_inicio?.slice(0, 5)} — {slot.hora_fim?.slice(0, 5)} de {dia.label}. Agendamentos existentes não serão afetados.
                                      </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                      <AlertDialogAction onClick={() => handleDeleteSlot(slot.id)}>Remover</AlertDialogAction>
                                    </AlertDialogFooter>
                                  </AlertDialogContent>
                                </AlertDialog>
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default DisponibilidadeProfissional;
