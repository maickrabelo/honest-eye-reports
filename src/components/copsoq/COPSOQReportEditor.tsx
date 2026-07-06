import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileText, ClipboardList, Calendar, Download, Loader2, Eye, Building2, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  COPSOQCategory,
  COPSOQ_CATEGORY_LABELS,
  ALL_CATEGORIES,
  getRiskLevel,
  RISK_LEVEL_LABELS,
} from '@/data/copsoqQuestions';
import {
  generateCOPSOQReport,
  COPSOQActionItem,
  COPSOQScheduleItem,
} from './COPSOQReportPDF';

interface CategoryAverage {
  category: COPSOQCategory;
  average: number;
  label: string;
}

interface COPSOQReportEditorProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assessment: {
    id: string;
    title: string;
    description: string | null;
    companyName: string;
    createdAt: string;
  };
  responsesCount: number;
  categoryAverages: CategoryAverage[];
  overallAverage: number;
  departments: string[];
  questionAverages: { number: number; text: string; category: string; average: number }[];
  sstLogoUrl?: string | null;
  sstName?: string | null;
}

const DEFAULT_RECS: Record<'risk' | 'intermediate', string> = {
  risk: 'Instituir plano de intervenção imediato: revisar carga e organização do trabalho, capacitar liderança, reforçar canais de comunicação/suporte e monitorar mensalmente os indicadores.',
  intermediate: 'Monitorar a dimensão com pesquisas periódicas, promover ações preventivas de fortalecimento (feedback, apoio social, autonomia) e manter comunicação aberta com a equipe.',
};

