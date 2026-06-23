import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { getSafeErrorMessage } from '@/lib/errorUtils';
import { Loader2, Upload } from 'lucide-react';

type ParsedLead = {
  phone: string | null;
  email: string | null;
  contact_name: string | null;
  company_name: string;
};

const EMAIL_RE = /\S+@\S+\.\S+/;

function parseLine(rawLine: string): ParsedLead | null {
  const line = rawLine.trim();
  if (!line) return null;

  // Prefer TAB split; fall back to 2+ spaces; fall back to ; or |
  let parts: string[];
  if (line.includes('\t')) parts = line.split('\t');
  else if (/ {2,}/.test(line)) parts = line.split(/ {2,}/);
  else if (line.includes(';')) parts = line.split(';');
  else if (line.includes('|')) parts = line.split('|');
  else return null;

  parts = parts.map(p => p.trim()).filter(p => p.length > 0);
  if (parts.length === 0) return null;

  // Try to detect email column
  const emailIdx = parts.findIndex(p => EMAIL_RE.test(p));
  let phone: string | null = null;
  let email: string | null = null;
  let contact_name: string | null = null;
  let company_name = '';

  if (emailIdx >= 0) {
    email = parts[emailIdx];
    const before = parts.slice(0, emailIdx);
    const after = parts.slice(emailIdx + 1);
    phone = before[0] || null;
    contact_name = after[0] || null;
    company_name = after.slice(1).join(' - ') || after[0] || '';
    if (!company_name && contact_name) {
      company_name = contact_name;
      contact_name = null;
    }
  } else {
    // No email — assume: phone, contact, company
    phone = parts[0] || null;
    contact_name = parts[1] || null;
    company_name = parts.slice(2).join(' - ') || parts[1] || parts[0] || '';
  }

  if (!company_name.trim()) return null;
  return {
    phone: phone?.trim() || null,
    email: email?.trim() || null,
    contact_name: contact_name?.trim() || null,
    company_name: company_name.trim(),
  };
}

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onImported: () => void;
}

export const BulkImportLeadsDialog = ({ open, onOpenChange, onImported }: Props) => {
  const [text, setText] = useState('');
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const preview = text
    .split(/\r?\n/)
    .map(parseLine)
    .filter((x): x is ParsedLead => !!x);

  const handleImport = async () => {
    if (preview.length === 0) {
      toast({ title: 'Nenhum lead válido encontrado', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const rows = preview.map(p => ({
        company_name: p.company_name,
        phone: p.phone,
        contact_name: p.contact_name,
        notes: p.email,
        status: 'prospect',
        created_by: user?.id || null,
      }));
      const { error } = await (supabase.from('sales_leads' as any).insert(rows) as any);
      if (error) throw error;
      toast({ title: `${rows.length} leads importados com sucesso` });
      setText('');
      onOpenChange(false);
      onImported();
    } catch (err) {
      toast({ title: 'Erro ao importar', description: getSafeErrorMessage(err), variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Importar leads em lote</DialogTitle>
          <DialogDescription>
            Cole os leads no formato (separados por TAB ou ponto e vírgula):<br />
            <code className="text-xs">telefone &nbsp;&nbsp; email &nbsp;&nbsp; responsável &nbsp;&nbsp; empresa</code>
            <br />Um lead por linha. O e-mail é detectado automaticamente.
          </DialogDescription>
        </DialogHeader>

        <Textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={'11 99999-9999\tjoao@empresa.com\tJoão Silva\tEmpresa X\n21 98888-8888\tmaria@acme.com\tMaria\tAcme'}
          className="min-h-[260px] font-mono text-xs"
        />

        <div className="text-xs text-muted-foreground">
          {preview.length > 0
            ? <>Pré-visualização: <strong>{preview.length}</strong> lead(s) detectado(s).</>
            : 'Cole linhas no formato indicado para visualizar a quantidade.'}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>Cancelar</Button>
          <Button onClick={handleImport} disabled={saving || preview.length === 0}>
            {saving ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Importando...</> : <><Upload className="h-4 w-4 mr-2" />Importar {preview.length || ''}</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
