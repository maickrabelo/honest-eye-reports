import { useDroppable } from "@dnd-kit/core";
import { Badge } from "@/components/ui/badge";
import { KanbanActionCard } from "./KanbanActionCard";
import type { DashAction, DashChecklistItem, DashRisk, DashGHE } from "@/hooks/usePGRDashboardData";

interface Props {
  status: string;
  label: string;
  colorClass: string;
  actions: DashAction[];
  checklist: DashChecklistItem[];
  risks: DashRisk[];
  ghes: DashGHE[];
}

export const KanbanColumn = ({
  status,
  label,
  colorClass,
  actions,
  checklist,
  risks,
  ghes,
}: Props) => {
  const { setNodeRef, isOver } = useDroppable({ id: status });

  return (
    <div className="flex flex-col w-72 flex-shrink-0">
      <div className={`flex items-center justify-between px-3 py-2 rounded-t-md border border-b-0 ${colorClass}`}>
        <h3 className="font-semibold text-sm">{label}</h3>
        <Badge variant="secondary" className="font-mono">
          {actions.length}
        </Badge>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 min-h-[400px] p-2 space-y-2 rounded-b-md border bg-muted/30 transition-colors ${
          isOver ? "bg-primary/10 border-primary" : ""
        }`}
      >
        {actions.length === 0 ? (
          <p className="text-xs text-muted-foreground italic text-center py-6">
            Sem ações
          </p>
        ) : (
          actions.map((a) => (
            <KanbanActionCard
              key={a.id}
              action={a}
              checklist={checklist.filter((c) => c.action_item_id === a.id)}
              risks={risks}
              ghes={ghes}
            />
          ))
        )}
      </div>
    </div>
  );
};
