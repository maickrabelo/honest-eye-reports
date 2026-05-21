import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from "recharts";
import type { DashGHE, DashRisk, DashAction } from "@/hooks/usePGRDashboardData";

const CATEGORY_LABELS: Record<string, string> = {
  fisico: 'Físico', quimico: 'Químico', biologico: 'Biológico',
  ergonomico: 'Ergonômico', acidentes: 'Acidentes', psicossocial: 'Psicossocial',
};
const LEVEL_LABELS: Record<string, string> = {
  trivial: 'Trivial', tolerable: 'Tolerável', moderate: 'Moderado',
  substantial: 'Substancial', intolerable: 'Intolerável',
};
const LEVEL_COLORS: Record<string, string> = {
  trivial: '#22c55e', tolerable: '#84cc16', moderate: '#eab308',
  substantial: '#f97316', intolerable: '#dc2626',
};
const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente', in_progress: 'Em andamento', done: 'Concluída', cancelled: 'Cancelada',
};
const STATUS_COLORS: Record<string, string> = {
  pending: '#eab308', in_progress: '#3b82f6', done: '#22c55e', cancelled: '#94a3b8',
};
const HIERARCHY_LABELS: Record<string, string> = {
  elimination: 'Eliminação', substitution: 'Substituição', engineering: 'Engenharia',
  administrative: 'Administrativa', epi: 'EPI',
};
const CATEGORY_COLORS = ['#3b82f6','#8b5cf6','#10b981','#f59e0b','#ef4444','#ec4899'];

interface Props {
  ghes: DashGHE[];
  risks: DashRisk[];
  actions: DashAction[];
  byCategory: Record<string, number>;
  byLevel: Record<string, number>;
  byStatus: Record<string, number>;
  byHierarchy: Record<string, number>;
  monthBuckets: { key: string; label: string; total: number; overdue: number }[];
}

const ChartCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Card>
    <CardHeader className="pb-2"><CardTitle className="text-sm font-semibold">{title}</CardTitle></CardHeader>
    <CardContent className="h-64">{children}</CardContent>
  </Card>
);

export const PGRCharts = ({ ghes, byCategory, byLevel, byStatus, byHierarchy, monthBuckets }: Props) => {
  const catData = Object.entries(byCategory).map(([k, v]) => ({ name: CATEGORY_LABELS[k] || k, value: v }));
  const levelData = ['trivial','tolerable','moderate','substantial','intolerable'].map(k => ({
    name: LEVEL_LABELS[k], value: byLevel[k] || 0, fill: LEVEL_COLORS[k],
  }));
  const gheData = ghes.map(g => ({ name: g.name.length > 18 ? g.name.slice(0,18)+'…' : g.name, value: g.worker_count }));
  const statusData = ['pending','in_progress','done','cancelled'].map(k => ({
    name: STATUS_LABELS[k], value: byStatus[k] || 0, fill: STATUS_COLORS[k],
  })).filter(d => d.value > 0);
  const hierData = Object.entries(HIERARCHY_LABELS).map(([k, l]) => ({ name: l, value: byHierarchy[k] || 0 }));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <ChartCard title="Riscos por categoria">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={catData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
              {catData.map((_, i) => <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Riscos por nível">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={levelData} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" allowDecimals={false} />
            <YAxis type="category" dataKey="name" width={90} />
            <Tooltip />
            <Bar dataKey="value">
              {levelData.map((d, i) => <Cell key={i} fill={d.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Trabalhadores por GHE">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={gheData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" fontSize={11} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Status do plano de ação">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={statusData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={80} paddingAngle={2}>
              {statusData.map((d, i) => <Cell key={i} fill={d.fill} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Ações por hierarquia de controle">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={hierData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" fontSize={11} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="value" fill="#8b5cf6" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>

      <ChartCard title="Ações por mês (próximos 12 meses)">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={monthBuckets}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="label" fontSize={11} />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Legend />
            <Bar dataKey="total" name="Ações" fill="#3b82f6" stackId="a" />
            <Bar dataKey="overdue" name="Atrasadas" fill="#dc2626" stackId="b" />
          </BarChart>
        </ResponsiveContainer>
      </ChartCard>
    </div>
  );
};
