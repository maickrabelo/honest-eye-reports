import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRealAuth } from '@/contexts/RealAuthContext';

/** Gestora SST Futuramed — única com acesso ao instrumento CLASA. */
export const CLASA_SST_MANAGER_ID = 'b493c525-48bf-45d2-848a-72bc0eaffb15';

/**
 * Libera a avaliação "Aprendizes CLASA" apenas para administradores
 * e para usuários vinculados à gestora Futuramed (direta ou via empresa).
 */
export function useHasCLASAAccess() {
  const { user, role, isLoading: authLoading } = useRealAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (authLoading) return;
    if (!user) {
      setHasAccess(false);
      setIsLoading(false);
      return;
    }
    if (role === 'admin') {
      setHasAccess(true);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    (async () => {
      const [profileRes, linkRes] = await Promise.all([
        supabase.from('profiles').select('sst_manager_id, company_id').eq('id', user.id).maybeSingle(),
        supabase.from('user_sst_managers').select('sst_manager_id').eq('user_id', user.id),
      ]);

      let allowed =
        profileRes.data?.sst_manager_id === CLASA_SST_MANAGER_ID ||
        (linkRes.data || []).some((l: any) => l.sst_manager_id === CLASA_SST_MANAGER_ID);

      if (!allowed) {
        const companyIds: string[] = [];
        if (profileRes.data?.company_id) companyIds.push(profileRes.data.company_id);
        const { data: userCompanies } = await supabase
          .from('user_companies')
          .select('company_id')
          .eq('user_id', user.id);
        (userCompanies || []).forEach((c: any) => companyIds.push(c.company_id));

        if (companyIds.length > 0) {
          const { count } = await supabase
            .from('company_sst_assignments')
            .select('id', { count: 'exact', head: true })
            .eq('sst_manager_id', CLASA_SST_MANAGER_ID)
            .in('company_id', companyIds);
          allowed = (count ?? 0) > 0;
        }
      }

      if (!active) return;
      setHasAccess(allowed);
      setIsLoading(false);
    })();

    return () => {
      active = false;
    };
  }, [user, role, authLoading]);

  return { hasAccess, isLoading: isLoading || authLoading };
}
