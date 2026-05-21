import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Pencil, Loader2, FlaskConical, Download } from "lucide-react";
import { toast } from "sonner";

interface Risk {
  id: string;
  ghe_id: string | null;
  category: string;
  agent_name: string;
  esocial_agent_code: string | null;
  source: string | null;
  exposure_description: string | null;
  severity: number;
  probability: number;
  risk_level: string;
  existing_epc: string | null;
  existing_epi: string | null;
  epi_ca: string | null;
  source_module: string | null;
}
interface GHE { id: string; name: string; }
interface Agent { code: string; category: string; name: string; }

const CATEGORY_LABELS: Record<string, string> = {
  fisico: 'Físico', quimico: 'Químico', biologico: 'Biológico',
  ergonomico: 'Ergonômico', acidentes: 'Acidentes', psicossocial: 'Psicossocial',
};
const LEVEL_STYLES: Record<string, string> = {
  trivial: 'bg-green-100 text-green-700',
  tolerable: 'bg-lime-100 text-lime-700',
  moderate: 'bg-yellow-100 text-yellow-700',
  substantial: 'bg-orange-100 text-orange-700',
  intolerable: 'bg-red-100 text-red-700',
};
const LEVEL_LABELS: Record<string, string> = {
  trivial: 'Trivial', tolerable: 'Tolerável', moderate: 'Moderado',
  substantial: 'Substancial', intolerable: 'Intolerável',
};

const emptyForm = {
  ghe_id: '',
  category: 'fisico',
  agent_name: '',
  esocial_agent_code: '',
  source: '',
  exposure_description: '',
  severity: 1,
  probability: 1,
  existing_epc: '',
  existing_epi: '',
  epi_ca: '',
};

