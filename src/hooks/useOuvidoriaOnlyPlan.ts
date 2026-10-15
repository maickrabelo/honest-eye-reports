import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/** True when the logged-in SST manager is on the "sst-ouvidoria" plan (only the regular ouvidoria). */
export function useOuvidoriaOnlyPlan() {
  const [isOuvidoriaOnly, setIsOuvidoriaOnly] = useState(false);
  useEffect(() => {
    let active = true;
    (async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u?.user?.id) return;
      const { data, error } = await (supabase as any).rpc('user_has_ouvidoria_only_plan', { _user_id: u.user.id });
      if (active) setIsOuvidoriaOnly(!error && Boolean(data));
    })();
    return () => { active = false; };
  }, []);
  return { isOuvidoriaOnly };
}
