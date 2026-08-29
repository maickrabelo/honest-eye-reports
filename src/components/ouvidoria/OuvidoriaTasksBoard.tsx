import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
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
import {
  Loader2,
  Plus,
  Trash2,
  CalendarDays,
  FileDown,
  GripVertical,
  ListChecks,
  Link2,
  Link2Off,
  Users,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useRealAuth } from '@/contexts/RealAuthContext';
import { useOuvidoriaAccess } from '@/hooks/useOuvidoriaAccess';
import jsPDF from 'jspdf';

interface TaskRow {
  id: string;
  title: string;
  description: string | null;
  status: string;
  due_date: string | null;
  report_id: string | null;
  report_code: string | null;
  sync_to_report: boolean;
  position: number;
  created_at: string;
  completed_at: string | null;
}

interface ChecklistItem {
  id: string;
  task_id: string;
  content: string;
  is_done: boolean;
  position: number;
}

interface OuvidoriaUserRow {
  id: string;
  full_name: string;
  job_title: string | null;
  access_type: string;
  status: string;
}

interface AssigneeRow {
  id: string;
  task_id: string;
  ouvidoria_user_id: string | null;
  display_name: string | null;
  assignee_role: string;
}

const ASSIGNEE_ROLES = [
  { key: 'responsavel', label: 'Responsável' },
  { key: 'envolvido', label: 'Envolvido' },
] as const;

const COLUMNS = [
  { key: 'todo', label: 'A fazer' },
  { key: 'doing', label: 'Em apuração' },
  { key: 'blocked', label: 'Aguardando terceiros' },
  { key: 'done', label: 'Concluída' },
] as const;

const labelOfStatus = (key: string) => COLUMNS.find((c) => c.key === key)?.label ?? key;

interface ReportOption {
  id: string;
  code: string;
  label: string;
  status?: string;
}

interface Props {
  companyId: string;
  channel: 'smart' | 'ia';
  canEdit: boolean;
  /** Denúncias disponíveis para vincular */
  reportOptions?: ReportOption[];
}

const TaskCard = ({
  task,
  canEdit,
  checklistSummary,
  taskAssignees = [],
  onOpen,
  onDelete,
}: {
  task: TaskRow;
  canEdit: boolean;
  checklistSummary?: { total: number; done: number };
  taskAssignees?: AssigneeRow[];
  onOpen: (task: TaskRow) => void;
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
        <button
          type="button"
          onClick={() => onOpen(task)}
          className="min-w-0 flex-1 text-left"
        >
          <p className="text-sm font-medium">{task.title}</p>
          {task.description && (
            <p className="text-xs text-muted-foreground mt-1 whitespace-pre-wrap line-clamp-3">
              {task.description}
            </p>
          )}
          <div className="flex flex-wrap items-center gap-2 mt-2">
            {task.report_code && (
              <Badge variant="outline" className="gap-1">
                {task.sync_to_report ? <Link2 className="h-3 w-3" /> : <Link2Off className="h-3 w-3" />}
                {task.report_code}
              </Badge>
            )}
            {checklistSummary && checklistSummary.total > 0 && (
              <Badge variant="secondary" className="gap-1">
                <ListChecks className="h-3 w-3" />
                {checklistSummary.done}/{checklistSummary.total}
              </Badge>
            )}
            {task.due_date && (
              <Badge variant={overdue ? 'destructive' : 'secondary'} className="gap-1">
                <CalendarDays className="h-3 w-3" />
                {new Date(task.due_date).toLocaleDateString('pt-BR')}
              </Badge>
            )}
          </div>
          {taskAssignees.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 mt-2">
              <Users className="h-3 w-3 text-muted-foreground" />
              {taskAssignees.map((a) => (
                <Badge
                  key={a.id}
                  variant={a.assignee_role === 'responsavel' ? 'default' : 'outline'}
                  className="text-[10px] font-normal"
                >
                  {a.display_name ?? 'Usuário'}
                  {a.assignee_role === 'envolvido' ? ' · envolvido' : ''}
                </Badge>
              ))}
            </div>
          )}
        </button>
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
  checklistMap,
  assigneeMap,
  onOpen,
  onDelete,
}: {
  columnKey: string;
  label: string;
  tasks: TaskRow[];
  canEdit: boolean;
  checklistMap: Record<string, { total: number; done: number }>;
  assigneeMap: Record<string, AssigneeRow[]>;
  onOpen: (task: TaskRow) => void;
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
        <TaskCard
          key={t.id}
          task={t}
          canEdit={canEdit}
          checklistSummary={checklistMap[t.id]}
          taskAssignees={assigneeMap[t.id] ?? []}
          onOpen={onOpen}
          onDelete={onDelete}
        />
      ))}
      {tasks.length === 0 && (
        <p className="text-xs text-muted-foreground py-4 text-center">Nenhuma tarefa</p>
      )}
    </div>
  );
};


