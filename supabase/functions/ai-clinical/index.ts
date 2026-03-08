import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { paciente_id, evolutions_text, evaluation_text, action } = await req.json();

    const apiKey = Deno.env.get("LOVABLE_API_KEY");
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let systemPrompt = "";
    let userContent = "";

    if (action === "summarize") {
      systemPrompt = `Você é um fisioterapeuta especialista. Analise o histórico de evoluções clínicas do paciente e gere:
1. **Resumo Clínico**: Síntese objetiva do quadro e progresso do paciente
2. **Principais Achados**: Pontos mais relevantes observados ao longo do tratamento
3. **Tendência**: Se o paciente está melhorando, estagnado ou piorando
4. **Atenção**: Pontos que merecem atenção especial

Responda em português brasileiro, de forma objetiva e profissional. Use markdown.`;

      userContent = `Histórico de evoluções do paciente:\n\n${evolutions_text}`;

      if (evaluation_text) {
        userContent += `\n\nAvaliação inicial:\n${evaluation_text}`;
      }
    } else if (action === "suggest_conduct") {
      systemPrompt = `Você é um fisioterapeuta especialista. Com base no histórico clínico fornecido, sugira:
1. **Conduta Recomendada**: O que fazer na próxima sessão
2. **Exercícios Sugeridos**: Protocolos e exercícios indicados
3. **Objetivos de Curto Prazo**: Metas para as próximas 2-4 sessões
4. **Orientações ao Paciente**: O que orientar para domicílio

Seja específico e baseado em evidências. Responda em português brasileiro. Use markdown.`;

      userContent = `Histórico de evoluções:\n\n${evolutions_text}`;

      if (evaluation_text) {
        userContent += `\n\nAvaliação inicial:\n${evaluation_text}`;
      }
    } else {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch(
      "https://ai.gateway.lovable.dev/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userContent },
          ],
          temperature: 0.5,
          max_tokens: 2000,
        }),
      }
    );

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content || "Não foi possível gerar análise.";

    return new Response(JSON.stringify({ result: content }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
