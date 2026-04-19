import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Loader2, Plus, X, CreditCard, QrCode, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Cycle = 'monthly' | 'quarterly' | 'annual';
type BillingType = 'PIX' | 'BOLETO' | 'CREDIT_CARD';

interface Plan {
  id: string;
  slug: string;
  name: string;
  category: 'company' | 'manager';
  max_cnpjs: number | null;
  max_employees: number | null;
  max_companies: number | null;
  price_monthly_cents: number | null;
  price_quarterly_cents: number | null;
  price_annual_cents: number | null;
  is_custom_quote: boolean;
  features: string[];
}

const formatBRL = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const formatCNPJ = (v: string) =>
  v.replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2')
    .slice(0, 18);

const formatPhone = (v: string) =>
  v.replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .slice(0, 15);

const Checkout = () => {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const planSlug = params.get('plano');
  const initialCycle = (params.get('ciclo') as Cycle) || 'annual';

  const [plan, setPlan] = useState<Plan | null>(null);
  const [cycle, setCycle] = useState<Cycle>(initialCycle);
  const [billingType, setBillingType] = useState<BillingType>('PIX');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [cnpjs, setCnpjs] = useState<string[]>(['']);

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    cpfCnpj: '',
    companyName: '',
  });

  useEffect(() => {
    (async () => {
      if (!planSlug) {
        navigate('/');
        return;
      }
      const { data } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('slug', planSlug)
        .maybeSingle();
      if (!data) {
        toast.error('Plano não encontrado');
        navigate('/');
        return;
      }
      const formatted: Plan = {
        ...(data as any),
        features: Array.isArray((data as any).features) ? (data as any).features : [],
      };
      if (formatted.is_custom_quote) {
        const msg = `Olá! Quero contratar o plano ${formatted.name}.`;
        window.location.href = `https://wa.me/5511996029222?text=${encodeURIComponent(msg)}`;
        return;
      }
      setPlan(formatted);
      setLoading(false);
    })();
  }, [planSlug, navigate]);

  const getMonthlyPrice = () => {
    if (!plan) return 0;
    return cycle === 'annual'
      ? plan.price_annual_cents ?? 0
      : cycle === 'quarterly'
        ? plan.price_quarterly_cents ?? 0
        : plan.price_monthly_cents ?? 0;
  };
  const monthsPerCycle = cycle === 'annual' ? 12 : cycle === 'quarterly' ? 3 : 1;
  const getCycleTotal = () => getMonthlyPrice() * monthsPerCycle;

  const isCorporate = plan?.slug === 'corporate';
  const maxCnpjs = plan?.max_cnpjs ?? 1;

  const addCnpj = () => {
    if (cnpjs.length < maxCnpjs) setCnpjs([...cnpjs, '']);
  };
  const removeCnpj = (i: number) => setCnpjs(cnpjs.filter((_, idx) => idx !== i));
  const updateCnpj = (i: number, v: string) =>
    setCnpjs(cnpjs.map((c, idx) => (idx === i ? formatCNPJ(v) : c)));

  const validate = (): boolean => {
    if (!form.name.trim()) return toast.error('Informe seu nome'), false;
    if (!form.email.includes('@')) return toast.error('Email inválido'), false;
    if (form.cpfCnpj.replace(/\D/g, '').length < 11) return toast.error('CPF/CNPJ inválido'), false;
    if (plan?.category === 'company' && !form.companyName.trim())
      return toast.error('Informe o nome da empresa'), false;
    if (isCorporate) {
      const validCnpjs = cnpjs.filter((c) => c.replace(/\D/g, '').length >= 14);
      if (validCnpjs.length === 0)
        return toast.error('Informe ao menos 1 CNPJ válido'), false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!plan || !validate()) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('asaas-create-subscription', {
        body: {
          planSlug: plan.slug,
          billingCycle: cycle,
          billingType,
          customer: {
            name: form.name,
            email: form.email,
            cpfCnpj: form.cpfCnpj,
            phone: form.phone,
          },
          companyName: form.companyName || form.name,
          cnpjs: isCorporate ? cnpjs.filter((c) => c.replace(/\D/g, '').length >= 14) : [],
        },
      });
      if (error) throw error;
      if (!data?.subscriptionId) throw new Error('Resposta inválida');

      // Open Asaas invoice in new tab + redirect to success page for polling
      if (data.invoiceUrl) {
        window.open(data.invoiceUrl, '_blank');
      }
      navigate(`/checkout/sucesso?sub=${data.subscriptionId}`);
    } catch (e) {
      console.error(e);
      toast.error(e instanceof Error ? e.message : 'Erro ao processar pagamento');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || !plan) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto max-w-4xl px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <Button variant="ghost" onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          <img src="/lovable-uploads/Logo_SOIA.png" alt="SOIA" className="h-8" />
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Resumo */}
          <Card className="md:col-span-1 h-fit sticky top-4">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                {plan.name}
                <Badge>{plan.category === 'manager' ? 'Gestor' : 'Empresa'}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Ciclo de pagamento</Label>
                <RadioGroup value={cycle} onValueChange={(v) => setCycle(v as Cycle)}>
                  {(['annual', 'quarterly', 'monthly'] as Cycle[]).map((c) => {
                    const price =
                      c === 'annual'
                        ? plan.price_annual_cents
                        : c === 'quarterly'
                          ? plan.price_quarterly_cents
                          : plan.price_monthly_cents;
                    if (!price) return null;
                    const label =
                      c === 'annual' ? 'Anual (12x)' : c === 'quarterly' ? 'Trimestral (3x)' : 'Mensal';
                    return (
                      <label
                        key={c}
                        className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-muted/40"
                      >
                        <div className="flex items-center gap-2">
                          <RadioGroupItem value={c} />
                          <span className="text-sm">{label}</span>
                        </div>
                        <span className="text-sm font-semibold text-primary">{formatBRL(price)}</span>
                      </label>
                    );
                  })}
                </RadioGroup>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-muted-foreground">Total mensal</span>
                  <span className="text-2xl font-bold text-primary">{formatBRL(getPrice())}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Form */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Seus dados</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Nome completo *</Label>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>CPF ou CNPJ *</Label>
                  <Input
                    value={form.cpfCnpj}
                    onChange={(e) => setForm({ ...form, cpfCnpj: formatCNPJ(e.target.value) })}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Email *</Label>
                  <Input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: formatPhone(e.target.value) })}
                  />
                </div>
              </div>

              {plan.category === 'company' && (
                <div className="space-y-2">
                  <Label>{isCorporate ? 'Razão social principal' : 'Nome da empresa'} *</Label>
                  <Input
                    value={form.companyName}
                    onChange={(e) => setForm({ ...form, companyName: e.target.value })}
                  />
                </div>
              )}

              {isCorporate && (
                <div className="space-y-2">
                  <Label>CNPJs incluídos (até {maxCnpjs})</Label>
                  {cnpjs.map((c, i) => (
                    <div key={i} className="flex gap-2">
                      <Input
                        placeholder="00.000.000/0000-00"
                        value={c}
                        onChange={(e) => updateCnpj(i, e.target.value)}
                      />
                      {cnpjs.length > 1 && (
                        <Button variant="ghost" size="icon" onClick={() => removeCnpj(i)}>
                          <X className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  {cnpjs.length < maxCnpjs && (
                    <Button variant="outline" size="sm" onClick={addCnpj}>
                      <Plus className="w-4 h-4 mr-2" />
                      Adicionar CNPJ
                    </Button>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label>Forma de pagamento</Label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { v: 'PIX', label: 'PIX', icon: QrCode },
                    { v: 'BOLETO', label: 'Boleto', icon: FileText },
                    { v: 'CREDIT_CARD', label: 'Cartão', icon: CreditCard },
                  ].map(({ v, label, icon: Icon }) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setBillingType(v as BillingType)}
                      className={`flex flex-col items-center gap-1 p-3 border rounded-lg transition-colors ${
                        billingType === v
                          ? 'border-primary bg-primary/5 text-primary'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <Button className="w-full" size="lg" disabled={submitting} onClick={handleSubmit}>
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>Pagar {formatBRL(getPrice())}</>
                )}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Após confirmar o pagamento, suas credenciais serão enviadas por email.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
