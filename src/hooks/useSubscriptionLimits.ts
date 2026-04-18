import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SubscriptionLimits {
  planName: string | null;
  planSlug: string | null;
  category: "company" | "manager" | null;
  maxCompanies: number | null;
  maxCnpjs: number | null;
  maxEmployees: number | null;
  currentCompanies: number;
  currentEmployees: number;
  isLoading: boolean;
  isAtCompanyLimit: boolean;
  isAtEmployeeLimit: boolean;
  legacy: boolean;
}

/**
 * Returns the active subscription limits and current usage for a given user.
 * Falls back to "legacy" (no enforcement) when no subscription is found.
 */
export function useSubscriptionLimits(userId: string | null | undefined): SubscriptionLimits {
  const [state, setState] = useState<SubscriptionLimits>({
    planName: null,
    planSlug: null,
    category: null,
    maxCompanies: null,
    maxCnpjs: null,
    maxEmployees: null,
    currentCompanies: 0,
    currentEmployees: 0,
    isLoading: true,
    isAtCompanyLimit: false,
    isAtEmployeeLimit: false,
    legacy: true,
  });

  useEffect(() => {
    let cancelled = false;
    if (!userId) {
      setState((s) => ({ ...s, isLoading: false }));
      return;
    }

    (async () => {
      const { data: sub } = await supabase
        .from("subscriptions" as any)
        .select("*, subscription_plans(*)")
        .eq("owner_user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;

      if (!sub) {
        setState((s) => ({ ...s, isLoading: false, legacy: true }));
        return;
      }

      const plan = (sub as any).subscription_plans;
      const { data: profile } = await supabase
        .from("profiles")
        .select("sst_manager_id, company_id")
        .eq("id", userId)
        .maybeSingle();

      let currentCompanies = 0;
      let currentEmployees = 0;

      if (plan.category === "manager" && profile?.sst_manager_id) {
        const { data: companies } = await supabase
          .from("companies")
          .select("id, employee_count, company_sst_assignments!inner(sst_manager_id)")
          .eq("company_sst_assignments.sst_manager_id", profile.sst_manager_id);
        currentCompanies = companies?.length ?? 0;
        currentEmployees = (companies ?? []).reduce(
          (sum, c: any) => sum + (c.employee_count ?? 0),
          0,
        );
      } else if (plan.category === "company") {
        const { data: companies } = await supabase
          .from("companies")
          .select("id, employee_count")
          .eq("parent_subscription_id", (sub as any).id);
        currentCompanies = companies?.length ?? 0;
        currentEmployees = (companies ?? []).reduce(
          (sum, c: any) => sum + (c.employee_count ?? 0),
          0,
        );
      }

      const maxCompanies = plan.category === "manager" ? plan.max_companies : plan.max_cnpjs;

      setState({
        planName: plan.name,
        planSlug: plan.slug,
        category: plan.category,
        maxCompanies,
        maxCnpjs: plan.max_cnpjs,
        maxEmployees: plan.max_employees,
        currentCompanies,
        currentEmployees,
        isLoading: false,
        isAtCompanyLimit: maxCompanies != null && currentCompanies >= maxCompanies,
        isAtEmployeeLimit: plan.max_employees != null && currentEmployees >= plan.max_employees,
        legacy: false,
      });
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return state;
}
