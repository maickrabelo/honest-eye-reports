import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Loader2, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { supabase } from '@/integrations/supabase/client';

type Cycle = 'monthly' | 'quarterly' | 'annual';

interface Plan {
  id: string;
  slug: string;
  name: string;
  category: 'company' | 'manager';
  tier: string;
  max_companies: number | null;
  max_cnpjs: number | null;
  max_employees: number | null;
  price_monthly_cents: number | null;
  price_quarterly_cents: number | null;
  price_annual_cents: number | null;
  is_custom_quote: boolean;
  features: string[];
  roi_initial_cents: number | null;
  roi_monthly_cents: number | null;
  display_order: number;
}

const formatBRL = (cents: number) =>
  (cents / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const cycleLabels: Record<Cycle, string> = {
  monthly: 'Mensal',
  quarterly: 'Trimestral (3x)',
  annual: 'Anual (12x)',
};

const PricingSection = () => {
  const { ref, isVisible } = useScrollAnimation();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [cycle, setCycle] = useState<Cycle>('annual');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('display_order' as any);
      const formatted = (data ?? []).map((p: any) => ({
        ...p,
        features: Array.isArray(p.features) ? p.features : [],
      }));
      setPlans(formatted as Plan[]);
      setLoading(false);
    })();
  }, []);

  const getPrice = (plan: Plan): number | null => {
    if (plan.is_custom_quote) return null;
    return cycle === 'annual'
      ? plan.price_annual_cents
      : cycle === 'quarterly'
        ? plan.price_quarterly_cents
        : plan.price_monthly_cents;
  };

  const getSavings = (plan: Plan): number | null => {
    if (plan.is_custom_quote || !plan.price_monthly_cents) return null;
    if (cycle === 'monthly') return null;
    const target = cycle === 'annual' ? plan.price_annual_cents : plan.price_quarterly_cents;
    if (!target) return null;
    return Math.round(((plan.price_monthly_cents - target) / plan.price_monthly_cents) * 100);
  };

  const handleSelect = (plan: Plan) => {
    if (plan.is_custom_quote) {
      const msg = `Olá! Tenho interesse no plano ${plan.name} da SOIA.`;
      window.open(`https://wa.me/5511996029222?text=${encodeURIComponent(msg)}`, '_blank');
      return;
    }
    navigate(`/contratar?plano=${plan.slug}&ciclo=${cycle}`);
  };

  const companyPlans = plans.filter((p) => p.category === 'company');
  const managerPlans = plans.filter((p) => p.category === 'manager');

  const renderCard = (plan: Plan, idx: number, showROI = false) => {
    const price = getPrice(plan);
    const savings = getSavings(plan);
    return (
      <Card
        key={plan.id}
        className={`relative flex flex-col transition-all duration-700 hover:shadow-xl hover:-translate-y-2 border-border hover:border-primary/50 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        style={{ transitionDelay: `${idx * 80}ms` }}
      >
        {savings && savings > 0 && (
          <Badge className="absolute -top-3 right-4 bg-primary text-primary-foreground">
            Economize {savings}%
          </Badge>
        )}
        <CardHeader className="text-center pb-2">
          <CardTitle className="text-xl font-bold text-foreground">{plan.name}</CardTitle>
          <p className="text-xs text-muted-foreground">
            {plan.category === 'manager'
              ? `Até ${plan.max_companies ?? '∞'} empresas · ${plan.max_employees ? `${plan.max_employees} colab.` : 'colab. ilimitados'}`
              : plan.max_cnpjs && plan.max_cnpjs > 1
                ? `Até ${plan.max_cnpjs} CNPJs · ${plan.max_employees ?? '∞'} colab.`
                : `Até ${plan.max_employees ?? '∞'} colaboradores`}
          </p>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col text-center">
          <div className="mb-4 min-h-[80px]">
            {plan.is_custom_quote ? (
              <>
                <span className="text-2xl font-bold text-primary">Sob demanda</span>
                <p className="text-sm text-muted-foreground mt-2">Personalizado para o seu volume</p>
              </>
            ) : (
              <>
                <span className="text-3xl font-bold text-primary">{formatBRL(price ?? 0)}</span>
                <span className="text-muted-foreground text-sm">/mês</span>
                <p className="text-xs text-muted-foreground mt-1">
                  Pagamento {cycleLabels[cycle].toLowerCase()}
                </p>
              </>
            )}
          </div>

          {showROI && plan.roi_initial_cents && plan.roi_monthly_cents && (
            <div className="mb-4 p-3 rounded-lg bg-primary/5 border border-primary/20 text-left">
              <p className="text-xs font-semibold text-primary mb-1">Receita potencial</p>
              <p className="text-sm text-foreground">
                <strong>{formatBRL(plan.roi_initial_cents)}</strong> inicial<br />
                + <strong>{formatBRL(plan.roi_monthly_cents)}</strong>/mês recorrente
              </p>
              <p className="text-[10px] text-muted-foreground mt-1">Estimativa atendendo carteira completa.</p>
            </div>
          )}

          <ul className="space-y-2 text-left mb-6 flex-1">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-2 text-sm">
                <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                <span className="text-foreground">{feature}</span>
              </li>
            ))}
          </ul>

          <Button className="w-full" onClick={() => handleSelect(plan)}>
            {plan.is_custom_quote ? (
              <>
                <MessageCircle className="w-4 h-4 mr-2" />
                Falar com consultor
              </>
            ) : (
              'Contratar agora'
            )}
          </Button>
        </CardContent>
      </Card>
    );
  };

  return (
    <section ref={ref} className="py-20 px-4 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto max-w-7xl">
        <div className={`text-center mb-12 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Planos & Investimento</Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Escolha o plano ideal para você
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Para empresas que querem cuidar do seu time ou para gestores que atendem múltiplas empresas.
          </p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="company" className="w-full">
            <div className="flex flex-col items-center gap-4 mb-8">
              <TabsList className="grid grid-cols-2 w-full max-w-md">
                <TabsTrigger value="company">Para sua empresa</TabsTrigger>
                <TabsTrigger value="manager">Para gestores</TabsTrigger>
              </TabsList>

              <div className="inline-flex rounded-lg border border-border p-1 bg-card">
                {(['monthly', 'quarterly', 'annual'] as Cycle[]).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCycle(c)}
                    className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                      cycle === c
                        ? 'bg-primary text-primary-foreground'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {cycleLabels[c]}
                  </button>
                ))}
              </div>
            </div>

            <TabsContent value="company">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {companyPlans.map((plan, idx) => renderCard(plan, idx, false))}
              </div>
            </TabsContent>

            <TabsContent value="manager">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {managerPlans.map((plan, idx) => renderCard(plan, idx, true))}
              </div>
              <p className="text-center text-xs text-muted-foreground mt-6">
                Ideal para gestoras de SST, escritórios de advocacia, psicólogos e contabilidades.
              </p>
            </TabsContent>
          </Tabs>
        )}

        <div className={`text-center mt-12 space-y-3 transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          <Button
            size="lg"
            variant="outline"
            onClick={() => window.open('https://wa.me/5511996029222?text=Olá! Gostaria de uma demonstração da SOIA.', '_blank')}
          >
            Solicitar demonstração
          </Button>
          <p className="text-sm text-muted-foreground">Fale com nosso time pelo WhatsApp.</p>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
