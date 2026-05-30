import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, User, AlertTriangle, Shield, GripVertical } from "lucide-react";
import type { DashAction, DashChecklistItem, DashRisk, DashGHE } from "@/hooks/usePGRDashboardData";

const HIERARCHY_LABELS: Record<string, string> = {
  elimination: "Eliminação",
  substitution: "Substituição",
  engineering: "Engenharia",
  administrative: "Administrativa",
  epi: "EPI",
};

interface Props {
  action: DashAction;
  checklist: DashChecklistItem[];
  risks: DashRisk[];
  ghes: DashGHE[];
}

export const KanbanActionCard = ({ action, checklist, risks, ghes }: Props) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: action.id,
    data: { status: action.status },
  });

  const risk = risks.find((r) => r.id === action.risk_id);
  const ghe = risk ? ghes.find((g) => g.id === risk.ghe_id) : undefined;

  const progress =
    checklist.length > 0
      ? Math.round((checklist.filter((c) => c.done).length / checklist.length) * 100)
      : action.status === "done"
      ? 100
      : action.status === "in_progress"
      ? 50
      : 0;

  let overdue = false;
  let dueSoon = false;
  if (action.deadline && action.status !== "done" && action.status !== "cancelled") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(action.deadline);
    const diff = Math.ceil((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    overdue = diff < 0;
    dueSoon = diff >= 0 && diff <= 7;
  }

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`bg-card border rounded-md p-3 shadow-sm hover:shadow-md transition-shadow space-y-2 ${
        overdue ? "border-destructive/50" : "border-border"
      }`}
      aria-label={`Ação ${action.description} — status atual ${action.status}`}
    >
      <div className="flex items-start gap-2">
        <button
          {...listeners}
          {...attributes}
          className="cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
          aria-label="Arrastar ação"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <h4 className="font-medium text-sm leading-snug flex-1 min-w-0">
          {action.description}
        </h4>
      </div>

      {(risk || ghe) && (
        <p className="text-[11px] text-muted-foreground pl-6">
          {risk?.agent_name}
          {ghe && <> · {ghe.name}</>}
        </p>
      )}

      <div className="flex flex-wrap gap-1 pl-6">
        {action.control_hierarchy && (
          <Badge variant="outline" className="gap-1 text-[10px] py-0">
            <Shield className="h-2.5 w-2.5" />
            {HIERARCHY_LABELS[action.control_hierarchy]}
          </Badge>
        )}
        {overdue && (
          <Badge variant="destructive" className="gap-1 text-[10px] py-0">
            <AlertTriangle className="h-2.5 w-2.5" />
            Atrasada
          </Badge>
        )}
      </div>

      <div className="space-y-1.5 pl-6">
        <div className="grid grid-cols-2 gap-1.5 text-[11px]">
          <div className="flex items-center gap-1 min-w-0">
            <User className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span className="truncate">{action.responsible || "—"}</span>
          </div>
          <div className="flex items-center gap-1">
            <Calendar className="h-3 w-3 text-muted-foreground flex-shrink-0" />
            <span
              className={
                overdue
                  ? "text-destructive font-medium"
                  : dueSoon
                  ? "text-orange-600 font-medium"
                  : "text-muted-foreground"
              }
            >
              {action.deadline
                ? new Date(action.deadline).toLocaleDateString("pt-BR")
                : "Sem prazo"}
            </span>
          </div>
        </div>

        {checklist.length > 0 && (
          <div className="space-y-0.5">
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>
                {checklist.filter((c) => c.done).length}/{checklist.length} subtarefas
              </span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-1" />
          </div>
        )}
      </div>
    </div>
  );
};
