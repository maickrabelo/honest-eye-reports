import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Copy, Loader2, Receipt, CheckCircle2, AlertTriangle } from "lucide-react";

interface PlanOption {
  id: string;
  slug: string;
  name: string;
  category: string | null;
}

interface Result {
  invoiceUrl: string | null;
  planName: string;
  billingCycle: string;
  amountCents: number;
  asaasSubscriptionId: string | null;
  installmentCount?: number;
  installmentCents?: number;
  emailSent: boolean;
  emailError: string | null;
}

const cycleLabels: Record<string, string> = {
  monthly: "Mensal",
  quarterly: "Trimestral",
  annual: "Anual",
};

const brl = (cents: number) =>
  (cents / 100).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const CustomSubscriptionTab = () => {
  const [plans, setPlans] = useState<PlanOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);

  const [form, setForm] = useState({
    planSlug: "",
    billingCycle: "monthly",
    billingType: "PIX",
    installmentCount: "1",
    amount: "",
    maxCompanies: "",
    maxEmployees: "",
    name: "",
    email: "",
    cpfCnpj: "",
    phone: "",
    companyName: "",
    notes: "",
  });

  const set = (key: keyof typeof form) => (value: string) =>
    setForm((f) => ({ ...f, [key]: value }));

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from("subscription_plans")
        .select("id, slug, name, category")
        .order("name");
      setPlans((data as PlanOption[]) ?? []);
    })();
  }, []);

  const parseAmount = (value: string) =>
    Math.round((parseFloat(value.replace(/\./g, "").replace(",", ".")) || 0) * 100);

  const amountCentsPreview = parseAmount(form.amount);

  const handleSubmit = async () => {
    const amountCents = parseAmount(form.amount);

    if (!form.planSlug || !form.email || !form.name || !form.cpfCnpj || !amountCents) {
      toast({
        title: "Preencha os campos obrigatórios",
        description: "Plano, valor, nome, e-mail e CPF/CNPJ são necessários.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("create-custom-subscription", {
        body: {
          planSlug: form.planSlug,
          billingCycle: form.billingCycle,
          billingType: form.billingType,
          amountCents,
          installmentCount:
            form.billingType === "CREDIT_CARD" ? Number(form.installmentCount) : 1,
          maxCompanies: form.maxCompanies ? Number(form.maxCompanies) : null,
          maxEmployees: form.maxEmployees ? Number(form.maxEmployees) : null,
          companyName: form.companyName || undefined,
          notes: form.notes || undefined,
          customer: {
            name: form.name,
            email: form.email.trim().toLowerCase(),
            cpfCnpj: form.cpfCnpj,
            phone: form.phone || undefined,
          },
        },
      });

      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      setResult(data as Result);
      toast({
        title: "Cobrança gerada!",
        description: (data as any)?.emailSent
          ? "E-mail com o link de pagamento enviado ao cliente."
          : "Assinatura criada, mas o e-mail não pôde ser enviado.",
      });
    } catch (e) {
      toast({
        title: "Erro ao gerar cobrança",
        description: e instanceof Error ? e.message : "Erro desconhecido",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!" });
  };

  const summaryText = result
    ? `Assinatura SOIA — ${result.planName}\nRecorrência: ${cycleLabels[result.billingCycle] ?? result.billingCycle}\nValor: ${brl(result.amountCents)}${
        result.installmentCount && result.installmentCount > 1
          ? `\nParcelamento: em até ${result.installmentCount}x de ${brl(result.installmentCents ?? Math.round(result.amountCents / result.installmentCount))} sem juros (total ${brl(result.amountCents)})`
          : ""
      }\nLink de pagamento: ${result.invoiceUrl ?? "-"}`
    : "";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Receipt className="h-5 w-5 text-primary" />
            Assinatura personalizada
          </CardTitle>
          <CardDescription>
            Defina valor, recorrência e limites sob medida. A cobrança recorrente é criada no
            Asaas e o cliente recebe um e-mail com o link de pagamento.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Plano base *</Label>
              <Select value={form.planSlug} onValueChange={set("planSlug")}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o plano" />
                </SelectTrigger>
                <SelectContent>
                  {plans.map((p) => (
                    <SelectItem key={p.id} value={p.slug}>
                      {p.name}
                      {p.category ? ` — ${p.category === "manager" ? "Gestora" : "Empresa"}` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Recorrência *</Label>
              <Select value={form.billingCycle} onValueChange={set("billingCycle")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Mensal</SelectItem>
                  <SelectItem value="quarterly">Trimestral</SelectItem>
                  <SelectItem value="annual">Anual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Forma de pagamento *</Label>
              <Select value={form.billingType} onValueChange={set("billingType")}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="PIX">PIX</SelectItem>
                  <SelectItem value="BOLETO">Boleto</SelectItem>
                  <SelectItem value="CREDIT_CARD">Cartão de crédito</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {form.billingType === "CREDIT_CARD" && (
              <div className="space-y-2">
                <Label>Parcelamento no cartão</Label>
                <Select value={form.installmentCount} onValueChange={set("installmentCount")}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n === 1 ? "À vista (1x)" : `Até ${n}x sem juros`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {amountCentsPreview > 0 && Number(form.installmentCount) > 1 && (
                  <p className="text-xs text-muted-foreground">
                    {form.installmentCount}x de{" "}
                    <span className="font-medium text-foreground">
                      {brl(Math.round(amountCentsPreview / Number(form.installmentCount)))}
                    </span>{" "}
                    sem juros · total {brl(amountCentsPreview)}
                  </p>
                )}
                {Number(form.installmentCount) > 1 && (
                  <p className="text-xs text-muted-foreground">
                    Parcelado gera cobrança única no cartão (sem renovação automática).
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2">
              <Label>Valor por cobrança (R$) *</Label>
              <Input
                placeholder="899,90"
                value={form.amount}
                onChange={(e) => set("amount")(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Empresas liberadas</Label>
              <Input
                type="number"
                min={0}
                placeholder="Ex: 30"
                value={form.maxCompanies}
                onChange={(e) => set("maxCompanies")(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Vidas liberadas</Label>
              <Input
                type="number"
                min={0}
                placeholder="Ex: 500"
                value={form.maxEmployees}
                onChange={(e) => set("maxEmployees")(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Nome do responsável *</Label>
              <Input value={form.name} onChange={(e) => set("name")(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>E-mail do cliente *</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => set("email")(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>CPF/CNPJ *</Label>
              <Input value={form.cpfCnpj} onChange={(e) => set("cpfCnpj")(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Telefone</Label>
              <Input value={form.phone} onChange={(e) => set("phone")(e.target.value)} />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Nome da empresa / gestora</Label>
              <Input
                value={form.companyName}
                onChange={(e) => set("companyName")(e.target.value)}
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Observações no e-mail (opcional)</Label>
              <Textarea
                rows={3}
                value={form.notes}
                onChange={(e) => set("notes")(e.target.value)}
              />
            </div>
          </div>

          <Button onClick={handleSubmit} disabled={loading} className="w-full md:w-auto">
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Gerando cobrança...
              </>
            ) : (
              "Gerar cobrança e enviar ao cliente"
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card className="border-primary/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              Cobrança criada
            </CardTitle>
            <CardDescription>
              {result.emailSent ? (
                <span className="inline-flex items-center gap-1">
                  <Badge variant="secondary">E-mail enviado</Badge>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-destructive">
                  <AlertTriangle className="h-4 w-4" /> E-mail não enviado
                  {result.emailError ? `: ${result.emailError}` : ""}
                </span>
              )}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid gap-2 md:grid-cols-3">
              <div>
                <p className="text-muted-foreground">Plano</p>
                <p className="font-medium">{result.planName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">Recorrência</p>
                <p className="font-medium">
                  {cycleLabels[result.billingCycle] ?? result.billingCycle}
                </p>
              </div>
              <div>
                <p className="text-muted-foreground">Valor por cobrança</p>
                <p className="font-medium">{brl(result.amountCents)}</p>
                {result.installmentCount && result.installmentCount > 1 && (
                  <p className="text-xs text-muted-foreground">
                    em até {result.installmentCount}x de{" "}
                    {brl(
                      result.installmentCents ??
                        Math.round(result.amountCents / result.installmentCount),
                    )}{" "}
                    sem juros
                  </p>
                )}
              </div>
            </div>

            {result.invoiceUrl && (
              <div className="flex flex-wrap items-center gap-2">
                <Input readOnly value={result.invoiceUrl} className="flex-1 min-w-[240px]" />
                <Button variant="outline" onClick={() => copy(result.invoiceUrl!)}>
                  <Copy className="mr-2 h-4 w-4" /> Copiar link
                </Button>
                <Button variant="outline" onClick={() => copy(summaryText)}>
                  <Copy className="mr-2 h-4 w-4" /> Copiar resumo
                </Button>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              {result.asaasSubscriptionId
                ? `Assinatura Asaas: ${result.asaasSubscriptionId}.`
                : "Cobrança parcelada única no cartão (sem renovação automática)."}{" "}
              Após o pagamento confirmado, o acesso é provisionado automaticamente com os limites
              definidos.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CustomSubscriptionTab;
