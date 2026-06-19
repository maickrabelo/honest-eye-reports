import { supabase } from '@/integrations/supabase/client';

/**
 * Checks if the user came from Hotmart and still needs to complete
 * cadastral data (CPF/CNPJ, phone, address) on their entity
 * (companies or sst_managers).
 */
export async function needsHotmartProfileCompletion(userId: string): Promise<boolean> {
  try {
    // 1) Is there a Hotmart subscription owned by this user?
    const { data: sub } = await supabase
      .from('subscriptions')
      .select('id, provider')
      .eq('owner_user_id', userId)
      .eq('provider', 'hotmart')
      .limit(1)
      .maybeSingle();

    if (!sub) return false;

    // 2) Load profile entity references
    const { data: profile } = await supabase
      .from('profiles')
      .select('company_id, sst_manager_id')
      .eq('id', userId)
      .maybeSingle();

    if (!profile) return false;

    if (profile.sst_manager_id) {
      const { data: mgr } = await supabase
        .from('sst_managers')
        .select('cnpj, phone, address')
        .eq('id', profile.sst_manager_id)
        .maybeSingle();
      if (!mgr) return false;
      return !mgr.cnpj || !mgr.phone || !mgr.address;
    }

    if (profile.company_id) {
      const { data: company } = await supabase
        .from('companies')
        .select('cnpj, phone, address')
        .eq('id', profile.company_id)
        .maybeSingle();
      if (!company) return false;
      return !company.cnpj || !company.phone || !company.address;
    }

    return false;
  } catch (e) {
    console.error('needsHotmartProfileCompletion error', e);
    return false;
  }
}
