import { Check, Star } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const plans = [
  {
    name: 'Starter',
    employees: '1 a 10 funcionários',
    price: 'R$ 149,90',
    period: '/mês',
    description: 'Ideal para pequenas empresas',
    popular: false,
    features: [
      'Canal de denúncias anônimo',
      'Dashboard básico',
      'Pesquisa de clima organizacional',
      'Relatórios mensais',
      'Suporte por email',
    ],
  },
  {
    name: 'Profissional',
    employees: 'Até 50 funcionários',
    price: 'R$ 199,90',
    period: '/mês',
    description: 'Para empresas em crescimento',
    popular: true,
    features: [
      'Tudo do plano Starter',
      'Dashboard avançado com IA',
      'Análise de sentimento',
      'Relatórios semanais',
      'Suporte prioritário',
      'Integração com RH',
    ],
  },
  {
    name: 'Empresarial',
    employees: 'Até 100 funcionários',
    price: 'R$ 299,90',
    period: '/mês',
    description: 'Para médias empresas',
    popular: false,
    features: [
      'Tudo do plano Profissional',
      'Multi-departamentos',
      'Gestão de SST integrada',
      'API de integração',
      'Treinamento da equipe',
      'Suporte telefônico',
    ],
  },
  {
    name: 'Corporativo',
    employees: 'Acima de 100 funcionários',
    price: 'R$ 299,90',
    period: '+ R$ 1,00/funcionário',
    description: 'Para grandes organizações',
    popular: false,
    features: [
      'Tudo do plano Empresarial',
      'Customização completa',
      'Múltiplas unidades',
      'Relatórios personalizados',
      'Gerente de conta dedicado',
      'SLA garantido',
    ],
  },
];

const PricingSection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section ref={ref} className="py-20 px-4 bg-gradient-to-b from-background to-muted/30">
      <div className="container mx-auto max-w-7xl">
        <div className={`text-center mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            Investimento
          </Badge>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Planos que cabem no seu orçamento
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Escolha o plano ideal para o tamanho da sua empresa. Todos incluem suporte completo e atualizações constantes.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, index) => (
            <Card
              key={plan.name}
              className={`relative transition-all duration-700 hover:shadow-xl hover:-translate-y-2 ${
                plan.popular 
                  ? 'border-primary shadow-lg ring-2 ring-primary/20' 
                  : 'border-border hover:border-primary/50'
              } ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
              style={{ transitionDelay: `${index * 100}ms` }}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground shadow-lg">
                    <Star className="w-3 h-3 mr-1 fill-current" />
                    Mais Popular
                  </Badge>
                </div>
              )}
              
              <CardHeader className="text-center pb-2">
                <CardTitle className="text-xl font-bold text-foreground">
                  {plan.name}
                </CardTitle>
                <p className="text-sm text-muted-foreground">{plan.employees}</p>
              </CardHeader>
              
              <CardContent className="text-center">
                <div className="mb-6">
                  <span className="text-4xl font-bold text-primary">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
                
                <p className="text-sm text-muted-foreground mb-6">{plan.description}</p>
                
                <ul className="space-y-3 text-left mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm">
                      <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <span className="text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <Button 
                  className={`w-full ${plan.popular ? '' : 'variant-outline'}`}
                  variant={plan.popular ? 'default' : 'outline'}
                >
                  Começar agora
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className={`text-center text-sm text-muted-foreground mt-8 transition-all duration-700 delay-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
          * Todos os planos incluem período de teste gratuito de 14 dias. Sem compromisso.
        </p>
      </div>
    </section>
  );
};

export default PricingSection;
