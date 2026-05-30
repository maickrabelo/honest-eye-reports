import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  DndContext,
  DragEndEvent,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { supabase } from "@/integrations/supabase/client";
import { useRealAuth } from "@/contexts/RealAuthContext";
import { usePGRModuleAccess } from "@/hooks/usePGRModuleAccess";
import { usePGRDashboardData, DashAction } from "@/hooks/usePGRDashboardData";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Loader2, KanbanSquare } from "lucide-react";
import { toast } from "sonner";
import { KanbanColumn } from "@/components/pgr/KanbanColumn";
import { ConfirmStatusChangeDialog } from "@/components/pgr/ConfirmStatusChangeDialog";

const COLUMNS: { status: string; label: string; colorClass: string }[] = [
  { status: "pending", label: "Pendente", colorClass: "bg-yellow-50 text-yellow-900 border-yellow-200" },
  { status: "in_progress", label: "Em andamento", colorClass: "bg-blue-50 text-blue-900 border-blue-200" },
  { status: "done", label: "Concluída", colorClass: "bg-green-50 text-green-900 border-green-200" },
  { status: "cancelled", label: "Cancelada", colorClass: "bg-gray-100 text-gray-700 border-gray-200" },
];

const PGRKanban = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useRealAuth();
  const { hasAccess, isLoading: accessLoading } = usePGRModuleAccess();

  const [pgrId, setPgrId] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [loadingPgr, setLoadingPgr] = useState(true);

  // Resolve latest PGR for this company (same pattern as PGRDashboard)
  useEffect(() => {
    if (authLoading || accessLoading) return;
    if (!user) { navigate("/auth"); return; }
    if (!hasAccess) { navigate("/"); return; }
    if (!companyId) { navigate(-1); return; }
    (async () => {
      setLoadingPgr(true);
      const [{ data: company }, { data: pgr }] = await Promise.all([
        supabase.from("companies").select("name").eq("id", companyId).maybeSingle(),
        supabase
          .from("pgr_documents")
          .select("id")
          .eq("company_id", companyId)
          .order("version", { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      setCompanyName((company as any)?.name || "");
      setPgrId((pgr as any)?.id || null);
      setLoadingPgr(false);
    })();
  }, [user, hasAccess, authLoading, accessLoading, companyId]);

  const { ghes, risks, actions: rawActions, checklist, loading, reloadActions } =
    usePGRDashboardData(pgrId || "");

  const [optimisticActions, setOptimisticActions] = useState<DashAction[]>([]);
  useEffect(() => { setOptimisticActions(rawActions); }, [rawActions]);

  const [gheFilter, setGheFilter] = useState("all");
  const [responsibleFilter, setResponsibleFilter] = useState("");
  const [overdueOnly, setOverdueOnly] = useState(false);

  const [pendingMove, setPendingMove] = useState<{
    actionId: string;
    fromStatus: string;
    toStatus: "done" | "cancelled";
    description: string;
  } | null>(null);

  const filteredActions = useMemo(() => {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    return optimisticActions.filter((a) => {
      if (gheFilter !== "all") {
        const risk = risks.find((r) => r.id === a.risk_id);
        if (!risk || risk.ghe_id !== gheFilter) return false;
      }
      if (responsibleFilter && !(a.responsible || "").toLowerCase().includes(responsibleFilter.toLowerCase())) return false;
      if (overdueOnly) {
        if (!a.deadline || a.status === "done" || a.status === "cancelled") return false;
        if (new Date(a.deadline) >= today) return false;
      }
      return true;
    });
  }, [optimisticActions, risks, gheFilter, responsibleFilter, overdueOnly]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  );

  const applyStatusUpdate = async (actionId: string, newStatus: string, previousStatus: string) => {
    setOptimisticActions((prev) =>
      prev.map((a) => (a.id === actionId ? { ...a, status: newStatus } : a)),
    );
    const { error } = await supabase
      .from("pgr_action_items")
      .update({ status: newStatus } as any)
      .eq("id", actionId);
    if (error) {
      toast.error("Erro ao atualizar: " + error.message);
      setOptimisticActions((prev) =>
        prev.map((a) => (a.id === actionId ? { ...a, status: previousStatus } : a)),
      );
      return;
    }
    toast.success("Status atualizado");
    reloadActions();
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const actionId = String(active.id);
    const newStatus = String(over.id);
    const action = optimisticActions.find((a) => a.id === actionId);
    if (!action || action.status === newStatus) return;

    if (newStatus === "done" || newStatus === "cancelled") {
      setPendingMove({
        actionId,
        fromStatus: action.status,
        toStatus: newStatus as "done" | "cancelled",
        description: action.description,
      });
      return;
    }
    applyStatusUpdate(actionId, newStatus, action.status);
  };

  const confirmPending = () => {
    if (!pendingMove) return;
    applyStatusUpdate(pendingMove.actionId, pendingMove.toStatus, pendingMove.fromStatus);
    setPendingMove(null);
  };

  if (authLoading || accessLoading || loadingPgr) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!pgrId) {
    return (
      <div className="min-h-screen p-6 max-w-2xl mx-auto space-y-4">
        <Button variant="ghost" onClick={() => navigate(`/pgr/${companyId}`)}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Voltar ao PGR
        </Button>
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Nenhum PGR encontrado para esta empresa.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Button variant="ghost" size="sm" onClick={() => navigate(`/pgr/${companyId}`)}>
              <ArrowLeft className="h-4 w-4 mr-2" /> Voltar
            </Button>
            <div className="flex items-center gap-2 min-w-0">
              <KanbanSquare className="h-5 w-5 text-primary flex-shrink-0" />
              <div className="min-w-0">
                <h1 className="font-semibold leading-tight truncate">Kanban de Ações — PGR</h1>
                <p className="text-xs text-muted-foreground truncate">{companyName}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-4 space-y-4">
        <Card>
          <CardContent className="pt-4 grid grid-cols-1 md:grid-cols-4 gap-3">
            <Select value={gheFilter} onValueChange={setGheFilter}>
              <SelectTrigger><SelectValue placeholder="GHE" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os GHEs</SelectItem>
                {ghes.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input
              placeholder="Filtrar por responsável…"
              value={responsibleFilter}
              onChange={(e) => setResponsibleFilter(e.target.value)}
              className="md:col-span-2"
            />
            <Button
              variant={overdueOnly ? "destructive" : "outline"}
              onClick={() => setOverdueOnly((v) => !v)}
            >
              {overdueOnly ? "Mostrando atrasadas" : "Somente atrasadas"}
            </Button>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="flex gap-3 overflow-x-auto pb-4">
              {COLUMNS.map((col) => (
                <KanbanColumn
                  key={col.status}
                  status={col.status}
                  label={col.label}
                  colorClass={col.colorClass}
                  actions={filteredActions.filter((a) => a.status === col.status)}
                  checklist={checklist}
                  risks={risks}
                  ghes={ghes}
                />
              ))}
            </div>
          </DndContext>
        )}
      </div>

      <ConfirmStatusChangeDialog
        open={!!pendingMove}
        targetStatus={pendingMove?.toStatus ?? null}
        actionDescription={pendingMove?.description ?? ""}
        onConfirm={confirmPending}
        onCancel={() => setPendingMove(null)}
      />
    </div>
  );
};

export default PGRKanban;
