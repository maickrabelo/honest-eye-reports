import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useSmartOnlyPlan() {
  const [isSmartOnly, setIsSmartOnly] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const uid = userData?.user?.id;
        if (!uid) {
          if (active) {
            setIsSmartOnly(false);
            setIsLoading(false);
          }
          return;
        }
        const { data, error } = await (supabase as any).rpc('user_has_smart_plan', { _user_id: uid });
        if (!active) return;
        setIsSmartOnly(!error && Boolean(data));
      } catch {
        if (active) setIsSmartOnly(false);
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return { isSmartOnly, isLoading };
}
