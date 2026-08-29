import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Loader2, Plus, Trash2, CalendarDays, FileDown, GripVertical } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRealAuth } from '@/contexts/RealAuthContext';
import jsPDF from 'jspdf';

interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
  report_code: string | null;
  position: number;
  created_at: string;
  completed_at: string | null;
}

const COLUMNS = [
  { key: 'todo', label: 'A fazer' },
  { key: 'doing', label: 'Em apuração' },
  { key: 'blocked', label: 'Aguardando terceiros' },
  { key: 'done', label: 'Concluída' },
] as const;

interface Props {
  companyId: string;
  channel: 'smart' | 'ia';
  canEdit: boolean;
  /** Denúncias disponíveis para vincular */
  reportOptions?: { id: string; code: string; label: string }[];
}

const TaskCard = ({
  task,
  canEdit,
  onDelete,
}: {
  task: TaskRow;
  canEdit: boolean;
  onDelete: (id: string) => void;
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    disabled: !canEdit,
  });

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 }
    : undefined;

  const overdue =
    task.due_date && task.status !== 'done' && new Date(task.due_date) < new Date();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-md border bg-card p-3 shadow-sm ${isDragging ? 'opacity-70' : ''}`}
    >
      <div className="flex items-start gap-2">
        {canEdit && (
          <button
            {...listeners}
            {...attributes}
            className="mt-0.5 text-muted-foreground cursor-grab active:cursor-grabbing"
            aria-label="Mover tarefa"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium">{task.title}</p>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap">
              {task.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {task.report_code && <Badge variant="outline">{task.report_code}</Badge>}
            {task.due_date && (
              <Badge variant={overdue ? 'destructive' : 'secondary'} className="gap-1">
                <CalendarDays className="h-3 w-3" />
                {new Date(task.due_date).toLocaleDateString('pt-BR')}
              </Badge>
            )}
          </div>
        </div>
        {canEdit && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onDelete(task.id)}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>
    </div>
  );
};

const Column = ({
  columnKey,
  label,
  tasks,
  canEdit,
  onDelete,
}: {
  columnKey: string;
  label: string;
  tasks: TaskRow[];
  canEdit: boolean;
  onDelete: (id: string) => void;
}) => {
  const { setNodeRef, isOver } = useDroppable({ id: columnKey });
  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col gap-2 rounded-lg border bg-muted/30 p-3 min-h-[220px] ${
        isOver ? 'ring-2 ring-primary/50' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">{label}</p>
        <Badge variant="secondary">{tasks.length}</Badge>
      </div>
      {tasks.map((t) => (
        <TaskCard key={t.id} task={t} canEdit={canEdit} onDelete={onDelete} />
      ))}
      {tasks.length === 0 && (
        <p className="text-xs text-muted-foreground py-4 text-center">Nenhuma tarefa</p>
      )}
    </div>
  );
};

const OuvidoriaTasksBoard = ({ companyId, channel, canEdit, reportOptions = [] }: Props) => {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    due_date: '',
    report_id: 'none',
    status: 'todo',
  });
  const { toast } = useToast();
  const { user } = useRealAuth();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('ouvidoria_tasks')
      .select('id, title, description, status, due_date, report_code, position, created_at, completed_at')
      .eq('company_id', companyId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: false });
    setTasks(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    if (companyId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const grouped = useMemo(() => {
    const map: Record<string, TaskRow[]> = {};
    COLUMNS.forEach((c) => (map[c.key] = []));
    tasks.forEach((t) => {
      (map[t.status] ?? (map[t.status] = [])).push(t);
    });
    return map;
  }, [tasks]);

  const createTask = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const linked = reportOptions.find((r) => r.id === form.report_id);
    const { error } = await supabase.from('ouvidoria_tasks').insert({
      company_id: companyId,
      channel,
      title: form.title.trim(),
      description: form.description.trim() || null,
      due_date: form.due_date || null,
      status: form.status,
      report_id: form.report_id !== 'none' ? form.report_id : null,
      report_code: linked?.code ?? null,
      created_by: user?.id ?? null,
      position: tasks.length,
    });
    setSaving(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao criar tarefa', description: error.message });
      return;
    }
    setForm({ title: '', description: '', due_date: '', report_id: 'none', status: 'todo' });
    setOpen(false);
    load();
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const newStatus = String(over.id);
    const task = tasks.find((t) => t.id === active.id);
    if (!task || task.status === newStatus) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
    );

    const { error } = await supabase
      .from('ouvidoria_tasks')
      .update({
        status: newStatus,
        completed_at: newStatus === 'done' ? new Date().toISOString() : null,
      })
      .eq('id', task.id);

    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao mover', description: error.message });
      load();
    }
  };

  const removeTask = async (id: string) => {
    const { error } = await supabase.from('ouvidoria_tasks').delete().eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      return;
    }
    load();
  };

  const exportPdf = () => {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const marginX = 48;
    let y = 60;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Plano de apuração — Ouvidoria', marginX, y);
    y += 18;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(`Emitido em ${new Date().toLocaleString('pt-BR')}`, marginX, y);
    y += 24;

    COLUMNS.forEach((col) => {
      const list = grouped[col.key] ?? [];
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      if (y > 760) { doc.addPage(); y = 60; }
      doc.text(`${col.label} (${list.length})`, marginX, y);
      y += 16;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      if (list.length === 0) {
        doc.text('— nenhuma tarefa', marginX + 12, y);
        y += 16;
      }
      list.forEach((t) => {
        if (y > 770) { doc.addPage(); y = 60; }
        const meta = [
          t.report_code ? `Protocolo ${t.report_code}` : null,
          t.due_date ? `Prazo ${new Date(t.due_date).toLocaleDateString('pt-BR')}` : null,
        ].filter(Boolean).join(' · ');
        doc.text(`• ${t.title}${meta ? ` (${meta})` : ''}`, marginX + 12, y, {
          maxWidth: 480,
        });
        y += 16;
      });
      y += 8;
    });

    doc.save('plano-apuracao-ouvidoria.pdf');
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-lg">Quadro de apuração</CardTitle>
          <CardDescription>
            Organize as tarefas de cada denúncia e exporte o histórico para auditoria.
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={exportPdf}>
            <FileDown className="h-4 w-4 mr-2" /> Exportar
          </Button>
          {canEdit && (
            <Button size="sm" onClick={() => setOpen(true)}>
              <Plus className="h-4 w-4 mr-2" /> Nova tarefa
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <DndContext sensors={sensors} onDragEnd={onDragEnd}>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              {COLUMNS.map((c) => (
                <Column
                  key={c.key}
                  columnKey={c.key}
                  label={c.label}
                  tasks={grouped[c.key] ?? []}
                  canEdit={canEdit}
                  onDelete={removeTask}
                />
              ))}
            </div>
          </DndContext>
        )}
      </CardContent>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova tarefa</DialogTitle>
            <DialogDescription>Vincule a uma denúncia para manter a rastreabilidade.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Título</Label>
              <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div>
              <Label>Descrição</Label>
              <Textarea
                rows={3}
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Prazo</Label>
                <Input
                  type="date"
                  value={form.due_date}
                  onChange={(e) => setForm({ ...form, due_date: e.target.value })}
                />
              </div>
              <div>
                <Label>Coluna</Label>
                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {COLUMNS.map((c) => (
                      <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Denúncia vinculada</Label>
              <Select value={form.report_id} onValueChange={(v) => setForm({ ...form, report_id: v })}>
                <SelectTrigger><SelectValue placeholder="Nenhuma" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Nenhuma</SelectItem>
                  {reportOptions.map((r) => (
                    <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
            <Button onClick={createTask} disabled={saving || !form.title.trim()}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />} Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default OuvidoriaTasksBoard;
