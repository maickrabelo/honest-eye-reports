import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { Loader2, Trash2, Share2 } from 'lucide-react';

interface AccessRow {
  id: string;
  user_id: string;
  department_name: string;
  created_at: string;
  email?: string;
}

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessmentId: string;
  assessmentType: 'hseit' | 'copsoq';
  companyId: string;
  availableDepartments: string[];
}

export default function ShareSectorDialog({
  open, onOpenChange, assessmentType, companyId, availableDepartments,
}: Props) {
  const [email, setEmail] = useState('');
  const [selectedDepts, setSelectedDepts] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [existing, setExisting] = useState<AccessRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) loadExisting();
  }, [open, companyId, assessmentType]);

  const loadExisting = async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('sector_viewer_access')
        .select('id, user_id, department_name, created_at')
        .eq('company_id', companyId)
        .eq('assessment_type', assessmentType)
        .order('created_at', { ascending: false });
      setExisting((data || []) as AccessRow[]);
    } finally {
      setLoading(false);
    }
  };

  const toggleDept = (d: string) => {
    setSelectedDepts((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]);
  };

  const handleInvite = async () => {
    if (!email.includes('@')) {
      toast({ title: 'E-mail inválido', variant: 'destructive' });
      return;
    }
    if (selectedDepts.length === 0) {
      toast({ title: 'Selecione ao menos um setor', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('invite-sector-viewer', {
        body: { email, company_id: companyId, assessment_type: assessmentType, department_names: selectedDepts },
      });
      if (error) throw error;
      toast({ title: 'Convite enviado', description: `Um e-mail foi enviado para ${email}.` });
      setEmail(''); setSelectedDepts([]);
      loadExisting();
    } catch (e: any) {
      toast({ title: 'Erro ao enviar convite', description: e.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleRevoke = async (accessId: string) => {
    if (!confirm('Revogar este acesso?')) return;
    try {
      const { error } = await supabase.functions.invoke('revoke-sector-viewer-access', {
        body: { access_id: accessId },
      });
      if (error) throw error;
      toast({ title: 'Acesso revogado' });
      loadExisting();
    } catch (e: any) {
      toast({ title: 'Erro', description: e.message, variant: 'destructive' });
    }
  };

  // Group existing accesses by user_id
  const grouped = existing.reduce((acc, row) => {
    if (!acc[row.user_id]) acc[row.user_id] = [];
    acc[row.user_id].push(row);
    return acc;
  }, {} as Record<string, AccessRow[]>);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" /> Compartilhar acesso por setor
          </DialogTitle>
          <DialogDescription>
            Conceda acesso somente-leitura a setores específicos desta avaliação {assessmentType.toUpperCase()}.
            O convidado só verá os dados dos setores liberados.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sv-email">E-mail do convidado</Label>
            <Input id="sv-email" type="email" placeholder="nome@empresa.com" value={email}
              onChange={(e) => setEmail(e.target.value)} />
          </div>

          <div className="space-y-2">
            <Label>Setores liberados</Label>
            {availableDepartments.length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum setor cadastrado nesta avaliação.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 border rounded-md">
                {availableDepartments.map((d) => (
                  <label key={d} className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1 rounded">
                    <Checkbox checked={selectedDepts.includes(d)} onCheckedChange={() => toggleDept(d)} />
                    <span>{d}</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <Button onClick={handleInvite} disabled={submitting || availableDepartments.length === 0} className="w-full">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Enviar convite
          </Button>

          <div className="border-t pt-4">
            <h4 className="font-medium text-sm mb-2">Acessos ativos</h4>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : Object.keys(grouped).length === 0 ? (
              <p className="text-sm text-muted-foreground">Nenhum acesso concedido ainda.</p>
            ) : (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {Object.entries(grouped).map(([userId, rows]) => (
                  <div key={userId} className="p-3 border rounded-md">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-muted-foreground">user: {userId.slice(0, 8)}…</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {rows.map((r) => (
                        <Badge key={r.id} variant="secondary" className="gap-1">
                          {r.department_name}
                          <button onClick={() => handleRevoke(r.id)} className="ml-1 hover:text-destructive">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
