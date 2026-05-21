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
import { Plus, Trash2, Pencil, Loader2, ClipboardList } from "lucide-react";
import { toast } from "sonner";

interface Action {
  id: string;
  risk_id: string | null;
  description: string;
  control_hierarchy: string | null;
  responsible: string | null;
  deadline: string | null;
  status: string;
  cost: number | null;
}
interface Risk { id: string; agent_name: string; category: string; }

const HIERARCHY_LABELS: Record<string, string> = {
  elimination: 'Eliminação', substitution: 'Substituição', engineering: 'Engenharia',
  administrative: 'Administrativa', epi: 'EPI',
};
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700' },
  in_progress: { label: 'Em andamento', color: 'bg-blue-100 text-blue-700' },
  done: { label: 'Concluída', color: 'bg-green-100 text-green-700' },
  cancelled: { label: 'Cancelada', color: 'bg-gray-200 text-gray-600' },
};

const emptyForm = { risk_id: '', description: '', control_hierarchy: 'engineering', responsible: '', deadline: '', status: 'pending', cost: 0 };

export const ActionPlanEditor = ({ pgrDocumentId }: { pgrDocumentId: string }) => {
  const [actions, setActions] = useState<Action[]>([]);
  const [risks, setRisks] = useState<Risk[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Action | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    const [{ data: a }, { data: r }] = await Promise.all([
      supabase.from('pgr_action_items').select('*').eq('pgr_document_id', pgrDocumentId).order('deadline', { nullsFirst: false }),
      supabase.from('pgr_risks').select('id, agent_name, category').eq('pgr_document_id', pgrDocumentId),
    ]);
    setActions((a as any) || []);
    setRisks((r as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, [pgrDocumentId]);

  const openNew = () => { setEditing(null); setForm(emptyForm); setOpen(true); };
  const openEdit = (a: Action) => {
    setEditing(a);
    setForm({
      risk_id: a.risk_id || '',
      description: a.description,
      control_hierarchy: a.control_hierarchy || 'engineering',
      responsible: a.responsible || '',
      deadline: a.deadline || '',
      status: a.status,
      cost: a.cost || 0,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!form.description.trim()) { toast.error("Descrição obrigatória"); return; }
    setSaving(true);
    try {
      const payload: any = { ...form, pgr_document_id: pgrDocumentId };
      if (!payload.risk_id) payload.risk_id = null;
      if (!payload.deadline) payload.deadline = null;
      if (editing) {
        const { error } = await supabase.from('pgr_action_items').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('pgr_action_items').insert(payload);
        if (error) throw error;
      }
      toast.success("Ação salva");
      setOpen(false);
      load();
    } catch (e: any) { toast.error(e.message); } finally { setSaving(false); }
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir esta ação?")) return;
    const { error } = await supabase.from('pgr_action_items').delete().eq('id', id);
    if (error) { toast.error(error.message); return; }
    load();
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2"><ClipboardList className="h-5 w-5" /> Plano de Ação</h3>
            <p className="text-sm text-muted-foreground">Hierarquia de controle: eliminar → substituir → engenharia → administrativa → EPI.</p>
          </div>
          <Button onClick={openNew} className="gap-2"><Plus className="h-4 w-4" /> Nova Ação</Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        ) : actions.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground">Nenhuma ação cadastrada.</div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descrição</TableHead>
                <TableHead>Risco</TableHead>
                <TableHead>Controle</TableHead>
                <TableHead>Responsável</TableHead>
                <TableHead>Prazo</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-24"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {actions.map(a => {
                const st = STATUS_LABELS[a.status] || STATUS_LABELS.pending;
                return (
                  <TableRow key={a.id}>
                    <TableCell className="max-w-sm">{a.description}</TableCell>
                    <TableCell className="text-sm">{risks.find(r => r.id === a.risk_id)?.agent_name || '-'}</TableCell>
                    <TableCell>{a.control_hierarchy ? <Badge variant="outline">{HIERARCHY_LABELS[a.control_hierarchy]}</Badge> : '-'}</TableCell>
                    <TableCell>{a.responsible || '-'}</TableCell>
                    <TableCell>{a.deadline ? new Date(a.deadline).toLocaleDateString('pt-BR') : '-'}</TableCell>
                    <TableCell><span className={`px-2 py-0.5 rounded text-xs font-medium ${st.color}`}>{st.label}</span></TableCell>
                    <TableCell className="text-right space-x-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(a)}><Pencil className="h-4 w-4" /></Button>
                      <Button size="icon" variant="ghost" onClick={() => remove(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-xl">
            <DialogHeader><DialogTitle>{editing ? 'Editar' : 'Nova'} Ação</DialogTitle></DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2"><Label>Descrição *</Label><Textarea rows={3} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
              <div className="space-y-2">
                <Label>Risco relacionado</Label>
                <select className="w-full h-10 rounded-md border border-input bg-background px-3" value={form.risk_id} onChange={e => setForm({ ...form, risk_id: e.target.value })}>
                  <option value="">— Nenhum —</option>
                  {risks.map(r => <option key={r.id} value={r.id}>{r.agent_name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Hierarquia de Controle</Label>
                  <select className="w-full h-10 rounded-md border border-input bg-background px-3" value={form.control_hierarchy} onChange={e => setForm({ ...form, control_hierarchy: e.target.value })}>
                    {Object.entries(HIERARCHY_LABELS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Status</Label>
                  <select className="w-full h-10 rounded-md border border-input bg-background px-3" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>
                    {Object.entries(STATUS_LABELS).map(([k, l]) => <option key={k} value={k}>{l.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Responsável</Label><Input value={form.responsible} onChange={e => setForm({ ...form, responsible: e.target.value })} /></div>
                <div className="space-y-2"><Label>Prazo</Label><Input type="date" value={form.deadline} onChange={e => setForm({ ...form, deadline: e.target.value })} /></div>
              </div>
              <div className="space-y-2"><Label>Custo estimado (R$)</Label><Input type="number" min={0} step="0.01" value={form.cost} onChange={e => setForm({ ...form, cost: parseFloat(e.target.value) || 0 })} /></div>
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
