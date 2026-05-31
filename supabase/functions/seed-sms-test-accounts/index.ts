import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PASSWORD = 'TesteSMS@2026';

const ACCOUNTS = [
  { slug: 'tecnico-sst-sms',       email: 'teste-tecnico-sms@soia.app.br',           name: 'Teste Técnico SST SMS' },
  { slug: 'gestora-sst-sms-basic', email: 'teste-gestora-basic-sms@soia.app.br',     name: 'Teste Gestora SMS Basic' },
  { slug: 'gestora-sst-sms-pro',   email: 'teste-gestora-pro-sms@soia.app.br',       name: 'Teste Gestora SMS Pro' },
  { slug: 'empresa-sms-starter',   email: 'teste-empresa-starter-sms@soia.app.br',   name: 'Teste Empresa SMS Starter' },
  { slug: 'empresa-sms-corporate', email: 'teste-empresa-corporate-sms@soia.app.br', name: 'Teste Empresa SMS Corporate' },
];

async function findUserByEmail(supabase: any, email: string) {
  const e = email.toLowerCase().trim();
  let page = 1;
  while (page <= 10) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const found = data.users.find((u: any) => u.email?.toLowerCase() === e);
    if (found) return found;
    if (data.users.length < 200) return null;
    page++;
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const results: any[] = [];

    for (const acc of ACCOUNTS) {
      const { data: plan, error: planErr } = await supabase
        .from('subscription_plans').select('*').eq('slug', acc.slug).single();
      if (planErr || !plan) { results.push({ email: acc.email, error: `plan ${acc.slug} not found` }); continue; }

      // create or fetch user
      let user = await findUserByEmail(supabase, acc.email);
      if (!user) {
        const { data, error } = await supabase.auth.admin.createUser({
          email: acc.email, password: PASSWORD, email_confirm: true,
          user_metadata: { full_name: acc.name },
        });
        if (error) { results.push({ email: acc.email, error: error.message }); continue; }
        user = data.user;
      } else {
        // reset password to known value
        await supabase.auth.admin.updateUserById(user.id, { password: PASSWORD, email_confirm: true });
      }

      await supabase.from('profiles').upsert({
        id: user!.id, full_name: acc.name, must_change_password: false,
      });

      const role = plan.category === 'manager' ? 'sst' : 'company';
      // wipe pending role and set right one
      await supabase.from('user_roles').delete().eq('user_id', user!.id);
      await supabase.from('user_roles').insert({ user_id: user!.id, role });

      // idempotent subscription
      const { data: existingSub } = await supabase
        .from('subscriptions').select('id')
        .eq('owner_user_id', user!.id).eq('plan_id', plan.id).maybeSingle();

      let subId = existingSub?.id;
      if (!subId) {
        const { data: newSub, error: subErr } = await supabase.from('subscriptions').insert({
          owner_user_id: user!.id, owner_email: acc.email, plan_id: plan.id,
          billing_cycle: 'monthly', status: 'active',
          amount_cents: plan.price_monthly_cents ?? plan.base_price_cents ?? 0,
          provider: 'hotmart-test',
          hotmart_transaction_id: `TEST-${acc.slug}`,
          current_period_start: new Date().toISOString(),
          metadata: { test_account: true, plan_slug: acc.slug },
        }).select('id').single();
        if (subErr) { results.push({ email: acc.email, error: `sub: ${subErr.message}` }); continue; }
        subId = newSub.id;
      }

      if (plan.category === 'manager') {
        const { data: prof } = await supabase.from('profiles').select('sst_manager_id').eq('id', user!.id).single();
        let mgrId = prof?.sst_manager_id;
        if (!mgrId) {
          const { data: mgr, error: mgrErr } = await supabase.from('sst_managers').insert({
            name: acc.name, email: acc.email,
            max_companies: plan.max_companies || 10,
            subscription_status: 'active',
            pgr_module_enabled: plan.pgr_enabled === true,
          }).select('id').single();
          if (mgrErr) { results.push({ email: acc.email, error: `mgr: ${mgrErr.message}` }); continue; }
          mgrId = mgr.id;
          await supabase.from('profiles').update({ sst_manager_id: mgrId }).eq('id', user!.id);
        } else {
          await supabase.from('sst_managers').update({
            subscription_status: 'active',
            pgr_module_enabled: plan.pgr_enabled === true,
            max_companies: plan.max_companies || 10,
          }).eq('id', mgrId);
        }
        results.push({ email: acc.email, password: PASSWORD, plan: plan.name, sst_manager_id: mgrId });
      } else {
        const { data: prof } = await supabase.from('profiles').select('company_id').eq('id', user!.id).single();
        let companyId = prof?.company_id;
        if (!companyId) {
          const slugBase = acc.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').slice(0, 50);
          const { data: company, error: cErr } = await supabase.from('companies').insert({
            name: acc.name, email: acc.email,
            slug: `${slugBase}-${Date.now().toString(36)}`,
            subscription_status: 'active', employee_count: 0,
            parent_subscription_id: subId, max_employees: plan.max_employees,
          }).select('id').single();
          if (cErr) { results.push({ email: acc.email, error: `company: ${cErr.message}` }); continue; }
          companyId = company.id;
          await supabase.from('user_companies').upsert(
            { user_id: user!.id, company_id: companyId }, { onConflict: 'user_id,company_id' },
          );
          await supabase.from('profiles').update({ company_id: companyId }).eq('id', user!.id);
        }
        await supabase.from('company_feature_access').upsert({
          company_id: companyId,
          ouvidoria_enabled: plan.ouvidoria_enabled ?? true,
          psicossocial_enabled: true, burnout_enabled: true,
          clima_enabled: true, treinamentos_enabled: true,
        }, { onConflict: 'company_id' });
        results.push({ email: acc.email, password: PASSWORD, plan: plan.name, company_id: companyId });
      }
    }

    return new Response(JSON.stringify({ ok: true, results }, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
