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

const SourceBadge = ({ row }: { row: TrialRow }) => {
  const isHotmart = !!row.plan_slug?.toLowerCase().includes("sms") || row.provider === "hotmart";
  if (isHotmart) {
    return <Badge variant="outline" className="border-orange-500 text-orange-600"><ShoppingCart className="h-3 w-3 mr-1" /> Hotmart</Badge>;
  }
  return <Badge variant="outline" className="border-blue-500 text-blue-600"><Zap className="h-3 w-3 mr-1" /> SOIA</Badge>;
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
          <TableHead>Fonte</TableHead>
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
            <TableCell><SourceBadge row={r} /></TableCell>
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
  const [source, setSource] = useState<TrialSource>("all");

  const isHotmartRow = (row: TrialRow) =>
    !!row.plan_slug?.toLowerCase().includes("sms") || row.provider === "hotmart";

  const load = async () => {
    setLoading(true);
    const [c, s, subs, profiles] = await Promise.all([
      supabase
        .from("companies")
        .select("id,name,email,trial_ends_at,created_at,subscription_status,parent_subscription_id")
        .or("subscription_status.eq.trial,trial_ends_at.not.is.null")
        .order("trial_ends_at", { ascending: false }),
      supabase
        .from("sst_managers")
        .select("id,name,email,trial_ends_at,created_at,subscription_status")
        .or("subscription_status.eq.trial,trial_ends_at.not.is.null")
        .order("trial_ends_at", { ascending: false }),
      supabase
        .from("subscriptions")
        .select("id, owner_user_id, provider, plan_id, subscription_plans:plan_id(slug)")
        .in("status", ["trial", "trialing"]),
      supabase
        .from("profiles")
        .select("id, sst_manager_id")
        .not("sst_manager_id", "is", null),
    ]);

    const subPlanMap = new Map<string, string>();
    const subProviderMap = new Map<string, string>();
    (subs.data || []).forEach((sub: any) => {
      const slug = sub.subscription_plans?.slug as string | undefined;
      if (sub.id) {
        subPlanMap.set(sub.id, slug || "");
        subProviderMap.set(sub.id, sub.provider || "");
      }
    });

    const userPlanMap = new Map<string, string>();
    const userProviderMap = new Map<string, string>();
    (subs.data || []).forEach((sub: any) => {
      const slug = sub.subscription_plans?.slug as string | undefined;
      if (sub.owner_user_id) {
        userPlanMap.set(sub.owner_user_id, slug || "");
        userProviderMap.set(sub.owner_user_id, sub.provider || "");
      }
    });

    const sstUserMap = new Map<string, string>();
    (profiles.data || []).forEach((p: any) => {
      if (p.sst_manager_id && p.id) {
        sstUserMap.set(p.sst_manager_id, p.id);
      }
    });

    const companyRows = ((c.data || []) as any[]).map((r) => {
      const planSlug = r.parent_subscription_id ? subPlanMap.get(r.parent_subscription_id) : undefined;
      const provider = r.parent_subscription_id ? subProviderMap.get(r.parent_subscription_id) : undefined;
      return { ...r, plan_slug: planSlug || null, provider: provider || null } as TrialRow;
    });

    const sstRows = ((s.data || []) as any[]).map((r) => {
      const userId = sstUserMap.get(r.id);
      const planSlug = userId ? userPlanMap.get(userId) : undefined;
      const provider = userId ? userProviderMap.get(userId) : undefined;
      return { ...r, plan_slug: planSlug || null, provider: provider || null } as TrialRow;
    });

    setCompanies(companyRows);
    setSsts(sstRows);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const filteredCompanies = useMemo(() => {
    if (source === "all") return companies;
    if (source === "hotmart") return companies.filter(isHotmartRow);
    return companies.filter((r) => !isHotmartRow(r));
  }, [companies, source]);

  const filteredSsts = useMemo(() => {
    if (source === "all") return ssts;
    if (source === "hotmart") return ssts.filter(isHotmartRow);
    return ssts.filter((r) => !isHotmartRow(r));
  }, [ssts, source]);

  const countActive = (rows: TrialRow[]) => rows.filter((r) => !isExpired(r.trial_ends_at)).length;
  const countExpired = (rows: TrialRow[]) => rows.filter((r) => isExpired(r.trial_ends_at)).length;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold">Contas em Teste</h2>
          <p className="text-muted-foreground text-sm">Acompanhe os trials ativos e expirados.</p>
        </div>
        <div className="flex items-center gap-2">
          <ToggleGroup type="single" value={source} onValueChange={(v) => v && setSource(v as TrialSource)} size="sm">
            <ToggleGroupItem value="all" aria-label="Todos">Todos</ToggleGroupItem>
            <ToggleGroupItem value="soia" aria-label="SOIA">SOIA</ToggleGroupItem>
            <ToggleGroupItem value="hotmart" aria-label="Hotmart">Hotmart</ToggleGroupItem>
          </ToggleGroup>
          <Button variant="outline" size="sm" onClick={load}>
            <RefreshCw className="h-4 w-4 mr-2" /> Atualizar
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Empresas ativas</p><p className="text-2xl font-bold">{countActive(filteredCompanies)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">Empresas expiradas</p><p className="text-2xl font-bold text-destructive">{countExpired(filteredCompanies)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">SSTs ativas</p><p className="text-2xl font-bold">{countActive(filteredSsts)}</p></CardContent></Card>
        <Card><CardContent className="pt-6"><p className="text-xs text-muted-foreground">SSTs expiradas</p><p className="text-2xl font-bold text-destructive">{countExpired(filteredSsts)}</p></CardContent></Card>
      </div>

      <Tabs defaultValue="companies">
        <TabsList>
          <TabsTrigger value="companies"><Building2 className="h-4 w-4 mr-2" />Empresas ({filteredCompanies.length})</TabsTrigger>
          <TabsTrigger value="ssts"><Briefcase className="h-4 w-4 mr-2" />Gestoras SST ({filteredSsts.length})</TabsTrigger>
        </TabsList>
        <TabsContent value="companies">
          <Card><CardHeader><CardTitle className="text-base">Empresas em trial</CardTitle></CardHeader><CardContent><TrialTable rows={filteredCompanies} loading={loading} type="company" /></CardContent></Card>
        </TabsContent>
        <TabsContent value="ssts">
          <Card><CardHeader><CardTitle className="text-base">Gestoras SST em trial</CardTitle></CardHeader><CardContent><TrialTable rows={filteredSsts} loading={loading} type="sst" /></CardContent></Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
