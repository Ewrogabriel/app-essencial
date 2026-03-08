import { useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Notificacao {
  id: string;
  tipo: string;
  titulo: string;
  resumo: string;
  conteudo: string | null;
  lida: boolean;
  link: string | null;
  metadata: any;
  created_at: string;
}

export function NotificationBell() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [detail, setDetail] = useState<Notificacao | null>(null);

  const { data: notificacoes = [] } = useQuery({
    queryKey: ["notificacoes", user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await (supabase
        .from("notificacoes")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(50) as any);
      if (error) throw error;
      return (data || []) as Notificacao[];
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  // Realtime subscription + browser notifications
  useEffect(() => {
    if (!user) return;

    // Request browser notification permission
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const channel = supabase
      .channel("notificacoes-bell")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notificacoes", filter: `user_id=eq.${user.id}` }, (payload: any) => {
        queryClient.invalidateQueries({ queryKey: ["notificacoes"] });
        
        // Show browser notification
        if ("Notification" in window && Notification.permission === "granted") {
          const data = payload.new;
          new Notification(data.titulo || "Nova notificação", {
            body: data.resumo || "",
            icon: "/favicon.ico",
          });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id]);

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      await (supabase.from("notificacoes").update({ lida: true }).eq("id", id) as any);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notificacoes"] }),
  });

  const markAllRead = useMutation({
    mutationFn: async () => {
      if (!user) return;
      await (supabase.from("notificacoes").update({ lida: true }).eq("user_id", user.id).eq("lida", false) as any);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notificacoes"] }),
  });

  const unreadCount = notificacoes.filter((n) => !n.lida).length;

  const handleClick = (notif: Notificacao) => {
    if (!notif.lida) markRead.mutate(notif.id);
    if (notif.conteudo) {
      setDetail(notif);
      setOpen(false);
    } else if (notif.link) {
      navigate(notif.link);
      setOpen(false);
    }
  };

  const tipoColor: Record<string, string> = {
    remarcacao: "bg-amber-100 text-amber-800",
    feriado: "bg-red-100 text-red-800",
    bloqueio: "bg-orange-100 text-orange-800",
    mensagem: "bg-blue-100 text-blue-800",
    lembrete: "bg-green-100 text-green-800",
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="relative h-9 w-9">
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 h-5 w-5 flex items-center justify-center rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-96 p-0" align="end">
          <div className="flex items-center justify-between p-3 border-b">
            <h4 className="text-sm font-semibold">Notificações</h4>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => markAllRead.mutate()}>
                Marcar todas como lidas
              </Button>
            )}
          </div>
          <ScrollArea className="max-h-[400px]">
            {notificacoes.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma notificação</p>
            ) : (
              <div className="divide-y">
                {notificacoes.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => handleClick(n)}
                    className={`w-full text-left p-3 hover:bg-muted/50 transition-colors ${!n.lida ? "bg-primary/5" : ""}`}
                  >
                    <div className="flex items-start gap-2">
                      <Badge className={`text-[10px] shrink-0 ${tipoColor[n.tipo] || "bg-muted text-muted-foreground"}`}>
                        {n.tipo}
                      </Badge>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm truncate ${!n.lida ? "font-semibold" : ""}`}>{n.titulo}</p>
                        <p className="text-xs text-muted-foreground truncate">{n.resumo}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                          {format(new Date(n.created_at), "dd/MM 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>
                      {!n.lida && <span className="h-2 w-2 rounded-full bg-primary shrink-0 mt-1.5" />}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </PopoverContent>
      </Popover>

      {/* Detail dialog */}
      <Dialog open={!!detail} onOpenChange={(o) => !o && setDetail(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Badge className={tipoColor[detail?.tipo || ""] || ""}>
                {detail?.tipo}
              </Badge>
              {detail?.titulo}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{detail?.resumo}</p>
            {detail?.conteudo && (
              <div className="rounded-lg bg-muted/50 p-4 text-sm whitespace-pre-wrap">
                {detail.conteudo}
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {detail && format(new Date(detail.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          </div>
          {detail?.link && (
            <Button variant="outline" onClick={() => { navigate(detail.link!); setDetail(null); }}>
              Ver detalhes
            </Button>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
