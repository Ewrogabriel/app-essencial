import { useAuth } from "@/hooks/useAuth";
import { useClinic } from "@/hooks/useClinic";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PatientAgendaTab } from "@/components/patient/PatientAgendaTab";
import { PatientFinanceTab } from "@/components/patient/PatientFinanceTab";
import { PatientProdutosTab } from "@/components/patient/PatientProdutosTab";
import { GamificationDashboard } from "@/components/gamification/GamificationDashboard";
import { AlertCircle, Calendar, CreditCard, Package, Trophy, Info, Dumbbell } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

export default function PatientDashboard() {
  const { user, profile } = useAuth();
  const { clinicId } = useClinic();
  const navigate = useNavigate();

  const { data: paciente } = useQuery({
    queryKey: ["paciente-by-user", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("pacientes")
        .select("id, nome")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: avisos } = useQuery({
    queryKey: ["avisos-ativos", clinicId],
    queryFn: async () => {
      const { data } = await supabase
        .from("avisos")
        .select("*")
        .eq("ativo", true)
        .eq("clinic_id", clinicId)
        .order("created_at", { ascending: false })
        .limit(3);
      return data || [];
    },
    enabled: !!clinicId,
  });

  const { data: clinicSettings } = useQuery({
    queryKey: ["clinic-settings", clinicId],
    queryFn: async () => {
      const { data } = await supabase
        .from("clinicas")
        .select("*")
        .eq("id", clinicId)
        .single();
      return data;
    },
    enabled: !!clinicId,
  });

  const { data: feriados } = useQuery({
    queryKey: ["feriados-proximos"],
    queryFn: async () => {
      const today = new Date().toISOString().split("T")[0];
      const { data } = await supabase
        .from("feriados")
        .select("*")
        .gte("data", today)
        .order("data")
        .limit(3);
      return data || [];
    },
  });

  const { data: planosCount } = useQuery({
    queryKey: ["planos-exercicios-count", paciente?.id],
    queryFn: async () => {
      if (!paciente?.id) return 0;
      const { count } = await supabase
        .from("planos_exercicios")
        .select("*", { count: "exact", head: true })
        .eq("paciente_id", paciente.id)
        .eq("ativo", true);
      return count || 0;
    },
    enabled: !!paciente?.id,
  });

  if (!paciente) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Sua conta não está vinculada a um cadastro de paciente. Entre em contato com a clínica.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 space-y-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          Olá, {profile?.nome || paciente?.nome}! 👋
        </h1>
        <p className="text-muted-foreground">Bem-vindo ao seu portal</p>
      </div>

      {/* Quick Access Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card
          className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-primary"
          onClick={() => navigate("/minha-agenda")}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Calendar className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">Minha Agenda</p>
              <p className="text-xs text-muted-foreground">Ver sessões</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-green-500"
          onClick={() => navigate("/meus-pagamentos")}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <CreditCard className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-sm font-medium">Pagamentos</p>
              <p className="text-xs text-muted-foreground">Financeiro</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-purple-500"
          onClick={() => navigate("/planos-exercicios")}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Dumbbell className="h-5 w-5 text-purple-500" />
            </div>
            <div>
              <p className="text-sm font-medium">Exercícios</p>
              <p className="text-xs text-muted-foreground">{planosCount} plano(s)</p>
            </div>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md transition-shadow border-l-4 border-l-amber-500"
          onClick={() => navigate("/meus-planos")}
        >
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <Package className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm font-medium">Meus Planos</p>
              <p className="text-xs text-muted-foreground">Sessões</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Calendar className="h-5 w-5 text-primary" />
              Próximas Sessões
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PatientAgendaTab pacienteId={paciente.id} clinicId={clinicId} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <CreditCard className="h-5 w-5 text-green-600" />
              Financeiro
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PatientFinanceTab pacienteId={paciente.id} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Package className="h-5 w-5 text-purple-600" />
              Produtos Disponíveis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <PatientProdutosTab pacienteId={paciente.id} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Trophy className="h-5 w-5 text-amber-500" />
              Minhas Conquistas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <GamificationDashboard pacienteId={paciente.id} />
          </CardContent>
        </Card>
      </div>

      {/* Info Section */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Info className="h-5 w-5 text-blue-600" />
            Informações
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div>
              <h4 className="font-semibold mb-3 text-sm">Mural de Avisos</h4>
              {avisos && avisos.length > 0 ? (
                <div className="space-y-2">
                  {avisos.map((aviso) => (
                    <div key={aviso.id} className="p-3 bg-muted rounded-lg">
                      <p className="font-medium text-sm">{aviso.titulo}</p>
                      <p className="text-xs text-muted-foreground line-clamp-2">{aviso.mensagem}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Nenhum aviso no momento</p>
              )}
            </div>

            <div>
              <h4 className="font-semibold mb-3 text-sm">Próximos Feriados</h4>
              {feriados && feriados.length > 0 ? (
                <div className="space-y-2">
                  {feriados.map((f) => (
                    <div key={f.id} className="p-3 bg-muted rounded-lg">
                      <p className="font-medium text-sm">{f.descricao}</p>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(f.data), "dd 'de' MMMM", { locale: ptBR })}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Sem feriados próximos</p>
              )}
            </div>

            <div>
              <h4 className="font-semibold mb-3 text-sm">Dados da Clínica</h4>
              {clinicSettings ? (
                <div className="space-y-1 text-sm">
                  <p className="font-medium">{clinicSettings.nome}</p>
                  {clinicSettings.telefone && <p className="text-muted-foreground">📞 {clinicSettings.telefone}</p>}
                  {clinicSettings.whatsapp && <p className="text-muted-foreground">💬 {clinicSettings.whatsapp}</p>}
                  {clinicSettings.endereco && (
                    <p className="text-muted-foreground text-xs">
                      📍 {clinicSettings.endereco}
                      {clinicSettings.numero && `, ${clinicSettings.numero}`}
                      {clinicSettings.bairro && ` - ${clinicSettings.bairro}`}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Carregando...</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
