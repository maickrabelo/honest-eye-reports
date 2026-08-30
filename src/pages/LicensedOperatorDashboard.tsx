import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  ArrowLeft, Building2, DollarSign, FileText, Handshake, Image as ImageIcon,
  Loader2, MessageSquareWarning, Percent, ShieldCheck, TrendingUp,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRealAuth } from "@/contexts/RealAuthContext";
import EmbeddedDashboard from "@/components/EmbeddedDashboard";
import NewOperatorCompanyDialog from "@/components/licensed-operator/NewOperatorCompanyDialog";
import RequestManagementDialog, { type ManagementStatus } from "@/components/licensed-operator/RequestManagementDialog";
import { formatBRL, OPERATOR_PLAN_LABELS } from "@/lib/licensedOperatorPricing";
import usePageSEO from "@/hooks/usePageSEO";
import { toast } from "sonner";
import { getSafeErrorMessage } from "@/lib/errorUtils";

interface OperatorCompany {
  id: string;
  company_id: string;
  plan_slug: string;
  employee_count: number;
  billing_cycle: string;
  billing_mode: string;
  monthly_amount_cents: number;
  payment_status: string;
  invoice_url: string | null;
  companies?: { name: string; slug: string | null; logo_url: string | null } | null;
}

interface OperatorInvoice {
  id: string;
  reference_month: string;
  period_start: string;
  period_end: string;
  gross_cents: number;
  discount_cents: number;
  commission_credit_cents: number;
  total_cents: number;
  status: string;
  invoice_url: string | null;
}

const statusBadge = (status: string) => {
  switch (status) {
    case "paid":
      return <Badge className="bg-green-600">Pago</Badge>;
    case "overdue":
      return <Badge variant="destructive">Pagamento em atraso</Badge>;
    case "billed_to_operator":
      return <Badge className="bg-blue-600">Faturado ao licenciado</Badge>;
    case "canceled":
      return <Badge variant="outline">Cancelado</Badge>;
    default:
      return <Badge variant="secondary">Aguardando pagamento</Badge>;
  }
};

