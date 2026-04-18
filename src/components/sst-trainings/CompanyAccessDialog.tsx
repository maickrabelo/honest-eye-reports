import React, { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface Company { id: string; name: string; }

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  moduleId: string;
  sstManagerId: string;
}

const CompanyAccessDialog: React.FC<Props> = ({ open, onOpenChange, moduleId, sstManagerId }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!open) return;
    const load = async () => {
      setLoading(true);
      // Empresas atribuídas à gestora
      const { data: assigns } = await supabase
        .from('company_sst_assignments')
        .select('company_id, companies(id, name)')
        .eq('sst_manager_id', sstManagerId);
      const list: Company[] = (assigns || [])
        .map((a: any) => a.companies)
        .filter(Boolean)
        .sort((a: Company, b: Company) => a.name.localeCompare(b.name));
      setCompanies(list);

      const { data: access } = await supabase
        .from('sst_training_company_access')
        .select('company_id')
        .eq('module_id', moduleId);
      setSelected(new Set((access || []).map((a: any) => a.company_id)));
      setLoading(false);
    };
    load();
  }, [open, moduleId, sstManagerId]);

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === companies.length) setSelected(new Set());
    else setSelected(new Set(companies.map(c => c.id)));
  };

  const save = async () => {
    setSaving(true);
    try {
      // Replace all access rows
      await supabase.from('sst_training_company_access').delete().eq('module_id', moduleId);
      if (selected.size > 0) {
        const rows = Array.from(selected).map(company_id => ({ module_id: moduleId, company_id }));
        const { error } = await supabase.from('sst_training_company_access').insert(rows);
        if (error) throw error;
      }
      toast({ title: 'Acesso atualizado!' });
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gerenciar acesso ao módulo</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : companies.length === 0 ? (
          <p className="text-sm text-muted-foreground py-4">Nenhuma empresa atribuída a esta gestora.</p>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-2 pb-2 border-b border-border">
              <Checkbox
                id="all"
                checked={selected.size === companies.length && companies.length > 0}
                onCheckedChange={toggleAll}
              />
              <Label htmlFor="all" className="font-semibold cursor-pointer">Todas as empresas</Label>
            </div>
            {companies.map(c => (
              <div key={c.id} className="flex items-center gap-2 py-1">
                <Checkbox
                  id={c.id}
                  checked={selected.has(c.id)}
                  onCheckedChange={() => toggle(c.id)}
                />
                <Label htmlFor={c.id} className="cursor-pointer flex-1">{c.name}</Label>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={save} disabled={saving || loading}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CompanyAccessDialog;
