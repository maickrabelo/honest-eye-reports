import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface CompanyFeatures {
  ouvidoria: boolean;
  psicossocial: boolean;
  burnout: boolean;
  clima: boolean;
  treinamentos: boolean;
}

const DEFAULTS: CompanyFeatures = {
  ouvidoria: true,
  psicossocial: true,
  burnout: true,
  clima: true,
  treinamentos: true,
};

export function useCompanyFeatures(companyId: string | null | undefined) {
  const [features, setFeatures] = useState<CompanyFeatures>(DEFAULTS);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;
    if (!companyId) {
      setFeatures(DEFAULTS);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    (async () => {
      const { data, error } = await supabase.rpc('get_company_features', { _company_id: companyId });
      if (!active) return;
      if (error || !data || data.length === 0) {
        setFeatures(DEFAULTS);
      } else {
        const row = data[0] as any;
        setFeatures({
          ouvidoria: row.ouvidoria_enabled ?? true,
          psicossocial: row.psicossocial_enabled ?? true,
          burnout: row.burnout_enabled ?? true,
          clima: row.clima_enabled ?? true,
          treinamentos: row.treinamentos_enabled ?? true,
        });
      }
      setIsLoading(false);
    })();
    return () => {
      active = false;
    };
  }, [companyId]);

  return { features, isLoading };
}
