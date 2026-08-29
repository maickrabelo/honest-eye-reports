import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const body = await req.json();
    const trackingCode = String(body.tracking_code ?? "").trim().toUpperCase();
    if (!trackingCode) {
      return new Response(JSON.stringify({ error: "tracking_code obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    let reportId: string | null = body.report_id ?? null;
    let companyId: string | null = body.company_id ?? null;
    const channel = body.channel === "smart" ? "smart" : "ia";

    // Resolve report/company when the client did not provide them
    if (!reportId) {
      const table = channel === "smart" ? "beta_ouvidoria_reports" : "reports";
      const { data } = await supabase
        .from(table)
        .select("id, company_id")
        .eq("tracking_code", trackingCode)
        .maybeSingle();
      if (data) {
        reportId = data.id;
        companyId = companyId ?? data.company_id;
      }
    }

    const { error } = await supabase.from("ouvidoria_access_logs").insert({
      channel,
      tracking_code: trackingCode,
      report_id: reportId,
      company_id: companyId,
      success: body.success !== false,
      failure_reason: body.failure_reason ?? null,
      user_agent: req.headers.get("user-agent"),
      ip_address: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    });

    if (error) {
      console.error("log-ouvidoria-access insert error", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("log-ouvidoria-access error", err);
    return new Response(JSON.stringify({ error: "Erro ao registrar log." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
