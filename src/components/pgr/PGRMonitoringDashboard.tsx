import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, ClipboardList, KanbanSquare } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { usePGRDashboardData } from "@/hooks/usePGRDashboardData";
import { PGRKPICards } from "./PGRKPICards";
import { PGRCharts } from "./PGRCharts";
import { ActionCard } from "./ActionCard";
import type { PGRDocument } from "@/pages/PGRDashboard";

export const PGRMonitoringDashboard = ({ pgr }: { pgr: PGRDocument }) => {
  const { ghes, risks, actions, checklist, loading, aggregates, reload } = usePGRDashboardData(pgr.id);

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [gheFilter, setGheFilter] = useState<string>('all');
  const [responsibleFilter, setResponsibleFilter] = useState<string>('');
  const [overdueOnly, setOverdueOnly] = useState(false);

  const responsibles = useMemo(() => {
    const set = new Set<string>();
    actions.forEach(a => { if (a.responsible) set.add(a.responsible); });
    return Array.from(set).sort();
  }, [actions]);

  const filteredActions = useMemo(() => {
    const today = new Date(); today.setHours(0,0,0,0);
    return actions.filter(a => {
      if (statusFilter !== 'all' && a.status !== statusFilter) return false;
      if (gheFilter !== 'all') {
        const risk = risks.find(r => r.id === a.risk_id);
        if (!risk || risk.ghe_id !== gheFilter) return false;
      }
      if (responsibleFilter && !(a.responsible || '').toLowerCase().includes(responsibleFilter.toLowerCase())) return false;
      if (overdueOnly) {
        if (!a.deadline || a.status === 'done' || a.status === 'cancelled') return false;
        if (new Date(a.deadline) >= today) return false;
      }
      return true;
    });
  }, [actions, risks, statusFilter, gheFilter, responsibleFilter, overdueOnly]);

  if (loading) {
    return <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <PGRKPICards
        pgr={pgr}
        gheCount={ghes.length}
        totalWorkers={aggregates.totalWorkers}
        riskCount={risks.length}
        criticalRisks={aggregates.criticalRisks}
        totalActions={actions.length}
        doneActions={aggregates.byStatus.done}
        overdueActions={aggregates.overdue}
        completionPct={aggregates.completionPct}
      />

      <PGRCharts
        ghes={ghes}
        risks={risks}
        actions={actions}
        byCategory={aggregates.byCategory}
        byLevel={aggregates.byLevel}
        byStatus={aggregates.byStatus}
        byHierarchy={aggregates.byHierarchy}
        monthBuckets={aggregates.monthBuckets}
      />

      <div>
        <div className="flex items-center justify-between gap-2 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <ClipboardList className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold">Plano de Ação Vigente</h3>
            <span className="text-sm text-muted-foreground">({filteredActions.length} de {actions.length})</span>
          </div>
          <Button asChild size="sm" variant="outline" className="gap-1.5">
            <Link to={`/pgr/${pgr.company_id}/kanban`}>
              <KanbanSquare className="h-4 w-4" /> Ver em Kanban
            </Link>
          </Button>
        </div>

        <Card className="mb-4">
          <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="in_progress">Em andamento</SelectItem>
                <SelectItem value="done">Concluída</SelectItem>
                <SelectItem value="cancelled">Cancelada</SelectItem>
              </SelectContent>
            </Select>
            <Select value={gheFilter} onValueChange={setGheFilter}>
              <SelectTrigger><SelectValue placeholder="GHE" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os GHEs</SelectItem>
                {ghes.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input
              placeholder="Filtrar por responsável…"
              value={responsibleFilter}
              onChange={e => setResponsibleFilter(e.target.value)}
              list="responsibles-list"
            />
            <datalist id="responsibles-list">
              {responsibles.map(r => <option key={r} value={r} />)}
            </datalist>
            <Button
              variant={overdueOnly ? 'destructive' : 'outline'}
              onClick={() => setOverdueOnly(v => !v)}
            >
              {overdueOnly ? 'Mostrando atrasadas' : 'Somente atrasadas'}
            </Button>
          </CardContent>
        </Card>

        {filteredActions.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-sm text-muted-foreground">
            Nenhuma ação encontrada com os filtros atuais.
          </CardContent></Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredActions.map(a => (
              <ActionCard
                key={a.id}
                action={a}
                checklist={checklist.filter(c => c.action_item_id === a.id)}
                risks={risks}
                ghes={ghes}
                onChanged={reload}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
