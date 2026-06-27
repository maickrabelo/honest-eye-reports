import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PLAN_ID = 'af9d601f-fda5-4f77-862d-aff799e4fdf3'; // teste-sms

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: plan } = await supabase.from('subscription_plans').select('*').eq('id', PLAN_ID).single();

    const { data: subs } = await supabase
      .from('subscriptions').select('*').eq('plan_id', PLAN_ID);

    const userIds = Array.from(new Set((subs || []).map((s: any) => s.owner_user_id).filter(Boolean)));

    // fetch auth users (paged)
    const authUsersById = new Map<string, any>();
    let page = 1;
    while (true) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
      if (error) break;
      data.users.forEach((u: any) => authUsersById.set(u.id, u));
      if (data.users.length < 200) break;
      page++;
      if (page > 50) break;
    }

    const { data: profiles } = await supabase.from('profiles').select('*').in('id', userIds);
    const { data: roles } = await supabase.from('user_roles').select('*').in('user_id', userIds);

    const sstIds = Array.from(new Set((profiles || []).map((p: any) => p.sst_manager_id).filter(Boolean)));
    const companyIds = Array.from(new Set((profiles || []).map((p: any) => p.company_id).filter(Boolean)));

    const { data: sstManagers } = sstIds.length
      ? await supabase.from('sst_managers').select('*').in('id', sstIds)
      : { data: [] as any[] };
    const { data: companies } = companyIds.length
      ? await supabase.from('companies').select('*').in('id', companyIds)
      : { data: [] as any[] };
    const { data: userCompanies } = await supabase.from('user_companies').select('*').in('user_id', userIds);
    const { data: featureAccess } = companyIds.length
      ? await supabase.from('company_feature_access').select('*').in('company_id', companyIds)
      : { data: [] as any[] };

    const now = Date.now();

    const rows = (subs || []).map((s: any) => {
      const u = authUsersById.get(s.owner_user_id) || {};
      const p = (profiles || []).find((x: any) => x.id === s.owner_user_id) || {};
      const userRoles = (roles || []).filter((r: any) => r.user_id === s.owner_user_id).map((r: any) => r.role);
      const sst = (sstManagers || []).find((m: any) => m.id === p.sst_manager_id) || null;
      const company = (companies || []).find((c: any) => c.id === p.company_id) || null;
      const trialEnd = s.trial_ends_at ? new Date(s.trial_ends_at).getTime() : null;
      const daysRemaining = trialEnd != null
        ? Math.max(0, Math.ceil((trialEnd - now) / 86400000))
        : null;
      const expired = trialEnd != null && trialEnd < now;
      return {
        subscription: s,
        days_remaining: daysRemaining,
        trial_expired: expired,
        auth_user: {
          id: u.id,
          email: u.email,
          phone: u.phone,
          created_at: u.created_at,
          last_sign_in_at: u.last_sign_in_at,
          email_confirmed_at: u.email_confirmed_at,
          user_metadata: u.user_metadata,
          app_metadata: u.app_metadata,
        },
        profile: p,
        roles: userRoles,
        sst_manager: sst,
        company,
        user_companies: (userCompanies || []).filter((uc: any) => uc.user_id === s.owner_user_id),
        company_feature_access: company ? (featureAccess || []).find((f: any) => f.company_id === company.id) : null,
      };
    });

    const payload = {
      exported_at: new Date().toISOString(),
      plan,
      total: rows.length,
      users: rows,
    };

    return new Response(JSON.stringify(payload, null, 2), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
