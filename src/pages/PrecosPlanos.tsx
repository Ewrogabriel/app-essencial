import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Tag, Percent } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "@/hooks/use-toast";

const PrecosPlanos = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [planoOpen, setPlanoOpen] = useState(false);
  const [editPlano, setEditPlano] = useState<any>(null);
  const [descontoOpen, setDescontoOpen] = useState(false);
  const [planoForm, setPlanoForm] = useState({ nome: "", descricao: "", frequencia_semanal: 1, modalidade: "grupo", valor: "" });
  const [descontoForm, setDescontoForm] = useState({ paciente_id: "", preco_plano_id: "", percentual_desconto: "", motivo: "" });

  const { data: planos = [] } = useQuery({
    queryKey: ["precos-planos"],
    queryFn: async () => {
      const { data } = await supabase.from("precos_planos").select("*").order("nome") as any;
      return data ?? [];
    },
  });

  const { data: descontos = [] } = useQuery({
    queryKey: ["descontos-pacientes"],
    queryFn: async () => {
      const { data } = await supabase
        .from("descontos_pacientes")
        .select("*, pacientes(nome), precos_planos(nome)")
        .order("created_at", { ascending: false }) as any;
      return data ?? [];
    },
  });

  const { data: pacientes = [] } = useQuery({
    queryKey: ["pacientes-desconto"],
    queryFn: async () => {
      const { data } = await supabase.from("pacientes").select("id, nome").eq("status", "ativo").order("nome");
      return data ?? [];
    },
  });

  const savePlano = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Não autenticado");
      const payload = {
        nome: planoForm.nome,
        descricao: planoForm.descricao || null,
        frequencia_semanal: planoForm.frequencia_semanal,
        modalidade: planoForm.modalidade,
        valor: parseFloat(planoForm.valor) || 0,
        created_by: user.id,
      };
      if (editPlano) {
        const { error } = await supabase.from("precos_planos").update(payload).eq("id", editPlano.id) as any;
        if (error) throw error;
      } else {
        const { error } = await supabase.from("precos_planos").insert(payload) as any;
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["precos-planos"] });
      setPlanoOpen(false);
      setEditPlano(null);
      setPlanoForm({ nome: "", descricao: "", frequencia_semanal: 1, modalidade: "grupo", valor: "" });
      toast({ title: editPlano ? "Plano atualizado!" : "Plano criado!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const togglePlano = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const { error } = await supabase.from("precos_planos").update({ ativo }).eq("id", id) as any;
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["precos-planos"] }),
  });

  const deletePlano = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("precos_planos").delete().eq("id", id) as any;
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["precos-planos"] });
      toast({ title: "Plano removido!" });
    },
  });

  const saveDesconto = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Não autenticado");
      const { error } = await supabase.from("descontos_pacientes").insert({
        paciente_id: descontoForm.paciente_id,
        preco_plano_id: descontoForm.preco_plano_id || null,
        percentual_desconto: parseFloat(descontoForm.percentual_desconto) || 0,
        motivo: descontoForm.motivo || null,
        created_by: user.id,
      }) as any;
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["descontos-pacientes"] });
      setDescontoOpen(false);
      setDescontoForm({ paciente_id: "", preco_plano_id: "", percentual_desconto: "", motivo: "" });
      toast({ title: "Desconto adicionado!" });
    },
    onError: (e: any) => toast({ title: "Erro", description: e.message, variant: "destructive" }),
  });

  const deleteDesconto = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("descontos_pacientes").delete().eq("id", id) as any;
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["descontos-pacientes"] });
      toast({ title: "Desconto removido!" });
    },
  });

  const openEdit = (p: any) => {
    setEditPlano(p);
    setPlanoForm({
      nome: p.nome,
      descricao: p.descricao || "",
      frequencia_semanal: p.frequencia_semanal,
      modalidade: p.modalidade,
      valor: String(p.valor),
    });
    setPlanoOpen(true);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tabela de Preços & Descontos</h1>
        <p className="text-muted-foreground">Gerencie os valores fixos dos planos e descontos por paciente</p>
      </div>

      <Tabs defaultValue="planos">
        <TabsList>
          <TabsTrigger value="planos"><Tag className="h-4 w-4 mr-1" /> Planos</TabsTrigger>
          <TabsTrigger value="descontos"><Percent className="h-4 w-4 mr-1" /> Descontos</TabsTrigger>
        </TabsList>

        <TabsContent value="planos" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setEditPlano(null); setPlanoForm({ nome: "", descricao: "", frequencia_semanal: 1, modalidade: "grupo", valor: "" }); setPlanoOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" /> Novo Plano
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Frequência</TableHead>
                    <TableHead>Modalidade</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Ativo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(planos as any[]).map((p: any) => (
                    <TableRow key={p.id}>
                      <TableCell className="font-medium">{p.nome}</TableCell>
                      <TableCell>{p.frequencia_semanal}x/semana</TableCell>
                      <TableCell className="capitalize">{p.modalidade}</TableCell>
                      <TableCell>R$ {Number(p.valor).toFixed(2)}</TableCell>
                      <TableCell>
                        <Switch checked={p.ativo} onCheckedChange={(v) => togglePlano.mutate({ id: p.id, ativo: v })} />
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="icon" variant="ghost" onClick={() => openEdit(p)}><Pencil className="h-4 w-4" /></Button>
                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deletePlano.mutate(p.id)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {planos.length === 0 && (
                    <TableRow><TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Nenhum plano cadastrado</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="descontos" className="space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => setDescontoOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Novo Desconto
            </Button>
          </div>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Paciente</TableHead>
                    <TableHead>Plano</TableHead>
                    <TableHead>Desconto</TableHead>
                    <TableHead>Motivo</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(descontos as any[]).map((d: any) => (
                    <TableRow key={d.id}>
                      <TableCell className="font-medium">{d.pacientes?.nome ?? "—"}</TableCell>
                      <TableCell>{d.precos_planos?.nome ?? "Todos"}</TableCell>
                      <TableCell><Badge variant="secondary">{d.percentual_desconto}%</Badge></TableCell>
                      <TableCell>{d.motivo || "—"}</TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" className="text-destructive" onClick={() => deleteDesconto.mutate(d.id)}><Trash2 className="h-4 w-4" /></Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {descontos.length === 0 && (
                    <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum desconto cadastrado</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Plan form dialog */}
      <Dialog open={planoOpen} onOpenChange={setPlanoOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader><DialogTitle>{editPlano ? "Editar Plano" : "Novo Plano"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome do Plano</Label>
              <Input placeholder="Ex: Pilates 2x Grupo" value={planoForm.nome} onChange={(e) => setPlanoForm(p => ({ ...p, nome: e.target.value }))} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Input placeholder="Opcional" value={planoForm.descricao} onChange={(e) => setPlanoForm(p => ({ ...p, descricao: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Frequência semanal</Label>
                <Select value={String(planoForm.frequencia_semanal)} onValueChange={(v) => setPlanoForm(p => ({ ...p, frequencia_semanal: Number(v) }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map(n => <SelectItem key={n} value={String(n)}>{n}x/semana</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Modalidade</Label>
                <Select value={planoForm.modalidade} onValueChange={(v) => setPlanoForm(p => ({ ...p, modalidade: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="individual">Individual</SelectItem>
                    <SelectItem value="grupo">Grupo</SelectItem>
                    <SelectItem value="duo">Duo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Valor mensal (R$)</Label>
              <Input type="number" step="0.01" placeholder="0,00" value={planoForm.valor} onChange={(e) => setPlanoForm(p => ({ ...p, valor: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setPlanoOpen(false)}>Cancelar</Button>
              <Button onClick={() => savePlano.mutate()} disabled={!planoForm.nome || savePlano.isPending}>
                {savePlano.isPending ? "Salvando..." : editPlano ? "Atualizar" : "Criar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Discount form dialog */}
      <Dialog open={descontoOpen} onOpenChange={setDescontoOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader><DialogTitle>Novo Desconto</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Paciente</Label>
              <Select value={descontoForm.paciente_id} onValueChange={(v) => setDescontoForm(p => ({ ...p, paciente_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {(pacientes as any[]).map((p: any) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Plano (opcional – deixe vazio para todos)</Label>
              <Select value={descontoForm.preco_plano_id} onValueChange={(v) => setDescontoForm(p => ({ ...p, preco_plano_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Todos os planos" /></SelectTrigger>
                <SelectContent>
                  {(planos as any[]).filter((p: any) => p.ativo).map((p: any) => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Percentual de desconto (%)</Label>
              <Input type="number" step="1" min="1" max="100" placeholder="10" value={descontoForm.percentual_desconto} onChange={(e) => setDescontoForm(p => ({ ...p, percentual_desconto: e.target.value }))} />
            </div>
            <div>
              <Label>Motivo</Label>
              <Input placeholder="Ex: Fidelidade, Funcionário" value={descontoForm.motivo} onChange={(e) => setDescontoForm(p => ({ ...p, motivo: e.target.value }))} />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <Button variant="outline" onClick={() => setDescontoOpen(false)}>Cancelar</Button>
              <Button onClick={() => saveDesconto.mutate()} disabled={!descontoForm.paciente_id || !descontoForm.percentual_desconto || saveDesconto.isPending}>
                {saveDesconto.isPending ? "Salvando..." : "Adicionar"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PrecosPlanos;
