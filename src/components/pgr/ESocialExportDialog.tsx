import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Download, FileText, FileCode, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import type { PGRDocument } from "@/pages/PGRDashboard";
import { downloadPGRReport } from "@/components/pgr/PGRReportPDF";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  pgr: PGRDocument;
  companyName: string;
  companyCnpj: string;
}

const sanitizeXml = (v: any) => String(v ?? '').replace(/[<>&'"]/g, c => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '\'': '&apos;', '"': '&quot;' }[c]!));
const onlyDigits = (v: string) => (v || '').replace(/\D/g, '');

const buildSimplePDF = (pgr: PGRDocument, companyName: string, companyCnpj: string, ghes: any[], risks: any[], actions: any[]) => {
  // Geração simples HTML → PDF via window.print no preview, ou usa Blob como fallback.
  const html = `
<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8"><title>PGR - ${companyName}</title>
<style>
  body { font-family: Arial, sans-serif; padding: 32px; color: #222; }
  h1 { color: #1a1a2e; border-bottom: 3px solid #4f46e5; padding-bottom: 8px; }
  h2 { color: #1a1a2e; margin-top: 28px; border-bottom: 1px solid #ddd; padding-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0; font-size: 12px; }
  th, td { border: 1px solid #ccc; padding: 6px; text-align: left; vertical-align: top; }
  th { background: #f5f5f5; }
  .meta { background: #f8f9fa; padding: 12px; border-radius: 6px; margin: 8px 0; }
  .meta strong { display: inline-block; min-width: 180px; }
  .level-intolerable { background: #fee; color: #c00; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
  .level-substantial { background: #fed7aa; color: #9a3412; padding: 2px 6px; border-radius: 4px; font-weight: bold; }
  .level-moderate { background: #fef3c7; color: #92400e; padding: 2px 6px; border-radius: 4px; }
  .level-tolerable { background: #d9f99d; color: #4d7c0f; padding: 2px 6px; border-radius: 4px; }
  .level-trivial { background: #d1fae5; color: #047857; padding: 2px 6px; border-radius: 4px; }
  @media print { body { padding: 16px; } }
</style></head><body>
  <h1>Programa de Gerenciamento de Riscos (PGR)</h1>
  <h2>1. Identificação da Empresa</h2>
  <div class="meta">
    <div><strong>Empresa:</strong> ${companyName}</div>
    <div><strong>CNPJ:</strong> ${companyCnpj || '-'}</div>
    <div><strong>CNAE:</strong> ${pgr.cnae || '-'}</div>
    <div><strong>Grau de Risco (NR-4):</strong> ${pgr.risk_grade || '-'}</div>
    <div><strong>Endereço:</strong> ${pgr.address || '-'}</div>
    <div><strong>Vigência:</strong> ${pgr.validity_start || '-'} a ${pgr.validity_end || '-'}</div>
    <div><strong>Versão:</strong> ${pgr.version}</div>
  </div>

  <h2>2. Responsável Técnico</h2>
  <div class="meta">
    <div><strong>Nome:</strong> ${pgr.responsible_name || '-'}</div>
    <div><strong>CPF:</strong> ${pgr.responsible_cpf || '-'}</div>
    <div><strong>Registro:</strong> ${pgr.responsible_registration || '-'}</div>
  </div>

  <h2>3. Resumo Executivo</h2>
  <p>${(pgr.executive_summary || '—').replace(/\n/g, '<br>')}</p>

  <h2>4. Grupos Homogêneos de Exposição (GHE)</h2>
  <table><thead><tr><th>Nome</th><th>Setor</th><th>Cargo</th><th>Trabalhadores</th><th>Jornada</th></tr></thead><tbody>
    ${ghes.map(g => `<tr><td>${g.name}</td><td>${g.sector || '-'}</td><td>${g.role || '-'}</td><td>${g.worker_count}</td><td>${g.work_schedule || '-'}</td></tr>`).join('') || '<tr><td colspan=5>Nenhum GHE cadastrado</td></tr>'}
  </tbody></table>

  <h2>5. Inventário de Riscos</h2>
  <table><thead><tr><th>Categoria</th><th>Agente</th><th>Código e-Social</th><th>S</th><th>P</th><th>Nível</th><th>EPC/EPI</th></tr></thead><tbody>
    ${risks.map(r => `<tr><td>${r.category}</td><td>${r.agent_name}</td><td>${r.esocial_agent_code || '-'}</td><td>${r.severity}</td><td>${r.probability}</td><td><span class="level-${r.risk_level}">${r.risk_level}</span></td><td>${(r.existing_epc || '') + ' ' + (r.existing_epi ? `EPI: ${r.existing_epi} CA: ${r.epi_ca || '-'}` : '')}</td></tr>`).join('') || '<tr><td colspan=7>Nenhum risco cadastrado</td></tr>'}
  </tbody></table>

  <h2>6. Plano de Ação</h2>
  <table><thead><tr><th>Descrição</th><th>Hierarquia</th><th>Responsável</th><th>Prazo</th><th>Status</th></tr></thead><tbody>
    ${actions.map(a => `<tr><td>${a.description}</td><td>${a.control_hierarchy || '-'}</td><td>${a.responsible || '-'}</td><td>${a.deadline || '-'}</td><td>${a.status}</td></tr>`).join('') || '<tr><td colspan=5>Nenhuma ação cadastrada</td></tr>'}
  </tbody></table>

  <h2>7. Assinatura</h2>
  <div style="margin-top: 60px; border-top: 1px solid #333; padding-top: 6px; max-width: 400px;">
    ${pgr.responsible_name || '_______________________'}<br>
    <small>${pgr.responsible_registration || ''}</small>
  </div>

  <script>window.onload = () => window.print();</script>
</body></html>`;
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);
  window.open(url, '_blank');
  setTimeout(() => URL.revokeObjectURL(url), 60000);
};

