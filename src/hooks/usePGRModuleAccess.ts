import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useRealAuth } from '@/contexts/RealAuthContext';

/**
 * Verifica se o usuário tem acesso ao módulo PGR (beta restrito).
 * Acesso liberado se pertence a uma gestora SST com `pgr_module_enabled = true`,
 * ou se é admin, ou se é empresa atribuída a essa gestora.
 */
export function usePGRModuleAccess() {
  const { user, role, profile } = useRealAuth();
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
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
      try {
        if (role === 'sst' && profile?.sst_manager_id) {
          const { data } = await supabase
            .from('sst_managers')
            .select('pgr_module_enabled, parent_subscription_id')
            .eq('id', profile.sst_manager_id)
            .maybeSingle();
          let ok = !!(data as any)?.pgr_module_enabled;
          if (!ok) {
            const subId = (data as any)?.parent_subscription_id;
            if (subId) {
              const { data: sub } = await supabase
                .from('subscriptions')
                .select('subscription_plans(pgr_enabled)')
                .eq('id', subId)
                .maybeSingle();
              ok = !!(sub as any)?.subscription_plans?.pgr_enabled;
            }
          }
          if (!cancelled) setHasAccess(ok);
        } else if (role === 'company' && profile?.company_id) {
          // 1. Via gestora SST atribuída
          const { data: assignments } = await supabase
            .from('company_sst_assignments')
            .select('sst_manager_id')
            .eq('company_id', profile.company_id);
          const ids = (assignments || []).map((a: any) => a.sst_manager_id);
          let ok = false;
          if (ids.length > 0) {
            const { data: managers } = await supabase
              .from('sst_managers')
              .select('id, pgr_module_enabled')
              .in('id', ids);
            ok = (managers || []).some((m: any) => m.pgr_module_enabled);
          }
          // 2. Via plano da própria empresa (Empresa SMS Starter/Corporate)
          if (!ok) {
            const { data: company } = await supabase
              .from('companies')
              .select('parent_subscription_id')
              .eq('id', profile.company_id)
              .maybeSingle();
            const subId = (company as any)?.parent_subscription_id;
            if (subId) {
              const { data: sub } = await supabase
                .from('subscriptions')
                .select('subscription_plans(pgr_enabled)')
                .eq('id', subId)
                .maybeSingle();
              ok = !!(sub as any)?.subscription_plans?.pgr_enabled;
            }
          }
          if (!cancelled) setHasAccess(ok);
        } else {
          if (!cancelled) setHasAccess(false);
        }
      } catch (e) {
        console.error('Erro ao verificar acesso PGR:', e);
        if (!cancelled) setHasAccess(false);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    check();
    return () => { cancelled = true; };
  }, [user, role, profile?.sst_manager_id, profile?.company_id]);

  return { hasAccess, isLoading };
}
