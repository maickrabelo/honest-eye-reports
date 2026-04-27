import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const SLOT_PRICE_CENTS = 1990; // R$ 19,90
const ASAAS_API_URL = "https://api.asaas.com/v3";

const log = (step: string, details?: any) =>
  console.log(`[PURCHASE-SLOT] ${step}${details ? ` - ${JSON.stringify(details)}` : ""}`);

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

    // 1. Validar que o usuário pertence a uma gestora SST
    const { data: profile } = await supabase
      .from("profiles")
      .select("sst_manager_id")
      .eq("id", userId)
      .maybeSingle();

    if (!profile?.sst_manager_id) {
      return new Response(JSON.stringify({ error: "Usuário não está vinculado a uma gestora SST." }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const sstManagerId = profile.sst_manager_id;
    log("user validated", { userId, sstManagerId });

    // 2. Buscar gestora atual + assinatura ativa
    const { data: manager } = await supabase
      .from("sst_managers")
      .select("id, name, max_companies, extra_company_slots")
      .eq("id", sstManagerId)
      .single();

    const { data: subscription } = await supabase
      .from("subscriptions")
      .select("id, asaas_customer_id, asaas_subscription_id, next_charge_date, current_period_end")
      .eq("owner_user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    log("subscription found", { hasSub: !!subscription, hasAsaas: !!subscription?.asaas_customer_id });

    // 3. Criar assinatura recorrente no Asaas (se aplicável)
    let asaasSubscriptionId: string | null = null;
    let nextChargeDate: string | null = subscription?.next_charge_date ?? null;
    let pendingBilling = false;

    // IMPORTANTE: a falha no Asaas NUNCA bloqueia a liberação do slot.
    // Se algo der errado na cobrança, marcamos como pending_billing e seguimos.
    if (asaasKey && subscription?.asaas_customer_id) {
      try {
        const nextDueDate = subscription.next_charge_date
          ? new Date(subscription.next_charge_date).toISOString().slice(0, 10)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

        const asaasRes = await fetch(`${ASAAS_API_URL}/subscriptions`, {
          method: "POST",
          headers: {
            "access_token": asaasKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            customer: subscription.asaas_customer_id,
            billingType: "BOLETO",
            value: SLOT_PRICE_CENTS / 100,
            nextDueDate,
            cycle: "MONTHLY",
            description: `SOIA - Slot extra de empresa (gestora ${manager?.name ?? sstManagerId})`,
            externalReference: `slot-${sstManagerId}-${Date.now()}`,
          }),
        });

        let asaasJson: any = null;
        try { asaasJson = await asaasRes.json(); } catch (_) { /* resposta vazia */ }

        if (asaasRes.ok && asaasJson?.id) {
          asaasSubscriptionId = asaasJson.id;
          nextChargeDate = nextDueDate;
          log("asaas sub created", { id: asaasSubscriptionId, nextDueDate });
        } else {
          log("asaas sub failed, releasing slot anyway", { status: asaasRes.status, body: asaasJson });
          pendingBilling = true;
        }
      } catch (e: any) {
        log("asaas exception, releasing slot anyway", e?.message);
        pendingBilling = true;
      }
    } else {
      log("no asaas key/customer; releasing slot as pending billing", {
        hasKey: !!asaasKey,
        hasCustomer: !!subscription?.asaas_customer_id,
      });
      pendingBilling = true;
    }

    // 4. Incrementar slots no manager
    const newSlots = (manager?.extra_company_slots ?? 0) + 1;
    const { error: updErr } = await supabase
      .from("sst_managers")
      .update({ extra_company_slots: newSlots })
      .eq("id", sstManagerId);
    if (updErr) throw new Error(`Falha ao atualizar slots: ${updErr.message}`);

    // 5. Registrar a compra
    await supabase.from("sst_extra_slot_purchases").insert({
      sst_manager_id: sstManagerId,
      subscription_id: subscription?.id ?? null,
      slots_added: 1,
      unit_price_cents: SLOT_PRICE_CENTS,
      status: pendingBilling ? "pending_billing" : "active",
      purchased_by: userId,
      asaas_subscription_id: asaasSubscriptionId,
      billing_started_at: nextChargeDate,
    });

    const newLimit = (manager?.max_companies ?? 50) + newSlots;

    return new Response(
      JSON.stringify({
        success: true,
        new_limit: newLimit,
        extra_slots: newSlots,
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