const buildS2240Xml = (pgr: PGRDocument, companyCnpj: string, worker: any, ghe: any, risks: any[]) => {
  const cnpj = onlyDigits(companyCnpj);
  const cpf = onlyDigits(worker.cpf);
  const respCpf = onlyDigits(pgr.responsible_cpf || '');
  const ts = new Date().toISOString().replace(/[-:.TZ]/g, '').slice(0, 14);
  const id = `ID${'1'.padStart(1, '0')}${cnpj.padEnd(14, '0').slice(0,14)}${ts}000001`;
  const today = new Date().toISOString().split('T')[0];
  const agNocs = risks.filter(r => r.esocial_agent_code).map(r => `
        <agNoc>
          <codAgNoc>${sanitizeXml(r.esocial_agent_code)}</codAgNoc>
          <dscAgNoc>${sanitizeXml(r.agent_name)}</dscAgNoc>
          <tpAval>${r.measurement_value ? '2' : '1'}</tpAval>
          ${r.measurement_value ? `<intConc>${r.measurement_value}</intConc>` : ''}
          ${r.measurement_unit ? `<unMed>${sanitizeXml(r.measurement_unit)}</unMed>` : ''}
          <utilizEPC>${r.existing_epc ? '2' : '1'}</utilizEPC>
          <utilizEPI>${r.existing_epi ? '2' : '1'}</utilizEPI>
          ${r.epi_ca ? `
          <epi>
            <docAval>${sanitizeXml(r.epi_ca)}</docAval>
          </epi>` : ''}
        </agNoc>`).join('');

  return `<?xml version="1.0" encoding="UTF-8"?>
<eSocial xmlns="http://www.esocial.gov.br/schema/evt/evtExpRisco/v_S_01_03_00">
  <evtExpRisco Id="${id}">
    <ideEvento>
      <indRetif>1</indRetif>
      <tpAmb>2</tpAmb>
      <procEmi>1</procEmi>
      <verProc>SOIA-1.0</verProc>
    </ideEvento>
    <ideEmpregador>
      <tpInsc>1</tpInsc>
      <nrInsc>${cnpj.slice(0, 8)}</nrInsc>
    </ideEmpregador>
    <ideVinculo>
      <cpfTrab>${cpf}</cpfTrab>
      ${worker.registration_number ? `<matricula>${sanitizeXml(worker.registration_number)}</matricula>` : ''}
    </ideVinculo>
    <infoExpRisco>
      <dtIniCondicao>${pgr.validity_start || today}</dtIniCondicao>
      <infoAmb>
        <localAmb>1</localAmb>
        <dscSetor>${sanitizeXml(ghe?.sector || ghe?.name || 'N/A')}</dscSetor>
      </infoAmb>
      <infoAtiv>
        <dscAtivDes>${sanitizeXml(ghe?.activities_description || ghe?.role || 'N/A')}</dscAtivDes>
      </infoAtiv>${agNocs}
      <respReg>
        <cpfResp>${respCpf}</cpfResp>
        <ideOC>${pgr.responsible_registration?.toUpperCase().includes('CREA') ? '1' : pgr.responsible_registration?.toUpperCase().includes('CRM') ? '2' : '3'}</ideOC>
        <dscOC>${sanitizeXml(pgr.responsible_registration || 'N/A')}</dscOC>
        <nrOC>${sanitizeXml(pgr.responsible_registration || 'N/A')}</nrOC>
      </respReg>
    </infoExpRisco>
  </evtExpRisco>
</eSocial>`;
};

