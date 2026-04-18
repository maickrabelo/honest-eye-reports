import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Returns the active employee count configured for a company.
 * Returns 0 when companyId is null or when not yet configured.
 */
export function useCompanyEmployeeCount(companyId: string | null | undefined) {
  const [employeeCount, setEmployeeCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    let cancelled = false;
    if (!companyId) {
      setEmployeeCount(0);
      return;
    }
    setIsLoading(true);
    (async () => {
      const { data } = await supabase
        .from("companies")
        .select("employee_count")
        .eq("id", companyId)
        .maybeSingle();
      if (!cancelled) {
        setEmployeeCount((data as any)?.employee_count ?? 0);
        setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [companyId]);

  return { employeeCount, isLoading };
}
