import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Returns true when the current user's active subscription plan slug
 * contains "sms" (Técnico SST SMS, Gestora SST SMS Basic/Pro, Empresa SMS Starter/Corporate).
 * Used to hide the Ouvidoria portal and redirect company card clicks to PGR.
 */
export function useSmsPlan() {
  const [isSmsPlan, setIsSmsPlan] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const uid = userData?.user?.id;
        if (!uid) {
          if (active) {
            setIsSmsPlan(false);
            setIsLoading(false);
          }
          return;
        }
        const { data, error } = await (supabase as any)
          .from('subscriptions')
          .select('subscription_plans!inner(slug)')
          .eq('owner_user_id', uid)
          .in('status', ['active', 'trial', 'trialing'])
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!active) return;
        const slug = (data as any)?.subscription_plans?.slug as string | undefined;
        setIsSmsPlan(!error && !!slug && slug.toLowerCase().includes('sms'));
      } catch {
        if (active) setIsSmsPlan(false);
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return { isSmsPlan, isLoading };
}
