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

    const code = String(tracking_code).trim().toUpperCase();
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const userAgent = req.headers.get("user-agent");
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;

    const logAccess = async (
      success: boolean,
      opts: { report_id?: string | null; company_id?: string | null; failure_reason?: string | null } = {},
    ) => {
      try {
        await supabase.from("ouvidoria_access_logs").insert({
          channel: "smart",
          tracking_code: code,
          report_id: opts.report_id ?? null,
          company_id: opts.company_id ?? null,
          success,
          failure_reason: opts.failure_reason ?? null,
          user_agent: userAgent,
          ip_address: ip,
        });
      } catch (e) {
        console.error("access log error", e);
      }
    };

    const { data: report } = await supabase
      .from("beta_ouvidoria_reports")
      .select("id, company_id, tracking_code, report_type, category, category_other, description, occurrence_type, occurrence_date, location_sector, status, created_at")
      .eq("tracking_code", code)
      .maybeSingle();

    if (!report) {
      await logAccess(false, { failure_reason: "Protocolo não encontrado" });
      return new Response(JSON.stringify({ error: "Protocolo não encontrado." }), { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    await logAccess(true, { report_id: report.id, company_id: report.company_id });

    // Somente atualizações públicas — o denunciante nunca vê notas internas
    // nem o nome de quem atualizou.
    const { data: updates } = await supabase
      .from("beta_ouvidoria_updates")
      .select("id, author_type, message, created_at, visibility")
      .eq("report_id", report.id)
      .eq("visibility", "public")
      .order("created_at", { ascending: true });

    const publicUpdates = (updates ?? []).map((u) => ({
      id: u.id,
      author_type: u.author_type,
      message: u.message,
      created_at: u.created_at,
    }));

    return new Response(JSON.stringify({ report, updates: publicUpdates }), {
      status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("track-beta-report error:", err);
    return new Response(JSON.stringify({ error: "Erro ao consultar relato." }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
