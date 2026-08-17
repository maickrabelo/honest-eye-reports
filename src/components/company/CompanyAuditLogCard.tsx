import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { ShieldCheck, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface AuditLog {
  id: string;
  user_email: string | null;
  user_name: string | null;
  action: string;
  entity_type: string | null;
  entity_id: string | null;
  details: any;
  created_at: string;
}

const ACTION_LABELS: Record<string, string> = {
  dashboard_view: 'Acessou o dashboard',
  report_status_change: 'Alterou status da denúncia',
  report_note_added: 'Adicionou nota à denúncia',
  report_viewed: 'Visualizou denúncia',
  collaborator_invited: 'Convidou colaborador',
  collaborator_removed: 'Removeu colaborador',
  invitation_revoked: 'Revogou convite',
};

const CompanyAuditLogCard: React.FC<{ companyId: string }> = ({ companyId }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const load = async () => {
    setLoading(true);
    const { data } = await (supabase as any)
      .from('company_audit_logs')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })
      .limit(300);
    setLogs((data as AuditLog[]) || []);
    setLoading(false);
  };

  useEffect(() => {
    if (companyId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const filtered = logs.filter((l) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (l.user_email || '').toLowerCase().includes(q) ||
      (l.user_name || '').toLowerCase().includes(q) ||
      (ACTION_LABELS[l.action] || l.action).toLowerCase().includes(q) ||
      (l.entity_id || '').toLowerCase().includes(q)
    );
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            Log de acessos e alterações
          </CardTitle>
          <CardDescription>
            Registro de segurança visível apenas para o administrador principal da conta.
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Buscar por usuário, ação ou código da denúncia..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground italic py-4">Nenhum registro encontrado.</p>
        ) : (
          <div className="max-h-96 overflow-y-auto divide-y rounded-lg border">
            {filtered.map((l) => (
              <div key={l.id} className="p-3 flex items-start justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{ACTION_LABELS[l.action] || l.action}</span>
                    {l.entity_id && (
                      <Badge variant="secondary" className="text-xs">{l.entity_id}</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    {l.user_name || 'Usuário'} • {l.user_email || '—'}
                  </p>
                  {l.details?.from && l.details?.to && (
                    <p className="text-xs text-muted-foreground">
                      {String(l.details.from)} → {String(l.details.to)}
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(l.created_at).toLocaleString('pt-BR')}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CompanyAuditLogCard;
