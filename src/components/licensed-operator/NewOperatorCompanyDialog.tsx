import { useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Building2, Loader2, Plus, Receipt, Copy } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import {
  calculateOperatorPrice,
  formatBRL,
  OPERATOR_CYCLE_LABELS,
  OPERATOR_MODE_LABELS,
  OPERATOR_PLAN_LABELS,
  type OperatorBillingCycle,
  type OperatorBillingMode,
  type OperatorPlanSlug,
} from "@/lib/licensedOperatorPricing";
import { getSafeErrorMessage } from "@/lib/errorUtils";

interface Props {
  onCreated: () => void;
}

const NewOperatorCompanyDialog = ({ onCreated }: Props) => {
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState<{ invoiceUrl?: string | null; tempPassword?: string | null } | null>(null);

  const [form, setForm] = useState({
    name: "",
    cnpj: "",
    email: "",
    phone: "",
    address: "",
    employeeCount: "",
    planSlug: "ouvidoria" as OperatorPlanSlug,
    billingCycle: "monthly" as OperatorBillingCycle,
    billingMode: "direct" as OperatorBillingMode,
  });

  const price = useMemo(
    () => calculateOperatorPrice(form.planSlug, Number(form.employeeCount) || 0, form.billingCycle),
    [form.planSlug, form.employeeCount, form.billingCycle],
  );

  const reset = () => {
    setForm({
      name: "", cnpj: "", email: "", phone: "", address: "", employeeCount: "",
      planSlug: "ouvidoria", billingCycle: "monthly", billingMode: "direct",
    });
    setResult(null);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.email || !form.cnpj || !form.employeeCount) {
      toast.error("Preencha nome, CNPJ, e-mail e nº de colaboradores.");
      return;
    }
    setSaving(true);
    try {
      const { data: session } = await supabase.auth.getSession();
      const { data, error } = await supabase.functions.invoke("licensed-operator-create-company", {
        headers: { Authorization: `Bearer ${session.session?.access_token}` },
        body: {
          ...form,
          employeeCount: Number(form.employeeCount),
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast.success(
        form.billingMode === "direct"
          ? "Empresa cadastrada! Cobrança enviada por e-mail."
          : "Empresa cadastrada e acesso liberado!",
      );
      setResult({ invoiceUrl: data?.invoiceUrl, tempPassword: data?.tempPassword });
      onCreated();
    } catch (err) {
      toast.error(getSafeErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Cadastrar empresa
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            Nova empresa no seu programa
          </DialogTitle>
          <DialogDescription>
            O valor é calculado automaticamente conforme o plano, a recorrência e o número de colaboradores.
          </DialogDescription>
        </DialogHeader>

        {result ? (
          <div className="space-y-4">
            <Card className="border-primary/30 bg-primary/5">
              <CardContent className="pt-6 space-y-3 text-sm">
                <p className="font-semibold text-primary">Empresa cadastrada com sucesso!</p>
                {result.invoiceUrl && (
                  <div className="space-y-2">
                    <p className="text-muted-foreground">
                      A cobrança foi enviada por e-mail para a empresa. Link de pagamento:
                    </p>
                    <div className="flex items-center gap-2">
                      <Input readOnly value={result.invoiceUrl} />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => {
                          navigator.clipboard.writeText(result.invoiceUrl!);
                          toast.success("Link copiado!");
                        }}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                )}
                {result.tempPassword && (
                  <p className="text-muted-foreground">
                    Acesso liberado. Senha provisória enviada por e-mail:{" "}
                    <strong className="text-foreground">{result.tempPassword}</strong>
                  </p>
                )}
              </CardContent>
            </Card>
            <DialogFooter>
              <Button variant="outline" onClick={reset}>Cadastrar outra</Button>
              <Button onClick={() => setOpen(false)}>Concluir</Button>
            </DialogFooter>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2 sm:col-span-2">
                <Label>Razão social / Nome</Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>CNPJ</Label>
                <Input value={form.cnpj} onChange={(e) => setForm({ ...form, cnpj: e.target.value })} placeholder="00.000.000/0000-00" />
              </div>
              <div className="space-y-2">
                <Label>E-mail de acesso</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Telefone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Colaboradores</Label>
                <Input
                  type="number"
                  min={1}
                  value={form.employeeCount}
                  onChange={(e) => setForm({ ...form, employeeCount: e.target.value })}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Endereço</Label>
                <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Plano</Label>
                <Select value={form.planSlug} onValueChange={(v) => setForm({ ...form, planSlug: v as OperatorPlanSlug })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(OPERATOR_PLAN_LABELS).map(([slug, label]) => (
                      <SelectItem key={slug} value={slug}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Recorrência</Label>
                <Select value={form.billingCycle} onValueChange={(v) => setForm({ ...form, billingCycle: v as OperatorBillingCycle })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(OPERATOR_CYCLE_LABELS).map(([cycle, label]) => (
                      <SelectItem key={cycle} value={cycle}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Faturamento</Label>
                <Select value={form.billingMode} onValueChange={(v) => setForm({ ...form, billingMode: v as OperatorBillingMode })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {Object.entries(OPERATOR_MODE_LABELS).map(([mode, label]) => (
                      <SelectItem key={mode} value={mode}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {form.billingMode === "direct"
                    ? "A cobrança vai direto para a empresa. O acesso é liberado após o pagamento e a comissão entra na sua apuração."
                    : "O valor entra na sua fatura do dia 20 (com desconto da sua comissão) e a empresa recebe o acesso imediatamente."}
                </p>
              </div>
            </div>

            <Card className="bg-muted/40">
              <CardContent className="pt-6 space-y-2 text-sm">
                <div className="flex items-center gap-2 font-semibold">
                  <Receipt className="h-4 w-4 text-primary" />
                  Resumo do valor
                </div>
                <div className="flex justify-between"><span className="text-muted-foreground">Faixa</span><span>{price.tier}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Valor mensal</span><span className="font-bold">{formatBRL(price.monthlyCents)}</span></div>
                {form.billingCycle === "annual" && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Total anual</span>
                    <span className="font-bold">{formatBRL(price.totalChargeCents)} (12x de {formatBRL(price.installmentCents)} sem juros)</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button onClick={handleSubmit} disabled={saving} className="gap-2">
                {saving && <Loader2 className="h-4 w-4 animate-spin" />}
                {form.billingMode === "direct" ? "Cadastrar e gerar cobrança" : "Cadastrar e liberar acesso"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default NewOperatorCompanyDialog;
