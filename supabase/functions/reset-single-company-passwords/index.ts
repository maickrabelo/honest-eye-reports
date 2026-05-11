import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const cnpjDigits = (value: unknown) => String(value ?? "").replace(/\D/g, "");

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Authorization: caller must be admin (or service role)
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "");
    let authorized = false;
    if (token && token === supabaseServiceKey) {
      authorized = true;
    } else if (token) {
      const caller = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: `Bearer ${token}` } },
      });
      const { data: callerData } = await caller.auth.getUser(token);
      const callerId = callerData?.user?.id;
      if (callerId) {
        const adminTmp = createClient(supabaseUrl, supabaseServiceKey);
        const { data: roles } = await adminTmp
          .from("user_roles")
          .select("role")
          .eq("user_id", callerId);
        if (roles?.some((r: any) => r.role === "admin")) authorized = true;
      }
    }
    if (!authorized) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(supabaseUrl, supabaseServiceKey);
    const body = await req.json().catch(() => ({}));
    const dryRun: boolean = body.dry_run === true;

    // Load companies and group by lowercase email
    const { data: companies } = await admin
      .from("companies")
      .select("id, cnpj, email, name");

    const companiesByEmail = new Map<string, any[]>();
    for (const c of companies ?? []) {
      const email = String(c.email ?? "").trim().toLowerCase();
      if (!email) continue;
      const arr = companiesByEmail.get(email) ?? [];
      arr.push(c);
      companiesByEmail.set(email, arr);
    }

    // Load all auth users
    const { data: { users } } = await admin.auth.admin.listUsers({ perPage: 1000 });

    // Load all user_roles & user_companies once
    const { data: allRoles } = await admin.from("user_roles").select("user_id, role");
    const rolesByUser = new Map<string, string[]>();
    for (const r of allRoles ?? []) {
      const arr = rolesByUser.get(r.user_id) ?? [];
      arr.push(r.role);
      rolesByUser.set(r.user_id, arr);
    }

    const { data: allLinks } = await admin
      .from("user_companies")
      .select("user_id, company_id");
    const linksByUser = new Map<string, string[]>();
    for (const l of allLinks ?? []) {
      const arr = linksByUser.get(l.user_id) ?? [];
      arr.push(l.company_id);
      linksByUser.set(l.user_id, arr);
    }

    const summary = {
      reset: 0,
      skipped_multi_company: 0,
      skipped_not_company_role: 0,
      skipped_invalid_cnpj: 0,
      skipped_no_user: 0,
      errors: 0,
      details: [] as any[],
    };

    for (const [email, comps] of companiesByEmail.entries()) {
      if (comps.length !== 1) {
        summary.skipped_multi_company++;
        continue;
      }
      const company = comps[0];
      const password = cnpjDigits(company.cnpj);
      if (password.length < 8) {
        summary.skipped_invalid_cnpj++;
        summary.details.push({ email, company: company.name, status: "invalid_cnpj" });
        continue;
      }

      const u = users.find((x: any) => x.email?.toLowerCase() === email);
      if (!u) {
        summary.skipped_no_user++;
        summary.details.push({ email, company: company.name, status: "no_auth_user" });
        continue;
      }

      const userRoles = rolesByUser.get(u.id) ?? [];
      const isCompanyOnly =
        userRoles.includes("company") &&
        !userRoles.some((r) =>
          ["admin", "sst", "partner", "affiliate", "sales"].includes(r),
        );
      if (!isCompanyOnly) {
        summary.skipped_not_company_role++;
        summary.details.push({ email, company: company.name, status: "not_company_role", roles: userRoles });
        continue;
      }

      // Extra safety: ensure user_companies link count is 0 or 1
      const links = linksByUser.get(u.id) ?? [];
      const uniqueLinks = Array.from(new Set(links));
      if (uniqueLinks.length > 1) {
        summary.skipped_multi_company++;
        summary.details.push({ email, company: company.name, status: "multi_user_companies", count: uniqueLinks.length });
        continue;
      }

      if (dryRun) {
        summary.reset++;
        summary.details.push({ email, company: company.name, status: "would_reset" });
        continue;
      }

      const { error: updErr } = await admin.auth.admin.updateUserById(u.id, {
        password,
        email_confirm: true,
      });
      if (updErr) {
        summary.errors++;
        summary.details.push({ email, company: company.name, status: "error", error: updErr.message });
        continue;
      }

      await admin
        .from("profiles")
        .update({
          must_change_password: true,
          password_reset_reason: "system_update",
        })
        .eq("id", u.id);

      summary.reset++;
      summary.details.push({ email, company: company.name, status: "reset_ok" });
    }

    return new Response(JSON.stringify({ success: true, ...summary }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
