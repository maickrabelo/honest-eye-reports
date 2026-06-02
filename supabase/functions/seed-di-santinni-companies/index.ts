import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SST_MANAGER_ID = "af4685b9-9f20-489a-a745-867cd9756ff1";
const USER_EMAIL = "karen.rodrigues@di-santinni.com.br";
const USER_NAME = "Karen Rodrigues";

const COMPANIES: { name: string; cnpj: string; employee_count: number }[] = [
  { name: "BY RIO INDUSTRIA E COMERCIO DE CALCADOS LTDA (17)", cnpj: "12.746.684/0002-17", employee_count: 133 },
  { name: "BY RIO INDUSTRIA E COMERCIO DE CALCADOS LTDA (06)", cnpj: "12.746.864/0003-06", employee_count: 57 },
  { name: "PKK CALCADOS LTDA (80)", cnpj: "56.681.513/0028-80", employee_count: 17 },
  { name: "PKK CALCADOS LTDA (07)", cnpj: "56.681.513/0027-07", employee_count: 13 },
  { name: "PKK CALCADOS LTDA (58)", cnpj: "56.681.513/0069-58", employee_count: 32 },
  { name: "PKK CALCADOS LTDA (06)", cnpj: "56.681.513/0083-06", employee_count: 65 },
  { name: "CAPO IBIRAPUERA 1 COMERCIO DE CALCADOS LTDA (36)", cnpj: "57.765.479/0003-36", employee_count: 3 },
  { name: "CAPO IBIRAPUERA 1 COMERCIO DE CALCADOS LTDA (74)", cnpj: "57.765.479/0001-74", employee_count: 7 },
  { name: "CAPO IBIRAPUERA 1 COMERCIO DE CALCADOS LTDA (06)", cnpj: "57.765.479/0005-06", employee_count: 5 },
  { name: "CAPO IBIRAPUERA 1 COMERCIO DE CALCADOS LTDA (55)", cnpj: "57.765.479/0002-55", employee_count: 5 },
  { name: "WIZOS DESENVOLVIMENTO E COMERCIO DE SOFTWARE LTDA", cnpj: "51.288.138/0001-79", employee_count: 21 },
  { name: "BY RIO INDUSTRIA E COMERCIO DE CALCADOS LTDA (36)", cnpj: "12.746.864/0001-36", employee_count: 8 },
  { name: "DS LOG COMERCIO DE CALCADOS LTDA (70)", cnpj: "12.680.513/0001-70", employee_count: 48 },
  { name: "A ALVES FILHO CALCADOS EPP", cnpj: "13.177.284/0001-38", employee_count: 9 },
  { name: "PKK CALCADOS LTDA (20)", cnpj: "56.681.513/0079-20", employee_count: 22 },
  { name: "PKK CALCADOS LTDA (63)", cnpj: "56.681.513/0080-63", employee_count: 7 },
  { name: "PKK CALCADOS LTDA (97)", cnpj: "56.681.513/0084-97", employee_count: 13 },
  { name: "PKK CALCADOS LTDA (09)", cnpj: "56.681.513/0061-09", employee_count: 17 },
  { name: "PKK CALCADOS LTDA (52)", cnpj: "56.681.513/0055-52", employee_count: 43 },
  { name: "PKK CALCADOS LTDA (56)", cnpj: "56.681.513/0105-56", employee_count: 14 },
  { name: "PKK CALCADOS LTDA (33)", cnpj: "56.681.513/0056-33", employee_count: 16 },
  { name: "PKK CALCADOS LTDA (37)", cnpj: "56.681.513/0106-37", employee_count: 16 },
  { name: "PKK CALCADOS LTDA (71)", cnpj: "56.681.513/0054-71", employee_count: 31 },
  { name: "PKK CALCADOS LTDA (03-0102)", cnpj: "56.681.513/0102-03", employee_count: 20 },
  { name: "PKK CALCADOS LTDA (81)", cnpj: "56.681.513/0062-81", employee_count: 43 },
  { name: "PKK CALCADOS LTDA (75)", cnpj: "56.681.513/0104-75", employee_count: 13 },
  { name: "PKK CALCADOS LTDA (03-0058)", cnpj: "56.681.513/0058-03", employee_count: 42 },
  { name: "PKK CALCADOS LTDA (10)", cnpj: "56.681.513/0060-10", employee_count: 16 },
  { name: "PKK CALCADOS LTDA (41)", cnpj: "56.681.513/0100-41", employee_count: 28 },
  { name: "PKK CALCADOS LTDA (22)", cnpj: "56.681.513/0101-22", employee_count: 16 },
  { name: "DS LOG COMERCIO DE CALCADOS LTDA (36)", cnpj: "12.746.864/0001-36", employee_count: 35 },
  { name: "DS LOG COMERCIO DE CALCADOS LTDA (84)", cnpj: "12.680.513/0006-84", employee_count: 8 },
  { name: "PKK CALCADOS LTDA (34)", cnpj: "56.681.513/0073-34", employee_count: 18 },
  { name: "PKK CALCADOS LTDA (88)", cnpj: "56.681.513/0093-88", employee_count: 9 },
  { name: "PKK CALCADOS LTDA (53)", cnpj: "56.681.513/0072-53", employee_count: 15 },
  { name: "PKK CALCADOS LTDA (15)", cnpj: "56.681.513/0074-15", employee_count: 16 },
  { name: "PKK CALCADOS LTDA (04-0075)", cnpj: "56.681.513/0075-04", employee_count: 25 },
  { name: "PKK CALCADOS LTDA (68)", cnpj: "56.681.513/0077-68", employee_count: 11 },
  { name: "PKK CALCADOS LTDA (44)", cnpj: "56.681.513/0081-44", employee_count: 14 },
  { name: "PKK CALCADOS LTDA (57)", cnpj: "56.681.513/0041-57", employee_count: 25 },
  { name: "PKK CALCADOS LTDA (51)", cnpj: "56.681.513/0038-51", employee_count: 13 },
  { name: "PKK CALCADOS LTDA (02-0004)", cnpj: "56.681.513/0004-02", employee_count: 26 },
  { name: "PKK CALCADOS LTDA (85)", cnpj: "56.681.513/0031-85", employee_count: 27 },
  { name: "PKK CALCADOS LTDA (78)", cnpj: "56.681.513/0085-78", employee_count: 17 },
  { name: "PKK CALCADOS LTDA (43)", cnpj: "56.681.513/0064-43", employee_count: 19 },
  { name: "PKK CALCADOS LTDA (02-0111)", cnpj: "56.681.513/0111-02", employee_count: 13 },
  { name: "PKK CALCADOS LTDA (30)", cnpj: "56.681.513/0087-30", employee_count: 16 },
  { name: "PKK CALCADOS LTDA (07-0108)", cnpj: "56.681.513/0108-07", employee_count: 14 },
  { name: "PKK CALCADOS LTDA (59)", cnpj: "56.681.513/0086-59", employee_count: 14 },
  { name: "PKK CALCADOS LTDA (18)", cnpj: "56.681.513/0107-18", employee_count: 10 },
  { name: "PKK CALCADOS LTDA (80-0109)", cnpj: "56.681.513/0109-80", employee_count: 14 },
  { name: "PKK CALCADOS LTDA (17)", cnpj: "56.681.513/0009-17", employee_count: 15 },
  { name: "PKK CALCADOS LTDA (24)", cnpj: "56.681.513/0065-24", employee_count: 29 },
  { name: "PKK CALCADOS LTDA (16)", cnpj: "56.681.513/0091-16", employee_count: 14 },
  { name: "PKK CALCADOS LTDA (04-0049)", cnpj: "56.681.513/0049-04", employee_count: 15 },
  { name: "PKK CALCADOS LTDA (61)", cnpj: "56.681.513/0046-61", employee_count: 13 },
  { name: "PKK CALCADOS LTDA (08)", cnpj: "56.681.513/0044-08", employee_count: 10 },
  { name: "PKK CALCADOS LTDA (87)", cnpj: "56.681.513/0076-87", employee_count: 17 },
  { name: "PKK CALCADOS LTDA (40)", cnpj: "56.681.513/0095-40", employee_count: 21 },
  { name: "PKK CALCADOS LTDA (48)", cnpj: "56.681.513/0050-48", employee_count: 15 },
  { name: "PKK CALCADOS LTDA (80-0045)", cnpj: "56.681.513/0045-80", employee_count: 10 },
  { name: "PKK CALCADOS LTDA (77)", cnpj: "56.681.513/0068-77", employee_count: 13 },
];

