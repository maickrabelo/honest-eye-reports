import React, { useEffect, useRef, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  CheckCircle2,
  Clock,
  FileDown,
  Filter,
  History,
  KanbanSquare,
  ListChecks,
  Lock,
  MessageSquare,
  Search,
  ShieldCheck,
  StickyNote,
  UserCog,
  Users,
} from 'lucide-react';

type ReportStatus = 'novo' | 'em_apuracao' | 'concluido';

interface DemoReport {
  protocol: string;
  category: string;
  severity: 'alta' | 'media' | 'baixa';
  status: ReportStatus;
  time: string;
}

const REPORTS: DemoReport[] = [
  { protocol: '#OV-2026-8471', category: 'Assédio moral', severity: 'alta', status: 'em_apuracao', time: 'há 12 min' },
  { protocol: '#OV-2026-8468', category: 'Segurança do trabalho', severity: 'media', status: 'novo', time: 'há 1 h' },
  { protocol: '#OV-2026-8460', category: 'Discriminação', severity: 'alta', status: 'em_apuracao', time: 'há 3 h' },
  { protocol: '#OV-2026-8452', category: 'Fraude', severity: 'baixa', status: 'concluido', time: 'ontem' },
  { protocol: '#OV-2026-8449', category: 'Conflito de interesses', severity: 'media', status: 'concluido', time: 'ontem' },
];

const LOG_FEED = [
  { icon: MessageSquare, text: 'Nova denúncia recebida e classificada pela SOnIA', detail: 'Assédio moral · Gravidade ALTA', time: 'agora' },
  { icon: KanbanSquare, text: 'Tarefa criada: "Entrevistar testemunhas"', detail: 'Responsável: Gestor · Prazo: 5 dias', time: 'há 2 min' },
  { icon: StickyNote, text: 'Nota interna adicionada (visível só para a equipe)', detail: 'Caso #OV-2026-8471', time: 'há 8 min' },
  { icon: UserCog, text: 'Auditor externo acessou o painel (somente leitura)', detail: 'Acesso registrado no log', time: 'há 15 min' },
  { icon: FileDown, text: 'Histórico completo exportado em PDF', detail: 'Caso #OV-2026-8452 · evidência p/ auditoria', time: 'há 40 min' },
  { icon: CheckCircle2, text: 'Denúncia concluída e denunciante notificado', detail: 'Protocolo #OV-2026-8449', time: 'há 1 h' },
];

