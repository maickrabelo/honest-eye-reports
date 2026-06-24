import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { RefreshCw, Building2, Briefcase, ShoppingCart, Zap } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

type TrialSource = "all" | "soia" | "hotmart";

type TrialRow = {
  id: string;
  name: string;
  email: string | null;
  trial_ends_at: string | null;
  created_at: string;
  subscription_status: string | null;
  plan_slug?: string | null;
  provider?: string | null;
};

const fmt = (d: string | null) =>
  d ? new Date(d).toLocaleDateString("pt-BR") : "—";

const isExpired = (d: string | null) =>
  d ? new Date(d).getTime() < Date.now() : false;

const daysLeft = (d: string | null) => {
  if (!d) return null;
  const ms = new Date(d).getTime() - Date.now();
  return Math.ceil(ms / (1000 * 60 * 60 * 24));
};

const StatusBadge = ({ row }: { row: TrialRow }) => {
  if (isExpired(row.trial_ends_at)) {
    return <Badge variant="destructive">Expirado</Badge>;
  }
  const dl = daysLeft(row.trial_ends_at);
  if (dl !== null && dl <= 2) {
    return <Badge className="bg-amber-500 hover:bg-amber-600">Expira em {dl}d</Badge>;
  }
  return <Badge className="bg-emerald-600 hover:bg-emerald-700">Ativo ({dl}d)</Badge>;
};

const TrialTable = ({ rows, loading, type }: { rows: TrialRow[]; loading: boolean; type: "company" | "sst" }) => {
  if (loading) return <Skeleton className="h-64 w-full" />;
  if (!rows.length) return <p className="text-muted-foreground text-sm py-8 text-center">Nenhuma conta em período de teste.</p>;

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>{type === "company" ? "Empresa" : "Gestora SST"}</TableHead>
          <TableHead>Email</TableHead>
          <TableHead>Início do teste</TableHead>
          <TableHead>Término</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id} className={isExpired(r.trial_ends_at) ? "bg-destructive/5" : ""}>
            <TableCell className="font-medium">{r.name}</TableCell>
            <TableCell>{r.email || "—"}</TableCell>
            <TableCell>{fmt(r.created_at)}</TableCell>
            <TableCell>{fmt(r.trial_ends_at)}</TableCell>
            <TableCell><StatusBadge row={r} /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};

export default function TrialAccountsTab() {
  const [companies, setCompanies] = useState<TrialRow[]>([]);
  const [ssts, setSsts] = useState<TrialRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const [c, s] = await Promise.all([
      supabase
        .from("companies")
        .select("id,name,email,trial_ends_at,created_at,subscription_status")
        .or("subscription_status.eq.trial,trial_ends_at.not.is.null")
        .order("trial_ends_at", { ascending: false }),
      supabase
        .from("sst_managers")
        .select("id,name,email,trial_ends_at,created_at,subscription_status")
        .or("subscription_status.eq.trial,trial_ends_at.not.is.null")
        .order("trial_ends_at", { ascending: false }),
    ]);
    setCompanies((c.data || []) as TrialRow[]);
    setSsts((s.data || []) as TrialRow[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const countActive = (rows: TrialRow[]) => rows.filter((r) => !isExpired(r.trial_ends_at)).length;
  const countExpired = (rows: TrialRow[]) => rows.filter((r) => isExpired(r.trial_ends_at)).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Contas em Teste</h2>
          <p className="text-muted-foreground text-sm">Acompanhe os trials ativos e expirados.</p>
        </div>
        <Button variant="outline" size="sm" onClick={load}>
          <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Empresas ativas</p><p className="text-2xl font-bold">{countActive(companies)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Empresas expiradas</p><p className="text-2xl font-bold text-destructive">{countExpired(companies)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">SSTs ativas</p><p className="text-2xl font-bold">{countActive(ssts)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">SSTs expiradas</p><p className="text-2xl font-bold text-destructive">{countExpired(ssts)}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="companies">
        <TabsList>
          <TabsTrigger value="companies"><Building2 className="h-4 w-4 mr-2" />Empresas ({companies.length})</TabsTrigger>
          <TabsTrigger value="ssts"><Briefcase className="h-4 w-4 mr-2" />Gestoras SST ({ssts.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="companies">
          <Card><CardHeader><CardTitle className="text-base">Empresas em trial</CardTitle></CardHeader><CardContent><TrialTable rows={companies} loading={loading} type="company" /></CardContent></Card>
        </TabsContent>
        <TabsContent value="ssts">
          <Card><CardHeader><CardTitle className="text-base">Gestoras SST em trial</CardTitle></CardHeader><CardContent><TrialTable rows={ssts} loading={loading} type="sst" /></CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
