import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

let cached: boolean | null = null;
let inflight: Promise<boolean> | null = null;

async function fetchAiAccess(): Promise<boolean> {
  if (cached !== null) return cached;
  if (inflight) return inflight;
  inflight = (async () => {
    const { data: userData } = await supabase.auth.getUser();
    const uid = userData?.user?.id;
    if (!uid) return true;
    const { data, error } = await supabase.rpc('has_ai_access' as any, { _user_id: uid });
    const value = error ? true : (data as boolean | null) ?? true;
    cached = value;
    return value;
  })();
  try {
    return await inflight;
  } finally {
    inflight = null;
  }
}

export function resetAiAccessCache() {
  cached = null;
}

export function useAiAccess() {
  const [hasAccess, setHasAccess] = useState<boolean>(cached ?? true);
  const [isLoading, setIsLoading] = useState<boolean>(cached === null);

  useEffect(() => {
    let active = true;
    fetchAiAccess().then((v) => {
      if (!active) return;
      setHasAccess(v);
      setIsLoading(false);
    });
    return () => {
      active = false;
    };
  }, []);

  return { hasAccess, isLoading };
}
