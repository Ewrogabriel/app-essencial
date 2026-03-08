import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Brain, FileText, Sparkles, ClipboardList } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface AIClinicalAssistantProps {
  pacienteId: string;
}

export function AIClinicalAssistant({ pacienteId }: AIClinicalAssistantProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [lastAction, setLastAction] = useState("");

  const { data: evolutions = [] } = useQuery({
    queryKey: ["evolucoes-ai", pacienteId],
    queryFn: async () => {
      const { data } = await (supabase.from("evolutions") as any)
        .select("descricao, conduta, data_evolucao")
        .eq("paciente_id", pacienteId)
        .order("data_evolucao", { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: !!pacienteId,
  });

  const { data: evaluation } = useQuery({
    queryKey: ["avaliacao-ai", pacienteId],
    queryFn: async () => {
      const { data } = await (supabase.from("evaluations") as any)
        .select("queixa_principal, historico_doenca, antecedentes_pessoais, objetivos_tratamento, conduta_inicial")
        .eq("paciente_id", pacienteId)
        .order("data_avaliacao", { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
    enabled: !!pacienteId,
  });

  const callAI = async (action: "summarize" | "suggest_conduct") => {
    if (evolutions.length === 0) {
      toast({ title: "Sem evoluções para analisar", description: "Registre evoluções primeiro.", variant: "destructive" });
      return;
    }

    setLoading(true);
    setLastAction(action);
    setResult("");

    try {
      const evolutionsText = evolutions
        .map((e: any) => `[${e.data_evolucao?.split("T")[0]}] ${e.descricao}${e.conduta ? `\nConduta: ${e.conduta}` : ""}`)
        .join("\n\n");

      const evaluationText = evaluation
        ? `Queixa: ${evaluation.queixa_principal}\nHistórico: ${evaluation.historico_doenca || "N/A"}\nAntecedentes: ${evaluation.antecedentes_pessoais || "N/A"}\nObjetivos: ${evaluation.objetivos_tratamento || "N/A"}`
        : "";

      const { data, error } = await supabase.functions.invoke("ai-clinical", {
        body: {
          paciente_id: pacienteId,
          evolutions_text: evolutionsText,
          evaluation_text: evaluationText,
          action,
        },
      });

      if (error) throw error;
      setResult(data.result || "Sem resultado.");
    } catch (err: any) {
      toast({ title: "Erro na análise IA", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Brain className="h-4 w-4 text-primary" />
          Assistente Clínico IA
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => callAI("summarize")}
            disabled={loading || evolutions.length === 0}
          >
            <FileText className="h-4 w-4 mr-1" />
            Resumo Clínico
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => callAI("suggest_conduct")}
            disabled={loading || evolutions.length === 0}
          >
            <Sparkles className="h-4 w-4 mr-1" />
            Sugestão de Conduta
          </Button>
          <Badge variant="secondary" className="text-xs">
            <ClipboardList className="h-3 w-3 mr-1" />
            {evolutions.length} evolução(ões)
          </Badge>
        </div>

        {loading && (
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <p className="text-xs text-muted-foreground animate-pulse">Analisando histórico clínico...</p>
          </div>
        )}

        {result && !loading && (
          <div className="rounded-lg border bg-muted/30 p-4 prose prose-sm max-w-none dark:prose-invert">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="h-4 w-4 text-primary" />
              <span className="text-xs font-medium text-primary">
                {lastAction === "summarize" ? "Resumo Clínico" : "Sugestão de Conduta"}
              </span>
            </div>
            <div
              className="text-sm whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: result.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>").replace(/## (.*)/g, "<h3 class='text-sm font-bold mt-3 mb-1'>$1</h3>").replace(/\n/g, "<br/>") }}
            />
          </div>
        )}

        {evolutions.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-2">
            Registre evoluções para habilitar a análise por IA
          </p>
        )}
      </CardContent>
    </Card>
  );
}