const severityStyle: Record<DemoReport['severity'], string> = {
  alta: 'bg-red-100 text-red-700 border-red-200',
  media: 'bg-amber-100 text-amber-700 border-amber-200',
  baixa: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const statusStyle: Record<ReportStatus, { label: string; cls: string }> = {
  novo: { label: 'Novo', cls: 'bg-blue-100 text-blue-700 border-blue-200' },
  em_apuracao: { label: 'Em apuração', cls: 'bg-amber-100 text-amber-700 border-amber-200' },
  concluido: { label: 'Concluída', cls: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
};

const STATS = [
  { icon: AlertTriangle, label: 'Denúncias ativas', value: '12', tone: 'text-amber-600 bg-amber-100' },
  { icon: KanbanSquare, label: 'Tarefas pendentes', value: '7', tone: 'text-blue-600 bg-blue-100' },
  { icon: CheckCircle2, label: 'Concluídas no mês', value: '23', tone: 'text-emerald-600 bg-emerald-100' },
  { icon: Clock, label: 'SLA médio de resposta', value: '1,8 d', tone: 'text-audit-secondary bg-audit-secondary/15' },
];

/** Simulação visual do painel de gestão da ouvidoria: fila de denúncias, tarefas e log de atividades. */
export default function OuvidoriaDashboardSimulation() {
  const [visibleLogs, setVisibleLogs] = useState(1);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const timers: number[] = [];
    const cycle = () => {
      LOG_FEED.forEach((_, i) => {
        timers.push(
          window.setTimeout(() => {
            if (!cancelled) setVisibleLogs(i + 1);
          }, 900 * (i + 1))
        );
      });
      timers.push(
        window.setTimeout(() => {
          if (cancelled) return;
          setVisibleLogs(0);
          timers.push(window.setTimeout(cycle, 900));
        }, 900 * (LOG_FEED.length + 1) + 4000)
      );
    };
    cycle();
    return () => {
      cancelled = true;
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [visibleLogs]);

  return (
    <div className="relative max-w-5xl mx-auto">
      <div className="absolute -inset-2 bg-gradient-to-br from-audit-secondary/40 to-audit-primary/40 rounded-3xl blur-xl opacity-40" />
      <div className="relative bg-card rounded-2xl border-2 border-audit-secondary/30 shadow-2xl overflow-hidden">
        {/* Barra de "navegador" */}
        <div className="bg-muted/60 border-b border-border px-4 py-2.5 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <div className="flex-1 max-w-md mx-auto h-7 rounded-md bg-background border border-border flex items-center px-3 text-[11px] text-muted-foreground gap-1.5">
            <Lock className="h-3 w-3" /> app.soia.com.br/dashboard/ouvidoria
          </div>
        </div>

        {/* Header do painel */}
        <div className="bg-audit-primary px-4 md:px-6 py-4 flex flex-wrap items-center gap-3">
          <div>
            <p className="font-bold text-primary-foreground text-sm md:text-base">Ouvidoria — Painel de gestão</p>
            <p className="text-[11px] text-primary-foreground/70">Empresa Demo Ltda · visão do Gestor</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Badge className="bg-primary-foreground/10 text-primary-foreground border border-primary-foreground/20 text-[10px] gap-1 hover:bg-primary-foreground/10">
              <Filter className="h-3 w-3" /> Assédio
            </Badge>
            <Badge className="bg-primary-foreground/10 text-primary-foreground border border-primary-foreground/20 text-[10px] gap-1 hover:bg-primary-foreground/10">
              <Search className="h-3 w-3" /> Todas
            </Badge>
            <Badge className="bg-audit-secondary text-audit-primary border-0 text-[10px] font-bold hover:bg-audit-secondary">
              AO VIVO
            </Badge>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 md:p-6 pb-0">
          {STATS.map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-muted/30 p-3.5 flex items-center gap-3">
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${s.tone}`}>
                <s.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-lg font-bold leading-none">{s.value}</p>
                <p className="text-[10px] text-muted-foreground mt-1 truncate">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Corpo: fila de denúncias + atividades */}
        <div className="grid md:grid-cols-5 gap-4 p-4 md:p-6">
          {/* Fila de denúncias */}
          <div className="md:col-span-3 rounded-xl border border-border bg-muted/20 p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5">
                <ShieldCheck className="h-3.5 w-3.5 text-audit-secondary" /> Fila de denúncias
              </p>
              <Badge variant="outline" className="text-[10px]">
                {REPORTS.length} casos
              </Badge>
            </div>
            <div className="space-y-2.5">
              {REPORTS.map((r) => (
                <div
                  key={r.protocol}
                  className="rounded-lg border border-border bg-card p-3 flex items-center gap-3 shadow-sm hover:border-audit-secondary/40 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-semibold">{r.protocol}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded border ${severityStyle[r.severity]}`}>
                        {r.severity === 'alta' ? 'Alta' : r.severity === 'media' ? 'Média' : 'Baixa'}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{r.category}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className={`text-[10px] px-2 py-1 rounded-full border font-semibold ${statusStyle[r.status].cls}`}>
                      {statusStyle[r.status].label}
                    </span>
                    <p className="text-[10px] text-muted-foreground mt-1">{r.time}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Mini Kanban */}
            <div className="mt-4 rounded-lg border border-border bg-card p-3">
              <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5 mb-2.5">
                <ListChecks className="h-3.5 w-3.5 text-audit-secondary" /> Tarefas do caso #OV-2026-8471
              </p>
              <div className="grid grid-cols-3 gap-2 text-[10px]">
                <div className="rounded-md bg-muted/50 p-2 space-y-1.5">
                  <p className="font-bold text-muted-foreground">A fazer · 2</p>
                  <div className="rounded bg-card border border-border p-2 shadow-sm">Revisar política interna</div>
                  <div className="rounded bg-card border border-border p-2 shadow-sm">Agendar retorno ao comitê</div>
                </div>
                <div className="rounded-md bg-muted/50 p-2 space-y-1.5">
                  <p className="font-bold text-muted-foreground">Em andamento · 1</p>
                  <div className="rounded bg-card border border-audit-secondary/40 p-2 shadow-sm">
                    Entrevistar testemunhas
                    <span className="block text-[9px] text-muted-foreground mt-1">☑ 2/4 no checklist</span>
                  </div>
                </div>
                <div className="rounded-md bg-muted/50 p-2 space-y-1.5">
                  <p className="font-bold text-muted-foreground">Concluídas · 1</p>
                  <div className="rounded bg-card border border-border p-2 shadow-sm opacity-70">
                    Coletar relatos anteriores
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Log de atividades */}
          <div className="md:col-span-2 rounded-xl border border-border bg-muted/20 p-4 flex flex-col">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground flex items-center gap-1.5 mb-3">
              <History className="h-3.5 w-3.5 text-audit-secondary" /> Log de acessos e alterações
            </p>
            <div ref={logRef} className="space-y-2.5 h-[300px] md:h-[360px] overflow-hidden">
              {LOG_FEED.slice(0, visibleLogs).map((log, i) => (
                <div
                  key={`${log.text}-${i}`}
                  className="rounded-lg border border-border bg-card p-2.5 flex gap-2.5 shadow-sm animate-fade-in"
                >
                  <div className="h-7 w-7 rounded-md bg-audit-secondary/12 flex items-center justify-center shrink-0">
                    <log.icon className="h-3.5 w-3.5 text-audit-secondary" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[11px] font-medium leading-snug">{log.text}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{log.detail}</p>
                    <p className="text-[9px] text-muted-foreground/70 mt-0.5">{log.time}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-border flex items-center gap-2 text-[10px] text-muted-foreground">
              <Users className="h-3.5 w-3.5 text-audit-secondary" />
              Equipe: 2 gestores · 1 auditor (somente leitura)
            </div>
          </div>
        </div>

        {/* Rodapé da simulação */}
        <div className="px-4 md:px-6 pb-5">
          <div className="rounded-xl bg-audit-secondary/10 border border-audit-secondary/30 px-4 py-3 flex flex-wrap items-center justify-center gap-x-6 gap-y-1.5 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Lock className="h-3 w-3 text-audit-secondary" /> O denunciante nunca vê notas, tarefas nem responsáveis
            </span>
            <span className="flex items-center gap-1.5">
              <History className="h-3 w-3 text-audit-secondary" /> Cada ação fica registrada com data e hora
            </span>
            <span className="flex items-center gap-1.5">
              <FileDown className="h-3 w-3 text-audit-secondary" /> Dossiê completo exportável em PDF
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
