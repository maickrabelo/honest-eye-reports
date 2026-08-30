import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { brl, OPERATOR_PLAN_LABELS } from "../_shared/operatorPricing.ts";
import { emailShell, ctaButton, sendEmail } from "../_shared/operatorEmail.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const ASAAS_BASE = (Deno.env.get("ASAAS_ENV") ?? "production").trim().toLowerCase() !== "sandbox"
  ? "https://api.asaas.com/v3"
  : "https://sandbox.asaas.com/api/v3";

const json = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

interface Item {
  company_id: string | null;
  company_name: string | null;
  kind: "charge" | "commission_discount" | "commission_credit";
  description: string;
  plan_slug: string | null;
  employee_count: number | null;
  amount_cents: number;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const token = (req.headers.get("Authorization") ?? "").replace("Bearer ", "").trim();
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    let allowed = token === serviceKey;
    if (!allowed) {
      const { data: userData } = await supabase.auth.getUser(token);
      if (!userData?.user) return json({ error: "Não autenticado." }, 401);
      const { data: isAdmin } = await supabase.rpc("has_role", {
        _user_id: userData.user.id,
        _role: "admin",
      });
      allowed = !!isAdmin;
    }
    if (!allowed) return json({ error: "Acesso restrito a administradores." }, 403);

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const now = new Date();
    const referenceMonth = String(body.referenceMonth ?? `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}`);
    const [refYear, refMonth] = referenceMonth.split("-").map(Number);
    const periodEnd = new Date(Date.UTC(refYear, refMonth - 1, 20));
    const periodStart = new Date(Date.UTC(refYear, refMonth - 2, 21));

    let opQuery = supabase.from("licensed_operators").select("*").eq("status", "active");
    if (body.operatorId) opQuery = opQuery.eq("id", String(body.operatorId));
    const { data: operators, error: opErr } = await opQuery;
    if (opErr) throw opErr;

    const results: unknown[] = [];

