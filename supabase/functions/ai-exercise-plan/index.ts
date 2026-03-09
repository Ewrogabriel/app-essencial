import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { objetivo, condicao, nivel, semanas, observacoes } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `Você é um fisioterapeuta e especialista em pilates com ampla experiência em criação de planos de exercícios terapêuticos e de condicionamento físico.

Sua tarefa é criar um plano de exercícios detalhado e estruturado para um paciente.

Retorne SOMENTE um JSON válido com a seguinte estrutura, sem texto adicional:
{
  "titulo": "Nome do plano",
  "descricao": "Descrição geral do plano",
  "objetivo": "Objetivo principal",
  "exercicios": [
    {
      "nome": "Nome do exercício",
      "descricao": "Como executar",
      "series": 3,
      "repeticoes": "10-12",
      "carga": "Leve/Moderada/Peso corporal",
      "tempo_execucao": "30 segundos",
      "frequencia": "3x por semana",
      "observacoes": "Cuidados e dicas"
    }
  ]
}

Crie entre 5 e 8 exercícios adequados ao perfil informado.`;

    const userPrompt = `Crie um plano de exercícios com as seguintes especificações:
- Objetivo: ${objetivo || "Condicionamento geral e bem-estar"}
- Condição do paciente: ${condicao || "Sem restrições especiais"}
- Nível: ${nivel || "Iniciante"}
- Duração do plano: ${semanas || 4} semanas
- Observações adicionais: ${observacoes || "Nenhuma"}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) return new Response(JSON.stringify({ error: "Limite de requisições excedido." }), { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      if (response.status === 402) return new Response(JSON.stringify({ error: "Créditos insuficientes." }), { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } });
      throw new Error("Erro no gateway de IA");
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "{}";
    
    let plan;
    try {
      plan = JSON.parse(content);
    } catch {
      plan = { titulo: "Plano Personalizado", descricao: content, exercicios: [] };
    }

    return new Response(JSON.stringify({ plan }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("ai-exercise-plan error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
