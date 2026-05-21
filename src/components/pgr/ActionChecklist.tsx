import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { DashChecklistItem } from "@/hooks/usePGRDashboardData";

interface Props {
  actionId: string;
  items: DashChecklistItem[];
  onChanged: () => void;
}

export const ActionChecklist = ({ actionId, items, onChanged }: Props) => {
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const add = async () => {
    if (!newTitle.trim()) return;
    setAdding(true);
    const { error } = await supabase.from('pgr_action_checklist_items').insert({
      action_item_id: actionId,
      title: newTitle.trim(),
      order_index: items.length,
    } as any);
    setAdding(false);
    if (error) { toast.error(error.message); return; }
    setNewTitle("");
    onChanged();
  };

  const toggle = async (item: DashChecklistItem) => {
    setBusyId(item.id);
    const { error } = await supabase
      .from('pgr_action_checklist_items')
      .update({ done: !item.done } as any)
      .eq('id', item.id);
    setBusyId(null);
    if (error) { toast.error(error.message); return; }
    onChanged();
  };

  const remove = async (id: string) => {
    setBusyId(id);
    const { error } = await supabase.from('pgr_action_checklist_items').delete().eq('id', id);
    setBusyId(null);
    if (error) { toast.error(error.message); return; }
    onChanged();
  };

  return (
    <div className="space-y-2">
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">Nenhuma subtarefa. Adicione abaixo para acompanhar o progresso.</p>
      ) : (
        <ul className="space-y-1.5">
          {items.map(item => (
            <li key={item.id} className="flex items-center gap-2 group">
              <Checkbox checked={item.done} onCheckedChange={() => toggle(item)} disabled={busyId === item.id} />
              <span className={`flex-1 text-sm ${item.done ? 'line-through text-muted-foreground' : ''}`}>{item.title}</span>
              <Button size="icon" variant="ghost" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => remove(item.id)} disabled={busyId === item.id}>
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
              </Button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2 pt-1">
        <Input
          placeholder="Adicionar subtarefa…"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') add(); }}
          className="h-8 text-sm"
        />
        <Button size="sm" variant="outline" onClick={add} disabled={adding || !newTitle.trim()}>
          {adding ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  );
};
