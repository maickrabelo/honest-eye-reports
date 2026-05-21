import { useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Calendar, User, DollarSign, AlertTriangle, Shield } from "lucide-react";
import { toast } from "sonner";
import { ActionChecklist } from "./ActionChecklist";
import type { DashAction, DashChecklistItem, DashRisk, DashGHE } from "@/hooks/usePGRDashboardData";

const HIERARCHY_LABELS: Record<string, string> = {
  elimination: 'Eliminação', substitution: 'Substituição', engineering: 'Engenharia',
  administrative: 'Administrativa', epi: 'EPI',
};
const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pendente', color: 'bg-yellow-100 text-yellow-700 border-yellow-300' },
  in_progress: { label: 'Em andamento', color: 'bg-blue-100 text-blue-700 border-blue-300' },
  done: { label: 'Concluída', color: 'bg-green-100 text-green-700 border-green-300' },
  cancelled: { label: 'Cancelada', color: 'bg-gray-100 text-gray-600 border-gray-300' },
};

interface Props {
  action: DashAction;
  checklist: DashChecklistItem[];
  risks: DashRisk[];
  ghes: DashGHE[];
  onChanged: () => void;
}

export const ActionCard = ({ action, checklist, risks, ghes, onChanged }: Props) => {
  const risk = risks.find(r => r.id === action.risk_id);
  const ghe = risk ? ghes.find(g => g.id === risk.ghe_id) : undefined;
  const st = STATUS_LABELS[action.status] || STATUS_LABELS.pending;

  const { progress, deadlineState } = useMemo(() => {
    let prog = 0;
    if (checklist.length > 0) {
      prog = Math.round((checklist.filter(c => c.done).length / checklist.length) * 100);
    } else {
      prog = action.status === 'done' ? 100 : action.status === 'in_progress' ? 50 : 0;
    }
    let state: 'overdue' | 'soon' | 'ok' | 'none' = 'none';
    if (action.deadline && action.status !== 'done' && action.status !== 'cancelled') {
      const today = new Date(); today.setHours(0,0,0,0);
      const d = new Date(action.deadline);
      const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      if (diff < 0) state = 'overdue';
      else if (diff <= 7) state = 'soon';
      else state = 'ok';
    }
    return { progress: prog, deadlineState: state };
  }, [checklist, action]);

  const markDone = async () => {
    const { error } = await supabase.from('pgr_action_items').update({ status: 'done' } as any).eq('id', action.id);
    if (error) { toast.error(error.message); return; }
    toast.success("Ação concluída");
    onChanged();
  };

  const deadlineClass =
    deadlineState === 'overdue' ? 'text-destructive font-semibold' :
    deadlineState === 'soon' ? 'text-orange-600 font-medium' : 'text-muted-foreground';

  return (
    <Card className={deadlineState === 'overdue' ? 'border-destructive/40' : ''}>
      <CardContent className="pt-5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold leading-snug">{action.description}</h4>
            {risk && (
              <p className="text-xs text-muted-foreground mt-1">
                Risco: <span className="font-medium">{risk.agent_name}</span>
                {ghe && <> · GHE: <span className="font-medium">{ghe.name}</span></>}
              </p>
            )}
          </div>
          <Badge variant="outline" className={st.color}>{st.label}</Badge>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {action.control_hierarchy && (
            <Badge variant="outline" className="gap-1"><Shield className="h-3 w-3" />{HIERARCHY_LABELS[action.control_hierarchy]}</Badge>
          )}
          {deadlineState === 'overdue' && (
            <Badge variant="destructive" className="gap-1"><AlertTriangle className="h-3 w-3" />Atrasada</Badge>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center gap-1.5"><User className="h-3.5 w-3.5 text-muted-foreground" /><span>{action.responsible || '—'}</span></div>
          <div className="flex items-center gap-1.5"><Calendar className="h-3.5 w-3.5 text-muted-foreground" /><span className={deadlineClass}>{action.deadline ? new Date(action.deadline).toLocaleDateString('pt-BR') : 'Sem prazo'}</span></div>
          <div className="flex items-center gap-1.5 col-span-2"><DollarSign className="h-3.5 w-3.5 text-muted-foreground" /><span>R$ {(action.cost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium">Progresso</span>
            <span className="text-muted-foreground">{progress}%</span>
          </div>
          <Progress value={progress} />
        </div>

        <div className="pt-2 border-t">
          <p className="text-xs font-semibold mb-2 text-muted-foreground uppercase tracking-wide">Checklist</p>
          <ActionChecklist actionId={action.id} items={checklist} onChanged={onChanged} />
        </div>

        {action.status !== 'done' && action.status !== 'cancelled' && (
          <Button size="sm" variant="outline" className="w-full gap-1.5" onClick={markDone}>
            <CheckCircle2 className="h-4 w-4" /> Marcar como concluída
          </Button>
        )}

        <p className="text-[10px] text-muted-foreground pt-1">
          Criada em {new Date(action.created_at).toLocaleDateString('pt-BR')} · Atualizada em {new Date(action.updated_at).toLocaleDateString('pt-BR')}
        </p>
      </CardContent>
    </Card>
  );
};
