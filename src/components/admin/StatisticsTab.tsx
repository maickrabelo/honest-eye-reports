import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Users, Building2, ClipboardCheck, Activity, Brain, Flame, HeartPulse } from "lucide-react";

interface Stats {
  hseit: number;
  copsoq: number;
  burnout: number;
  climate: number;
  total: number;
  companiesWithAssessments: number;
  totalCompanies: number;
  avgPerCompany: number;
}

export default function StatisticsTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [hseit, copsoq, burnout, climate, companies, hseitA, copsoqA, burnoutA, climateA] = await Promise.all([
        supabase.from("hseit_responses" as any).select("id", { count: "exact", head: true }).not("completed_at", "is", null),
        supabase.from("copsoq_responses" as any).select("id", { count: "exact", head: true }).not("completed_at", "is", null),
        supabase.from("burnout_responses" as any).select("id", { count: "exact", head: true }).not("completed_at", "is", null),
        supabase.from("survey_responses" as any).select("id", { count: "exact", head: true }).not("completed_at", "is", null),
        supabase.from("companies").select("id", { count: "exact", head: true }),
        supabase.from("hseit_assessments" as any).select("company_id"),
        supabase.from("copsoq_assessments" as any).select("company_id"),
        supabase.from("burnout_assessments" as any).select("company_id"),
        supabase.from("climate_surveys" as any).select("company_id"),
      ]);

      const h = hseit.count || 0;
      const c = copsoq.count || 0;
      const b = burnout.count || 0;
      const cl = climate.count || 0;
      const total = h + c + b + cl;

      const companyIds = new Set<string>();
      [hseitA.data, copsoqA.data, burnoutA.data, climateA.data].forEach(arr => {
        (arr as any[] || []).forEach(r => r?.company_id && companyIds.add(r.company_id));
      });

      const totalCompanies = companies.count || 0;
      setStats({
        hseit: h,
        copsoq: c,
        burnout: b,
        climate: cl,
        total,
        companiesWithAssessments: companyIds.size,
        totalCompanies,
        avgPerCompany: companyIds.size ? Math.round(total / companyIds.size) : 0,
      });
      setUpdatedAt(new Date());
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading && !stats) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }
  if (!stats) return null;

  const cards = [
    { label: "Total de Vidas Avaliadas", value: stats.total.toLocaleString("pt-BR"), icon: Users, color: "text-primary", bg: "bg-primary/10", desc: "Soma de todas as respostas concluídas" },
    { label: "Média por Empresa", value: stats.avgPerCompany.toLocaleString("pt-BR"), icon: Activity, color: "text-blue-600", bg: "bg-blue-500/10", desc: `${stats.companiesWithAssessments} empresas com avaliações` },
    { label: "Empresas Cadastradas", value: stats.totalCompanies.toLocaleString("pt-BR"), icon: Building2, color: "text-emerald-600", bg: "bg-emerald-500/10", desc: "Total de empresas no sistema" },
    { label: "HSE-IT", value: stats.hseit.toLocaleString("pt-BR"), icon: ClipboardCheck, color: "text-indigo-600", bg: "bg-indigo-500/10", desc: "Respostas concluídas" },
    { label: "COPSOQ II", value: stats.copsoq.toLocaleString("pt-BR"), icon: Brain, color: "text-purple-600", bg: "bg-purple-500/10", desc: "Respostas concluídas" },
    { label: "Burnout", value: stats.burnout.toLocaleString("pt-BR"), icon: Flame, color: "text-orange-600", bg: "bg-orange-500/10", desc: "Respostas concluídas" },
    { label: "Clima Organizacional", value: stats.climate.toLocaleString("pt-BR"), icon: HeartPulse, color: "text-pink-600", bg: "bg-pink-500/10", desc: "Respostas concluídas" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Estatísticas Gerais</h2>
          <p className="text-sm text-muted-foreground">
            {updatedAt && `Atualizado em ${updatedAt.toLocaleString("pt-BR")}`}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
                <div className={`p-2 rounded-lg ${c.bg}`}>
                  <c.icon className={`h-4 w-4 ${c.color}`} />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{c.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{c.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumo</CardTitle>
          <CardDescription>Distribuição de participações por instrumento</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { label: "HSE-IT", value: stats.hseit, color: "bg-indigo-500" },
            { label: "COPSOQ II", value: stats.copsoq, color: "bg-purple-500" },
            { label: "Burnout", value: stats.burnout, color: "bg-orange-500" },
            { label: "Clima Organizacional", value: stats.climate, color: "bg-pink-500" },
          ].map((row) => {
            const pct = stats.total ? (row.value / stats.total) * 100 : 0;
            return (
              <div key={row.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-medium">{row.label}</span>
                  <span className="text-muted-foreground">{row.value.toLocaleString("pt-BR")} ({pct.toFixed(1)}%)</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className={`h-full ${row.color}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}
