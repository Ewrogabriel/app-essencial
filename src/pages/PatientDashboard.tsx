import { useAuth } from "@/hooks/useAuth";
import { useClinic } from "@/hooks/useClinic";
import { Card, CardContent } from "@/components/ui/card";
import { GamificationDashboard } from "@/components/gamification/GamificationDashboard";
import {
  AlertCircle, Calendar, CreditCard, Trophy, Dumbbell,
  ClipboardList, FileText, MessageSquare, Handshake, User,
  ChevronRight, Megaphone, CalendarDays, Gift, Star, Phone,
  MapPin, AlertTriangle, CheckCircle2, Info
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function PatientDashboard() {
  const { user, profile } = useAuth();
  const { activeClinicId } = useClinic();
  const navigate = useNavigate();

  const { data: paciente } = useQuery({
    queryKey: ["paciente-by-user", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from("pacientes")
        .select("id, nome, cpf")
        .eq("user_id", user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user?.id,
  });

  const { data: nextAppointments = [] } = useQuery({
    queryKey: ["patient-next-appointments", paciente?.id],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data } = await supabase
        .from("agendamentos")
        .select("id, data_horario, tipo_atendimento, status")
        .eq("paciente_id", paciente!.id)
        .gte("data_horario", now)
        .in("status", ["agendado", "confirmado"])
        .order("data_horario")
        .limit(3);
      return data || [];
    },
    enabled: !!paciente?.id,
  });

  const { data: planosCount } = useQuery({
    queryKey: ["planos-exercicios-count", paciente?.id],
    queryFn: async () => {
      if (!paciente?.id) return 0;
      const { count } = await (supabase
        .from("planos_exercicios")
        .select("*", { count: "exact", head: true })
        .eq("paciente_id", paciente.id) as any)
        .eq("ativo", true);
      return (count as number) || 0;
    },
    enabled: !!paciente?.id,
  });

  const { data: pendingCount } = useQuery({
    queryKey: ["patient-pending-count", paciente?.id],
    queryFn: async () => {
      if (!paciente?.id) return 0;
      const { count } = await supabase
        .from("pagamentos")
        .select("*", { count: "exact", head: true })
        .eq("paciente_id", paciente.id)
        .eq("status", "pendente");
      return count || 0;
    },
    enabled: !!paciente?.id,
  });

  const { data: rewardsAvailable = [] } = useQuery({
    queryKey: ["rewards-catalog-active"],
    queryFn: async () => {
      const { data } = await supabase
        .from("rewards_catalog")
        .select("*")
        .eq("ativo", true)
        .order("pontos_necessarios");
      return data || [];
    },
  });

  const { data: avisos = [] } = useQuery({
    queryKey: ["avisos-ativos", activeClinicId],
    queryFn: async () => {
      const { data } = await supabase
        .from("avisos")
        .select("*")
        .eq("ativo", true)
        .eq("clinic_id", activeClinicId!)
        .order("created_at", { ascending: false })
        .limit(3);
      return data || [];
    },
    enabled: !!activeClinicId,
  });

  const { data: clinicSettings } = useQuery({
    queryKey: ["clinic-settings", activeClinicId],
    queryFn: async () => {
      const { data } = await supabase
        .from("clinicas")
        .select("*")
        .eq("id", activeClinicId!)
        .single();
      return data;
    },
    enabled: !!activeClinicId,
  });

  const { data: feriados = [] } = useQuery({
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

  const { data: totalPoints } = useQuery({
    queryKey: ["patient-total-points", paciente?.id],
    queryFn: async () => {
      if (!paciente?.id) return 0;
      const { data } = await supabase
        .from("patient_points")
        .select("pontos")
        .eq("paciente_id", paciente.id);
      return (data || []).reduce((sum, p) => sum + (p.pontos || 0), 0);
    },
    enabled: !!paciente?.id,
  });

  const redeemReward = async (reward: any) => {
    if (!paciente?.id) return;
    if ((totalPoints || 0) < reward.pontos_necessarios) {
      toast.error("Pontos insuficientes para este resgate.");
      return;
    }
    try {
      const expiresAt = reward.validade_dias
        ? new Date(Date.now() + reward.validade_dias * 86400000).toISOString()
        : null;
      const { error } = await supabase.from("rewards_redemptions").insert({
        reward_id: reward.id,
        paciente_id: paciente.id,
        pontos_gastos: reward.pontos_necessarios,
        status: "pendente",
        codigo_desconto: `DESC-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        expira_em: expiresAt,
      });
      if (error) throw error;
      toast.success("Resgate solicitado! Aguarde aprovação da clínica.");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

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

  const recursos = [
    {
      label: "Minha Agenda",
      desc: "Sessões agendadas e histórico",
      icon: Calendar,
      badge: nextAppointments.length > 0 ? `${nextAppointments.length} próxima(s)` : null,
      badgeVariant: "default" as const,
      route: "/minha-agenda",
      iconColor: "text-blue-600",
      iconBg: "bg-blue-50",
    },
    {
      label: "Exercícios",
      desc: "Planos e atividades prescritas",
      icon: Dumbbell,
      badge: planosCount ? `${planosCount} ativo(s)` : null,
      badgeVariant: "secondary" as const,
      route: "/planos-exercicios",
      iconColor: "text-purple-600",
      iconBg: "bg-purple-50",
    },
    {
      label: "Meus Planos",
      desc: "Pacotes de sessões contratados",
      icon: ClipboardList,
      badge: null,
      badgeVariant: "secondary" as const,
      route: "/meus-planos",
      iconColor: "text-amber-600",
      iconBg: "bg-amber-50",
    },
    {
      label: "Pagamentos",
      desc: "Faturas e histórico financeiro",
      icon: CreditCard,
      badge: pendingCount ? `${pendingCount} pendente(s)` : null,
      badgeVariant: "destructive" as const,
      route: "/meus-pagamentos",
      iconColor: "text-green-600",
      iconBg: "bg-green-50",
    },
    {
      label: "Mensagens",
      desc: "Fale com a clínica e profissionais",
      icon: MessageSquare,
      badge: null,
      badgeVariant: "secondary" as const,
      route: "/mensagens",
      iconColor: "text-rose-600",
      iconBg: "bg-rose-50",
    },
    {
      label: "Contratos",
      desc: "Documentos e assinaturas",
      icon: FileText,
      badge: null,
      badgeVariant: "secondary" as const,
      route: "/contratos",
      iconColor: "text-teal-600",
      iconBg: "bg-teal-50",
    },
    {
      label: "Convênios",
      desc: "Parceiros e benefícios",
      icon: Handshake,
      badge: null,
      badgeVariant: "secondary" as const,
      route: "/convenios",
      iconColor: "text-sky-600",
      iconBg: "bg-sky-50",
    },
    {
      label: "Meu Perfil",
      desc: "Dados pessoais e configurações",
      icon: User,
      badge: null,
      badgeVariant: "secondary" as const,
      route: "/meu-perfil",
      iconColor: "text-indigo-600",
      iconBg: "bg-indigo-50",
    },
  ];

  return (
    <div className="container mx-auto p-4 space-y-6 max-w-5xl">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Olá, {profile?.nome || paciente?.nome}!
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Bem-vindo ao seu portal de saúde</p>
        </div>
        <button
          onClick={() => navigate("/meu-perfil")}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 hover:bg-primary/20 transition-colors"
        >
          <User className="h-5 w-5 text-primary" />
        </button>
      </div>

      {/* Alerta de pagamentos pendentes */}
      {(pendingCount || 0) > 0 && (
        <button
          onClick={() => navigate("/meus-pagamentos")}
          className="w-full text-left"
        >
          <Alert className="border-destructive/50 bg-destructive/5 cursor-pointer hover:bg-destructive/10 transition-colors">
            <AlertTriangle className="h-4 w-4 text-destructive" />
            <AlertDescription className="text-destructive font-medium">
              Você tem {pendingCount} pagamento(s) pendente(s). Clique para visualizar.
            </AlertDescription>
          </Alert>
        </button>
      )}

      {/* Resumo rápido */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <button
          onClick={() => navigate("/minha-agenda")}
          className="group"
        >
          <Card className="group-hover:shadow-md transition-all group-hover:border-blue-200 cursor-pointer h-full">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center w-10 h-10 bg-blue-50 rounded-full mx-auto mb-2 group-hover:scale-110 transition-transform">
                <Calendar className="h-5 w-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-foreground">{nextAppointments.length}</p>
              <p className="text-xs text-muted-foreground">Próximas sessões</p>
            </CardContent>
          </Card>
        </button>

        <button onClick={() => navigate("/planos-exercicios")} className="group">
          <Card className="group-hover:shadow-md transition-all group-hover:border-purple-200 cursor-pointer h-full">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center w-10 h-10 bg-purple-50 rounded-full mx-auto mb-2 group-hover:scale-110 transition-transform">
                <Dumbbell className="h-5 w-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-foreground">{planosCount || 0}</p>
              <p className="text-xs text-muted-foreground">Planos de exercício</p>
            </CardContent>
          </Card>
        </button>

        <button onClick={() => navigate("/meus-pagamentos")} className="group">
          <Card className={`group-hover:shadow-md transition-all cursor-pointer h-full ${(pendingCount || 0) > 0 ? "border-destructive/30 group-hover:border-destructive/50" : "group-hover:border-green-200"}`}>
            <CardContent className="p-4 text-center">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full mx-auto mb-2 group-hover:scale-110 transition-transform ${(pendingCount || 0) > 0 ? "bg-destructive/10" : "bg-green-50"}`}>
                <CreditCard className={`h-5 w-5 ${(pendingCount || 0) > 0 ? "text-destructive" : "text-green-600"}`} />
              </div>
              <p className="text-2xl font-bold text-foreground">{pendingCount || 0}</p>
              <p className="text-xs text-muted-foreground">Pendências financeiras</p>
            </CardContent>
          </Card>
        </button>

        <button onClick={() => navigate("/minha-agenda")} className="group">
          <Card className="group-hover:shadow-md transition-all group-hover:border-amber-200 cursor-pointer h-full">
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center w-10 h-10 bg-amber-50 rounded-full mx-auto mb-2 group-hover:scale-110 transition-transform">
                <Star className="h-5 w-5 text-amber-500" />
              </div>
              <p className="text-2xl font-bold text-foreground">{totalPoints || 0}</p>
              <p className="text-xs text-muted-foreground">Pontos acumulados</p>
            </CardContent>
          </Card>
        </button>
      </div>

      {/* Próximas sessões */}
      {nextAppointments.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Calendar className="h-4 w-4 text-blue-600" />
              Próximas Sessões
            </h2>
            <button
              onClick={() => navigate("/minha-agenda")}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              Ver tudo <ChevronRight className="h-3 w-3" />
            </button>
          </div>
          <div className="space-y-2">
            {nextAppointments.map((apt) => (
              <button
                key={apt.id}
                onClick={() => navigate("/minha-agenda")}
                className="w-full text-left"
              >
                <Card className="hover:shadow-md hover:border-blue-200 transition-all cursor-pointer">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-9 h-9 bg-blue-50 rounded-lg shrink-0">
                        <Calendar className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          {format(new Date(apt.data_horario), "EEEE, dd/MM 'às' HH:mm", { locale: ptBR })}
                        </p>
                        <p className="text-xs text-muted-foreground">{apt.tipo_atendimento}</p>
                      </div>
                    </div>
                    <Badge
                      variant={apt.status === "confirmado" ? "default" : "secondary"}
                      className="text-xs shrink-0"
                    >
                      {apt.status === "confirmado" ? (
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                      ) : null}
                      {apt.status}
                    </Badge>
                  </CardContent>
                </Card>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Recursos principais */}
      <div>
        <h2 className="text-sm font-semibold text-foreground mb-3">Meus Recursos</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {recursos.map((item) => (
            <button
              key={item.label}
              onClick={() => navigate(item.route)}
              className="text-left group"
            >
              <Card className="hover:shadow-md transition-all cursor-pointer h-full group-hover:border-primary/20 active:scale-[0.99]">
                <CardContent className="p-4 flex items-center gap-4">
                  <div className={`flex items-center justify-center w-11 h-11 ${item.iconBg} rounded-xl shrink-0 group-hover:scale-105 transition-transform`}>
                    <item.icon className={`h-5 w-5 ${item.iconColor}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold text-foreground">{item.label}</p>
                      {item.badge && (
                        <Badge variant={item.badgeVariant} className="text-xs h-5 px-1.5">
                          {item.badge}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{item.desc}</p>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:translate-x-1 transition-transform" />
                </CardContent>
              </Card>
            </button>
          ))}
        </div>
      </div>

      {/* Conquistas / Gamificação */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" />
            Conquistas e Pontos
          </h2>
          <Badge variant="outline" className="gap-1">
            <Star className="h-3 w-3 text-amber-500" />
            {totalPoints || 0} pts
          </Badge>
        </div>
        <Card>
          <CardContent className="p-4">
            <GamificationDashboard pacienteId={paciente.id} />
          </CardContent>
        </Card>
      </div>

      {/* Recompensas disponíveis */}
      {rewardsAvailable.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Gift className="h-4 w-4 text-rose-500" />
            Recompensas Disponíveis
          </h2>
          <div className="grid sm:grid-cols-2 gap-3">
            {rewardsAvailable.map((reward: any) => {
              const canRedeem = (totalPoints || 0) >= reward.pontos_necessarios;
              return (
                <Card
                  key={reward.id}
                  className={`transition-all ${canRedeem ? "border-primary/30 hover:shadow-md hover:border-primary/50" : "opacity-60"}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm text-foreground">{reward.nome}</p>
                        {reward.descricao && (
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{reward.descricao}</p>
                        )}
                      </div>
                      <Badge variant="outline" className="gap-1 shrink-0 text-xs">
                        <Star className="h-3 w-3 text-amber-500" />
                        {reward.pontos_necessarios} pts
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge className="bg-green-600 text-white text-xs">
                        {reward.tipo === "desconto_percentual"
                          ? `${reward.percentual_desconto}% OFF`
                          : `R$ ${reward.valor_desconto?.toFixed(2)}`}
                      </Badge>
                      <Button
                        size="sm"
                        variant={canRedeem ? "default" : "outline"}
                        disabled={!canRedeem}
                        onClick={() => redeemReward(reward)}
                        className="h-7 text-xs gap-1"
                      >
                        <Gift className="h-3 w-3" />
                        Resgatar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Avisos da clínica */}
      {avisos.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
            <Megaphone className="h-4 w-4 text-primary" />
            Avisos da Clínica
          </h2>
          <div className="space-y-2">
            {avisos.map((aviso) => (
              <Card key={aviso.id} className="border-l-4 border-l-primary">
                <CardContent className="p-4">
                  <p className="font-semibold text-sm text-foreground">{aviso.titulo}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{aviso.mensagem}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Informações e Feriados */}
      <div className="grid sm:grid-cols-2 gap-4">

        {/* Feriados */}
        {feriados.length > 0 && (
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-sky-600" />
              Próximos Feriados
            </h2>
            <Card>
              <CardContent className="p-4 space-y-2">
                {feriados.map((f) => (
                  <div key={f.id} className="flex items-center justify-between py-2 border-b last:border-0">
                    <p className="text-sm font-medium text-foreground">{f.descricao}</p>
                    <p className="text-xs text-muted-foreground shrink-0 ml-2">
                      {format(new Date(f.data), "dd/MM", { locale: ptBR })}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Dados da clínica */}
        {clinicSettings && (
          <div>
            <h2 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Info className="h-4 w-4 text-indigo-600" />
              Contato da Clínica
            </h2>
            <Card>
              <CardContent className="p-4 space-y-3">
                <p className="font-semibold text-sm text-foreground">{clinicSettings.nome}</p>
                {clinicSettings.telefone && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Phone className="h-4 w-4 shrink-0" />
                    <span>{clinicSettings.telefone}</span>
                  </div>
                )}
                {clinicSettings.whatsapp && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MessageSquare className="h-4 w-4 shrink-0" />
                    <span>{clinicSettings.whatsapp}</span>
                  </div>
                )}
                {clinicSettings.endereco && (
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <MapPin className="h-4 w-4 shrink-0 mt-0.5" />
                    <span>
                      {clinicSettings.endereco}
                      {clinicSettings.numero && `, ${clinicSettings.numero}`}
                      {clinicSettings.bairro && ` - ${clinicSettings.bairro}`}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </div>

    </div>
  );
}