    for (const operator of operators ?? []) {
      const { data: existing } = await supabase
        .from("licensed_operator_invoices")
        .select("id")
        .eq("operator_id", operator.id)
        .eq("reference_month", referenceMonth)
        .maybeSingle();
      if (existing && !body.force) {
        results.push({ operator: operator.razao_social, skipped: "fatura já fechada" });
        continue;
      }
      if (existing && body.force) {
        await supabase.from("licensed_operator_invoices").delete().eq("id", existing.id);
      }

      const { data: companies } = await supabase
        .from("licensed_operator_companies")
        .select("*, companies(name)")
        .eq("operator_id", operator.id)
        .eq("active", true);

      const rate = Number(operator.commission_rate ?? 0) / 100;
      const items: Item[] = [];
      let gross = 0;
      let discount = 0;
      let credit = 0;

      for (const c of companies ?? []) {
        const planLabel = OPERATOR_PLAN_LABELS[c.plan_slug as "ouvidoria"] ?? c.plan_slug;
        const companyName = (c as any).companies?.name ?? "Empresa";
        if (c.billing_mode === "operator") {
          gross += c.monthly_amount_cents;
          items.push({
            company_id: c.company_id,
            company_name: companyName,
            kind: "charge",
            description: `${companyName} — ${planLabel} (${c.employee_count} colaboradores)`,
            plan_slug: c.plan_slug,
            employee_count: c.employee_count,
            amount_cents: c.monthly_amount_cents,
          });
          const d = Math.round(c.monthly_amount_cents * rate);
          discount += d;
          items.push({
            company_id: c.company_id,
            company_name: companyName,
            kind: "commission_discount",
            description: `Desconto de comissão (${operator.commission_rate}%) — ${companyName}`,
            plan_slug: c.plan_slug,
            employee_count: c.employee_count,
            amount_cents: -d,
          });
        } else if (c.billing_mode === "direct" && c.payment_status === "paid") {
          const comm = Math.round(c.monthly_amount_cents * rate);
          credit += comm;
          items.push({
            company_id: c.company_id,
            company_name: companyName,
            kind: "commission_credit",
            description: `Comissão a receber (${operator.commission_rate}%) — ${companyName}`,
            plan_slug: c.plan_slug,
            employee_count: c.employee_count,
            amount_cents: -comm,
          });
        }
      }

      const total = Math.max(0, gross - discount - credit);
      const status = total > 0 ? "pending" : "credit";

      let invoiceUrl: string | null = null;
      let asaasPaymentId: string | null = null;

      if (total > 0) {
        const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY");
        const cpfCnpj = String(operator.cnpj ?? "").replace(/\D/g, "");
        if (ASAAS_API_KEY && cpfCnpj.length >= 11) {
          let customerId: string | null = null;
          const findRes = await fetch(`${ASAAS_BASE}/customers?cpfCnpj=${cpfCnpj}`, {
            headers: { access_token: ASAAS_API_KEY },
          });
          const findJson = await findRes.json();
          if (findJson?.data?.[0]?.id) {
            customerId = findJson.data[0].id;
          } else {
            const createRes = await fetch(`${ASAAS_BASE}/customers`, {
              method: "POST",
              headers: { access_token: ASAAS_API_KEY, "Content-Type": "application/json" },
              body: JSON.stringify({
                name: operator.razao_social,
                email: operator.email,
                cpfCnpj,
                mobilePhone: String(operator.phone ?? "").replace(/\D/g, "") || undefined,
              }),
            });
            const createJson = await createRes.json();
            if (createRes.ok) customerId = createJson.id;
            else console.error("[CLOSE-INVOICES] customer", createJson);
          }

          if (customerId) {
            const due = new Date(periodEnd);
            due.setUTCDate(due.getUTCDate() + 5);
            const payRes = await fetch(`${ASAAS_BASE}/payments`, {
              method: "POST",
              headers: { access_token: ASAAS_API_KEY, "Content-Type": "application/json" },
              body: JSON.stringify({
                customer: customerId,
                billingType: "UNDEFINED",
                value: total / 100,
                dueDate: due.toISOString().split("T")[0],
                description: `SOIA - Fatura Parceiro Licenciado ${referenceMonth}`,
                externalReference: `soia-lop-invoice-${operator.id}-${referenceMonth}`,
              }),
            });
            const payJson = await payRes.json();
            if (payRes.ok) {
              invoiceUrl = payJson?.invoiceUrl ?? null;
              asaasPaymentId = payJson?.id ?? null;
            } else {
              console.error("[CLOSE-INVOICES] payment", payJson);
            }
          }
        }
      }

      const { data: invoice, error: invErr } = await supabase
        .from("licensed_operator_invoices")
        .insert({
          operator_id: operator.id,
          reference_month: referenceMonth,
          period_start: periodStart.toISOString().split("T")[0],
          period_end: periodEnd.toISOString().split("T")[0],
          gross_cents: gross,
          discount_cents: discount,
          commission_credit_cents: credit,
          total_cents: total,
          status,
          asaas_payment_id: asaasPaymentId,
          invoice_url: invoiceUrl,
        })
        .select("id")
        .single();
      if (invErr) throw invErr;

      if (items.length) {
        await supabase
          .from("licensed_operator_invoice_items")
          .insert(items.map((i) => ({ ...i, invoice_id: invoice.id })));
      }

      // e-mail detalhado
      const rowsHtml = items
        .map(
          (i, idx) => `<tr style="background:${idx % 2 === 0 ? "#f8fafc" : "#ffffff"}">
            <td style="padding:9px 12px;color:#334155;font-size:13px">${i.description}</td>
            <td style="padding:9px 12px;text-align:right;font-size:13px;font-weight:bold;color:${i.amount_cents < 0 ? "#16a34a" : "#0f172a"}">
              ${i.amount_cents < 0 ? "- " : ""}${brl(Math.abs(i.amount_cents))}
            </td>
          </tr>`,
        )
        .join("");

      await sendEmail(
        operator.email,
        `Fatura SOIA ${referenceMonth} — ${operator.razao_social}`,
        emailShell(
          `<h2 style="margin:0 0 10px;font-size:20px">Fechamento de ${referenceMonth}</h2>
           <p style="font-size:15px;line-height:1.6;color:#334155">
             Segue o detalhamento do encontro de contas do período de
             ${periodStart.toISOString().split("T")[0].split("-").reverse().join("/")} a
             ${periodEnd.toISOString().split("T")[0].split("-").reverse().join("/")}.
           </p>
           <table style="width:100%;border-collapse:collapse;margin:16px 0;border:1px solid #e2e8f0">
             ${rowsHtml || `<tr><td style="padding:12px;color:#64748b">Nenhum lançamento no período.</td></tr>`}
             <tr style="background:#0f172a;color:#ffffff">
               <td style="padding:12px">Total a pagar</td>
               <td style="padding:12px;text-align:right;font-weight:bold">${brl(total)}</td>
             </tr>
           </table>
           <p style="font-size:13px;color:#64748b">
             Faturamento bruto: ${brl(gross)} · Desconto de comissão: ${brl(discount)} ·
             Comissões abatidas: ${brl(credit)}
           </p>
           ${invoiceUrl ? ctaButton(invoiceUrl, "Pagar fatura") : total === 0 ? `<p style="font-size:14px;color:#16a34a"><strong>Nada a pagar neste mês.</strong></p>` : ""}`,
          operator.logo_url,
        ),
      );

      results.push({
        operator: operator.razao_social,
        referenceMonth,
        gross,
        discount,
        credit,
        total,
        invoiceUrl,
      });
    }

    return json({ success: true, referenceMonth, results });
  } catch (err) {
    console.error("[LICENSED-OPERATOR-CLOSE-INVOICES]", err);
    return json({ error: (err as Error).message ?? "Erro inesperado" }, 500);
  }
});
