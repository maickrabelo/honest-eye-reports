import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ASAAS_BASE = Deno.env.get('ASAAS_ENV') === 'production'
  ? 'https://api.asaas.com/v3'
  : 'https://sandbox.asaas.com/api/v3';

interface SubReq {
  planSlug: string;
  billingCycle: 'monthly' | 'quarterly' | 'annual';
  billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD';
  customer: {
    name: string;
    email: string;
    cpfCnpj: string;
    phone?: string;
  };
  companyName?: string;
  cnpjs?: string[]; // for Corporate
  metadata?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY');
    if (!ASAAS_API_KEY) throw new Error('ASAAS_API_KEY not configured');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const body = await req.json() as SubReq;

    if (!body.planSlug || !body.billingCycle || !body.billingType || !body.customer?.email) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Fetch plan
    const { data: plan, error: planErr } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('slug', body.planSlug)
      .maybeSingle();

    if (planErr || !plan) throw new Error(`Plan not found: ${body.planSlug}`);
    if (plan.is_custom_quote) throw new Error('Este plano é sob demanda. Entre em contato com o consultor.');

    const priceField = body.billingCycle === 'annual'
      ? 'price_annual_cents'
      : body.billingCycle === 'quarterly'
        ? 'price_quarterly_cents'
        : 'price_monthly_cents';
    const amountCents: number = (plan as any)[priceField];
    if (!amountCents || amountCents <= 0) throw new Error('Preço inválido para o ciclo selecionado');

    const cycleMap = { monthly: 'MONTHLY', quarterly: 'QUARTERLY', annual: 'YEARLY' };
    const asaasCycle = cycleMap[body.billingCycle];

    // 2. Create or fetch Asaas customer
    const cpfCnpj = body.customer.cpfCnpj.replace(/\D/g, '');
    let customerId: string | undefined;

    const findCustRes = await fetch(`${ASAAS_BASE}/customers?cpfCnpj=${cpfCnpj}`, {
      headers: { 'access_token': ASAAS_API_KEY },
    });
    const findCustJson = await findCustRes.json();
    if (findCustJson?.data?.[0]?.id) {
      customerId = findCustJson.data[0].id;
    } else {
      const createCustRes = await fetch(`${ASAAS_BASE}/customers`, {
        method: 'POST',
        headers: { 'access_token': ASAAS_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: body.customer.name,
          email: body.customer.email,
          cpfCnpj,
          mobilePhone: body.customer.phone?.replace(/\D/g, ''),
        }),
      });
      const createCustJson = await createCustRes.json();
      if (!createCustRes.ok) throw new Error(`Asaas customer error: ${JSON.stringify(createCustJson)}`);
      customerId = createCustJson.id;
    }

    // 3. Create Asaas subscription
    const nextDueDate = new Date();
    nextDueDate.setDate(nextDueDate.getDate() + 1);
    const dueDateStr = nextDueDate.toISOString().split('T')[0];

    const subRes = await fetch(`${ASAAS_BASE}/subscriptions`, {
      method: 'POST',
      headers: { 'access_token': ASAAS_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer: customerId,
        billingType: body.billingType,
        value: amountCents / 100,
        nextDueDate: dueDateStr,
        cycle: asaasCycle,
        description: `SOIA - ${plan.name} (${body.billingCycle})`,
        externalReference: `soia-${body.planSlug}-${Date.now()}`,
      }),
    });
    const subJson = await subRes.json();
    if (!subRes.ok) throw new Error(`Asaas subscription error: ${JSON.stringify(subJson)}`);

    // 4. Get the first invoice/payment URL
    const paymentsRes = await fetch(`${ASAAS_BASE}/payments?subscription=${subJson.id}&limit=1`, {
      headers: { 'access_token': ASAAS_API_KEY },
    });
    const paymentsJson = await paymentsRes.json();
    const firstPayment = paymentsJson?.data?.[0];
    const invoiceUrl = firstPayment?.invoiceUrl ?? null;
    const paymentId = firstPayment?.id ?? null;

    // 5. Persist subscription
    const { data: inserted, error: insErr } = await supabase
      .from('subscriptions')
      .insert({
        owner_email: body.customer.email,
        plan_id: plan.id,
        billing_cycle: body.billingCycle,
        status: 'pending',
        asaas_customer_id: customerId,
        asaas_subscription_id: subJson.id,
        asaas_payment_id: paymentId,
        invoice_url: invoiceUrl,
        amount_cents: amountCents,
        metadata: {
          customer: body.customer,
          companyName: body.companyName,
          cnpjs: body.cnpjs ?? [],
          billingType: body.billingType,
          ...(body.metadata ?? {}),
        },
      })
      .select('id')
      .single();
    if (insErr) throw insErr;

    return new Response(JSON.stringify({
      subscriptionId: inserted.id,
      asaasSubscriptionId: subJson.id,
      asaasPaymentId: paymentId,
      invoiceUrl,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('asaas-create-subscription error:', e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