const OuvidoriaTasksBoard = ({ companyId, channel, canEdit, reportOptions = [] }: Props) => {
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [checklists, setChecklists] = useState<ChecklistItem[]>([]);
  const [assignees, setAssignees] = useState<AssigneeRow[]>([]);
  const [ouvidoriaUsers, setOuvidoriaUsers] = useState<OuvidoriaUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<TaskRow | null>(null);
  const [newItem, setNewItem] = useState('');
  const [form, setForm] = useState({
    title: '',
    description: '',
    due_date: '',
    report_id: 'none',
    status: 'todo',
    sync_to_report: true,
  });
  const { toast } = useToast();
  const { user } = useRealAuth();
  const { authorName, authorRoleTitle } = useOuvidoriaAccess(companyId);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('ouvidoria_tasks')
      .select(
        'id, title, description, status, due_date, report_id, report_code, sync_to_report, position, created_at, completed_at'
      )
      .eq('company_id', companyId)
      .order('position', { ascending: true })
      .order('created_at', { ascending: false });
    const rows = (data ?? []) as TaskRow[];
    setTasks(rows);
    if (rows.length > 0) {
      const ids = rows.map((r) => r.id);
      const [{ data: items }, { data: people }] = await Promise.all([
        supabase
          .from('ouvidoria_task_checklist_items')
          .select('id, task_id, content, is_done, position')
          .in('task_id', ids)
          .order('position', { ascending: true }),
        supabase
          .from('ouvidoria_task_assignees')
          .select('id, task_id, ouvidoria_user_id, display_name, assignee_role')
          .in('task_id', ids),
      ]);
      setChecklists((items ?? []) as ChecklistItem[]);
      setAssignees((people ?? []) as AssigneeRow[]);
    } else {
      setChecklists([]);
      setAssignees([]);
    }
    setLoading(false);
  };

  const loadUsers = async () => {
    const { data } = await supabase
      .from('ouvidoria_users')
      .select('id, full_name, job_title, access_type, status')
      .eq('company_id', companyId)
      .order('full_name', { ascending: true });
    setOuvidoriaUsers((data ?? []) as OuvidoriaUserRow[]);
  };

  useEffect(() => {
    if (companyId) {
      load();
      loadUsers();
    }
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

  const pendingCount = useMemo(
    () => tasks.filter((t) => t.status !== 'done').length,
    [tasks],
  );

  const checklistMap = useMemo(() => {
    const map: Record<string, { total: number; done: number }> = {};
    checklists.forEach((i) => {
      const entry = map[i.task_id] ?? (map[i.task_id] = { total: 0, done: 0 });
      entry.total += 1;
      if (i.is_done) entry.done += 1;
    });
    return map;
  }, [checklists]);

  const assigneeMap = useMemo(() => {
    const map: Record<string, AssigneeRow[]> = {};
    assignees.forEach((a) => {
      (map[a.task_id] ?? (map[a.task_id] = [])).push(a);
    });
    return map;
  }, [assignees]);

  const selectedItems = useMemo(
    () => (selected ? checklists.filter((i) => i.task_id === selected.id) : []),
    [checklists, selected]
  );

  const selectedAssignees = useMemo(
    () => (selected ? assignees.filter((a) => a.task_id === selected.id) : []),
    [assignees, selected]
  );

  const roleOf = (userId: string): string | null =>
    selectedAssignees.find((a) => a.ouvidoria_user_id === userId)?.assignee_role ?? null;

  const setAssigneeRole = async (person: OuvidoriaUserRow, role: string | null) => {
    if (!selected) return;
    const existing = selectedAssignees.find((a) => a.ouvidoria_user_id === person.id);

    if (!role) {
      if (!existing) return;
      const { error } = await supabase
        .from('ouvidoria_task_assignees')
        .delete()
        .eq('id', existing.id);
      if (error) {
        toast({ variant: 'destructive', title: 'Erro', description: error.message });
        return;
      }
      setAssignees((prev) => prev.filter((a) => a.id !== existing.id));
      await syncToReportHistory(
        selected,
        `[Tarefa] "${selected.title}" — ${person.full_name} removido(a) da apuração.`
      );
      return;
    }

    if (existing) {
      const { error } = await supabase
        .from('ouvidoria_task_assignees')
        .update({ assignee_role: role })
        .eq('id', existing.id);
      if (error) {
        toast({ variant: 'destructive', title: 'Erro', description: error.message });
        return;
      }
      setAssignees((prev) =>
        prev.map((a) => (a.id === existing.id ? { ...a, assignee_role: role } : a))
      );
    } else {
      const { data, error } = await supabase
        .from('ouvidoria_task_assignees')
        .insert({
          task_id: selected.id,
          ouvidoria_user_id: person.id,
          display_name: person.full_name,
          assignee_role: role,
        })
        .select('id, task_id, ouvidoria_user_id, display_name, assignee_role')
        .maybeSingle();
      if (error) {
        toast({ variant: 'destructive', title: 'Erro', description: error.message });
        return;
      }
      if (data) setAssignees((prev) => [...prev, data as AssigneeRow]);
    }

    // Atribuição de responsáveis é interna: não vai para o histórico da denúncia.
  };


  /** Registra o andamento da tarefa no histórico PÚBLICO da denúncia vinculada
   *  (o denunciante vê as atualizações de tarefas; apenas notas internas ficam ocultas) */
  const syncToReportHistory = async (task: TaskRow, message: string) => {
    if (!task.report_id || !task.sync_to_report) return;
    try {
      if (channel === 'smart') {
        await supabase.from('beta_ouvidoria_updates').insert({
          report_id: task.report_id,
          author_type: 'investigator',
          author_user_id: user?.id ?? null,
          author_name: null,
          author_role_title: null,
          message,
          visibility: 'public',
        });
      } else {
        const reportStatus =
          reportOptions.find((r) => r.id === task.report_id)?.status ?? 'in_progress';
        await supabase.from('report_updates').insert({
          report_id: task.report_id,
          new_status: reportStatus,
          old_status: reportStatus,
          notes: message,
          user_id: user?.id ?? null,
          author_name: null,
          author_role_title: null,
          visibility: 'public',
        });
      }
    } catch {
      // histórico é complementar: não bloqueia a operação da tarefa
    }
  };

  const createTask = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    const linked = reportOptions.find((r) => r.id === form.report_id);
    const { data, error } = await supabase
      .from('ouvidoria_tasks')
      .insert({
        company_id: companyId,
        channel,
        title: form.title.trim(),
        description: form.description.trim() || null,
        due_date: form.due_date || null,
        status: form.status,
        report_id: form.report_id !== 'none' ? form.report_id : null,
        report_code: linked?.code ?? null,
        sync_to_report: form.sync_to_report,
        created_by: user?.id ?? null,
        position: tasks.length,
      })
      .select(
        'id, title, description, status, due_date, report_id, report_code, sync_to_report, position, created_at, completed_at'
      )
      .maybeSingle();
    setSaving(false);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao criar tarefa', description: error.message });
      return;
    }
    if (data) {
      await syncToReportHistory(
        data as TaskRow,
        `[Tarefa] "${(data as TaskRow).title}" criada em "${labelOfStatus((data as TaskRow).status)}".`
      );
    }
    setForm({ title: '', description: '', due_date: '', report_id: 'none', status: 'todo', sync_to_report: true });
    setOpen(false);
    load();
  };

  const moveTask = async (task: TaskRow, newStatus: string) => {
    if (task.status === newStatus) return;
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t)));
    setSelected((prev) => (prev && prev.id === task.id ? { ...prev, status: newStatus } : prev));

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
      return;
    }
    await syncToReportHistory(
      task,
      `[Tarefa] "${task.title}" movida de "${labelOfStatus(task.status)}" para "${labelOfStatus(newStatus)}".`
    );
  };

  const onDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const task = tasks.find((t) => t.id === active.id);
    if (!task) return;
    await moveTask(task, String(over.id));
  };

  const removeTask = async (id: string) => {
    const { error } = await supabase.from('ouvidoria_tasks').delete().eq('id', id);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      return;
    }
    if (selected?.id === id) setSelected(null);
    load();
  };

  const updateTaskLink = async (task: TaskRow, reportId: string) => {
    const linked = reportOptions.find((r) => r.id === reportId);
    const patch = {
      report_id: reportId !== 'none' ? reportId : null,
      report_code: linked?.code ?? null,
    };
    const { error } = await supabase.from('ouvidoria_tasks').update(patch).eq('id', task.id);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao vincular', description: error.message });
      return;
    }
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, ...patch } : t)));
    setSelected((prev) => (prev && prev.id === task.id ? { ...prev, ...patch } : prev));
    if (patch.report_id) {
      await syncToReportHistory(
        { ...task, ...patch },
        `[Tarefa] "${task.title}" vinculada a esta denúncia (situação: ${labelOfStatus(task.status)}).`
      );
    }
  };

  const updateTaskSync = async (task: TaskRow, value: boolean) => {
    const { error } = await supabase
      .from('ouvidoria_tasks')
      .update({ sync_to_report: value })
      .eq('id', task.id);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      return;
    }
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, sync_to_report: value } : t)));
    setSelected((prev) => (prev && prev.id === task.id ? { ...prev, sync_to_report: value } : prev));
  };

  const addChecklistItem = async () => {
    if (!selected || !newItem.trim()) return;
    const { data, error } = await supabase
      .from('ouvidoria_task_checklist_items')
      .insert({
        task_id: selected.id,
        content: newItem.trim(),
        position: selectedItems.length,
      })
      .select('id, task_id, content, is_done, position')
      .maybeSingle();
    if (error) {
      toast({ variant: 'destructive', title: 'Erro ao adicionar item', description: error.message });
      return;
    }
    if (data) setChecklists((prev) => [...prev, data as ChecklistItem]);
    setNewItem('');
  };

  const toggleChecklistItem = async (item: ChecklistItem) => {
    const value = !item.is_done;
    const { error } = await supabase
      .from('ouvidoria_task_checklist_items')
      .update({ is_done: value })
      .eq('id', item.id);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      return;
    }
    setChecklists((prev) => prev.map((i) => (i.id === item.id ? { ...i, is_done: value } : i)));
    const task = tasks.find((t) => t.id === item.task_id);
    if (task) {
      const total = checklists.filter((i) => i.task_id === task.id).length;
      const done = checklists.filter((i) => i.task_id === task.id && i.is_done).length + (value ? 1 : -1);
      await syncToReportHistory(
        task,
        `[Tarefa] "${task.title}" — item "${item.content}" ${value ? 'concluído' : 'reaberto'} (checklist ${done}/${total}).`
      );
    }
  };

  const removeChecklistItem = async (item: ChecklistItem) => {
    const { error } = await supabase
      .from('ouvidoria_task_checklist_items')
      .delete()
      .eq('id', item.id);
    if (error) {
      toast({ variant: 'destructive', title: 'Erro', description: error.message });
      return;
    }
    setChecklists((prev) => prev.filter((i) => i.id !== item.id));
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
        const people = assigneeMap[t.id] ?? [];
        if (people.length > 0) {
          if (y > 770) { doc.addPage(); y = 60; }
          const resp = people
            .filter((a) => a.assignee_role === 'responsavel')
            .map((a) => a.display_name ?? 'Usuário');
          const env = people
            .filter((a) => a.assignee_role === 'envolvido')
            .map((a) => a.display_name ?? 'Usuário');
          doc.setFontSize(9);
          doc.text(
            `   Responsáveis: ${resp.join(', ') || '—'}${env.length ? ` | Envolvidos: ${env.join(', ')}` : ''}`,
            marginX + 24,
            y,
            { maxWidth: 460 }
          );
          doc.setFontSize(10);
          y += 14;
        }
        checklists
          .filter((i) => i.task_id === t.id)
          .forEach((i) => {
            if (y > 770) { doc.addPage(); y = 60; }
            doc.setFontSize(9);
            doc.text(`   ${i.is_done ? '[x]' : '[ ]'} ${i.content}`, marginX + 24, y, { maxWidth: 460 });
            doc.setFontSize(10);
            y += 14;
          });
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
            Vincule tarefas às denúncias (o andamento vai automaticamente para o histórico da denúncia (visível ao denunciante)),
            crie checklists e exporte tudo para auditoria.
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
                  checklistMap={checklistMap}
                  assigneeMap={assigneeMap}
                  onOpen={setSelected}
                  onDelete={removeTask}
                />
              ))}
            </div>
          </DndContext>
        )}
      </CardContent>
      <div className="flex items-center justify-center gap-2 rounded-b-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white">
        <ListChecks className="h-4 w-4" />
        {pendingCount} {pendingCount === 1 ? 'tarefa pendente' : 'tarefas pendentes'} no momento
      </div>

      {/* Nova tarefa */}
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
              {reportOptions.length === 0 && (
                <p className="text-xs text-muted-foreground mt-1">
                  Nenhuma denúncia disponível para vincular ainda.
                </p>
              )}
            </div>
            <div className="flex items-center justify-between rounded-md border p-3">
              <div className="pr-3">
                <Label className="text-sm">Atualizar histórico da denúncia</Label>
                <p className="text-xs text-muted-foreground">
                  Cada movimentação da tarefa é registrada como atualização pública — o denunciante acompanha pelo protocolo. Somente as notas internas ficam ocultas.
                </p>
              </div>
              <Switch
                checked={form.sync_to_report}
                onCheckedChange={(v) => setForm({ ...form, sync_to_report: v })}
              />
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

      {/* Detalhe da tarefa */}
      <Dialog open={!!selected} onOpenChange={(o) => { if (!o) { setSelected(null); setNewItem(''); } }}>
        {selected && (
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selected.title}</DialogTitle>
              <DialogDescription>
                {selected.description || 'Sem descrição'}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>Situação</Label>
                  <Select
                    value={selected.status}
                    onValueChange={(v) => moveTask(selected, v)}
                    disabled={!canEdit}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {COLUMNS.map((c) => (
                        <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Denúncia vinculada</Label>
                  <Select
                    value={selected.report_id ?? 'none'}
                    onValueChange={(v) => updateTaskLink(selected, v)}
                    disabled={!canEdit}
                  >
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

              <div className="flex items-center justify-between rounded-md border p-3">
                <div className="pr-3">
                  <Label className="text-sm">Atualizar histórico da denúncia</Label>
                  <p className="text-xs text-muted-foreground">
                    Registra automaticamente o andamento desta tarefa como atualização pública na denúncia (o denunciante visualiza).
                  </p>
                </div>
                <Switch
                  checked={selected.sync_to_report}
                  onCheckedChange={(v) => updateTaskSync(selected, v)}
                  disabled={!canEdit || !selected.report_id}
                />
              </div>

              <Separator />

              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="flex items-center gap-2">
                    <Users className="h-4 w-4" /> Responsáveis e envolvidos
                  </Label>
                  <Badge variant="secondary">{selectedAssignees.length}</Badge>
                </div>
                {ouvidoriaUsers.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    Cadastre usuários em "Usuários da ouvidoria" para atribuí-los às tarefas.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {ouvidoriaUsers.map((person) => {
                      const role = roleOf(person.id);
                      return (
                        <div
                          key={person.id}
                          className="flex items-center justify-between gap-2 rounded-md border px-3 py-2"
                        >
                          <div className="min-w-0">
                            <p className="text-sm truncate">{person.full_name}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {person.job_title || (person.access_type === 'auditor' ? 'Auditor' : 'Gestor')}
                              {person.status !== 'active' ? ' · convite pendente' : ''}
                            </p>
                          </div>
                          <Select
                            value={role ?? 'nenhum'}
                            onValueChange={(v) =>
                              setAssigneeRole(person, v === 'nenhum' ? null : v)
                            }
                            disabled={!canEdit}
                          >
                            <SelectTrigger className="w-[150px] shrink-0">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="nenhum">Não atribuído</SelectItem>
                              {ASSIGNEE_ROLES.map((r) => (
                                <SelectItem key={r.key} value={r.key}>
                                  {r.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <Separator />


              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="flex items-center gap-2">
                    <ListChecks className="h-4 w-4" /> Checklist interno
                  </Label>
                  <Badge variant="secondary">
                    {selectedItems.filter((i) => i.is_done).length}/{selectedItems.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {selectedItems.length === 0 && (
                    <p className="text-xs text-muted-foreground">Nenhum item no checklist.</p>
                  )}
                  {selectedItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 rounded-md border px-3 py-2">
                      <Checkbox
                        checked={item.is_done}
                        onCheckedChange={() => canEdit && toggleChecklistItem(item)}
                        disabled={!canEdit}
                      />
                      <span
                        className={`flex-1 text-sm ${item.is_done ? 'line-through text-muted-foreground' : ''}`}
                      >
                        {item.content}
                      </span>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => removeChecklistItem(item)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
                {canEdit && (
                  <div className="flex gap-2 mt-3">
                    <Input
                      placeholder="Novo item do checklist"
                      value={newItem}
                      onChange={(e) => setNewItem(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addChecklistItem();
                        }
                      }}
                    />
                    <Button onClick={addChecklistItem} disabled={!newItem.trim()}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setSelected(null)}>Fechar</Button>
            </DialogFooter>
          </DialogContent>
        )}
      </Dialog>
    </Card>
  );
};

export default OuvidoriaTasksBoard;
