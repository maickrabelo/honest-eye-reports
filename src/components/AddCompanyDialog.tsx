import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Building2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useRealAuth } from '@/contexts/RealAuthContext';

interface AddCompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: () => void;
}

const formatCNPJ = (v: string) =>
  v.replace(/\D/g, '')
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .substring(0, 18);

const AddCompanyDialog: React.FC<AddCompanyDialogProps> = ({ open, onOpenChange, onCreated }) => {
  const { toast } = useToast();
  const { refreshRole } = useRealAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ company_name: '', cnpj: '', phone: '', address: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.company_name || !form.cnpj) {
      toast({ title: 'Campos obrigatórios', description: 'Informe nome e CNPJ.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('add-company-to-trial', {
        body: { ...form, cnpj: form.cnpj.replace(/\D/g, '') },
      });
      if (error) {
        let msg = 'Erro ao adicionar CNPJ.';
        try {
          const ctx = (error as any).context;
          if (ctx && typeof ctx.json === 'function') {
            const body = await ctx.json();
            if (body?.error) msg = body.error;
          }
        } catch {}
        throw new Error(msg);
      }
      if (data?.error) throw new Error(data.error);

      toast({ title: 'Empresa adicionada', description: 'O novo CNPJ foi vinculado à sua conta.' });
      setForm({ company_name: '', cnpj: '', phone: '', address: '' });
      await refreshRole();
      onCreated?.();
      onOpenChange(false);
    } catch (err: any) {
      toast({ title: 'Erro', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" /> Adicionar novo CNPJ
          </DialogTitle>
          <DialogDescription>
            Disponível no Plano Corporate. A nova empresa herda seu período de teste / assinatura.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="add-company-name">Razão social / nome *</Label>
            <Input id="add-company-name" value={form.company_name}
              onChange={(e) => setForm(p => ({ ...p, company_name: e.target.value }))} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="add-company-cnpj">CNPJ *</Label>
            <Input id="add-company-cnpj" value={form.cnpj}
              onChange={(e) => setForm(p => ({ ...p, cnpj: formatCNPJ(e.target.value) }))}
              placeholder="00.000.000/0000-00" maxLength={18} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="add-company-phone">Telefone</Label>
            <Input id="add-company-phone" value={form.phone}
              onChange={(e) => setForm(p => ({ ...p, phone: e.target.value }))}
              placeholder="(11) 99999-9999" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="add-company-address">Endereço</Label>
            <Textarea id="add-company-address" value={form.address}
              onChange={(e) => setForm(p => ({ ...p, address: e.target.value }))} rows={2} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adicionando...</> : 'Adicionar empresa'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddCompanyDialog;