const LicensedOperatorDashboard = () => {
  const { user, isLoading: authLoading } = useRealAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [operator, setOperator] = useState<any>(null);
  const [companies, setCompanies] = useState<OperatorCompany[]>([]);
  const [invoices, setInvoices] = useState<OperatorInvoice[]>([]);
  const [invoiceItems, setInvoiceItems] = useState<Record<string, any[]>>({});
  const [selectedCompanySlug, setSelectedCompanySlug] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [mgmtStatus, setMgmtStatus] = useState<Record<string, ManagementStatus>>({});
  const [dialogCompany, setDialogCompany] = useState<OperatorCompany | null>(null);

  usePageSEO({
    title: "Painel do Parceiro Licenciado | SOIA",
    description: "Gerencie suas empresas de ouvidoria, faturamento e comissões no programa de parceria SOIA.",
  });

  const loadData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: op } = await supabase
        .from("licensed_operators")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      setOperator(op);
      if (!op) return;

      const [companiesRes, invoicesRes] = await Promise.all([
        supabase
          .from("licensed_operator_companies")
          .select("*, companies(name, slug, logo_url)")
          .eq("operator_id", op.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("licensed_operator_invoices")
          .select("*")
          .eq("operator_id", op.id)
          .order("period_end", { ascending: false }),
      ]);

      setCompanies((companiesRes.data as any) ?? []);
      const invs = (invoicesRes.data as any) ?? [];
      setInvoices(invs);

      const { data: reqs } = await supabase
        .from("licensed_operator_management_requests")
        .select("company_id, status")
        .eq("operator_id", op.id);
      const statusMap: Record<string, ManagementStatus> = {};
      (reqs ?? []).forEach((r: any) => {
        statusMap[r.company_id] = r.status as ManagementStatus;
      });
      setMgmtStatus(statusMap);



      if (invs.length) {
        const { data: items } = await supabase
          .from("licensed_operator_invoice_items")
          .select("*")
          .in("invoice_id", invs.map((i: any) => i.id));
        const grouped: Record<string, any[]> = {};
        (items ?? []).forEach((it: any) => {
          grouped[it.invoice_id] = [...(grouped[it.invoice_id] ?? []), it];
        });
        setInvoiceItems(grouped);
      }
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      navigate("/auth");
      return;
    }
    loadData();
  }, [authLoading, user, loadData, navigate]);

  const totals = useMemo(() => {
    const rate = Number(operator?.commission_rate ?? 0) / 100;
    let commissionReceivable = 0;
    let operatorDue = 0;
    let overdue = 0;
    let monthlyVolume = 0;

    companies.forEach((c) => {
      if (!c.monthly_amount_cents) return;
      monthlyVolume += c.monthly_amount_cents;
      if (c.billing_mode === "direct") {
        if (c.payment_status === "paid") commissionReceivable += Math.round(c.monthly_amount_cents * rate);
        if (c.payment_status === "overdue") overdue += 1;
      } else {
        operatorDue += c.monthly_amount_cents - Math.round(c.monthly_amount_cents * rate);
      }
    });

    return {
      commissionReceivable,
      operatorDue,
      overdue,
      monthlyVolume,
      netToPay: Math.max(0, operatorDue - commissionReceivable),
      netToReceive: Math.max(0, commissionReceivable - operatorDue),
    };
  }, [companies, operator]);

  const handleLogoUpload = async (file: File) => {
    if (!operator) return;
    setUploading(true);
    try {
      const path = `licensed-operators/${operator.id}-${Date.now()}-${file.name}`;
      const { error: upErr } = await supabase.storage.from("company-logos").upload(path, file, { upsert: true });
      if (upErr) throw upErr;
      const { data: pub } = supabase.storage.from("company-logos").getPublicUrl(path);
      const { error } = await supabase
        .from("licensed_operators")
        .update({ logo_url: pub.publicUrl })
        .eq("id", operator.id);
      if (error) throw error;
      if (operator.sst_manager_id) {
        await supabase.from("sst_managers").update({ logo_url: pub.publicUrl }).eq("id", operator.sst_manager_id);
      }
      toast.success("Logo atualizada! Ela aparece junto à logo SOIA nos painéis.");
      loadData();
    } catch (err) {
      toast.error(getSafeErrorMessage(err));
    } finally {
      setUploading(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!operator) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow flex items-center justify-center p-6">
          <Card className="max-w-md">
            <CardHeader>
              <CardTitle>Acesso não disponível</CardTitle>
              <CardDescription>
                Sua conta não está vinculada a um Parceiro Licenciado SOIA. Fale com o time comercial.
              </CardDescription>
            </CardHeader>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  if (selectedCompanySlug) {
    return (
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <main className="flex-grow bg-muted/30">
          <div className="audit-container py-6">
            <Button variant="ghost" className="gap-2 mb-4" onClick={() => setSelectedCompanySlug(null)}>
              <ArrowLeft className="h-4 w-4" />
              Voltar para minhas empresas
            </Button>
            <EmbeddedDashboard companyId={selectedCompanySlug} />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow bg-muted/30">
        <div className="bg-gradient-to-br from-primary to-primary/80 text-primary-foreground">
          <div className="audit-container py-10">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <Badge className="bg-white/15 text-primary-foreground border-none mb-3">Parceiro Licenciado SOIA</Badge>
                <h1 className="text-3xl font-bold">{operator.nome_fantasia || operator.razao_social}</h1>
                <p className="text-primary-foreground/80 mt-1">
                  Canal de Ouvidoria para sua carteira · comissão de {operator.commission_rate}%
                </p>
              </div>
              <div className="flex items-center gap-3">
                {operator.logo_url && (
                  <img src={operator.logo_url} alt="Sua logo" className="h-12 bg-white rounded-lg p-2 object-contain" />
                )}
                <label className="cursor-pointer">
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => e.target.files?.[0] && handleLogoUpload(e.target.files[0])}
                  />
                  <span className="inline-flex items-center gap-2 rounded-md bg-white/15 px-3 py-2 text-sm font-medium hover:bg-white/25 transition-colors">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                    {operator.logo_url ? "Trocar logo" : "Enviar logo"}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="audit-container py-8 space-y-8">
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm text-muted-foreground">Empresas ativas</CardTitle>
                <Building2 className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{companies.length}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm text-muted-foreground">Volume mensal SOIA</CardTitle>
                <TrendingUp className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold">{formatBRL(totals.monthlyVolume)}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm text-muted-foreground">Comissão a receber</CardTitle>
                <Percent className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent><div className="text-2xl font-bold text-green-600">{formatBRL(totals.commissionReceivable)}</div></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm text-muted-foreground">A pagar no dia 20</CardTitle>
                <DollarSign className="h-4 w-4 text-primary" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatBRL(totals.netToPay)}</div>
                {totals.netToReceive > 0 && (
                  <p className="text-xs text-green-600 mt-1">Crédito de {formatBRL(totals.netToReceive)} a seu favor</p>
                )}
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="empresas">
            <TabsList>
              <TabsTrigger value="empresas" className="gap-2"><MessageSquareWarning className="h-4 w-4" />Ouvidorias</TabsTrigger>
              <TabsTrigger value="programa" className="gap-2"><Handshake className="h-4 w-4" />Programa de Parceria</TabsTrigger>
              <TabsTrigger value="comissoes" className="gap-2"><FileText className="h-4 w-4" />Minhas Comissões</TabsTrigger>
            </TabsList>

            <TabsContent value="empresas" className="mt-6">
              {companies.length === 0 ? (
                <Card><CardContent className="py-12 text-center text-muted-foreground">
                  Nenhuma empresa cadastrada ainda. Use a aba “Programa de Parceria”.
                </CardContent></Card>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {companies.map((c) => (
                    <Card
                      key={c.id}
                      className="cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all"
                      onClick={() => setDialogCompany(c)}
                    >
                      <div className="h-24 bg-gradient-to-br from-primary/5 to-secondary/5 flex items-center justify-center p-4">
                        {c.companies?.logo_url ? (
                          <img src={c.companies.logo_url} alt={`Logo ${c.companies?.name}`} className="max-h-full object-contain" />
                        ) : (
                          <span className="text-3xl font-bold text-primary/30">
                            {(c.companies?.name ?? "??").substring(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">{c.companies?.name}</CardTitle>
                        <CardDescription>
                          {OPERATOR_PLAN_LABELS[c.plan_slug as "ouvidoria"] ?? c.plan_slug} · {c.employee_count} colaboradores
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between">
                          {statusBadge(c.payment_status)}
                          <span className="text-sm font-semibold">{formatBRL(c.monthly_amount_cents)}/mês</span>
                        </div>
                        {mgmtStatus[c.company_id] === "active" ? (
                          <Badge className="bg-green-600 gap-1"><ShieldCheck className="h-3 w-3" />Gerenciamento ativo</Badge>
                        ) : mgmtStatus[c.company_id] === "pending" ? (
                          <Badge variant="secondary">Aguardando autorização</Badge>
                        ) : (
                          <Badge variant="outline">Solicitar gerenciamento</Badge>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="programa" className="mt-6 space-y-6">
              <Card>
                <CardHeader className="flex flex-row items-start justify-between gap-4">
                  <div>
                    <CardTitle>Empresas e valores pagos à SOIA</CardTitle>
                    <CardDescription>
                      Cadastre novas empresas, escolha o plano de ouvidoria e defina quem recebe a cobrança.
                    </CardDescription>
                  </div>
                  <NewOperatorCompanyDialog onCreated={loadData} />
                </CardHeader>
                <CardContent className="p-0">
                  {companies.length === 0 ? (
                    <p className="p-6 text-muted-foreground text-sm">Nenhuma empresa cadastrada.</p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Empresa</TableHead>
                          <TableHead>Plano</TableHead>
                          <TableHead>Colab.</TableHead>
                          <TableHead>Faturamento</TableHead>
                          <TableHead>Valor mensal</TableHead>
                          <TableHead>Situação</TableHead>
                          <TableHead />
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {companies.map((c) => (
                          <TableRow key={c.id}>
                            <TableCell className="font-medium">{c.companies?.name}</TableCell>
                            <TableCell>{OPERATOR_PLAN_LABELS[c.plan_slug as "ouvidoria"] ?? c.plan_slug}</TableCell>
                            <TableCell>{c.employee_count}</TableCell>
                            <TableCell className="text-sm">
                              {c.billing_mode === "direct" ? "Direto para a empresa" : "Para o licenciado"}
                              <span className="text-muted-foreground"> · {c.billing_cycle === "annual" ? "Anual" : "Mensal"}</span>
                            </TableCell>
                            <TableCell className="font-semibold">{formatBRL(c.monthly_amount_cents)}</TableCell>
                            <TableCell>{statusBadge(c.payment_status)}</TableCell>
                            <TableCell className="text-right">
                              {c.invoice_url && (
                                <a href={c.invoice_url} target="_blank" rel="noreferrer">
                                  <Button variant="outline" size="sm">Cobrança</Button>
                                </a>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-muted/40">
                <CardContent className="pt-6 text-sm text-muted-foreground space-y-2">
                  <p><strong className="text-foreground">Faturamento direto para a empresa:</strong> a cobrança vai no valor cheio do plano para o cliente final. Sua comissão de {operator.commission_rate}% é apurada apenas quando a empresa paga.</p>
                  <p><strong className="text-foreground">Faturamento para o licenciado:</strong> o acesso é liberado na hora e o valor entra na sua fatura do dia 20 já com {operator.commission_rate}% de desconto.</p>
                  <p><strong className="text-foreground">Encontro de contas:</strong> no dia 20 as comissões a receber são abatidas do que você deve à SOIA, e o detalhamento chega por e-mail com o link de pagamento.</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comissoes" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Apuração do mês em andamento</CardTitle>
                  <CardDescription>Fechamento no dia 20 · comissão de {operator.commission_rate}%</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-4 sm:grid-cols-3 text-sm">
                  <div className="rounded-lg border p-4">
                    <p className="text-muted-foreground">Comissões a receber (pagas)</p>
                    <p className="text-xl font-bold text-green-600">{formatBRL(totals.commissionReceivable)}</p>
                  </div>
                  <div className="rounded-lg border p-4">
                    <p className="text-muted-foreground">Devido à SOIA (já com desconto)</p>
                    <p className="text-xl font-bold">{formatBRL(totals.operatorDue)}</p>
                  </div>
                  <div className="rounded-lg border p-4 bg-primary/5">
                    <p className="text-muted-foreground">Saldo previsto no dia 20</p>
                    <p className="text-xl font-bold">
                      {totals.netToReceive > 0 ? `+ ${formatBRL(totals.netToReceive)}` : formatBRL(totals.netToPay)}
                    </p>
                  </div>
                  {totals.overdue > 0 && (
                    <p className="sm:col-span-3 text-destructive">
                      {totals.overdue} empresa(s) com pagamento em atraso — a comissão só é contabilizada após o pagamento.
                    </p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Faturas fechadas</CardTitle>
                  <CardDescription>Detalhamento completo de cada fechamento</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {invoices.length === 0 ? (
                    <p className="text-sm text-muted-foreground">Nenhuma fatura fechada ainda.</p>
                  ) : (
                    invoices.map((inv) => (
                      <div key={inv.id} className="rounded-lg border">
                        <div className="flex flex-wrap items-center justify-between gap-3 p-4 border-b bg-muted/30">
                          <div>
                            <p className="font-semibold">Referência {inv.reference_month}</p>
                            <p className="text-xs text-muted-foreground">
                              {new Date(inv.period_start).toLocaleDateString("pt-BR")} a {new Date(inv.period_end).toLocaleDateString("pt-BR")}
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="font-bold">{formatBRL(inv.total_cents)}</span>
                            {inv.status === "paid" ? (
                              <Badge className="bg-green-600">Paga</Badge>
                            ) : inv.status === "credit" ? (
                              <Badge className="bg-blue-600">Sem valor a pagar</Badge>
                            ) : inv.status === "overdue" ? (
                              <Badge variant="destructive">Em atraso</Badge>
                            ) : (
                              <Badge variant="secondary">Aberta</Badge>
                            )}
                            {inv.invoice_url && inv.status !== "paid" && (
                              <a href={inv.invoice_url} target="_blank" rel="noreferrer">
                                <Button size="sm">Pagar</Button>
                              </a>
                            )}
                          </div>
                        </div>
                        <Table>
                          <TableBody>
                            {(invoiceItems[inv.id] ?? []).map((item) => (
                              <TableRow key={item.id}>
                                <TableCell className="text-sm">{item.description}</TableCell>
                                <TableCell className={`text-right font-medium ${item.amount_cents < 0 ? "text-green-600" : ""}`}>
                                  {item.amount_cents < 0 ? "- " : ""}{formatBRL(Math.abs(item.amount_cents))}
                                </TableCell>
                              </TableRow>
                            ))}
                            <TableRow className="bg-muted/40">
                              <TableCell className="font-semibold">Total</TableCell>
                              <TableCell className="text-right font-bold">{formatBRL(inv.total_cents)}</TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <RequestManagementDialog
          open={!!dialogCompany}
          onOpenChange={(o) => !o && setDialogCompany(null)}
          company={dialogCompany}
          status={dialogCompany ? (mgmtStatus[dialogCompany.company_id] ?? "none") : "none"}
          onRequested={() => {
            setDialogCompany(null);
            loadData();
          }}
          onOpenDashboard={() => {
            if (dialogCompany?.companies?.slug) setSelectedCompanySlug(dialogCompany.companies.slug);
            setDialogCompany(null);
          }}
        />
      </main>
      <Footer />
    </div>
  );
};

export default LicensedOperatorDashboard;
