import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const { tracking_code } = await req.json();
    if (!tracking_code) {
      return new Response(JSON.stringify({ error: "Protocolo obrigatório." }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { data: report } = await supabase
      .from("beta_ouvidoria_reports")
      .select("id, tracking_code, report_type, category, category_other, description, occurrence_type, occurrence_date, location_sector, status, created_at")
      .eq("tracking_code", String(tracking_code).trim().toUpperCase())
      .maybeSingle();

    if (!report) {
      return new Response(JSON.stringify({ error: "Protocolo não encontrado." }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { data: updates } = await supabase
      .from("beta_ouvidoria_updates")
      .select("id, author_type, message, created_at")
      .eq("report_id", report.id)
      .order("created_at", { ascending: true });

    return new Response(JSON.stringify({ report, updates: updates ?? [] }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("track-beta-report error:", err);
    return new Response(JSON.stringify({ error: "Erro ao consultar relato." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