const slugify = (n: string) =>
  n.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").substring(0, 60);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  try {
    // 1) Find or create Karen user
    const { data: list } = await supabase.auth.admin.listUsers({ page: 1, perPage: 1000 });
    let karen = list?.users?.find((u: any) => u.email?.toLowerCase() === USER_EMAIL);
    const initialPassword = COMPANIES[0].cnpj.replace(/\D/g, "");

    if (!karen) {
      const { data: created, error: cErr } = await supabase.auth.admin.createUser({
        email: USER_EMAIL,
        password: initialPassword,
        email_confirm: true,
        user_metadata: { full_name: USER_NAME },
      });
      if (cErr) throw cErr;
      karen = created.user!;
    }
    const userId = karen!.id;

    await supabase.from("profiles").upsert({
      id: userId, full_name: USER_NAME, must_change_password: true,
    }, { onConflict: "id" });

    await supabase.from("user_roles").delete().eq("user_id", userId);
    await supabase.from("user_roles").insert({ user_id: userId, role: "company" });

    const results: any[] = [];
    let firstCompanyId: string | null = null;

    for (let i = 0; i < COMPANIES.length; i++) {
      const c = COMPANIES[i];
      const cnpjDigits = c.cnpj.replace(/\D/g, "");

      // Check existing
      const { data: existing } = await supabase
        .from("companies").select("id").eq("cnpj", c.cnpj).maybeSingle();

      let companyId = existing?.id;
      if (!companyId) {
        const baseSlug = slugify(c.name);
        let slug = baseSlug;
        for (let s = 1; s < 50; s++) {
          const { data: e } = await supabase.from("companies").select("id").eq("slug", slug).maybeSingle();
          if (!e) break;
          slug = `${baseSlug}-${s}`;
        }
        companyId = crypto.randomUUID();
        const { error: insErr } = await supabase.from("companies").insert({
          id: companyId, name: c.name, cnpj: c.cnpj, email: USER_EMAIL,
          slug, subscription_status: "active", employee_count: c.employee_count,
        });
        if (insErr) { results.push({ cnpj: c.cnpj, error: insErr.message }); continue; }
      }

      if (!firstCompanyId) firstCompanyId = companyId!;

      await supabase.from("company_sst_assignments").upsert({
        company_id: companyId, sst_manager_id: SST_MANAGER_ID,
      }, { onConflict: "company_id,sst_manager_id" });

      await supabase.from("company_feature_access").upsert({
        company_id: companyId,
        ouvidoria_enabled: true, psicossocial_enabled: true,
        burnout_enabled: true, clima_enabled: true, treinamentos_enabled: true,
      }, { onConflict: "company_id" });

      const { data: ucExist } = await supabase.from("user_companies")
        .select("id").eq("user_id", userId).eq("company_id", companyId).maybeSingle();
      if (!ucExist) {
        await supabase.from("user_companies").insert({
          user_id: userId, company_id: companyId, is_default: i === 0,
        });
      }

      results.push({ cnpj: c.cnpj, company_id: companyId, ok: true });
    }

    // Set active company on profile
    if (firstCompanyId) {
      await supabase.from("profiles").update({ company_id: firstCompanyId }).eq("id", userId);
    }

    return new Response(JSON.stringify({
      success: true,
      user_email: USER_EMAIL,
      initial_password: initialPassword,
      total: results.length,
      ok_count: results.filter(r => r.ok).length,
      errors: results.filter(r => r.error),
    }, null, 2), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
