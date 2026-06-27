import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Todos os planos SMS (não apenas teste-sms)
const SMS_PLAN_SLUG_LIKE = '%sms%';

async function fetchIn(supabase: any, table: string, column: string, ids: string[], select = '*') {
  if (!ids.length) return [] as any[];
  const chunks: any[] = [];
  for (let i = 0; i < ids.length; i += 200) {
    const slice = ids.slice(i, i + 200);
    const { data } = await supabase.from(table).select(select).in(column, slice);
    if (data) chunks.push(...data);
  }
  return chunks;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const url = new URL(req.url);
    const planFilter = url.searchParams.get('plan'); // ex: teste-sms; default: all SMS

    // 1) Planos SMS
    let plansQuery = supabase.from('subscription_plans').select('*');
    plansQuery = planFilter
      ? plansQuery.eq('slug', planFilter)
      : plansQuery.like('slug', SMS_PLAN_SLUG_LIKE);
    const { data: plans } = await plansQuery;
    const planIds = (plans || []).map((p: any) => p.id);

    // 2) Subscriptions
    const { data: subs } = await supabase.from('subscriptions').select('*').in('plan_id', planIds);
    const userIds = Array.from(new Set((subs || []).map((s: any) => s.owner_user_id).filter(Boolean)));

    // 3) Auth users (paged)
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

    // 4) Profiles, roles, sst, companies
    const profiles = await fetchIn(supabase, 'profiles', 'id', userIds);
    const roles = await fetchIn(supabase, 'user_roles', 'user_id', userIds);
    const userCompanies = await fetchIn(supabase, 'user_companies', 'user_id', userIds);
    const userSstManagers = await fetchIn(supabase, 'user_sst_managers', 'user_id', userIds);

    const sstIds = Array.from(new Set([
      ...profiles.map((p: any) => p.sst_manager_id).filter(Boolean),
      ...userSstManagers.map((u: any) => u.sst_manager_id).filter(Boolean),
    ]));
    const sstManagers = await fetchIn(supabase, 'sst_managers', 'id', sstIds);

    const companyIds = Array.from(new Set([
      ...profiles.map((p: any) => p.company_id).filter(Boolean),
      ...userCompanies.map((u: any) => u.company_id).filter(Boolean),
    ]));
    const companies = await fetchIn(supabase, 'companies', 'id', companyIds);
    const companyAssignments = await fetchIn(supabase, 'company_sst_assignments', 'company_id', companyIds);
    const featureAccess = await fetchIn(supabase, 'company_feature_access', 'company_id', companyIds);

    // 5) Avaliações por company_id (cobre todos os tipos)
    const hseit = await fetchIn(supabase, 'hseit_assessments', 'company_id', companyIds);
    const copsoq = await fetchIn(supabase, 'copsoq_assessments', 'company_id', companyIds);
    const burnout = await fetchIn(supabase, 'burnout_assessments', 'company_id', companyIds);
    const climate = await fetchIn(supabase, 'climate_surveys', 'company_id', companyIds);

    // Responses
    const hseitResps = await fetchIn(supabase, 'hseit_responses', 'assessment_id', hseit.map((a: any) => a.id));
    const copsoqResps = await fetchIn(supabase, 'copsoq_responses', 'assessment_id', copsoq.map((a: any) => a.id));
    const burnoutResps = await fetchIn(supabase, 'burnout_responses', 'assessment_id', burnout.map((a: any) => a.id));
    const climateResps = await fetchIn(supabase, 'survey_responses', 'survey_id', climate.map((a: any) => a.id));

    // Answers
    const hseitAns = await fetchIn(supabase, 'hseit_answers', 'response_id', hseitResps.map((r: any) => r.id));
    const copsoqAns = await fetchIn(supabase, 'copsoq_answers', 'response_id', copsoqResps.map((r: any) => r.id));
    const burnoutAns = await fetchIn(supabase, 'burnout_answers', 'response_id', burnoutResps.map((r: any) => r.id));
    const climateAns = await fetchIn(supabase, 'survey_answers', 'response_id', climateResps.map((r: any) => r.id));
    const climateQuestions = await fetchIn(supabase, 'survey_questions', 'survey_id', climate.map((a: any) => a.id));

    // Departments (por assessment_id ou survey_id)
    const hseitDepts = await fetchIn(supabase, 'hseit_departments', 'assessment_id', hseit.map((a: any) => a.id));
    const copsoqDepts = await fetchIn(supabase, 'copsoq_departments', 'assessment_id', copsoq.map((a: any) => a.id));
    const burnoutDepts = await fetchIn(supabase, 'burnout_departments', 'assessment_id', burnout.map((a: any) => a.id));
    const climateDepts = await fetchIn(supabase, 'survey_departments', 'survey_id', climate.map((a: any) => a.id));

    // PGR
    const pgrDocs = await fetchIn(supabase, 'pgr_documents', 'company_id', companyIds);
    const pgrDocIds = pgrDocs.map((d: any) => d.id);
    const pgrGhe = await fetchIn(supabase, 'pgr_ghe', 'document_id', pgrDocIds);
    const pgrRisks = await fetchIn(supabase, 'pgr_risks', 'document_id', pgrDocIds);
    const pgrActions = await fetchIn(supabase, 'pgr_action_items', 'document_id', pgrDocIds);
    const pgrMonitoring = await fetchIn(supabase, 'pgr_monitoring', 'document_id', pgrDocIds);
    const pgrGheWorkers = await fetchIn(supabase, 'pgr_ghe_workers', 'ghe_id', pgrGhe.map((g: any) => g.id));
    const pgrChecklist = await fetchIn(supabase, 'pgr_action_checklist_items', 'action_item_id', pgrActions.map((a: any) => a.id));

    // Reports (ouvidoria)
    const reports = await fetchIn(supabase, 'reports', 'company_id', companyIds);

    const now = Date.now();

    // Indexa por user
    const usersOut = (subs || []).map((s: any) => {
      const u = authUsersById.get(s.owner_user_id) || {};
      const p = profiles.find((x: any) => x.id === s.owner_user_id) || {};
      const userRoleList = roles.filter((r: any) => r.user_id === s.owner_user_id).map((r: any) => r.role);
      const sst = sstManagers.find((m: any) => m.id === p.sst_manager_id) || null;
      const myCompanyIds = [
        ...(p.company_id ? [p.company_id] : []),
        ...userCompanies.filter((uc: any) => uc.user_id === s.owner_user_id).map((uc: any) => uc.company_id),
      ];
      const myCompanies = companies.filter((c: any) => myCompanyIds.includes(c.id));
      const trialEnd = s.trial_ends_at ? new Date(s.trial_ends_at).getTime() : null;
      const daysRemaining = trialEnd != null ? Math.max(0, Math.ceil((trialEnd - now) / 86400000)) : null;
      const planObj = (plans || []).find((pl: any) => pl.id === s.plan_id);

      return {
        subscription: s,
        plan_slug: planObj?.slug,
        days_remaining: daysRemaining,
        trial_expired: trialEnd != null && trialEnd < now,
        auth_user: {
          id: u.id, email: u.email, phone: u.phone,
          created_at: u.created_at, last_sign_in_at: u.last_sign_in_at,
          email_confirmed_at: u.email_confirmed_at,
          user_metadata: u.user_metadata, app_metadata: u.app_metadata,
        },
        profile: p,
        roles: userRoleList,
        sst_manager: sst,
        companies: myCompanies,
        user_companies: userCompanies.filter((uc: any) => uc.user_id === s.owner_user_id),
        user_sst_managers: userSstManagers.filter((uc: any) => uc.user_id === s.owner_user_id),
      };
    });

    const payload = {
      exported_at: new Date().toISOString(),
      filter: { plan: planFilter || 'all-sms' },
      totals: {
        plans: plans?.length || 0,
        subscriptions: subs?.length || 0,
        users: userIds.length,
        companies: companies.length,
        sst_managers: sstManagers.length,
        hseit_assessments: hseit.length,
        copsoq_assessments: copsoq.length,
        burnout_assessments: burnout.length,
        climate_surveys: climate.length,
        pgr_documents: pgrDocs.length,
        reports: reports.length,
      },
      plans,
      users: usersOut,
      companies,
      company_sst_assignments: companyAssignments,
      company_feature_access: featureAccess,
      sst_managers: sstManagers,
      assessments: {
        hseit: { assessments: hseit, responses: hseitResps, answers: hseitAns, departments: hseitDepts },
        copsoq: { assessments: copsoq, responses: copsoqResps, answers: copsoqAns, departments: copsoqDepts },
        burnout: { assessments: burnout, responses: burnoutResps, answers: burnoutAns, departments: burnoutDepts },
        climate: { surveys: climate, questions: climateQuestions, responses: climateResps, answers: climateAns, departments: climateDepts },
      },
      pgr: {
        documents: pgrDocs,
        ghe: pgrGhe,
        ghe_workers: pgrGheWorkers,
        risks: pgrRisks,
        action_items: pgrActions,
        action_checklist_items: pgrChecklist,
        monitoring: pgrMonitoring,
      },
      reports,
    };

    return new Response(JSON.stringify(payload), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="sms-full-export-${new Date().toISOString().split('T')[0]}.json"`,
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
