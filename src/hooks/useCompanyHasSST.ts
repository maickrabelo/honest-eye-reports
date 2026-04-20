import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Returns whether a given company has an SST manager assigned.
 * Companies WITHOUT an SST manager get direct access to psychosocial,
 * burnout and climate tools. Companies WITH an SST manager do not
 * (the SST manager applies these tools on their behalf).
 */
export function useCompanyHasSST(companyId: string | null | undefined) {
  const [hasSST, setHasSST] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!companyId) {
      setHasSST(null);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    (async () => {
      const { count, error } = await supabase
        .from('company_sst_assignments')
        .select('id', { count: 'exact', head: true })
        .eq('company_id', companyId);
      if (!active) return;
      if (error) {
        setHasSST(null);
      } else {
        setHasSST((count ?? 0) > 0);
      }
      setIsLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [companyId]);

  return { hasSST, isLoading };
}