export const RiskInventory = ({ pgrDocumentId, companyId }: { pgrDocumentId: string; companyId: string }) => {
  const [risks, setRisks] = useState<Risk[]>([]);
  const [ghes, setGhes] = useState<GHE[]>([]);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Risk | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [importing, setImporting] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: r }, { data: g }, { data: a }] = await Promise.all([
      supabase.from('pgr_risks').select('*').eq('pgr_document_id', pgrDocumentId).order('created_at'),
      supabase.from('pgr_ghe').select('id, name').eq('pgr_document_id', pgrDocumentId).order('name'),
      supabase.from('esocial_agents_catalog').select('code, category, name').order('code'),
    ]);
    setRisks((r as any) || []);
    setGhes((g as any) || []);
    setAgents((a as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [pgrDocumentId]);

  const openNew = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (r: Risk) => {
    setEditing(r);
    setForm({
      ghe_id: r.ghe_id || '',
      category: r.category,
      agent_name: r.agent_name,
      esocial_agent_code: r.esocial_agent_code || '',
      source: r.source || '',
      exposure_description: r.exposure_description || '',
      severity: r.severity,
      probability: r.probability,
      existing_epc: r.existing_epc || '',
      existing_epi: r.existing_epi || '',
      epi_ca: r.epi_ca || '',
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.agent_name.trim()) { toast.error("Informe o agente/risco"); return; }
    setSaving(true);
    try {
      const payload: any = { ...form, pgr_document_id: pgrDocumentId };
      if (!payload.ghe_id) payload.ghe_id = null;
      if (editing) {
        const { error } = await supabase.from('pgr_risks').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('pgr_risks').insert(payload);
        if (error) throw error;
      }
      toast.success("Risco salvo");
      setOpen(false);
      load();
    } catch (e: any) {
      toast.error(e.message);
    } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este risco?")) return;
    const { error } = await supabase.from('pgr_risks').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    load();
  };

  const importPsychosocial = async () => {
    setImporting(true);
    try {
      // Pega o assessment HSE-IT mais recente da empresa e cria 1 risco psicossocial por dimensão crítica
      const { data: hseit } = await supabase
        .from('hseit_assessments')
        .select('id, title')
        .eq('company_id', companyId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!hseit) { toast.info("Nenhuma avaliação HSE-IT encontrada"); return; }

      const sourceId = (hseit as any).id;
      const { data: existing } = await supabase
        .from('pgr_risks')
        .select('id')
        .eq('pgr_document_id', pgrDocumentId)
        .eq('source_module', 'hseit')
        .eq('source_module_id', sourceId);
      if (existing && existing.length > 0) {
        toast.info("Riscos psicossociais já importados desta avaliação");
        return;
      }

      const dimensions = [
        'Demandas', 'Controle', 'Apoio da chefia', 'Apoio dos colegas',
        'Relacionamentos', 'Função', 'Mudanças'
      ];
      const inserts = dimensions.map(d => ({
        pgr_document_id: pgrDocumentId,
        category: 'psicossocial',
        agent_name: `Fator psicossocial — ${d}`,
        source: `HSE-IT — ${(hseit as any).title}`,
        severity: 3,
        probability: 3,
        source_module: 'hseit',
        source_module_id: sourceId,
      }));
      const { error } = await supabase.from('pgr_risks').insert(inserts as any);
      if (error) throw error;
      toast.success(`${dimensions.length} riscos psicossociais importados — revise severidade/probabilidade`);
      load();
    } catch (e: any) {
      toast.error("Erro ao importar: " + e.message);
    } finally { setImporting(false); }
  };

  const filteredAgents = agents.filter(a => a.category === form.category);

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4 gap-2">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2"><FlaskConical className="h-5 w-5" /> Inventário de Riscos</h3>
            <p className="text-sm text-muted-foreground">Identifique e classifique cada risco por categoria.</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={importPsychosocial} disabled={importing}>
              {importing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
              Importar HSE-IT
            </Button>
            <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Novo Risco</Button>
          </div>
        </div>

        {/* Matriz 5x5 visual */}
        <div className="mb-6 p-4 border rounded-lg bg-card/50">
          <h4 className="text-sm font-semibold mb-2">Matriz de Risco 5×5 (Severidade × Probabilidade)</h4>
          <div className="grid grid-cols-6 gap-1 max-w-md text-xs">
            <div></div>
            {[1,2,3,4,5].map(p => <div key={p} className="text-center font-medium">P{p}</div>)}
            {[5,4,3,2,1].map(s => (
              <>
                <div key={`s${s}`} className="font-medium flex items-center">S{s}</div>
                {[1,2,3,4,5].map(p => {
                  const v = s * p;
                  const level = v >= 20 ? 'intolerable' : v >= 15 ? 'substantial' : v >= 8 ? 'moderate' : v >= 4 ? 'tolerable' : 'trivial';
                  const count = risks.filter(r => r.severity === s && r.probability === p).length;
                  return (
                    <div key={`${s}-${p}`} className={`aspect-square flex items-center justify-center rounded ${LEVEL_STYLES[level]} text-center`}>
                      <div>
                        <div className="font-bold">{v}</div>
                        {count > 0 && <div className="text-[10px]">({count})</div>}
                      </div>
                    </div>
                  );
                })}
              </>
            ))}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : risks.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">Nenhum risco cadastrado.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Categoria</TableHead>
                <TableHead>Agente / Risco</TableHead>
                <TableHead>GHE</TableHead>
                <TableHead className="text-center">S</TableHead>
                <TableHead className="text-center">P</TableHead>
                <TableHead>Nível</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {risks.map(r => (
                <TableRow key={r.id}>
                  <TableCell><Badge variant="outline">{CATEGORY_LABELS[r.category]}</Badge></TableCell>
                  <TableCell className="font-medium">
                    {r.agent_name}
                    {r.esocial_agent_code && <span className="block text-xs text-muted-foreground">e-Social: {r.esocial_agent_code}</span>}
                  </TableCell>
                  <TableCell className="text-sm">{ghes.find(g => g.id === r.ghe_id)?.name || '-'}</TableCell>
                  <TableCell className="text-center">{r.severity}</TableCell>
                  <TableCell className="text-center">{r.probability}</TableCell>
                  <TableCell><span className={`px-2 py-0.5 rounded text-xs font-medium ${LEVEL_STYLES[r.risk_level]}`}>{LEVEL_LABELS[r.risk_level]}</span></TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button size="icon" variant="ghost" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => remove(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle>{editing ? 'Editar' : 'Novo'} Risco</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Categoria *</Label>
                  <select className="w-full h-10 rounded-md border border-input bg-background px-3" value={form.category} onChange={e => setForm({ ...form, category: e.target.value, esocial_agent_code: '' })}>
                    {Object.entries(CATEGORY_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>GHE</Label>
                  <select className="w-full h-10 rounded-md border border-input bg-background px-3" value={form.ghe_id} onChange={e => setForm({ ...form, ghe_id: e.target.value })}>
                    <option value="">— Nenhum —</option>
                    {ghes.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>
              </div>

              {form.category !== 'psicossocial' && filteredAgents.length > 0 && (
                <div className="space-y-2">
                  <Label>Agente do e-Social (Tabela 23) — opcional</Label>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3"
                    value={form.esocial_agent_code}
                    onChange={e => {
                      const code = e.target.value;
                      const sel = filteredAgents.find(a => a.code === code);
                      setForm({ ...form, esocial_agent_code: code, agent_name: sel?.name || form.agent_name });
                    }}
                  >
                    <option value="">— Selecionar —</option>
                    {filteredAgents.map(a => <option key={a.code} value={a.code}>{a.code} — {a.name}</option>)}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Nome do agente / risco *</Label>
                <Input value={form.agent_name} onChange={e => setForm({ ...form, agent_name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Fonte geradora</Label>
                <Input value={form.source} onChange={e => setForm({ ...form, source: e.target.value })} placeholder="Ex: Compressor da linha 2" />
              </div>
              <div className="space-y-2">
                <Label>Descrição da exposição</Label>
                <Textarea rows={2} value={form.exposure_description} onChange={e => setForm({ ...form, exposure_description: e.target.value })} placeholder="Tempo, frequência, intensidade..." />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Severidade (1-5)</Label>
                  <select className="w-full h-10 rounded-md border border-input bg-background px-3" value={form.severity} onChange={e => setForm({ ...form, severity: parseInt(e.target.value) })}>
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Probabilidade (1-5)</Label>
                  <select className="w-full h-10 rounded-md border border-input bg-background px-3" value={form.probability} onChange={e => setForm({ ...form, probability: parseInt(e.target.value) })}>
                    {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2"><Label>EPC existentes</Label><Textarea rows={2} value={form.existing_epc} onChange={e => setForm({ ...form, existing_epc: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>EPI</Label><Input value={form.existing_epi} onChange={e => setForm({ ...form, existing_epi: e.target.value })} /></div>
                <div className="space-y-2"><Label>CA do EPI</Label><Input value={form.epi_ca} onChange={e => setForm({ ...form, epi_ca: e.target.value })} /></div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={save} disabled={saving}>{saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};
