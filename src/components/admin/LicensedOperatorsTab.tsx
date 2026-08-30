import { useCallback, useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Handshake, Loader2, Plus, RefreshCw, Receipt, Copy } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getSafeErrorMessage } from "@/lib/errorUtils";
import { formatBRL } from "@/lib/licensedOperatorPricing";

interface Operator {
  id: string;
  razao_social: string;
  nome_fantasia: string | null;
  email: string;
  cnpj: string | null;
  commission_rate: number;
  status: string;
  logo_url: string | null;
  sst_manager_id: string | null;
}

const LicensedOperatorsTab = () => {
  const [loading, setLoading] = useState(true);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [counts, setCounts] = useState<Record<string, { companies: number; monthly: number }>>({});
  const [saving, setSaving] = useState(false);
  const [closing, setClosing] = useState(false);
  const [open, setOpen] = useState(false);
  const [credentials, setCredentials] = useState<{ email: string; tempPassword: string } | null>(null);
  const [form, setForm] = useState({
    razaoSocial: "", nomeFantasia: "", cnpj: "", email: "", phone: "",
    enderecoCompleto: "", commissionRate: "20", maxCompanies: "100",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from("licensed_operators")
        .select("*")
        .order("created_at", { ascending: false });
      const ops = (data as any as Operator[]) ?? [];
      setOperators(ops);

      if (ops.length) {
        const { data: comps } = await supabase
          .from("licensed_operator_companies")
          .select("operator_id, monthly_amount_cents, active");
        const agg: Record<string, { companies: number; monthly: number }> = {};
        (comps ?? []).forEach((c: any) => {
          if (!c.active) return;
          agg[c.operator_id] = {
            companies: (agg[c.operator_id]?.companies ?? 0) + 1,
            monthly: (agg[c.operator_id]?.monthly ?? 0) + (c.monthly_amount_cents ?? 0),
          };
        });
        setCounts(agg);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const invokeAdmin = async (body: Record<string, unknown>) => {
    const { data: session } = await supabase.auth.getSession();
    const { data, error } = await supabase.functions.invoke("admin-manage-licensed-operator", {
      headers: { Authorization: `Bearer ${session.session?.access_token}` },
      body,
    });
    if (error) throw error;
    if (data?.error) throw new Error(data.error);
    return data;
  };

  const handleCreate = async () => {
    if (!form.razaoSocial || !form.email || !form.cnpj) {
      toast.error("Razão social, CNPJ e e-mail são obrigatórios.");
      return;
    }
    setSaving(true);
    try {
      const data = await invokeAdmin({
        action: "create",
        ...form,
        commissionRate: Number(form.commissionRate),
        maxCompanies: Number(form.maxCompanies),
      });
      setCredentials(data?.credentials ?? null);
      toast.success("Parceiro licenciado criado!");
      load();
    } catch (err) {
      toast.error(getSafeErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  const updateOperator = async (operatorId: string, patch: Record<string, unknown>) => {
    try {
      await invokeAdmin({ action: "update", operatorId, ...patch });
      toast.success("Parceiro atualizado.");
      load();
    } catch (err) {
      toast.error(getSafeErrorMessage(err));
    }
  };

  const closeInvoices = async (operatorId?: string) => {
    setClosing(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("licensed-operator-close-invoices", {
        headers: { Authorization: `Bearer ${session.session?.access_token}` },
        body: operatorId ? { operatorId } : {},
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Fechamento concluído (${data?.results?.length ?? 0} parceiro(s)).`);
    } catch (err) {
      toast.error(getSafeErrorMessage(err));
    } finally {
      setClosing(false);
    }
  };

  const seedDemo = async () => {
    setSeeding(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("seed-licensed-operator-demo", {
        headers: { Authorization: `Bearer ${session.session?.access_token}` },
        body: {},
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setCredentials({ email: data.operator.email, tempPassword: data.operator.password });
      setOpen(true);
      toast.success(`Parceiro demo criado com ${data.companies?.length ?? 0} empresas.`);
      load();
    } catch (err) {
      toast.error(getSafeErrorMessage(err));
    } finally {
      setSeeding(false);
    }
  };


  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4 flex-wrap">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Handshake className="h-5 w-5 text-primary" />
              Parceiros Licenciados
            </CardTitle>
            <CardDescription>
              Gestores exclusivos do módulo de Ouvidoria, com marca própria e comissionamento configurável.
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="gap-2" onClick={() => closeInvoices()} disabled={closing}>
              {closing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Receipt className="h-4 w-4" />}
              Fechar faturas do mês (dia 20)
            </Button>
            <Button variant="ghost" size="icon" onClick={load}><RefreshCw className="h-4 w-4" /></Button>
            <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setCredentials(null); }}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="h-4 w-4" />Novo parceiro</Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Novo Parceiro Licenciado</DialogTitle>
                  <DialogDescription>
                    Cria o acesso, a marca e o vínculo comercial. A senha provisória é o CNPJ informado.
                  </DialogDescription>
                </DialogHeader>

                {credentials ? (
                  <div className="space-y-3 text-sm">
                    <p className="font-semibold text-primary">Parceiro criado com sucesso!</p>
                    <div className="rounded-lg border p-4 space-y-2">
                      <p><strong>Usuário:</strong> {credentials.email}</p>
                      <p><strong>Senha provisória:</strong> {credentials.tempPassword}</p>
                    </div>
                    <Button
                      variant="outline"
                      className="gap-2"
                      onClick={() => {
                        navigator.clipboard.writeText(`Acesso: https://soia.app.br/auth\nUsuário: ${credentials.email}\nSenha: ${credentials.tempPassword}`);
                        toast.success("Credenciais copiadas!");
                      }}
                    >
                      <Copy className="h-4 w-4" />Copiar credenciais
                    </Button>
                    <DialogFooter>
                      <Button onClick={() => setOpen(false)}>Concluir</Button>
                    </DialogFooter>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Razão social</Label>
                        <Input value={form.razaoSocial} onChange={(e) => setForm({ ...form, razaoSocial: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Nome fantasia</Label>
                        <Input value={form.nomeFantasia} onChange={(e) => setForm({ ...form, nomeFantasia: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>CNPJ</Label>
                        <Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>E-mail de acesso</Label>
                        <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Telefone</Label>
                        <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
                      </div>
                      <div className="space-y-2 sm:col-span-2">
                        <Label>Endereço</Label>
                        <Input value={form.enderecoCompleto} onChange={(e) => setForm({ ...form, enderecoCompleto: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Comissão (%)</Label>
                        <Input type="number" min={0} max={100} value={form.commissionRate} onChange={(e) => setForm({ ...form, commissionRate: e.target.value })} />
                      </div>
                      <div className="space-y-2">
                        <Label>Limite de empresas</Label>
                        <Input type="number" min={1} value={form.maxCompanies} onChange={(e) => setForm({ ...form, maxCompanies: e.target.value })} />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                      <Button onClick={handleCreate} disabled={saving} className="gap-2">
                        {saving && <Loader2 className="h-4 w-4 animate-spin" />}Criar parceiro
                      </Button>
                    </DialogFooter>
                  </div>
                )}
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
          ) : operators.length === 0 ? (
            <p className="p-6 text-sm text-muted-foreground">Nenhum parceiro licenciado cadastrado.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Parceiro</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>Empresas</TableHead>
                  <TableHead>Volume mensal</TableHead>
                  <TableHead>Comissão</TableHead>
                  <TableHead>Situação</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {operators.map((op) => (
                  <TableRow key={op.id}>
                    <TableCell className="font-medium">{op.nome_fantasia || op.razao_social}</TableCell>
                    <TableCell className="text-sm">{op.email}</TableCell>
                    <TableCell>{counts[op.id]?.companies ?? 0}</TableCell>
                    <TableCell>{formatBRL(counts[op.id]?.monthly ?? 0)}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        className="w-20"
                        defaultValue={op.commission_rate}
                        onBlur={(e) => {
                          const value = Number(e.target.value);
                          if (value !== Number(op.commission_rate)) updateOperator(op.id, { commissionRate: value });
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Select value={op.status} onValueChange={(v) => updateOperator(op.id, { status: v })}>
                        <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Ativo</SelectItem>
                          <SelectItem value="suspended">Suspenso</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" onClick={() => closeInvoices(op.id)} disabled={closing}>
                        Fechar fatura
                      </Button>
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
          <p>Preços automáticos do programa: <strong className="text-foreground">Mensal</strong> R$ 149 (até 50 vidas), R$ 199 (até 100) ou R$ 1,80/vida acima de 100.</p>
          <p><strong className="text-foreground">Anual (12x sem juros)</strong>: R$ 99/mês (até 50), R$ 149/mês (até 100) ou R$ 1,40/vida acima de 100.</p>
          <p>O plano Ouvidoria Smart aplica 70% da tabela acima.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default LicensedOperatorsTab;
