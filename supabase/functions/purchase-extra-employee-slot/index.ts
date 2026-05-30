import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const ASAAS_API_URL = Deno.env.get("ASAAS_ENV") === "production"
  ? "https://api.asaas.com/v3"
  : "https://sandbox.asaas.com/api/v3";

const log = (step: string, details?: any) =>
  console.log(`[PURCHASE-EMP-SLOT] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const asaasKey = Deno.env.get("ASAAS_API_KEY");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autenticado." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Sessão inválida." }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = userData.user.id;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const quantity = Math.max(1, Math.min(1000, Number.parseInt(String(body?.quantity ?? "1"), 10) || 1));

    // Plano ativo + dono (company ou sst_manager)
    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("id, plan_id, asaas_customer_id, next_charge_date")
      .eq("owner_user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!subscription?.plan_id) {
      return new Response(JSON.stringify({ error: "Assinatura ativa não encontrada." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Preço por vida
    const { data: pricing } = await supabase
      .from("plan_upgrade_pricing")
      .select("unit_price_cents")
      .eq("plan_id", subscription.plan_id)
      .eq("kind", "employee")
      .maybeSingle();

    if (!pricing?.unit_price_cents) {
      return new Response(JSON.stringify({ error: "Plano não permite upgrade de vidas." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const unit = pricing.unit_price_cents;
    const totalCents = unit * quantity;

    // Descobrir target (company ou sst_manager)
    const { data: profile } = await supabase
      .from("profiles").select("company_id, sst_manager_id").eq("id", userId).maybeSingle();

    let asaasSubscriptionId: string | null = null;
    let nextChargeDate: string | null = subscription.next_charge_date ?? null;
    let pendingBilling = false;

    if (asaasKey && subscription.asaas_customer_id) {
      try {
        const nextDueDate = subscription.next_charge_date
          ? new Date(subscription.next_charge_date).toISOString().slice(0, 10)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

        const asaasRes = await fetch(`${ASAAS_API_URL}/subscriptions`, {
          method: "POST",
          headers: { "access_token": asaasKey, "Content-Type": "application/json" },
          body: JSON.stringify({
            customer: subscription.asaas_customer_id,
            billingType: "BOLETO",
            value: totalCents / 100,
            nextDueDate,
            cycle: "MONTHLY",
            description: `SOIA - ${quantity} vida(s) extra (R$ ${(unit/100).toFixed(2)} cada)`,
            externalReference: `emp-slot-${userId}-${Date.now()}`,
          }),
        });
        const asaasJson: any = await asaasRes.json().catch(() => null);
        if (asaasRes.ok && asaasJson?.id) {
          asaasSubscriptionId = asaasJson.id;
          nextChargeDate = nextDueDate;
        } else {
          pendingBilling = true;
          log("asaas failed", { status: asaasRes.status });
        }
      } catch (e: any) {
        pendingBilling = true;
        log("asaas exception", e?.message);
      }
    } else {
      pendingBilling = true;
    }

    // Aplicar slots
    if (profile?.company_id) {
      const { data: c } = await supabase.from("companies").select("extra_employee_slots").eq("id", profile.company_id).single();
      await supabase
        .from("companies")
        .update({ extra_employee_slots: (c?.extra_employee_slots ?? 0) + quantity })
        .eq("id", profile.company_id);
    } else if (profile?.sst_manager_id) {
      const { data: m } = await supabase.from("sst_managers").select("extra_employee_slots").eq("id", profile.sst_manager_id).single();
      await supabase
        .from("sst_managers")
        .update({ extra_employee_slots: (m?.extra_employee_slots ?? 0) + quantity })
        .eq("id", profile.sst_manager_id);
    } else {
      return new Response(JSON.stringify({ error: "Usuário sem vínculo de empresa/gestora." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await supabase.from("sst_extra_slot_purchases").insert({
      sst_manager_id: profile.sst_manager_id ?? null,
      subscription_id: subscription.id,
      slots_added: quantity,
      unit_price_cents: unit,
      status: pendingBilling ? "pending_billing" : "active",
      purchased_by: userId,
      asaas_subscription_id: asaasSubscriptionId,
      billing_started_at: nextChargeDate,
    });

    return new Response(
      JSON.stringify({
        success: true,
        quantity,
        unit_price_cents: unit,
        total_cents: totalCents,
        next_charge_date: nextChargeDate,
        pending_billing: pendingBilling,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    log("ERROR", error?.message);
    return new Response(JSON.stringify({ error: error?.message ?? String(error) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