export const ESocialExportDialog = ({ open, onOpenChange, pgr, companyName, companyCnpj }: Props) => {
  const [generating, setGenerating] = useState<'pdf' | 'xml' | null>(null);

  const generatePDF = async () => {
    setGenerating('pdf');
    try {
      const [{ data: ghes }, { data: risks }, { data: actions }] = await Promise.all([
        supabase.from('pgr_ghe').select('*').eq('pgr_document_id', pgr.id),
        supabase.from('pgr_risks').select('*').eq('pgr_document_id', pgr.id),
        supabase.from('pgr_action_items').select('*').eq('pgr_document_id', pgr.id),
      ]);
      buildSimplePDF(pgr, companyName, companyCnpj, (ghes as any) || [], (risks as any) || [], (actions as any) || []);
      toast.success("Relatório aberto — use Imprimir → Salvar como PDF");
    } catch (e: any) {
      toast.error("Erro: " + e.message);
    } finally { setGenerating(null); }
  };

  const generateXML = async () => {
    setGenerating('xml');
    try {
      if (!pgr.responsible_cpf || !pgr.responsible_registration) {
        toast.error("Preencha CPF e registro do responsável técnico na aba Visão Geral");
        return;
      }
      if (!onlyDigits(companyCnpj) || onlyDigits(companyCnpj).length !== 14) {
        toast.error("CNPJ da empresa inválido");
        return;
      }
      const { data: ghes } = await supabase
        .from('pgr_ghe')
        .select('id, name, sector, role, activities_description, pgr_ghe_workers(*)')
        .eq('pgr_document_id', pgr.id);
      const { data: risks } = await supabase
        .from('pgr_risks')
        .select('*')
        .eq('pgr_document_id', pgr.id)
        .not('esocial_agent_code', 'is', null);

      if (!ghes || ghes.length === 0) { toast.error("Cadastre ao menos um GHE"); return; }
      if (!risks || risks.length === 0) { toast.error("Cadastre riscos com código e-Social (Tabela 23)"); return; }

      const files: { name: string; xml: string }[] = [];
      for (const g of ghes as any[]) {
        const gheRisks = (risks as any[]).filter(r => r.ghe_id === g.id);
        if (gheRisks.length === 0) continue;
        const workers = g.pgr_ghe_workers || [];
        if (workers.length === 0) {
          // gera 1 XML stub sem CPF para placeholder
          const xml = buildS2240Xml(pgr, companyCnpj, { cpf: '00000000000', registration_number: 'PENDENTE' }, g, gheRisks);
          files.push({ name: `S-2240_${g.name.replace(/\W+/g, '_')}_SEM_TRABALHADOR.xml`, xml });
        } else {
          for (const w of workers) {
            const xml = buildS2240Xml(pgr, companyCnpj, w, g, gheRisks);
            files.push({ name: `S-2240_${onlyDigits(w.cpf)}_${g.name.replace(/\W+/g, '_')}.xml`, xml });
          }
        }
      }

      if (files.length === 0) { toast.error("Nenhum XML gerado — verifique GHEs/riscos com código e-Social"); return; }

      if (files.length === 1) {
        const blob = new Blob([files[0].xml], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = files[0].name; a.click();
        URL.revokeObjectURL(url);
      } else {
        // Concat em um único arquivo de lote simples
        const combined = files.map(f => `<!-- ${f.name} -->\n${f.xml}`).join('\n\n');
        const blob = new Blob([combined], { type: 'application/xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `S-2240_lote_${new Date().toISOString().split('T')[0]}.xml`; a.click();
        URL.revokeObjectURL(url);
      }

      // Auditoria
      await supabase.from('pgr_esocial_exports').insert({
        pgr_document_id: pgr.id,
        event_type: 'S-2240',
        reference_period: new Date().toISOString().slice(0, 7),
        file_path: 'download-direto',
        worker_count: files.length,
      } as any);

      toast.success(`${files.length} XML(s) gerado(s) — entregue ao contador para upload no portal e-Social.`);
      onOpenChange(false);
    } catch (e: any) {
      toast.error("Erro: " + e.message);
    } finally { setGenerating(null); }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Exportar PGR</DialogTitle>
          <DialogDescription>Gere o relatório PGR NR-1 em PDF ou os XMLs do evento S-2240 do e-Social.</DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Sem transmissão automática</AlertTitle>
          <AlertDescription className="text-xs">
            Os XMLs são gerados localmente para upload manual pelo seu contador no portal e-Social. A SOIA não envia eventos diretamente nesta fase beta.
          </AlertDescription>
        </Alert>

        <div className="space-y-3 mt-2">
          <Button onClick={generatePDF} disabled={!!generating} variant="outline" className="w-full justify-start gap-3 h-auto py-3">
            {generating === 'pdf' ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
            <div className="text-left">
              <div className="font-semibold">Relatório PGR (PDF)</div>
              <div className="text-xs text-muted-foreground">Documento completo NR-1 para apresentação e arquivamento</div>
            </div>
          </Button>
          <Button onClick={generateXML} disabled={!!generating} variant="outline" className="w-full justify-start gap-3 h-auto py-3">
            {generating === 'xml' ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileCode className="h-5 w-5" />}
            <div className="text-left">
              <div className="font-semibold">e-Social S-2240 (XML)</div>
              <div className="text-xs text-muted-foreground">Evento de Condições Ambientais do Trabalho — 1 arquivo por trabalhador/GHE</div>
            </div>
          </Button>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Fechar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
