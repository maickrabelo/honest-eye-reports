// TEMPORARY simulation helper — verifies Asaas subscription config and replays a payment webhook.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ASAAS_BASE = Deno.env.get('ASAAS_ENV') === 'production'
  ? 'https://api.asaas.com/v3'
  : 'https://sandbox.asaas.com/api/v3';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const key = Deno.env.get('ASAAS_API_KEY')!;
    const { subscriptionId, fireWebhook, paymentId } = await req.json();

    const subRes = await fetch(`${ASAAS_BASE}/subscriptions/${subscriptionId}`, {
      headers: { access_token: key },
    });
    const sub = await subRes.json();

    let webhookResult: unknown = null;
    if (fireWebhook) {
      const token = Deno.env.get('ASAAS_WEBHOOK_TOKEN') ?? Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
      const url = `${Deno.env.get('SUPABASE_URL')}/functions/v1/asaas-webhook`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'asaas-access-token': token },
        body: JSON.stringify({
          event: 'PAYMENT_RECEIVED',
          payment: { id: paymentId, subscription: subscriptionId, value: sub.value },
        }),
      });
      webhookResult = { status: res.status, body: await res.text() };
    }

    return new Response(JSON.stringify({
      env: Deno.env.get('ASAAS_ENV') ?? 'sandbox',
      subscription: {
        id: sub.id, cycle: sub.cycle, value: sub.value, status: sub.status,
        nextDueDate: sub.nextDueDate, billingType: sub.billingType, description: sub.description,
      },
      webhookResult,
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
