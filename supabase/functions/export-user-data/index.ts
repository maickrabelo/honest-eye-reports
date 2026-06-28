import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function fetchIn(supabase: any, table: string, column: string, ids: string[], select = '*') {
  if (!ids.length) return [] as any[];
  const out: any[] = [];
  for (let i = 0; i < ids.length; i += 200) {
    const { data } = await supabase.from(table).select(select).in(column, ids.slice(i, i + 200));
    if (data) out.push(...data);
  }
  return out;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Authorize: must be admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const token = authHeader.replace('Bearer ', '');
    const { data: userData } = await supabase.auth.getUser(token);
    if (!userData?.user) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    const { data: isAdmin } = await supabase.rpc('has_role', { _user_id: userData.user.id, _role: 'admin' });
    if (!isAdmin) return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const url = new URL(req.url);
    let userId = url.searchParams.get('user_id');
    const email = url.searchParams.get('email');

    if (!userId && email) {
      // find by email via auth admin listUsers
      let page = 1;
      while (!userId) {
        const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
        if (error || !data.users.length) break;
        const found = data.users.find((u: any) => (u.email || '').toLowerCase() === email.toLowerCase());
        if (found) { userId = found.id; break; }
        if (data.users.length < 200) break;
        page++;
        if (page > 50) break;
      }
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: 'Provide user_id or email (not found)' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { data: authUser } = await supabase.auth.admin.getUserById(userId);
    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    const roles = await fetchIn(supabase, 'user_roles', 'user_id', [userId]);
    const userCompanies = await fetchIn(supabase, 'user_companies', 'user_id', [userId]);
    const userSstManagers = await fetchIn(supabase, 'user_sst_managers', 'user_id', [userId]);
    const subscriptions = await fetchIn(supabase, 'subscriptions', 'owner_user_id', [userId]);

    const sstIds = Array.from(new Set([
      ...(profile?.sst_manager_id ? [profile.sst_manager_id] : []),
      ...userSstManagers.map((u: any) => u.sst_manager_id),
    ]));
    const sstManagers = await fetchIn(supabase, 'sst_managers', 'id', sstIds);

    const companyIds = Array.from(new Set([
      ...(profile?.company_id ? [profile.company_id] : []),
      ...userCompanies.map((u: any) => u.company_id),
      // also companies assigned to SSTs this user owns
    ]));
    // companies via sst assignments
    const csaBySst = await fetchIn(supabase, 'company_sst_assignments', 'sst_manager_id', sstIds);
    csaBySst.forEach((c: any) => { if (!companyIds.includes(c.company_id)) companyIds.push(c.company_id); });

    const companies = await fetchIn(supabase, 'companies', 'id', companyIds);
    const companyAssignments = await fetchIn(supabase, 'company_sst_assignments', 'company_id', companyIds);
    const featureAccess = await fetchIn(supabase, 'company_feature_access', 'company_id', companyIds);

    const hseit = await fetchIn(supabase, 'hseit_assessments', 'company_id', companyIds);
    const copsoq = await fetchIn(supabase, 'copsoq_assessments', 'company_id', companyIds);
    const burnout = await fetchIn(supabase, 'burnout_assessments', 'company_id', companyIds);
    const climate = await fetchIn(supabase, 'climate_surveys', 'company_id', companyIds);

    const hseitResps = await fetchIn(supabase, 'hseit_responses', 'assessment_id', hseit.map((a: any) => a.id));
    const copsoqResps = await fetchIn(supabase, 'copsoq_responses', 'assessment_id', copsoq.map((a: any) => a.id));
    const burnoutResps = await fetchIn(supabase, 'burnout_responses', 'assessment_id', burnout.map((a: any) => a.id));
    const climateResps = await fetchIn(supabase, 'survey_responses', 'survey_id', climate.map((a: any) => a.id));

    const hseitAns = await fetchIn(supabase, 'hseit_answers', 'response_id', hseitResps.map((r: any) => r.id));
    const copsoqAns = await fetchIn(supabase, 'copsoq_answers', 'response_id', copsoqResps.map((r: any) => r.id));
    const burnoutAns = await fetchIn(supabase, 'burnout_answers', 'response_id', burnoutResps.map((r: any) => r.id));
    const climateAns = await fetchIn(supabase, 'survey_answers', 'response_id', climateResps.map((r: any) => r.id));
    const climateQuestions = await fetchIn(supabase, 'survey_questions', 'survey_id', climate.map((a: any) => a.id));

    const hseitDepts = await fetchIn(supabase, 'hseit_departments', 'assessment_id', hseit.map((a: any) => a.id));
    const copsoqDepts = await fetchIn(supabase, 'copsoq_departments', 'assessment_id', copsoq.map((a: any) => a.id));
    const burnoutDepts = await fetchIn(supabase, 'burnout_departments', 'assessment_id', burnout.map((a: any) => a.id));
    const climateDepts = await fetchIn(supabase, 'survey_departments', 'survey_id', climate.map((a: any) => a.id));

    const pgrDocs = await fetchIn(supabase, 'pgr_documents', 'company_id', companyIds);
    const pgrDocIds = pgrDocs.map((d: any) => d.id);
    const pgrGhe = await fetchIn(supabase, 'pgr_ghe', 'document_id', pgrDocIds);
    const pgrRisks = await fetchIn(supabase, 'pgr_risks', 'document_id', pgrDocIds);
    const pgrActions = await fetchIn(supabase, 'pgr_action_items', 'document_id', pgrDocIds);
    const pgrMonitoring = await fetchIn(supabase, 'pgr_monitoring', 'document_id', pgrDocIds);
    const pgrGheWorkers = await fetchIn(supabase, 'pgr_ghe_workers', 'ghe_id', pgrGhe.map((g: any) => g.id));
    const pgrChecklist = await fetchIn(supabase, 'pgr_action_checklist_items', 'action_item_id', pgrActions.map((a: any) => a.id));

    const reports = await fetchIn(supabase, 'reports', 'company_id', companyIds);

    const u = authUser?.user || {} as any;
    const payload = {
      exported_at: new Date().toISOString(),
      target: { user_id: userId, email: u.email },
      totals: {
        companies: companies.length,
        sst_managers: sstManagers.length,
        hseit_assessments: hseit.length,
        copsoq_assessments: copsoq.length,
        burnout_assessments: burnout.length,
        climate_surveys: climate.length,
        pgr_documents: pgrDocs.length,
        reports: reports.length,
      },
      auth_user: {
        id: u.id, email: u.email, phone: u.phone,
        created_at: u.created_at, last_sign_in_at: u.last_sign_in_at,
        email_confirmed_at: u.email_confirmed_at,
        user_metadata: u.user_metadata, app_metadata: u.app_metadata,
      },
      profile, roles, subscriptions,
      sst_managers: sstManagers,
      user_sst_managers: userSstManagers,
      user_companies: userCompanies,
      companies,
      company_sst_assignments: companyAssignments,
      company_feature_access: featureAccess,
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

    const filename = `user-export-${(u.email || userId).replace(/[^a-z0-9]/gi, '_')}-${new Date().toISOString().split('T')[0]}.json`;
    return new Response(JSON.stringify(payload), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
