import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Users, FlaskConical, ClipboardList, AlertTriangle, CheckCircle2, CalendarClock } from "lucide-react";
import type { PGRDocument } from "@/pages/PGRDashboard";

interface Props {
  pgr: PGRDocument;
  gheCount: number;
  totalWorkers: number;
  riskCount: number;
  criticalRisks: number;
  totalActions: number;
  doneActions: number;
  overdueActions: number;
  completionPct: number;
}

const KPI = ({ icon: Icon, label, value, hint, tone = 'default' }: any) => {
  const toneClass = tone === 'danger' ? 'text-destructive' : tone === 'success' ? 'text-green-600' : 'text-primary';
  return (
    <Card>
      <CardContent className="pt-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{label}</p>
            <p className={`text-2xl font-bold mt-1 ${toneClass}`}>{value}</p>
            {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
          </div>
          <Icon className={`h-8 w-8 opacity-30 ${toneClass}`} />
        </div>
      </CardContent>
    </Card>
  );
};

export const PGRKPICards = ({ pgr, gheCount, totalWorkers, riskCount, criticalRisks, totalActions, doneActions, overdueActions, completionPct }: Props) => {
  // Time progress
  let timeProgress = 0;
  let daysRemaining: number | null = null;
  if (pgr.validity_start && pgr.validity_end) {
    const start = new Date(pgr.validity_start).getTime();
    const end = new Date(pgr.validity_end).getTime();
    const now = Date.now();
    timeProgress = Math.max(0, Math.min(100, Math.round(((now - start) / (end - start)) * 100)));
    daysRemaining = Math.max(0, Math.ceil((end - now) / (1000 * 60 * 60 * 24)));
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPI icon={Users} label="GHEs" value={gheCount} hint={`${totalWorkers} trabalhadores`} />
        <KPI icon={FlaskConical} label="Riscos" value={riskCount} hint={`${criticalRisks} críticos/altos`} tone={criticalRisks > 0 ? 'danger' : 'default'} />
        <KPI icon={ClipboardList} label="Ações" value={totalActions} hint={`${doneActions} concluídas`} />
        <KPI icon={CheckCircle2} label="Conclusão" value={`${completionPct}%`} tone="success" />
        <KPI icon={AlertTriangle} label="Atrasadas" value={overdueActions} tone={overdueActions > 0 ? 'danger' : 'default'} />
        <KPI icon={CalendarClock} label="Dias restantes" value={daysRemaining ?? '—'} hint={pgr.validity_end ? `até ${new Date(pgr.validity_end).toLocaleDateString('pt-BR')}` : 'Sem vigência'} />
      </div>

      <Card>
        <CardContent className="pt-5 space-y-3">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Vigência do PGR</span>
            <span className="text-muted-foreground">
              {pgr.validity_start ? new Date(pgr.validity_start).toLocaleDateString('pt-BR') : '—'}
              {' → '}
              {pgr.validity_end ? new Date(pgr.validity_end).toLocaleDateString('pt-BR') : '—'}
            </span>
          </div>
          <Progress value={timeProgress} />
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">Plano de Ação — conclusão</span>
            <span className="text-muted-foreground">{doneActions}/{totalActions - 0} ações</span>
          </div>
          <Progress value={completionPct} />
        </CardContent>
      </Card>
    </div>
  );
};
