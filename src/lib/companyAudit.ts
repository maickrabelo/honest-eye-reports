import { supabase } from '@/integrations/supabase/client';

export interface CompanyAuditEntry {
  companyId: string;
  action: string;
  entityType?: string | null;
  entityId?: string | null;
  details?: Record<string, unknown> | null;
}

/**
 * Fire-and-forget audit logger for company dashboards.
 * Never throws — logging must not break the UI.
 */
export const logCompanyAudit = async (entry: CompanyAuditEntry): Promise<void> => {
  try {
    if (!entry.companyId) return;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    let userName: string | null = null;
    const { data: prof } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();
    userName = (prof as any)?.full_name ?? null;

    await (supabase as any).from('company_audit_logs').insert({
      company_id: entry.companyId,
      user_id: user.id,
      user_email: user.email ?? null,
      user_name: userName,
      action: entry.action,
      entity_type: entry.entityType ?? null,
      entity_id: entry.entityId ?? null,
      details: entry.details ?? null,
    });
  } catch {
    // silent
  }
};
