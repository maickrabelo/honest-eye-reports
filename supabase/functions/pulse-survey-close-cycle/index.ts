// Edge function: fecha ciclos de pulse survey vencidos, envia email de resumo
// ao gestor e cria o próximo ciclo. Disparado por cron a cada hora.
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const FREQUENCY_LABEL: Record<string, string> = {
  weekly: "Semanal",
  biweekly: "Quinzenal",
  monthly: "Mensal",
  quarterly: "Trimestral",
  semiannual: "Semestral",
};

function fmt(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Buscar ciclos vencidos não fechados
    const { data: openCycles, error: cyclesErr } = await supabase
      .from("pulse_survey_cycles")
      .select(
        "id, pulse_survey_id, cycle_number, started_at, ended_at, total_responses, pulse_surveys!inner(id, title, frequency, manager_email, company_id, status, companies(name))"
      )
      .is("closed_at", null)
      .lte("ended_at", new Date().toISOString());

    if (cyclesErr) throw cyclesErr;

    const processed: any[] = [];

    for (const cycle of openCycles || []) {
      const survey: any = (cycle as any).pulse_surveys;
      const companyName: string = survey?.companies?.name || "Empresa";

      // Métricas: respostas + médias por pergunta
      const { count: responsesCount } = await supabase
        .from("pulse_survey_responses")
        .select("id", { count: "exact", head: true })
        .eq("cycle_id", cycle.id);

      const { data: questions } = await supabase
        .from("pulse_survey_questions")
        .select("id, text, category, order_index")
        .eq("pulse_survey_id", cycle.pulse_survey_id)
        .order("order_index");

      const { data: answers } = await supabase
        .from("pulse_survey_answers")
        .select("question_id, score, response_id, pulse_survey_responses!inner(cycle_id)")
        .eq("pulse_survey_responses.cycle_id", cycle.id);

      const perQ: Record<string, { sum: number; count: number }> = {};
      for (const a of answers || []) {
        const q = perQ[a.question_id] || { sum: 0, count: 0 };
        q.sum += Number(a.score);
        q.count += 1;
        perQ[a.question_id] = q;
      }

      let overallSum = 0,
        overallCount = 0;
      const rows: { text: string; avg: number; n: number }[] = [];
      for (const q of questions || []) {
        const stats = perQ[q.id] || { sum: 0, count: 0 };
        const avg = stats.count ? stats.sum / stats.count : 0;
        overallSum += stats.sum;
        overallCount += stats.count;
        rows.push({ text: q.text, avg, n: stats.count });
      }
      const overallAvg = overallCount ? overallSum / overallCount : 0;
      const best = rows.length ? rows.reduce((a, b) => (a.avg >= b.avg ? a : b)) : null;
      const worst = rows.length ? rows.reduce((a, b) => (a.avg <= b.avg ? a : b)) : null;

      // Atualizar contagem e fechar ciclo
      await supabase
        .from("pulse_survey_cycles")
        .update({
          total_responses: responsesCount || 0,
          closed_at: new Date().toISOString(),
        })
        .eq("id", cycle.id);

      // Enviar email se houver destinatário
      let emailSent = false;
      if (survey?.manager_email) {
        const rowsHtml = rows
          .map(
            (r) => `
            <tr>
              <td style="padding:8px;border-bottom:1px solid #eee;">${r.text}</td>
              <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${r.avg.toFixed(2)}</td>
              <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;color:#666;">${r.n}</td>
            </tr>`
          )
          .join("");

        try {
          await resend.emails.send({
            from: "SOIA Pulse <noreply@soia.app.br>",
            to: [survey.manager_email],
            subject: `Resultado Pulse Survey: ${survey.title} (Ciclo ${cycle.cycle_number})`,
            html: `
              <div style="font-family:Arial,sans-serif;max-width:640px;margin:0 auto;color:#111;">
                <h1 style="color:#0066cc;border-bottom:2px solid #0066cc;padding-bottom:8px;">${survey.title}</h1>
                <p style="color:#666;margin:4px 0 16px 0;">
                  ${companyName} · ${FREQUENCY_LABEL[survey.frequency] || survey.frequency} · Ciclo ${cycle.cycle_number}<br/>
                  Período: ${fmt(cycle.started_at)} a ${fmt(cycle.ended_at)}
                </p>

                <div style="background:#f5f8ff;padding:16px;border-radius:8px;display:flex;gap:24px;flex-wrap:wrap;">
                  <div><div style="font-size:12px;color:#666;">Respostas</div><div style="font-size:24px;font-weight:bold;">${responsesCount || 0}</div></div>
                  <div><div style="font-size:12px;color:#666;">Média geral</div><div style="font-size:24px;font-weight:bold;">${overallAvg.toFixed(2)}<span style="font-size:14px;color:#999;"> / 5</span></div></div>
                </div>

                ${best ? `<p style="margin-top:20px;"><strong>✅ Melhor avaliada:</strong> ${best.text} (${best.avg.toFixed(2)})</p>` : ""}
                ${worst && worst !== best ? `<p><strong>⚠️ Menor pontuação:</strong> ${worst.text} (${worst.avg.toFixed(2)})</p>` : ""}

                <h3 style="margin-top:24px;">Médias por pergunta</h3>
                <table style="width:100%;border-collapse:collapse;font-size:14px;">
                  <thead>
                    <tr style="background:#f0f0f0;">
                      <th style="padding:8px;text-align:left;">Pergunta</th>
                      <th style="padding:8px;width:80px;">Média</th>
                      <th style="padding:8px;width:80px;">Respostas</th>
                    </tr>
                  </thead>
                  <tbody>${rowsHtml}</tbody>
                </table>

                <p style="color:#666;font-size:12px;margin-top:32px;border-top:1px solid #ddd;padding-top:12px;">
                  Um novo ciclo já foi iniciado automaticamente. Você receberá o próximo resumo ao final do período.
                </p>
              </div>
            `,
          });
          emailSent = true;
          await supabase
            .from("pulse_survey_cycles")
            .update({ summary_email_sent_at: new Date().toISOString() })
            .eq("id", cycle.id);
        } catch (e) {
          console.error("Failed to send email for cycle", cycle.id, e);
        }
      }

      // Cria próximo ciclo apenas se a campanha continua ativa
      if (survey?.status === "active") {
        const { error: nextErr } = await supabase.rpc("pulse_create_next_cycle", {
          _survey_id: cycle.pulse_survey_id,
        });
        if (nextErr) console.error("Failed to create next cycle:", nextErr);
      }

      processed.push({
        cycle_id: cycle.id,
        survey_id: cycle.pulse_survey_id,
        responses: responsesCount || 0,
        email_sent: emailSent,
      });
    }

    return new Response(JSON.stringify({ success: true, processed }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error: any) {
    console.error("pulse-survey-close-cycle error:", error);
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
