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
  Bot,
  Calculator,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Loader2,
  Building2,
  HardHat,
  Scale,
  Calculator as CalcIcon,
  Repeat,
  Wallet,
  BadgeCheck,
  Users,
  MessageSquare,
  Rocket,
} from 'lucide-react';
import usePageSEO from '@/hooks/usePageSEO';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { fbqTrack } from '@/lib/metaPixel';

const logoSoia = '/lovable-uploads/Logo_SOIA.png';

/** Constantes comerciais do Programa de Parceiros Licenciados */
export const PARTNER_PRICING = {
  basePricePerCompanyMonthly: 99,
  pricePerExtraEmployeeMonthly: 1.7,
  freeEmployeesIncluded: 30,
  commissionRate: 0.3,
};

const brl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 });

function CommissionSimulator() {
  const [companies, setCompanies] = useState(10);
  const [employees, setEmployees] = useState(60);

  const result = useMemo(() => {
    const { basePricePerCompanyMonthly, pricePerExtraEmployeeMonthly, freeEmployeesIncluded, commissionRate } =
      PARTNER_PRICING;
    const extra = Math.max(0, employees - freeEmployeesIncluded);
    const monthlyPerCompany = basePricePerCompanyMonthly + extra * pricePerExtraEmployeeMonthly;
    const annualPerCompany = monthlyPerCompany * 12;
    const annualTotal = annualPerCompany * companies;
    const annualCommission = annualTotal * commissionRate;
    return {
      monthlyPerCompany,
      annualPerCompany,
      annualTotal,
      annualCommission,
      monthlyCommission: annualCommission / 12,
    };
  }, [companies, employees]);

  return (
    <Card className="border-2 border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 shadow-xl">
      <CardContent className="p-6 md:p-8 space-y-8">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center">
            <Calculator className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Simulador de comissões</h3>
            <p className="text-sm text-muted-foreground">
              Veja quanto a sua carteira atual pode gerar de receita recorrente.
            </p>
          </div>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-semibold">Quantidade de empresas</Label>
              <span className="text-lg font-bold text-primary">{companies}</span>
            </div>
            <Slider
              value={[companies]}
              min={1}
              max={100}
              step={1}
              onValueChange={(v) => setCompanies(v[0])}
              aria-label="Quantidade de empresas"
            />
            <Input
              type="number"
              min={1}
              value={companies}
              onChange={(e) => setCompanies(Math.max(1, Number(e.target.value) || 1))}
              className="h-10"
            />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="font-semibold">Colaboradores por empresa</Label>
              <span className="text-lg font-bold text-primary">{employees}</span>
            </div>
            <Slider
              value={[employees]}
              min={1}
              max={1000}
              step={1}
              onValueChange={(v) => setEmployees(v[0])}
              aria-label="Colaboradores por empresa"
            />
            <Input
              type="number"
              min={1}
              value={employees}
              onChange={(e) => setEmployees(Math.max(1, Number(e.target.value) || 1))}
              className="h-10"
            />
          </div>
        </div>

        <div className="rounded-xl border bg-muted/40 p-5 grid gap-4 sm:grid-cols-3 text-center">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Mensalidade por empresa</p>
            <p className="text-xl font-bold">{brl(result.monthlyPerCompany)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Anuidade por empresa</p>
            <p className="text-xl font-bold">{brl(result.annualPerCompany)}</p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Receita anual da carteira</p>
            <p className="text-xl font-bold">{brl(result.annualTotal)}</p>
          </div>
        </div>

        <div className="rounded-2xl bg-primary text-primary-foreground p-6 text-center shadow-lg">
          <p className="text-sm font-medium opacity-90">Sua comissão de 30% sobre a anuidade</p>
          <p className="text-4xl md:text-5xl font-extrabold mt-2">{brl(result.annualCommission)}</p>
          <p className="text-sm mt-2 opacity-90">
            equivalente a <strong>{brl(result.monthlyCommission)}</strong> por mês — recorrente, enquanto os clientes
            permanecerem ativos.
          </p>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Base de cálculo: R$ 99 por empresa/mês + R$ 1,70 por colaborador acima de 30 colaboradores. Comissão de 30%
          sobre o valor da anuidade. Este valor não inclui a taxa de implementação nem a mensalidade de gestão que você
          cobra diretamente do seu cliente.
        </p>
      </CardContent>
    </Card>
  );
}

const PDParceiros = () => {
  usePageSEO({
    title: 'Programa de Parceiros Licenciados SOIA | Até 30% de comissão recorrente',
    description:
      'Ofereça o Canal de Ouvidoria com IA da SOIA aos seus clientes, ganhe até 30% de comissão recorrente e cobre implementação e gestão de denúncias. Simule sua comissão.',
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
    'Olá! Quero saber mais sobre o Programa de Parceiros Licenciados SOIA.'
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
      const { error } = await supabase.from('demo_leads').insert({
        name: form.name,
        email: form.email,
        phone: form.phone,
        company_name: form.company_name || null,
        employee_count: form.employee_count || null,
        message: form.message || null,
        source: 'pdparceiros',
      });
      if (error) throw error;
      try {
        fbqTrack('Lead', { content_name: 'PDPARCEIROS — Programa de Parceiros' });
      } catch {
        /* noop */
      }
      toast({ title: 'Cadastro enviado!', description: 'Nosso time de parcerias entrará em contato.' });
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

  const revenues = [
    {
      icon: Repeat,
      title: 'Até 30% de comissão recorrente',
      desc: 'Você recebe todo mês, enquanto o cliente permanecer ativo. Receita previsível, sem teto de indicações.',
      highlight: 'Recorrente',
    },
    {
      icon: Wallet,
      title: 'Taxa de implementação',
      desc: 'Cobre do seu cliente pela implantação do canal, comunicação interna, treinamento e política de ouvidoria.',
      highlight: 'Você define o valor',
    },
    {
      icon: MessageSquare,
      title: 'Mensalidade de gestão de denúncias',
      desc: 'Assuma a triagem e a apuração dentro da plataforma SOIA e cobre uma mensalidade de gestão por cliente.',
      highlight: 'Novo serviço na sua carteira',
    },
  ];

  const audience = [
    {
      icon: HardHat,
      title: 'Gestoras e Assessorias de SST',
      desc: 'Complete o portfólio de NR-01 e riscos psicossociais com um canal de denúncias exigido por lei.',
    },
    {
      icon: Scale,
      title: 'Advocacia Trabalhista e Compliance',
      desc: 'Reduza passivos dos seus clientes e crie um serviço recorrente ao lado do consultivo.',
    },
    {
      icon: CalcIcon,
      title: 'Contabilidade e BPO',
      desc: 'Aumente o ticket médio da carteira com uma solução simples de vender e de operar.',
    },
  ];

  const differentials = [
    { icon: Bot, title: 'SOnIA, a IA de acolhimento', desc: 'Conversa empática, classifica e estrutura o relato automaticamente.' },
    { icon: ShieldCheck, title: 'Conformidade NR-01, Lei 14.457/22 e LGPD', desc: 'Relatórios prontos para auditoria e para o PGR.' },
    { icon: Building2, title: 'Conta de Gestora SST para você', desc: 'Seus clientes indicados entram no seu painel — você gerencia tudo em um só lugar.' },
    { icon: TrendingUp, title: 'Painel de comissões', desc: 'Acompanhe indicações, status de assinatura e comissões em tempo real.' },
    { icon: BadgeCheck, title: 'Marca e material de apoio', desc: 'Apresentações, propostas e link de indicação exclusivo.' },
    { icon: Users, title: 'Sem custo de estrutura', desc: 'Nada de servidor, suporte técnico ou desenvolvimento. A SOIA cuida da tecnologia.' },
  ];

  const steps = [
    { n: '1', title: 'Cadastro', desc: 'Você preenche o formulário e nosso time de parcerias faz uma reunião de alinhamento.' },
    { n: '2', title: 'Aprovação e contrato', desc: 'Assinatura digital do contrato de parceiro licenciado.' },
    { n: '3', title: 'Conta de Gestora SST liberada', desc: 'Você recebe acesso ao portal do parceiro e ao painel de gestora com seu link de indicação.' },
    { n: '4', title: 'Indique, implante e receba', desc: 'Cada empresa que assina entra no seu painel e gera comissão recorrente.' },
  ];

  const faq = [
    {
      q: 'Preciso pagar para entrar no programa?',
      a: 'Não. A adesão é gratuita após a aprovação do cadastro e a assinatura do contrato de parceiro licenciado.',
    },
    {
      q: 'Eu consigo gerenciar as denúncias dos meus clientes?',
      a: 'Sim. Como parceiro licenciado você recebe uma conta de Gestora SST e as empresas indicadas por você ficam vinculadas a esse painel.',
    },
    {
      q: 'Posso cobrar meus próprios valores do cliente?',
      a: 'Sim. Além da comissão da SOIA, você pode cobrar taxa de implementação e mensalidade de gestão de denúncias diretamente do cliente.',
    },
    {
      q: 'Como recebo a comissão?',
      a: 'A comissão é apurada mensalmente sobre as assinaturas ativas indicadas por você e paga conforme o contrato de parceria.',
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* HERO */}
      <section className="relative bg-gradient-to-b from-primary/10 via-background to-background border-b">
        <div className="max-w-6xl mx-auto px-4 py-14 md:py-20">
          <div className="flex justify-center mb-8">
            <img src={logoSoia} alt="SOIA" className="h-10 w-auto object-contain" />
          </div>

          <div className="text-center max-w-3xl mx-auto space-y-6">
            <Badge className="bg-primary/15 text-primary border border-primary/30 hover:bg-primary/15">
              <Sparkles className="h-3.5 w-3.5 mr-1" /> Programa de Parceiros Licenciados SOIA
            </Badge>
            <h1 className="text-3xl md:text-5xl font-extrabold leading-tight">
              Leve o Canal de Ouvidoria com IA para seus clientes e ganhe{' '}
              <span className="text-primary">até 30% de comissão recorrente</span>
            </h1>
            <p className="text-lg text-muted-foreground">
              Um serviço que toda empresa precisa por lei — e que agrega valor imediato à sua Gestora de SST, Advocacia
              ou Contabilidade. Você indica, implanta, gerencia e recebe todo mês.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
              <Button size="lg" className="text-base h-14 px-8 shadow-lg" onClick={() => scrollTo('simulador')}>
                <Calculator className="h-5 w-5 mr-2" /> Simular minha comissão
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="text-base h-14 px-8 border-2"
                onClick={() => scrollTo('cadastro')}
              >
                Quero ser parceiro <ArrowRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
            <div className="flex flex-wrap justify-center gap-4 pt-4 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Adesão gratuita
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Sem teto de indicações
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-primary" /> Conta de Gestora SST inclusa
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 3 FONTES DE RECEITA */}
      <section className="py-16 bg-muted/30 border-b">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <h2 className="text-2xl md:text-4xl font-bold">3 fontes de receita com um único produto</h2>
            <p className="text-muted-foreground mt-3">
              O parceiro licenciado SOIA não ganha só comissão: ele cria uma nova linha de serviço na sua operação.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {revenues.map((r) => (
              <Card key={r.title} className="border-2 hover:border-primary/40 transition-colors h-full">
                <CardContent className="p-6 space-y-3">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <r.icon className="h-6 w-6 text-primary" />
                  </div>
                  <Badge variant="secondary" className="text-[11px]">{r.highlight}</Badge>
                  <h3 className="text-lg font-bold">{r.title}</h3>
                  <p className="text-sm text-muted-foreground">{r.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* SIMULADOR */}
      <section id="simulador" className="py-16 border-b bg-background">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-2xl md:text-4xl font-bold">Quanto a sua carteira pode gerar?</h2>
            <p className="text-muted-foreground mt-3">
              Informe quantas empresas você atende e o tamanho médio delas. O cálculo é feito sobre a anuidade.
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

      {/* PARA QUEM É */}
      <section className="py-16 bg-muted/30 border-b">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-10">Feito para quem já atende empresas</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {audience.map((a) => (
              <Card key={a.title} className="h-full">
                <CardContent className="p-6 space-y-3">
                  <a.icon className="h-8 w-8 text-primary" />
                  <h3 className="font-bold text-lg">{a.title}</h3>
                  <p className="text-sm text-muted-foreground">{a.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* DIFERENCIAIS */}
      <section className="py-16 border-b bg-background">
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-10">
            Por que a Ouvidoria SOIA vende com facilidade
          </h2>
          <div className="grid gap-5 md:grid-cols-3">
            {differentials.map((d) => (
              <div key={d.title} className="rounded-xl border bg-card p-5 space-y-2">
                <d.icon className="h-6 w-6 text-primary" />
                <h3 className="font-semibold">{d.title}</h3>
                <p className="text-sm text-muted-foreground">{d.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA */}
      <section className="py-16 bg-muted/30 border-b">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-10">Como funciona em 4 passos</h2>
          <div className="grid gap-6 md:grid-cols-4">
            {steps.map((s) => (
              <div key={s.n} className="rounded-xl bg-card border p-5 space-y-2">
                <div className="h-10 w-10 rounded-full bg-primary text-primary-foreground font-bold flex items-center justify-center">
                  {s.n}
                </div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 border-b bg-background">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-10">Perguntas frequentes</h2>
          <div className="space-y-4">
            {faq.map((f) => (
              <div key={f.q} className="rounded-xl border bg-card p-5">
                <h3 className="font-semibold flex items-start gap-2">
                  <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" /> {f.q}
                </h3>
                <p className="text-sm text-muted-foreground mt-2 pl-7">{f.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FORMULÁRIO */}
      <section
        id="cadastro"
        className="py-16 bg-gradient-to-b from-primary/10 via-background to-background"
      >
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-8">
            <Badge className="bg-primary/15 text-primary border border-primary/30 hover:bg-primary/15 mb-4">
              <Handshake className="h-3.5 w-3.5 mr-1" /> Vagas limitadas por região
            </Badge>
            <h2 className="text-2xl md:text-4xl font-bold">Quero ser Parceiro Licenciado SOIA</h2>
            <p className="text-muted-foreground mt-3">
              Preencha os dados abaixo. Nosso time de parcerias entra em contato para apresentar o programa e liberar sua
              conta de Gestora SST.
            </p>
          </div>

          <Card className="border-2 border-primary/30 shadow-xl">
            <CardContent className="p-6 md:p-8">
              {submitted ? (
                <div className="text-center space-y-5 py-6">
                  <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                    <Rocket className="h-8 w-8 text-primary" />
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
                        placeholder="Gestora, escritório ou contabilidade"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="employee_count">Quantas empresas você atende?</Label>
                      <Input
                        id="employee_count"
                        name="employee_count"
                        value={form.employee_count}
                        onChange={handleChange}
                        className="h-12"
                        placeholder="Ex: 25"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="message">Conte um pouco sobre sua operação</Label>
                    <Textarea id="message" name="message" value={form.message} onChange={handleChange} rows={4} />
                  </div>
                  <Button type="submit" size="lg" className="w-full h-14 text-base shadow-lg" disabled={loading}>
                    {loading ? (
                      <>
                        <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Enviando...
                      </>
                    ) : (
                      <>
                        Quero ser parceiro licenciado <ArrowRight className="h-5 w-5 ml-2" />
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

      <footer className="py-8 border-t bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 text-center space-y-2">
          <img src={logoSoia} alt="SOIA" className="h-8 w-auto object-contain mx-auto opacity-80" />
          <p className="text-xs text-muted-foreground">
            SOIA — Canal de Ouvidoria com Inteligência Artificial · Programa de Parceiros Licenciados
          </p>
        </div>
      </footer>
    </div>
  );
};

export default PDParceiros;
