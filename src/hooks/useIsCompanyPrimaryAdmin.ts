import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * True when the signed-in user is the main administrator of the company
 * (owner of the account or the default company link).
 */
export function useIsCompanyPrimaryAdmin(companyId: string | null | undefined) {
  const [isPrimaryAdmin, setIsPrimaryAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!companyId) {
      setIsPrimaryAdmin(false);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        if (active) {
          setIsPrimaryAdmin(false);
          setIsLoading(false);
        }
        return;
      }
      const { data, error } = await (supabase as any).rpc('is_company_primary_admin', {
        _user_id: user.id,
        _company_id: companyId,
      });
      if (!active) return;
      setIsPrimaryAdmin(!error && data === true);
      setIsLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [companyId]);

  return { isPrimaryAdmin, isLoading };
}
