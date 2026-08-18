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
  has_sst_company?: string | null;
  business_model?: string | null;
  portfolio_size?: string | null;
};

const EMAIL_RE = /\S+@\S+\.\S+/;

const normalize = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

const prettify = (s: string) =>
  s
    .replace(/^_+|_+$/g, '')
    .replace(/_+/g, ' ')
    .trim();

/** Maps a normalized header to our lead field. */
function matchHeader(h: string): keyof ParsedLead | null {
  if (h.includes('full_name') || h === 'nome' || h.includes('responsavel') || h.includes('contato')) return 'contact_name';
  if (h.includes('company_name') || h.includes('empresa') && !h.includes('quantas') && !h.includes('gerencia')) return 'company_name';
  if (h.includes('email') || h.includes('e_mail')) return 'email';
  if (h.includes('phone') || h.includes('telefone') || h.includes('celular')) return 'phone';
  if (h.includes('mais_de_20_clientes') || h.includes('tem_uma_empresa_de_sst')) return 'has_sst_company';
  if (h.includes('modelo')) return 'business_model';
  if (h.includes('quantas') || h.includes('carteira') || h.includes('cnpjs')) return 'portfolio_size';
  return null;
}

function splitLine(line: string): string[] {
  if (line.includes('\t')) return line.split('\t');
  if (line.includes(';')) return line.split(';');
  if (line.includes('|')) return line.split('|');
  if (/ {2,}/.test(line)) return line.split(/ {2,}/);
  return [line];
}

const cleanPhone = (v: string | null) => (v ? v.replace(/^p:/i, '').trim() || null : null);

/** Header-based parse (preferred): first line contains column names. */
function parseWithHeader(lines: string[]): ParsedLead[] | null {
  const headerCells = splitLine(lines[0]).map(c => normalize(c.trim()));
  const mapped = headerCells.map(matchHeader);
  if (mapped.filter(Boolean).length < 2) return null;

  const out: ParsedLead[] = [];
  for (const raw of lines.slice(1)) {
    if (!raw.trim()) continue;
    const cells = splitLine(raw).map(c => c.trim());
    const lead: ParsedLead = { phone: null, email: null, contact_name: null, company_name: '' };
    mapped.forEach((field, i) => {
      const value = cells[i]?.trim();
      if (!field || !value) return;
      if (field === 'phone') {
        const p = cleanPhone(value);
        if (p && !lead.phone) lead.phone = p;
      } else if (field === 'company_name') {
        lead.company_name = value;
      } else if (field === 'has_sst_company' || field === 'business_model' || field === 'portfolio_size') {
        lead[field] = prettify(value);
      } else {
        (lead as any)[field] = value;
      }
    });
    if (!lead.company_name.trim()) lead.company_name = lead.contact_name || lead.email || '';
    if (!lead.company_name.trim()) continue;
    out.push(lead);
  }
  return out.length > 0 ? out : null;
}

function parseLine(rawLine: string): ParsedLead | null {
  const line = rawLine.trim();
  if (!line) return null;

  let parts = splitLine(line);
  if (parts.length < 2) return null;

  parts = parts.map(p => p.trim()).filter(p => p.length > 0);
  if (parts.length === 0) return null;

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
    phone = parts[0] || null;
    contact_name = parts[1] || null;
    company_name = parts.slice(2).join(' - ') || parts[1] || parts[0] || '';
  }

  if (!company_name.trim()) return null;
  return {
    phone: cleanPhone(phone),
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

  const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
  const headerParsed = lines.length > 1 ? parseWithHeader(lines) : null;
  const preview = headerParsed ?? lines.map(parseLine).filter((x): x is ParsedLead => !!x);

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
        email: p.email,
        has_sst_company: p.has_sst_company || null,
        business_model: p.business_model || null,
        portfolio_size: p.portfolio_size || null,
        notes: null,
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
            Cole a planilha inteira <strong>com a linha de cabeçalho</strong> (TAB, ponto e vírgula ou pipe).
            As colunas são reconhecidas automaticamente: <code className="text-xs">full_name</code>, <code className="text-xs">company_name</code>,{' '}
            <code className="text-xs">email</code>, <code className="text-xs">phone_number</code>, além de
            "você tem uma empresa de SST...", "qual o modelo do seu negócio?" e "quantas empresas/CNPJs...".
            <br />Sem cabeçalho, o formato aceito é: telefone / e-mail / responsável / empresa.
          </DialogDescription>
        </DialogHeader>

        <Textarea
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder={'você_tem_uma_empresa_de_sst_que_atende_mais_de_20_clientes?\tqual_o_modelo_do_seu_negócio?\tquantas_empresas/cnpjs_você_gerencia_hoje_na_sua_carteira?\temail\tfull_name\tcompany_name\tphone_number\nsim\tconsultoria\tmenos_de_20_empresas\tjoao@empresa.com\tJoão Silva\tEmpresa X\tp:+5511999999999'}
          className="min-h-[260px] font-mono text-xs"
        />

        <div className="text-xs text-muted-foreground">
          {preview.length > 0
            ? <>Pré-visualização: <strong>{preview.length}</strong> lead(s) detectado(s){headerParsed ? ' — cabeçalho reconhecido' : ''}.</>
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
