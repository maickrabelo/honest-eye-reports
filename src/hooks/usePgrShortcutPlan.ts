import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Returns true when the current user belongs to a plan without AI
 * but with the PGR module enabled (SST Smart and SMS plans).
 * Used to show the PGR shortcut card on the SST dashboard.
 */
export function usePgrShortcutPlan() {
  const [hasShortcut, setHasShortcut] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const uid = userData?.user?.id;
        if (!uid) {
          if (active) {
            setHasShortcut(false);
            setIsLoading(false);
          }
          return;
        }
        const { data, error } = await (supabase as any).rpc('user_has_pgr_shortcut_plan', { _user_id: uid });
        if (!active) return;
        setHasShortcut(!error && Boolean(data));
      } catch {
        if (active) setHasShortcut(false);
      } finally {
        if (active) setIsLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return { hasShortcut, isLoading };
}
