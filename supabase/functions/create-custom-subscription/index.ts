import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ASAAS_BASE = Deno.env.get('ASAAS_ENV') === 'production'
  ? 'https://api.asaas.com/v3'
  : 'https://sandbox.asaas.com/api/v3';

const GATEWAY_URL = 'https://connector-gateway.lovable.dev/resend';

interface Body {
  planSlug: string;
  billingCycle: 'monthly' | 'quarterly' | 'annual';
  billingType: 'PIX' | 'BOLETO' | 'CREDIT_CARD';
  amountCents: number; // valor cobrado por ciclo
  maxCompanies?: number | null;
  maxEmployees?: number | null;
  customer: { name: string; email: string; cpfCnpj: string; phone?: string };
  companyName?: string;
  notes?: string;
}

const cycleLabel = {
  monthly: 'Mensal',
  quarterly: 'Trimestral',
  annual: 'Anual',
} as const;

function brl(cents: number) {
  return (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const json = (payload: unknown, status = 200) =>
    new Response(JSON.stringify(payload), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const ASAAS_API_KEY = Deno.env.get('ASAAS_API_KEY');
    if (!ASAAS_API_KEY) throw new Error('ASAAS_API_KEY não configurada');

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // --- Auth: somente admin ---
    const authHeader = req.headers.get('Authorization') ?? '';
    const token = authHeader.replace('Bearer ', '').trim();
    if (!token) return json({ error: 'Não autenticado' }, 401);

    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) return json({ error: 'Não autenticado' }, 401);

    const { data: isAdmin } = await supabase.rpc('has_role', {
      _user_id: userData.user.id,
      _role: 'admin',
    });
    if (!isAdmin) return json({ error: 'Acesso restrito a administradores' }, 403);

    const body = await req.json() as Body;

    if (!body.planSlug || !body.billingCycle || !body.billingType || !body.customer?.email
      || !body.customer?.cpfCnpj || !body.customer?.name || !body.amountCents) {
      return json({ error: 'Campos obrigatórios faltando' }, 400);
    }
    if (body.amountCents < 500) return json({ error: 'Valor mínimo é R$ 5,00' }, 400);

    const { data: plan, error: planErr } = await supabase
      .from('subscription_plans')
      .select('*')
      .eq('slug', body.planSlug)
      .maybeSingle();
    if (planErr || !plan) return json({ error: `Plano não encontrado: ${body.planSlug}` }, 400);

    const monthsPerCycle = body.billingCycle === 'annual' ? 12 : body.billingCycle === 'quarterly' ? 3 : 1;
    const cpfCnpj = body.customer.cpfCnpj.replace(/\D/g, '');

    // 1. Cliente Asaas
    let customerId: string | undefined;
    const findRes = await fetch(`${ASAAS_BASE}/customers?cpfCnpj=${cpfCnpj}`, {
      headers: { access_token: ASAAS_API_KEY },
    });
    const findJson = await findRes.json();
    if (findJson?.data?.[0]?.id) {
      customerId = findJson.data[0].id;
    } else {
      const createRes = await fetch(`${ASAAS_BASE}/customers`, {
        method: 'POST',
        headers: { access_token: ASAAS_API_KEY, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: body.customer.name,
          email: body.customer.email,
          cpfCnpj,
          mobilePhone: body.customer.phone?.replace(/\D/g, ''),
        }),
      });
      const createJson = await createRes.json();
      if (!createRes.ok) throw new Error(`Asaas customer: ${JSON.stringify(createJson)}`);
      customerId = createJson.id;
    }

    // 2. Assinatura recorrente Asaas
    const nextDue = new Date();
    nextDue.setDate(nextDue.getDate() + 1);

    const payload: Record<string, unknown> = {
      customer: customerId,
      billingType: body.billingType,
      value: body.amountCents / 100,
      nextDueDate: nextDue.toISOString().split('T')[0],
      cycle: body.billingCycle === 'annual' ? 'YEARLY' : body.billingCycle === 'quarterly' ? 'QUARTERLY' : 'MONTHLY',
      description: `SOIA - ${plan.name} (personalizado - ${cycleLabel[body.billingCycle]})`,
      externalReference: `soia-custom-${body.planSlug}-${Date.now()}`,
    };
    if (body.billingType === 'CREDIT_CARD' && monthsPerCycle > 1) {
      payload.maxInstallmentCount = monthsPerCycle;
    }

    const subRes = await fetch(`${ASAAS_BASE}/subscriptions`, {
      method: 'POST',
      headers: { access_token: ASAAS_API_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const subJson = await subRes.json();
    if (!subRes.ok) throw new Error(`Asaas subscription: ${JSON.stringify(subJson)}`);

    // 3. Primeira cobrança (link de pagamento)
    const payRes = await fetch(`${ASAAS_BASE}/payments?subscription=${subJson.id}&limit=1`, {
      headers: { access_token: ASAAS_API_KEY },
    });
    const payJson = await payRes.json();
    const firstPayment = payJson?.data?.[0];
    const invoiceUrl: string | null = firstPayment?.invoiceUrl ?? null;
    const paymentId: string | null = firstPayment?.id ?? null;

    // 4. Persistir assinatura
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
        amount_cents: body.amountCents,
        metadata: {
          custom: true,
          createdByAdmin: userData.user.email,
          customer: body.customer,
          companyName: body.companyName,
          cnpjs: cpfCnpj.length === 14 ? [cpfCnpj] : [],
          billingType: body.billingType,
          customCompanies: body.maxCompanies ?? null,
          customEmployees: body.maxEmployees ?? null,
          notes: body.notes ?? null,
        },
      })
      .select('id')
      .single();
    if (insErr) throw insErr;

    // 5. E-mail para o cliente com os detalhes + botão de pagamento
    let emailSent = false;
    let emailError: string | null = null;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY_1') ?? Deno.env.get('RESEND_API_KEY');

    if (invoiceUrl && LOVABLE_API_KEY && RESEND_API_KEY) {
      const rows = [
        ['Plano', plan.name],
        ['Recorrência', cycleLabel[body.billingCycle]],
        ['Valor por cobrança', brl(body.amountCents)],
        body.maxCompanies != null ? ['Empresas liberadas', String(body.maxCompanies)] : null,
        body.maxEmployees != null ? ['Vidas liberadas', String(body.maxEmployees)] : null,
      ].filter(Boolean) as [string, string][];

      try {
        const res = await fetch(`${GATEWAY_URL}/emails`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            'X-Connection-Api-Key': RESEND_API_KEY,
          },
          body: JSON.stringify({
            from: 'SOIA <noreply@soia.app.br>',
            to: [body.customer.email],
            subject: `Sua proposta SOIA — ${plan.name} (${cycleLabel[body.billingCycle]})`,
            html: `
              <div style="font-family:Arial,sans-serif;color:#0f172a">
                <h2>Sua assinatura SOIA está pronta</h2>
                <p>Olá, ${body.customer.name}! Segue o resumo da assinatura personalizada criada para você:</p>
                <table cellpadding="8" style="border-collapse:collapse;font-size:14px">
                  ${rows.map(([k, v]) => `<tr><td style="border:1px solid #e2e8f0"><strong>${k}</strong></td><td style="border:1px solid #e2e8f0">${v}</td></tr>`).join('')}
                </table>
                ${body.notes ? `<p style="font-size:14px">${body.notes}</p>` : ''}
                <p style="margin:28px 0">
                  <a href="${invoiceUrl}" style="background:#16a34a;color:#ffffff;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:bold">Pagar agora</a>
                </p>
                <p style="font-size:13px;color:#475569">Após a confirmação do pagamento você receberá os dados de acesso à plataforma por e-mail.</p>
              </div>
            `,
          }),
        });
        if (res.ok) emailSent = true;
        else emailError = `Resend ${res.status}: ${await res.text().catch(() => '')}`;
      } catch (e) {
        emailError = e instanceof Error ? e.message : String(e);
      }
    } else if (!invoiceUrl) {
      emailError = 'Link de pagamento ainda não disponível';
    } else {
      emailError = 'Chaves de e-mail não configuradas';
    }

    try {
      await supabase.from('email_send_attempts').insert({
        recipient_email: body.customer.email,
        status: emailSent ? 'sent' : 'failed',
        error_message: emailError,
        subscription_id: inserted.id,
        context: 'create-custom-subscription',
        metadata: { invoiceUrl },
      });
    } catch (_) { /* noop */ }

    return json({
      subscriptionId: inserted.id,
      asaasSubscriptionId: subJson.id,
      asaasPaymentId: paymentId,
      invoiceUrl,
      amountCents: body.amountCents,
      planName: plan.name,
      billingCycle: body.billingCycle,
      emailSent,
      emailError,
    });
  } catch (e) {
    console.error('create-custom-subscription error:', e);
    return json({ error: e instanceof Error ? e.message : 'Erro desconhecido' }, 500);
  }
});