export function COPSOQReportEditor({
  open,
  onOpenChange,
  assessment,
  responsesCount,
  categoryAverages,
  overallAverage,
  departments,
  questionAverages,
  sstLogoUrl,
  sstName,
}: COPSOQReportEditorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState('preview');
  const [executiveSummary, setExecutiveSummary] = useState('');
  const [actionItems, setActionItems] = useState<COPSOQActionItem[]>([]);
  const [scheduleItems, setScheduleItems] = useState<COPSOQScheduleItem[]>([]);
  const [companyCnpj, setCompanyCnpj] = useState('');
  const [companyAddress, setCompanyAddress] = useState('');
  const [companyCnae, setCompanyCnae] = useState('');
  const [companyRiskGrade, setCompanyRiskGrade] = useState('');
  const [sstCpf, setSstCpf] = useState('');
  const [sstRegistration, setSstRegistration] = useState('');

  useEffect(() => {
    if (!open || categoryAverages.length === 0) return;

    const critical = categoryAverages.filter(c => getRiskLevel(c.average) === 'risk');
    const intermediate = categoryAverages.filter(c => getRiskLevel(c.average) === 'intermediate');

    const summary = `Este relatório apresenta os resultados da avaliação de fatores psicossociais (COPSOQ II) realizada na ${assessment.companyName}, com ${responsesCount} respostas em ${departments.length || 1} setor(es). A média geral obtida foi de ${overallAverage.toFixed(2)} (escala 1-5, normalizada), classificação ${RISK_LEVEL_LABELS[getRiskLevel(overallAverage)]}.

${critical.length > 0
  ? `Foram identificadas ${critical.length} dimensão(ões) em nível de risco que requerem atenção imediata: ${critical.map(c => c.label).join(', ')}.`
  : 'Não foram identificadas dimensões em nível de risco.'}

${intermediate.length > 0
  ? `${intermediate.length} dimensão(ões) apresentam nível intermediário e devem ser monitoradas: ${intermediate.map(c => c.label).join(', ')}.`
  : ''}`;

    setExecutiveSummary(summary);

    const defaults: COPSOQActionItem[] = [];
    critical.forEach(c => {
      defaults.push({
        id: crypto.randomUUID(),
        category: c.label,
        priority: 'immediate',
        description: `Dimensão "${c.label}" apresenta indicadores de risco (média ${c.average.toFixed(2)}).`,
        recommendation: DEFAULT_RECS.risk,
      });
    });
    intermediate.forEach(c => {
      defaults.push({
        id: crypto.randomUUID(),
        category: c.label,
        priority: 'short_term',
        description: `Dimensão "${c.label}" apresenta indicadores intermediários (média ${c.average.toFixed(2)}).`,
        recommendation: DEFAULT_RECS.intermediate,
      });
    });
    setActionItems(defaults);

    setScheduleItems([
      { id: crypto.randomUUID(), action: 'Apresentação dos resultados para a direção', deadline: 'Próxima semana', responsible: 'RH / SST' },
      { id: crypto.randomUUID(), action: 'Reunião com gestores para discussão do plano de ação', deadline: '15 dias', responsible: 'RH / Gestores' },
      ...(critical.length > 0 ? [{ id: crypto.randomUUID(), action: 'Implementação de ações para dimensões críticas', deadline: '30 dias', responsible: 'Gestores / RH' }] : []),
      { id: crypto.randomUUID(), action: 'Reavaliação após implementação das ações', deadline: '6 meses', responsible: 'SST' },
    ]);
  }, [open, categoryAverages, responsesCount, departments, assessment, overallAverage]);

  const addAction = () => setActionItems([...actionItems, {
    id: crypto.randomUUID(),
    category: COPSOQ_CATEGORY_LABELS[ALL_CATEGORIES[0]],
    priority: 'short_term',
    description: '',
    recommendation: '',
  }]);
  const updateAction = (id: string, field: keyof COPSOQActionItem, value: string) =>
    setActionItems(actionItems.map(a => a.id === id ? { ...a, [field]: value } : a));
  const removeAction = (id: string) => setActionItems(actionItems.filter(a => a.id !== id));

  const addSchedule = () => setScheduleItems([...scheduleItems, {
    id: crypto.randomUUID(), action: '', deadline: '', responsible: '',
  }]);
  const updateSchedule = (id: string, field: keyof COPSOQScheduleItem, value: string) =>
    setScheduleItems(scheduleItems.map(s => s.id === id ? { ...s, [field]: value } : s));
  const removeSchedule = (id: string) => setScheduleItems(scheduleItems.filter(s => s.id !== id));

  const generate = async () => {
    setIsGenerating(true);
    try {
      await generateCOPSOQReport({
        assessment: {
          id: assessment.id,
          title: assessment.title,
          description: assessment.description,
          companyName: assessment.companyName,
          createdAt: assessment.createdAt,
        },
        companyInfo: {
          cnpj: companyCnpj || undefined,
          address: companyAddress || undefined,
          cnae: companyCnae || undefined,
          riskGrade: companyRiskGrade || undefined,
          employeeCount: responsesCount,
        },
        responsesCount,
        departments,
        categoryAverages,
        overallAverage,
        questionAverages,
        actionItems,
        scheduleItems,
        executiveSummary,
        sstLogoUrl,
        sstName,
        sstCpf: sstCpf || undefined,
        sstRegistration: sstRegistration || undefined,
      });
      toast.success('Relatório COPSOQ II gerado com sucesso!');
      onOpenChange(false);
    } catch (err) {
      console.error('Error generating COPSOQ PDF:', err);
      toast.error('Erro ao gerar o relatório PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Preparar Relatório COPSOQ II — Riscos Psicossociais
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 overflow-hidden flex flex-col">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="preview" className="flex items-center gap-1 text-xs"><Eye className="h-3 w-3" />Resumo</TabsTrigger>
            <TabsTrigger value="company" className="flex items-center gap-1 text-xs"><Building2 className="h-3 w-3" />Empresa</TabsTrigger>
            <TabsTrigger value="action" className="flex items-center gap-1 text-xs"><ClipboardList className="h-3 w-3" />Plano de Ação</TabsTrigger>
            <TabsTrigger value="schedule" className="flex items-center gap-1 text-xs"><Calendar className="h-3 w-3" />Cronograma</TabsTrigger>
            <TabsTrigger value="finalize" className="flex items-center gap-1 text-xs"><Download className="h-3 w-3" />Finalizar</TabsTrigger>
          </TabsList>

          <div className="flex-1 overflow-auto mt-4">
            <TabsContent value="preview" className="mt-0 space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">Resumo Executivo</CardTitle></CardHeader>
                <CardContent>
                  <Textarea value={executiveSummary} onChange={e => setExecutiveSummary(e.target.value)} rows={10} />
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-lg">Visão geral das dimensões</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {categoryAverages.map(c => {
                      const r = getRiskLevel(c.average);
                      return (
                        <div key={c.category} className={`p-2 rounded-lg border-l-4 text-sm ${
                          r === 'risk' ? 'border-l-red-500 bg-red-50' :
                          r === 'intermediate' ? 'border-l-orange-500 bg-orange-50' :
                          'border-l-green-500 bg-green-50'
                        }`}>
                          <div className="font-medium">{c.label}</div>
                          <div className="text-xs text-muted-foreground">Média {c.average.toFixed(2)} — {RISK_LEVEL_LABELS[r]}</div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="company" className="mt-0 space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">Dados da Empresa</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">CNPJ</label>
                      <Input value={companyCnpj} onChange={e => setCompanyCnpj(e.target.value)} placeholder="00.000.000/0000-00" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">CNAE</label>
                      <Input value={companyCnae} onChange={e => setCompanyCnae(e.target.value)} placeholder="Ex: 8630-5/03" />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <label className="text-sm font-medium">Endereço completo</label>
                      <Input value={companyAddress} onChange={e => setCompanyAddress(e.target.value)} placeholder="Rua, número, bairro, cidade - UF" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Grau de risco (NR-4)</label>
                      <Input value={companyRiskGrade} onChange={e => setCompanyRiskGrade(e.target.value)} placeholder="Ex: 2" />
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-lg">Responsável Técnico SST</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">CPF</label>
                      <Input value={sstCpf} onChange={e => setSstCpf(e.target.value)} placeholder="000.000.000-00" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Registro MTE / CREA / CRP</label>
                      <Input value={sstRegistration} onChange={e => setSstRegistration(e.target.value)} placeholder="Nº do registro" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="action" className="mt-0 space-y-3">
              <div className="flex justify-end">
                <Button size="sm" onClick={addAction}><Plus className="h-4 w-4 mr-1" />Nova ação</Button>
              </div>
              {actionItems.map((it, i) => (
                <Card key={it.id}>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm font-medium">Ação {i + 1}</div>
                      <Button variant="ghost" size="icon" onClick={() => removeAction(it.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Dimensão</label>
                        <Input value={it.category} onChange={e => updateAction(it.id, 'category', e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Prioridade</label>
                        <Select value={it.priority} onValueChange={v => updateAction(it.id, 'priority', v)}>
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="immediate">Imediato (até 30 dias)</SelectItem>
                            <SelectItem value="short_term">Curto prazo (1-3 meses)</SelectItem>
                            <SelectItem value="medium_term">Médio prazo (3-6 meses)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Situação identificada</label>
                      <Textarea rows={2} value={it.description} onChange={e => updateAction(it.id, 'description', e.target.value)} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Medida proposta</label>
                      <Textarea rows={3} value={it.recommendation} onChange={e => updateAction(it.id, 'recommendation', e.target.value)} />
                    </div>
                  </CardContent>
                </Card>
              ))}
              {actionItems.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Nenhuma ação adicionada. Clique em "Nova ação" para começar.</p>
              )}
            </TabsContent>

            <TabsContent value="schedule" className="mt-0 space-y-3">
              <div className="flex justify-end">
                <Button size="sm" onClick={addSchedule}><Plus className="h-4 w-4 mr-1" />Novo item</Button>
              </div>
              {scheduleItems.map((it, i) => (
                <Card key={it.id}>
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="text-sm font-medium">Item {i + 1}</div>
                      <Button variant="ghost" size="icon" onClick={() => removeSchedule(it.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                    <div className="space-y-1">
                      <label className="text-xs font-medium">Ação</label>
                      <Textarea rows={2} value={it.action} onChange={e => updateSchedule(it.id, 'action', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Prazo</label>
                        <Input value={it.deadline} onChange={e => updateSchedule(it.id, 'deadline', e.target.value)} placeholder="Ex: 30 dias" />
                      </div>
                      <div className="space-y-1">
                        <label className="text-xs font-medium">Responsável</label>
                        <Input value={it.responsible} onChange={e => updateSchedule(it.id, 'responsible', e.target.value)} placeholder="Ex: RH / SST" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="finalize" className="mt-0 space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-lg">Resumo do conteúdo</CardTitle></CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between py-1 border-b"><span>Empresa</span><span className="font-medium">{assessment.companyName}</span></div>
                  <div className="flex justify-between py-1 border-b"><span>Avaliação</span><span className="font-medium">{assessment.title}</span></div>
                  <div className="flex justify-between py-1 border-b"><span>Respostas</span><span className="font-medium">{responsesCount}</span></div>
                  <div className="flex justify-between py-1 border-b"><span>Setores</span><span className="font-medium">{departments.length || 1}</span></div>
                  <div className="flex justify-between py-1 border-b"><span>Média geral</span><span className="font-medium">{overallAverage.toFixed(2)} — {RISK_LEVEL_LABELS[getRiskLevel(overallAverage)]}</span></div>
                  <div className="flex justify-between py-1 border-b"><span>Ações no plano</span><span className="font-medium">{actionItems.length}</span></div>
                  <div className="flex justify-between py-1 border-b"><span>Itens no cronograma</span><span className="font-medium">{scheduleItems.length}</span></div>
                  <div className="flex justify-between py-1"><span>Dimensões em risco</span><span className="font-medium text-red-600">{categoryAverages.filter(c => getRiskLevel(c.average) === 'risk').length}</span></div>
                </CardContent>
              </Card>

              <Button onClick={generate} disabled={isGenerating} className="w-full" size="lg">
                {isGenerating ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Gerando PDF...</>) : (<><Download className="h-4 w-4 mr-2" />Gerar Relatório COPSOQ II (PDF)</>)}
              </Button>
            </TabsContent>
          </div>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
