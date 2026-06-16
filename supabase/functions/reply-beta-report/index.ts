import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { tracking_code, message } = await req.json();
    const msg = String(message ?? "").trim();
    if (!tracking_code || msg.length < 2 || msg.length > 4000) {
      return new Response(JSON.stringify({ error: "Dados inválidos." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const { data: report } = await supabase
      .from("beta_ouvidoria_reports")
      .select("id")
      .eq("tracking_code", String(tracking_code).trim().toUpperCase())
      .maybeSingle();
    if (!report) {
      return new Response(JSON.stringify({ error: "Protocolo não encontrado." }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const { error } = await supabase.from("beta_ouvidoria_updates").insert({
      report_id: report.id, author_type: "anonymous", message: msg,
    });
    if (error) {
      console.error("reply-beta-report insert error:", error);
      return new Response(JSON.stringify({ error: "Erro ao enviar resposta." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err) {
    console.error("reply-beta-report error:", err);
    return new Response(JSON.stringify({ error: "Erro ao processar resposta." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
