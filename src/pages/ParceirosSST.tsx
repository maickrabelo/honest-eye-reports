import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import {
  ShieldCheck,
  TrendingUp,
  Handshake,
  Calculator,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Loader2,
  Building2,
  HardHat,
  Repeat,
  Wallet,
  BadgeCheck,
  Users,
  MessageSquare,
  Rocket,
  FileSearch,
  ScrollText,
  AlertTriangle,
  KanbanSquare,
  UserCog,
  Brain,
  ClipboardList,
  GraduationCap,
  BarChart3,
  LayoutDashboard,
  FileDown,
} from 'lucide-react';
import usePageSEO from '@/hooks/usePageSEO';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { fbqTrack } from '@/lib/metaPixel';

const logoSoia = '/lovable-uploads/Logo_SOIA.png';

const COMMISSION_RATE = 0.3;

const SST_PLANS = [
  { slug: 'gestor_basic', label: 'Gestor Basic', monthly: 799.9, maxCompanies: 10 },
  { slug: 'gestor_pro', label: 'Gestor Pro', monthly: 899.9, maxCompanies: 30 },
  { slug: 'gestor_master', label: 'Gestor Master', monthly: 1499.9, maxCompanies: null as number | null },
];

const brl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 });

function CommissionSimulator() {
  const [gestoras, setGestoras] = useState(5);
  const [companiesPerGestora, setCompaniesPerGestora] = useState(8);
  const [planSlug, setPlanSlug] = useState('gestor_basic');
  const [customMonthly, setCustomMonthly] = useState<number | null>(null);

  const plan = SST_PLANS.find((p) => p.slug === planSlug) ?? SST_PLANS[0];
  const monthlyPerGestora = customMonthly ?? plan.monthly;

  const result = useMemo(() => {
    const mrr = monthlyPerGestora * gestoras;
    const monthlyCommission = mrr * COMMISSION_RATE;
    return {
      mrr,
      monthlyCommission,
      annualCommission: monthlyCommission * 12,
      totalCompanies: gestoras * companiesPerGestora,
    };
  }, [gestoras, companiesPerGestora, monthlyPerGestora]);

  return (
    <Card className="border-2 border-audit-secondary/40 bg-card shadow-2xl">
      <CardContent className="p-6 md:p-8 space-y-8">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-audit-secondary/15 flex items-center justify-center">
            <Calculator className="h-6 w-6 text-audit-secondary" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Simulador de comissões — 30% da carteira</h3>
            <p className="text-sm text-muted-foreground">
              Simule quantas Gestoras de SST você indica e quantas empresas cada uma gerencia.
            </p>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-semibold">Gestoras de SST indicadas</Label>
              <span className="text-lg font-bold text-audit-secondary">{gestoras}</span>
            </div>
            <Slider
              value={[gestoras]}
              min={1}
              max={50}
              step={1}
              onValueChange={(v) => setGestoras(v[0])}
              aria-label="Quantidade de gestoras SST"
            />
            <Input
              type="number"
              min={1}
              value={gestoras}
              onChange={(e) => setGestoras(Math.max(1, Number(e.target.value) || 1))}
              className="h-10"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-semibold">Empresas geridas por gestora</Label>
              <span className="text-lg font-bold text-audit-secondary">{companiesPerGestora}</span>
            </div>
            <Slider
              value={[companiesPerGestora]}
              min={1}
              max={60}
              step={1}
              onValueChange={(v) => setCompaniesPerGestora(v[0])}
              aria-label="Empresas geridas por gestora"
            />
            <Input
              type="number"
              min={1}
              value={companiesPerGestora}
              onChange={(e) => setCompaniesPerGestora(Math.max(1, Number(e.target.value) || 1))}
              className="h-10"
            />
          </div>
        </div>

        <div className="space-y-3">
          <Label className="font-semibold">Plano médio das gestoras</Label>
          <div className="grid gap-2 sm:grid-cols-3">
            {SST_PLANS.map((p) => (
              <button
                key={p.slug}
                type="button"
                onClick={() => {
                  setPlanSlug(p.slug);
                  setCustomMonthly(null);
                }}
                className={`rounded-xl border-2 p-4 text-left transition-all ${
                  planSlug === p.slug && customMonthly === null
                    ? 'border-audit-secondary bg-audit-secondary/10 shadow-sm'
                    : 'border-border bg-card hover:border-audit-secondary/40'
                }`}
              >
                <p className="font-bold text-sm">{p.label}</p>
                <p className="text-xs text-muted-foreground">
                  {p.maxCompanies ? `até ${p.maxCompanies} empresas` : 'empresas ilimitadas'}
                </p>
                <p className="text-sm font-semibold mt-1 text-audit-secondary">
                  {brl(p.monthly)}/mês{p.slug === 'gestor_master' ? '*' : ''}
                </p>
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <Label htmlFor="customMonthly" className="text-xs text-muted-foreground whitespace-nowrap">
              Ou informe a mensalidade média:
            </Label>
            <Input
              id="customMonthly"
              type="number"
              min={1}
              step="0.01"
              placeholder={plan.monthly.toFixed(2)}
              value={customMonthly ?? ''}
              onChange={(e) => setCustomMonthly(e.target.value ? Math.max(1, Number(e.target.value)) : null)}
              className="h-9 w-40"
            />
          </div>
        </div>

        <div className="rounded-xl border bg-muted/40 p-5 grid gap-4 sm:grid-cols-3 text-center">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Mensalidade por gestora</p>
            <p className="text-xl font-bold">{brl(monthlyPerGestora)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Empresas sob gestão</p>
            <p className="text-xl font-bold">{result.totalCompanies}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Receita mensal da carteira (MRR)</p>
            <p className="text-xl font-bold">{brl(result.mrr)}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-audit-primary text-primary-foreground p-6 text-center shadow-lg">
          <p className="text-sm font-medium text-audit-secondary">30% de comissão recorrente</p>
          <p className="text-4xl md:text-5xl font-extrabold mt-2">{brl(result.monthlyCommission)}<span className="text-xl font-bold">/mês</span></p>
          <p className="text-sm mt-2 opacity-90">
            equivalente a <strong>{brl(result.annualCommission)}</strong> por ano — recorrente, enquanto as gestoras
            permanecerem ativas.
          </p>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Base de cálculo: Gestor Basic {brl(799.9)}/mês (até 10 empresas) e Gestor Pro {brl(899.9)}/mês (até 30
          empresas). *Gestor Master é personalizado — valor médio estimado, ajuste no campo acima. Comissão de 30%
          sobre a mensalidade. Consulte condições do contrato de parceria.
        </p>
      </CardContent>
    </Card>
  );
}

const ParceirosSST = () => {
  usePageSEO({
    title: 'Programa de Parceiros SST SOIA | 30% de comissão recorrente',
    description:
      'Indique os planos de Gestora de SST da SOIA (Basic, Pro e Master) e ganhe 30% de comissão recorrente sobre toda a sua carteira. Simule seus ganhos.',
  });

  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    company_name: '',
    employee_count: '',
    message: '',
  });

  const whatsappUrl = `https://wa.me/5511999406560?text=${encodeURIComponent(
    'Olá! Quero saber mais sobre o Programa de Parceiros SST da SOIA.'
  )}`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha nome, e-mail e telefone.',
        variant: 'destructive',
      });
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('pdparceiros-partner-signup', {
        body: {
          name: form.name,
          email: form.email,
          phone: form.phone,
          company_name: form.company_name || null,
          employee_count: form.employee_count || null,
          message: `[Programa Parceiros SST] ${form.message || ''}`.trim(),
          origin: window.location.origin,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      try {
        fbqTrack('Lead', { content_name: 'PARCEIROS SST — Programa de Parceiros' });
      } catch {
        /* noop */
      }
      toast({
        title: (data as any)?.accountCreated ? 'Parceria aprovada! 🎉' : 'Cadastro enviado!',
        description: (data as any)?.accountCreated
          ? 'Enviamos um e-mail para você criar sua senha e acessar o painel de parceiros.'
          : (data as any)?.message || 'Nosso time de parcerias entrará em contato.',
      });
      setForm({ name: '', email: '', phone: '', company_name: '', employee_count: '', message: '' });
      setSubmitted(true);
    } catch (err: any) {
      toast({
        title: 'Erro ao enviar',
        description: err.message || 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const plans = [
    {
      name: 'Gestor Basic',
      price: 'R$ 799,90/mês',
      limit: 'Até 10 empresas clientes',
      desc: 'Para gestoras que estão começando a digitalizar a operação de SST.',
    },
    {
      name: 'Gestor Pro',
      price: 'R$ 899,90/mês',
      limit: 'Até 30 empresas clientes',
      desc: 'Para gestoras consolidadas que precisam de escala e mais módulos.',
      featured: true,
    },
    {
      name: 'Gestor Master',
      price: 'Personalizado',
      limit: 'Empresas ilimitadas',
      desc: 'Para grandes operações, franquias e redes de consultorias de SST.',
    },
  ];

  const platformFeatures = [
    {
      icon: Brain,
      title: 'Riscos psicossociais (NR-01)',
      desc: 'Avaliações HSE-IT, COPSOQ II e Burnout com relatórios automáticos prontos para o PGR.',
    },
    {
      icon: MessageSquare,
      title: 'Canal de Ouvidoria com IA',
      desc: 'Denúncias anônimas acolhidas pela SOnIA, com classificação e tratativa em painel completo.',
    },
    {
      icon: BarChart3,
      title: 'Pesquisa de clima',
      desc: 'Pesquisas de clima e pulso segmentadas por setor, com resultados em tempo real.',
    },
    {
      icon: FileSearch,
      title: 'PGR digital',
      desc: 'Inventário de riscos por GHE, plano de ação com Kanban e exportação para o eSocial.',
    },
    {
      icon: GraduationCap,
      title: 'Treinamentos',
      desc: 'Trilhas e materiais de treinamento por empresa, com controle de acesso por cliente.',
    },
    {
      icon: LayoutDashboard,
      title: 'Painel multiempresa',
      desc: 'A gestora acompanha todas as empresas clientes em um único painel, com white-label.',
    },
  ];

  const revenues = [
    {
      icon: Repeat,
      title: '30% de comissão recorrente',
      desc: 'Você recebe todo mês sobre cada mensalidade da sua carteira, enquanto a gestora permanecer ativa.',
      highlight: 'Recorrente',
    },
    {
      icon: Wallet,
      title: 'Receita que cresce com a gestora',
      desc: 'Quando a gestora indicada sobe de plano (Basic → Pro → Master), sua comissão sobe junto, sem esforço extra.',
      highlight: 'Upsell automático',
    },
    {
      icon: TrendingUp,
      title: 'Sem teto de indicações',
      desc: 'Cada nova gestora indicada entra na sua carteira. Quanto maior a carteira, maior o MRR comissionado.',
      highlight: 'Escalável',
    },
  ];

  const audience = [
    {
      icon: HardHat,
      title: 'Consultores e técnicos de SST',
      desc: 'Indique a plataforma para as gestoras que você atende e crie uma renda recorrente paralela.',
    },
    {
      icon: Building2,
      title: 'Franquias e redes de SST',
      desc: 'Padronize a operação das unidades com uma plataforma única e ganhe sobre toda a rede.',
    },
    {
      icon: Users,
      title: 'Associações e canais de RH',
      desc: 'Leve conformidade NR-01 para a sua base de contatos e monetize relacionamentos que você já tem.',
    },
  ];

  const painPoints = [
    'A NR-01 obriga o gerenciamento de riscos psicossociais — gestoras sem ferramenta fazem tudo manualmente.',
    'Gestoras de SST precisam mostrar valor para reter clientes: relatórios, dashboards e evidências.',
    'Planilhas e formulários soltos não escalam: cada empresa cliente vira um caos de dados separado.',
    'Quem entrega tecnologia pronta fecha contratos de gestão com ticket maior.',
  ];

  const steps = [
    { n: '1', title: 'Cadastro', desc: 'Você preenche o formulário e nosso time de parcerias faz uma reunião de alinhamento.' },
    { n: '2', title: 'Aprovação e contrato', desc: 'Assinatura digital do contrato de parceiro e liberação do seu link de indicação.' },
    { n: '3', title: 'Indique gestoras', desc: 'Apresente os planos Gestor Basic, Pro e Master para as gestoras da sua rede.' },
    { n: '4', title: 'Receba todo mês', desc: 'Cada gestora ativa na sua carteira gera 30% de comissão recorrente.' },
  ];

  const faq = [
    {
      q: 'Preciso pagar para entrar no programa?',
      a: 'Não. A adesão é gratuita após a aprovação do cadastro e a assinatura do contrato de parceria.',
    },
    {
      q: 'Sobre o que incide a comissão de 30%?',
      a: 'Sobre a mensalidade de cada gestora ativa indicada por você (planos Gestor Basic, Pro e Master), enquanto a assinatura estiver ativa.',
    },
    {
      q: 'Preciso operar a plataforma para a gestora?',
      a: 'Não. A SOIA cuida da tecnologia, do suporte e das atualizações. Você indica e acompanha suas comissões no painel de parceiro.',
    },
    {
      q: 'E se a gestora precisar de mais empresas que o plano permite?',
      a: 'Ela pode subir de plano ou contratar slots extras — e a sua comissão acompanha o novo valor da mensalidade.',
    },
    {
      q: 'Posso indicar empresas que não são gestoras de SST?',
      a: 'Sim. Empresas finais e outros produtos SOIA (como a Ouvidoria) também podem entrar na sua carteira — fale com nosso time de parcerias.',
    },
    {
      q: 'Como recebo a comissão?',
      a: 'A comissão é apurada mensalmente sobre as assinaturas ativas da sua carteira e paga conforme o contrato de parceria.',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* HERO — escuro */}
      <section className="relative overflow-hidden bg-audit-primary">
        <div className="absolute inset-0 opacity-[0.18] bg-[radial-gradient(circle_at_20%_20%,hsl(var(--audit-secondary))_0%,transparent_45%),radial-gradient(circle_at_85%_10%,hsl(var(--audit-secondary))_0%,transparent_40%)]" />
        <div className="relative max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="flex justify-center md:justify-start mb-10">
            <img src={logoSoia} alt="SOIA" className="h-10 w-auto object-contain brightness-0 invert" />
          </div>

          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div className="text-left space-y-6">
              <Badge className="bg-audit-secondary/15 text-audit-secondary border border-audit-secondary/40 hover:bg-audit-secondary/15">
                <Sparkles className="h-3.5 w-3.5 mr-1" /> Programa de Parceiros SST SOIA
              </Badge>
              <h1 className="text-3xl md:text-5xl font-extrabold leading-tight text-primary-foreground">
                Indique a plataforma de SST completa e ganhe{' '}
                <span className="text-audit-secondary">30% de comissão recorrente</span>
              </h1>
              <p className="text-lg text-primary-foreground/75">
                Gestoras de SST precisam de tecnologia para atender a NR-01 e escalar a operação. Você indica os planos
                Gestor Basic, Pro e Master — e recebe 30% de toda a sua carteira, todo mês.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Button
                  size="lg"
                  className="text-base h-14 px-8 shadow-xl bg-audit-secondary text-audit-primary hover:bg-audit-secondary/90 font-bold"
                  onClick={() => scrollTo('simulador')}
                >
                  <Calculator className="h-5 w-5 mr-2" /> Simular minha comissão
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="text-base h-14 px-8 border-2 border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
                  onClick={() => scrollTo('cadastro')}
                >
                  Quero ser parceiro <ArrowRight className="h-5 w-5 ml-2" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-4 pt-4 text-sm text-primary-foreground/70">
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-audit-secondary" /> Adesão gratuita
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-audit-secondary" /> Sem teto de indicações
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-audit-secondary" /> Comissão recorrente mensal
                </span>
              </div>
            </div>

            <div className="flex justify-center md:justify-end">
              <div className="relative w-full max-w-[340px] aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl border-2 border-primary-foreground/15 bg-black">
                <iframe
                  className="absolute inset-0 h-full w-full"
                  src="https://www.youtube.com/embed/cT5OkR56hNg?rel=0&modestbranding=1&autoplay=1&mute=1&loop=1&playlist=cT5OkR56hNg"
                  title="Programa de Parceiros SOIA"
                  loading="lazy"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  allowFullScreen
                  referrerPolicy="strict-origin-when-cross-origin"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* POR QUE VENDE — claro */}
      <section className="py-16 md:py-20 px-4 bg-gradient-to-b from-muted/50 to-background border-b">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <Badge variant="outline" className="mb-4 border-audit-secondary/40 text-audit-secondary">
              <AlertTriangle className="h-3.5 w-3.5 mr-1" /> Obrigação legal, não “nice to have”
            </Badge>
            <h2 className="text-2xl md:text-4xl font-bold">
              Toda gestora de SST precisa disso — hoje
            </h2>
            <p className="text-muted-foreground mt-3">
              Você não precisa criar demanda. Você só precisa ser quem apresenta a solução.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {painPoints.map((p) => (
              <div key={p} className="flex gap-3 rounded-xl border bg-card p-5 shadow-sm">
                <ShieldCheck className="h-5 w-5 text-audit-secondary shrink-0 mt-0.5" />
                <p className="text-sm text-foreground/90">{p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* O QUE A GESTORA RECEBE — escuro */}
      <section className="relative overflow-hidden py-16 md:py-20 px-4 bg-audit-primary">
        <div className="absolute inset-0 opacity-[0.14] bg-[radial-gradient(circle_at_80%_30%,hsl(var(--audit-secondary))_0%,transparent_45%)]" />
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge className="bg-audit-secondary/15 text-audit-secondary border border-audit-secondary/40 hover:bg-audit-secondary/15 mb-4">
              <KanbanSquare className="h-3.5 w-3.5 mr-1" /> Uma plataforma, toda a operação
            </Badge>
            <h2 className="text-2xl md:text-4xl font-bold text-primary-foreground">
              O que a gestora indicada por você recebe
            </h2>
            <p className="text-primary-foreground/70 mt-3">
              NR-01, ouvidoria, clima, PGR e treinamentos em um único painel multiempresa — com a marca dela.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
            {platformFeatures.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/[0.06] backdrop-blur-sm p-6 space-y-3 h-full"
              >
                <div className="h-12 w-12 rounded-xl bg-audit-secondary/20 flex items-center justify-center">
                  <f.icon className="h-6 w-6 text-audit-secondary" />
                </div>
                <h3 className="font-bold text-primary-foreground">{f.title}</h3>
                <p className="text-sm text-primary-foreground/70 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PLANOS — claro */}
      <section className="py-16 md:py-20 px-4 bg-gradient-to-b from-background via-muted/40 to-background border-b">
        <div className="max-w-5xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl md:text-4xl font-bold">Os planos que você vai indicar</h2>
            <p className="text-muted-foreground mt-3">
              Três opções para cada tamanho de gestora — e sua comissão de 30% vale para todos.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {plans.map((p) => (
              <div
                key={p.name}
                className={`rounded-2xl border-2 p-6 space-y-3 h-full ${
                  p.featured
                    ? 'border-audit-secondary bg-card shadow-xl'
                    : 'border-border bg-card shadow-sm'
                }`}
              >
                {p.featured && (
                  <Badge className="bg-audit-secondary text-audit-primary border-0 text-[11px] font-bold hover:bg-audit-secondary">
                    Mais indicado
                  </Badge>
                )}
                <h3 className="text-lg font-bold">{p.name}</h3>
                <p className="text-2xl font-extrabold text-audit-secondary">{p.price}</p>
                <p className="text-sm font-medium">{p.limit}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 3 FONTES DE RECEITA — escuro */}
      <section className="relative overflow-hidden py-16 md:py-20 px-4 bg-audit-primary">
        <div className="absolute inset-0 opacity-[0.12] bg-[radial-gradient(circle_at_15%_70%,hsl(var(--audit-secondary))_0%,transparent_45%)]" />
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-primary-foreground">
              Por que essa comissão vale ouro
            </h2>
            <p className="text-primary-foreground/70 mt-3">
              Não é uma venda única: é uma carteira de receita recorrente que cresce a cada indicação.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {revenues.map((r) => (
              <div
                key={r.title}
                className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/[0.06] backdrop-blur-sm p-6 space-y-3 h-full"
              >
                <div className="h-12 w-12 rounded-xl bg-audit-secondary/20 flex items-center justify-center">
                  <r.icon className="h-6 w-6 text-audit-secondary" />
                </div>
                <Badge className="bg-audit-secondary text-audit-primary border-0 text-[11px] font-bold hover:bg-audit-secondary">
                  {r.highlight}
                </Badge>
                <h3 className="text-lg font-bold text-primary-foreground">{r.title}</h3>
                <p className="text-sm text-primary-foreground/70 leading-relaxed">{r.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SIMULADOR — claro */}
      <section id="simulador" className="py-16 md:py-20 px-4 bg-gradient-to-b from-muted/50 to-background border-b scroll-mt-16">
        <div className="max-w-4xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-2xl md:text-4xl font-bold">Quanto a sua carteira pode gerar?</h2>
            <p className="text-muted-foreground mt-3">
              Informe quantas gestoras você pode indicar e quantas empresas cada uma gerencia em média.
            </p>
          </div>
          <CommissionSimulator />
          <div className="text-center mt-8">
            <Button size="lg" className="h-14 px-8 text-base shadow-lg" onClick={() => scrollTo('cadastro')}>
              Quero essa comissão na minha operação <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* PARA QUEM É — escuro */}
      <section className="relative overflow-hidden py-16 md:py-20 px-4 bg-audit-primary">
        <div className="absolute inset-0 opacity-[0.12] bg-[radial-gradient(circle_at_85%_75%,hsl(var(--audit-secondary))_0%,transparent_45%)]" />
        <div className="relative max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-12 text-primary-foreground">
            Feito para quem tem acesso a gestoras de SST
          </h2>
          <div className="grid gap-6 md:grid-cols-3">
            {audience.map((a) => (
              <div
                key={a.title}
                className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/[0.06] backdrop-blur-sm p-6 space-y-3 h-full"
              >
                <a.icon className="h-8 w-8 text-audit-secondary" />
                <h3 className="font-bold text-lg text-primary-foreground">{a.title}</h3>
                <p className="text-sm text-primary-foreground/70 leading-relaxed">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* DIFERENCIAIS — claro */}
      <section className="py-16 md:py-20 px-4 bg-gradient-to-b from-background via-muted/40 to-background border-b">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl md:text-4xl font-bold">Por que indicar a SOIA é fácil</h2>
            <p className="text-muted-foreground mt-3">
              Tecnologia pronta, conformidade documentada e suporte que não fica no seu colo.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {[
              { icon: BadgeCheck, title: 'Marca e material de apoio', desc: 'Apresentações, propostas e link de indicação exclusivo para você usar na sua rede.' },
              { icon: ScrollText, title: 'Conformidade NR-01 e LGPD', desc: 'Relatórios prontos para auditoria e PGR — o argumento que fecha a venda.' },
              { icon: UserCog, title: 'A SOIA cuida da operação', desc: 'Suporte, atualizações e servidores são com a gente. Você indica e recebe.' },
              { icon: FileDown, title: 'Painel de comissões', desc: 'Acompanhe indicações, status de assinatura e comissões em tempo real.' },
              { icon: ClipboardList, title: 'Onboarding da gestora', desc: 'Nosso time ajuda a gestora indicada a implantar a plataforma e migrar os clientes.' },
              { icon: TrendingUp, title: 'Produto em expansão', desc: 'Novos módulos entram na plataforma sem custo extra — e valorizam sua carteira.' },
            ].map((d) => (
              <div
                key={d.title}
                className="rounded-2xl border bg-card p-6 space-y-2 shadow-sm hover:shadow-lg hover:border-audit-secondary/40 transition-all"
              >
                <d.icon className="h-6 w-6 text-audit-secondary" />
                <h3 className="font-semibold">{d.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMO ENTRAR — escuro */}
      <section className="relative overflow-hidden py-16 md:py-20 px-4 bg-audit-primary">
        <div className="absolute inset-0 opacity-[0.12] bg-[radial-gradient(circle_at_25%_25%,hsl(var(--audit-secondary))_0%,transparent_45%)]" />
        <div className="relative max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-12 text-primary-foreground">
            Como entrar no programa em 4 passos
          </h2>
          <div className="grid gap-6 md:grid-cols-4">
            {steps.map((s) => (
              <div
                key={s.n}
                className="rounded-2xl border border-primary-foreground/15 bg-primary-foreground/[0.06] backdrop-blur-sm p-5 space-y-2"
              >
                <div className="h-10 w-10 rounded-full bg-audit-secondary text-audit-primary font-bold flex items-center justify-center">
                  {s.n}
                </div>
                <h3 className="font-semibold text-primary-foreground">{s.title}</h3>
                <p className="text-sm text-primary-foreground/70 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ — claro */}
      <section className="py-16 md:py-20 px-4 bg-gradient-to-b from-muted/50 to-background border-b">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-10">Perguntas frequentes</h2>
          <div className="space-y-4">
            {faq.map((f) => (
              <div key={f.q} className="rounded-xl border bg-card p-5 shadow-sm">
                <h3 className="font-semibold flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-audit-secondary shrink-0 mt-0.5" /> {f.q}
                </h3>
                <p className="text-sm text-muted-foreground mt-2 pl-7 leading-relaxed">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FORMULÁRIO — escuro */}
      <section
        id="cadastro"
        className="relative overflow-hidden py-16 md:py-20 px-4 bg-audit-primary scroll-mt-16"
      >
        <div className="absolute inset-0 opacity-[0.14] bg-[radial-gradient(circle_at_50%_0%,hsl(var(--audit-secondary))_0%,transparent_50%)]" />
        <div className="relative max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <Badge className="bg-audit-secondary/15 text-audit-secondary border border-audit-secondary/40 hover:bg-audit-secondary/15 mb-4">
              <Handshake className="h-3.5 w-3.5 mr-1" /> Vagas limitadas por região
            </Badge>
            <h2 className="text-2xl md:text-4xl font-bold text-primary-foreground">
              Quero ser Parceiro SST da SOIA
            </h2>
            <p className="text-primary-foreground/70 mt-3">
              Preencha os dados abaixo. Nosso time de parcerias entra em contato para apresentar o programa e liberar
              seu acesso.
            </p>
          </div>

          <Card className="border-2 border-audit-secondary/40 shadow-2xl">
            <CardContent className="p-6 md:p-8">
              {submitted ? (
                <div className="text-center space-y-5 py-6">
                  <div className="h-16 w-16 rounded-full bg-audit-secondary/15 flex items-center justify-center mx-auto">
                    <Rocket className="h-8 w-8 text-audit-secondary" />
                  </div>
                  <h3 className="text-2xl font-bold">Cadastro recebido!</h3>
                  <p className="text-muted-foreground">
                    Para acelerar seu atendimento, fale agora com nosso time de parcerias no WhatsApp.
                  </p>
                  <Button asChild size="lg" className="h-14 px-8 text-base shadow-lg">
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                      <MessageSquare className="h-5 w-5 mr-2" /> Falar no WhatsApp agora
                    </a>
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome completo *</Label>
                      <Input id="name" name="name" value={form.name} onChange={handleChange} className="h-12" required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">WhatsApp *</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={form.phone}
                        onChange={handleChange}
                        className="h-12"
                        placeholder="(11) 99999-9999"
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={form.email}
                      onChange={handleChange}
                      className="h-12"
                      required
                    />
                  </div>
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="company_name">Sua empresa</Label>
                      <Input
                        id="company_name"
                        name="company_name"
                        value={form.company_name}
                        onChange={handleChange}
                        className="h-12"
                        placeholder="Consultoria, franquia ou associação"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employee_count">Quantas gestoras você alcança?</Label>
                      <Input
                        id="employee_count"
                        name="employee_count"
                        value={form.employee_count}
                        onChange={handleChange}
                        className="h-12"
                        placeholder="Ex: 10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Conte um pouco sobre sua rede de contatos</Label>
                    <Textarea id="message" name="message" value={form.message} onChange={handleChange} rows={4} />
                  </div>
                  <Button type="submit" size="lg" className="w-full h-14 text-base shadow-lg" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Enviando...
                      </>
                    ) : (
                      <>
                        Quero ser parceiro SST <ArrowRight className="h-5 w-5 ml-2" />
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    Seus dados são usados apenas para contato comercial, conforme a LGPD.
                  </p>
                </form>
              )}
            </CardContent>
          </Card>
        </div>
      </section>

      <footer className="py-8 border-t bg-muted/40">
        <div className="max-w-6xl mx-auto px-4 text-center space-y-2">
          <img src={logoSoia} alt="SOIA" className="h-8 w-auto object-contain mx-auto opacity-80" />
          <p className="text-xs text-muted-foreground">
            SOIA — Plataforma completa para Gestoras de SST · Programa de Parceiros SST
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ParceirosSST;
