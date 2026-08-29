import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';
import { Loader2, ShieldCheck, ShieldAlert } from 'lucide-react';

export interface AccessLogRow {
  id: string;
  created_at: string;
  success: boolean;
  failure_reason: string | null;
  user_agent: string | null;
  ip_address: string | null;
  tracking_code: string;
}

interface Props {
  /** Filtra por denúncia específica */
  reportId?: string;
  /** Filtra por código (inclui tentativas sem denúncia encontrada) */
  trackingCode?: string;
  companyId?: string | null;
  channel?: 'smart' | 'ia';
  limit?: number;
  onLoaded?: (rows: AccessLogRow[]) => void;
}

const OuvidoriaAccessLogs = ({
  reportId,
  trackingCode,
  companyId,
  channel,
  limit = 100,
  onLoaded,
}: Props) => {
  const [rows, setRows] = useState<AccessLogRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      let query = supabase
        .from('ouvidoria_access_logs')
        .select('id, created_at, success, failure_reason, user_agent, ip_address, tracking_code')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (reportId) query = query.eq('report_id', reportId);
      else if (trackingCode) query = query.eq('tracking_code', trackingCode);
      if (companyId) query = query.eq('company_id', companyId);
      if (channel) query = query.eq('channel', channel);

      const { data } = await query;
      if (!active) return;
      setRows(data ?? []);
      onLoaded?.(data ?? []);
      setLoading(false);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId, trackingCode, companyId, channel, limit]);

  if (loading) {
    return (
      <div className="flex justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhum acesso registrado até o momento.
      </p>
    );
  }

  return (
    <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
      {rows.map((r) => (
        <div key={r.id} className="flex items-start gap-3 rounded-md border p-3">
          {r.success ? (
            <ShieldCheck className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
          ) : (
            <ShieldAlert className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          )}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <span className="font-medium">
                {r.success ? 'Consulta ao protocolo' : 'Tentativa sem sucesso'}
              </span>
              <Badge variant="outline">{r.tracking_code}</Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(r.created_at).toLocaleString('pt-BR')}
              </span>
            </div>
            {!r.success && r.failure_reason && (
              <p className="text-xs text-destructive mt-1">{r.failure_reason}</p>
            )}
            {r.user_agent && (
              <p className="text-xs text-muted-foreground mt-1 truncate">{r.user_agent}</p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default OuvidoriaAccessLogs;
