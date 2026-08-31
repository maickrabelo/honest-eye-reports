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
  Lock,
  FileSearch,
  BellRing,
  ScrollText,
  AlertTriangle,
  QrCode,
  UserCheck,
  KanbanSquare,
  History,
  UserCog,
  FileDown,
  Mail,
  ListChecks,
  Filter,
  StickyNote,
  ClipboardList,
} from 'lucide-react';
import usePageSEO from '@/hooks/usePageSEO';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { fbqTrack } from '@/lib/metaPixel';
import OuvidoriaChatSimulation from '@/components/ouvidoria/OuvidoriaChatSimulation';
import OuvidoriaDashboardSimulation from '@/components/ouvidoria/OuvidoriaDashboardSimulation';

const logoSoia = '/lovable-uploads/Logo_SOIA.png';

/** Constantes comerciais do Programa de Parceiros Licenciados */
export const PARTNER_PRICING = {
  commissionRate: 0.3,
};

const brl = (v: number) =>
  v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 2 });

function CommissionSimulator() {
  const [companies, setCompanies] = useState(10);
  const [employees, setEmployees] = useState(60);

  const result = useMemo(() => {
    const { commissionRate } = PARTNER_PRICING;
    const monthlyPerCompany = calculateOperatorPrice('ouvidoria', employees, 'monthly').monthlyCents / 100;
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
    <Card className="border-2 border-audit-secondary/40 bg-card shadow-2xl">
      <CardContent className="p-6 md:p-8 space-y-8">
        <div className="flex items-center gap-3">
          <div className="h-11 w-11 rounded-xl bg-audit-secondary/15 flex items-center justify-center">
            <Calculator className="h-6 w-6 text-audit-secondary" />
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
              <span className="text-lg font-bold text-audit-secondary">{companies}</span>
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
              <span className="text-lg font-bold text-audit-secondary">{employees}</span>
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

        <div className="rounded-2xl bg-audit-primary text-primary-foreground p-6 text-center shadow-lg">
          <p className="text-sm font-medium text-audit-secondary">Sua comissão de 30% sobre a anuidade</p>
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

  /** Como a ouvidoria funciona na prática — argumento de venda do parceiro */
  const howItWorks = [
    {
      icon: QrCode,
      title: '1. Canal divulgado na empresa',
      desc: 'Link e QR Code exclusivos da empresa em murais, crachás e intranet. O colaborador acessa pelo celular, sem app e sem login.',
    },
    {
      icon: Bot,
      title: '2. A SOnIA acolhe o relato',
      desc: 'A IA conduz a conversa com empatia, faz as perguntas certas e coleta datas, locais, frequência e testemunhas.',
    },
    {
      icon: FileSearch,
      title: '3. Classificação automática',
      desc: 'O relato é categorizado (assédio, discriminação, segurança, fraude…) e recebe nível de gravidade e protocolo anônimo.',
    },
    {
      icon: BellRing,
      title: '4. Notificação da comissão',
      desc: 'Você e/ou o comitê da empresa recebem o alerta na hora, com o relato já estruturado para a apuração.',
    },
    {
      icon: UserCheck,
      title: '5. Tratativa e retorno',
      desc: 'A apuração acontece dentro da plataforma, com histórico de andamentos. O denunciante acompanha pelo protocolo, sem se identificar.',
    },
    {
      icon: ScrollText,
      title: '6. Relatórios de compliance',
      desc: 'Indicadores, evidências e relatórios prontos para auditoria, para a CIPA e para alimentar o PGR/riscos psicossociais.',
    },
  ];

  const painPoints = [
    'A Lei 14.457/22 obriga o canal de denúncias em empresas com CIPA.',
    'A NR-01 exige o gerenciamento dos riscos psicossociais — assédio incluso.',
    'Sem canal seguro, o relato vira processo trabalhista direto.',
    'E-mail e caixinha de sugestões não garantem anonimato nem rastreabilidade.',
  ];

  /** Funcionalidades do painel de gestão da ouvidoria — espelho do que é mostrado na /ouvidoria */
  const painelFeatures = [
    {
      icon: KanbanSquare,
      title: 'Quadro de tarefas estilo Kanban',
      desc: 'Cada denúncia pode virar tarefa com responsável, prazo e status (a fazer, em andamento, concluída) — tudo sincronizado com o histórico do caso.',
    },
    {
      icon: ListChecks,
      title: 'Checklist interno por tarefa',
      desc: 'Checklist de apuração dentro de cada tarefa: entrevistas, coleta de evidências, conclusão. Nada passa batido.',
    },
    {
      icon: UserCog,
      title: 'Perfis Gestor e Auditor',
      desc: 'Gestores tratam denúncias e tarefas; auditores apenas visualizam e fazem notas — ideal para conselho, jurídico e auditoria externa.',
    },
    {
      icon: History,
      title: 'Log de acessos e alterações',
      desc: 'Cada acesso e cada mudança de status fica registrada com data, hora e origem (empresa ou denunciante). Rastreabilidade total.',
    },
    {
      icon: StickyNote,
      title: 'Notas internas privadas',
      desc: 'Anotações visíveis só para a equipe de tratativa — nunca para o denunciante. Perfeitas para decisões e alinhamentos.',
    },
    {
      icon: Filter,
      title: 'Filtros por categoria e status',
      desc: 'Assédio, discriminação, segurança, fraude e mais: filtre a fila por categoria, gravidade e andamento em um clique.',
    },
    {
      icon: FileDown,
      title: 'Histórico completo em PDF',
      desc: 'Exporte o dossiê de cada denúncia com todo o histórico de atualizações — evidência pronta para auditorias e eSocial.',
    },
    {
      icon: Mail,
      title: 'Campanhas de divulgação por e-mail',
      desc: 'Envie o link e o QR Code do canal para a base de colaboradores, com lista de contatos gerenciada e deduplicação automática.',
    },
    {
      icon: ClipboardList,
      title: 'Equipe da ouvidoria via convite',
      desc: 'Convide gestores e auditores por e-mail. Cada pessoa cria a própria conta e passa a acessar só o que o perfil dela permite.',
    },
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
      q: 'O denunciante é realmente anônimo?',
      a: 'Sim. Não há login, não guardamos IP identificável e o acompanhamento é feito por um protocolo. Nem a empresa nem o parceiro conseguem identificar quem relatou.',
    },
    {
      q: 'Preciso ser especialista em compliance para operar?',
      a: 'Não. A SOnIA já entrega o relato classificado, com gravidade e recomendações. Você conduz a tratativa com apoio dos nossos materiais.',
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
                <Sparkles className="h-3.5 w-3.5 mr-1" /> Programa de Parceiros Licenciados SOIA
              </Badge>
              <h1 className="text-3xl md:text-5xl font-extrabold leading-tight text-primary-foreground">
                Leve o Canal de Ouvidoria com IA para seus clientes e ganhe{' '}
                <span className="text-audit-secondary">até 30% de comissão recorrente</span>
              </h1>
              <p className="text-lg text-primary-foreground/75">
                Um serviço que toda empresa precisa por lei — e que agrega valor imediato à sua Gestora de SST, Advocacia
                ou Contabilidade. Você indica, implanta, gerencia e recebe todo mês.
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
                  <CheckCircle2 className="h-4 w-4 text-audit-secondary" /> Conta de Gestora SST inclusa
                </span>
              </div>
            </div>

            <div className="flex justify-center md:justify-end">
              <div className="relative w-full max-w-[340px] aspect-[9/16] rounded-2xl overflow-hidden shadow-2xl border-2 border-primary-foreground/15 bg-black">
                <iframe
                  className="absolute inset-0 h-full w-full"
                  src="https://www.youtube.com/embed/uazqE-_dFRw?rel=0&modestbranding=1&autoplay=1&mute=1&loop=1&playlist=uazqE-_dFRw"
                  title="Programa de Parceiros Licenciados SOIA"
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
              Seus clientes já precisam desse canal — hoje
            </h2>
            <p className="text-muted-foreground mt-3">
              Você não precisa criar demanda. Você só precisa ser quem entrega a solução.
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

      {/* SIMULAÇÃO DO CHAT — escuro */}
      <section className="relative overflow-hidden py-16 md:py-20 px-4 bg-audit-primary">
        <div className="absolute inset-0 opacity-[0.14] bg-[radial-gradient(circle_at_80%_30%,hsl(var(--audit-secondary))_0%,transparent_45%)]" />
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <Badge className="bg-audit-secondary/15 text-audit-secondary border border-audit-secondary/40 hover:bg-audit-secondary/15 mb-4">
              <Bot className="h-3.5 w-3.5 mr-1" /> Veja a ferramenta em ação
            </Badge>
            <h2 className="text-2xl md:text-4xl font-bold text-primary-foreground">
              É isso que o colaborador do seu cliente vê
            </h2>
            <p className="text-primary-foreground/70 mt-3">
              Sem app, sem login, sem medo. A SOnIA acolhe, investiga com sensibilidade e entrega o relato pronto para
              apuração.
            </p>
          </div>
          <OuvidoriaChatSimulation />
          <div className="text-center mt-10">
            <Button
              size="lg"
              className="h-14 px-8 text-base font-bold bg-audit-secondary text-audit-primary hover:bg-audit-secondary/90 shadow-xl"
              onClick={() => scrollTo('cadastro')}
            >
              Quero oferecer isso aos meus clientes <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* COMO FUNCIONA A OUVIDORIA — claro */}
      <section className="py-16 md:py-20 px-4 bg-gradient-to-b from-background via-muted/40 to-background border-b">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl md:text-4xl font-bold">Como funciona a Ouvidoria SOIA na prática</h2>
            <p className="text-muted-foreground mt-3">
              Do QR Code no mural ao relatório de auditoria — todo o ciclo dentro de uma única plataforma.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {howItWorks.map((h) => (
              <div
                key={h.title}
                className="rounded-2xl border bg-card p-6 space-y-3 shadow-sm hover:shadow-lg hover:border-audit-secondary/40 transition-all"
              >
                <div className="h-12 w-12 rounded-xl bg-audit-secondary/12 flex items-center justify-center">
                  <h.icon className="h-6 w-6 text-audit-secondary" />
                </div>
                <h3 className="font-bold">{h.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{h.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Lock className="h-4 w-4 text-audit-secondary" /> Anonimato garantido
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-audit-secondary" /> LGPD e Lei 14.457/22
            </span>
            <span className="flex items-center gap-1.5">
              <ScrollText className="h-4 w-4 text-audit-secondary" /> Evidências para auditoria
            </span>
          </div>
        </div>
      </section>

      {/* PAINEL DE GESTÃO COMPLETO — claro */}
      <section className="py-16 md:py-20 px-4 bg-gradient-to-b from-background via-muted/40 to-background border-b">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <Badge variant="outline" className="mb-4 border-audit-secondary/40 text-audit-secondary">
              <KanbanSquare className="h-3.5 w-3.5 mr-1" /> Tudo incluso, sem módulo extra
            </Badge>
            <h2 className="text-2xl md:text-4xl font-bold">Um painel de gestão completo, pronto para auditoria</h2>
            <p className="text-muted-foreground mt-3">
              Não é só um formulário de denúncias: é uma operação completa de tratativa, com tarefas, equipe, evidências
              e rastreabilidade. Você entrega tudo isso ao seu cliente no dia um.
            </p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
            {painelFeatures.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border bg-card p-6 space-y-3 shadow-sm hover:shadow-lg hover:border-audit-secondary/40 transition-all"
              >
                <div className="h-12 w-12 rounded-xl bg-audit-secondary/12 flex items-center justify-center">
                  <f.icon className="h-6 w-6 text-audit-secondary" />
                </div>
                <h3 className="font-bold">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>

          {/* Simulação do dashboard */}
          <div className="mt-14">
            <div className="text-center mb-8">
              <h3 className="text-xl md:text-2xl font-bold">
                Veja o painel que você e seus clientes vão usar
              </h3>
              <p className="text-muted-foreground mt-2 text-sm max-w-2xl mx-auto">
                Fila de denúncias, tarefas com checklist e log de atividades — o mesmo painel para a empresa e para a
                sua operação de parceiro.
              </p>
            </div>
            <OuvidoriaDashboardSimulation />
          </div>

          <div className="mt-10 flex flex-wrap justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Lock className="h-4 w-4 text-audit-secondary" /> Denunciante nunca vê notas nem responsáveis internos
            </span>
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-audit-secondary" /> Evidências prontas para auditoria, CIPA e eSocial
            </span>
            <span className="flex items-center gap-1.5">
              <History className="h-4 w-4 text-audit-secondary" /> Histórico imutável de cada caso
            </span>
          </div>
          <div className="text-center mt-10">
            <Button
              size="lg"
              className="h-14 px-8 text-base font-bold shadow-lg"
              onClick={() => scrollTo('cadastro')}
            >
              Quero entregar isso aos meus clientes <ArrowRight className="h-5 w-5 ml-2" />
            </Button>
          </div>
        </div>
      </section>

      {/* 3 FONTES DE RECEITA — escuro */}
      <section className="relative overflow-hidden py-16 md:py-20 px-4 bg-audit-primary">
        <div className="absolute inset-0 opacity-[0.12] bg-[radial-gradient(circle_at_15%_70%,hsl(var(--audit-secondary))_0%,transparent_45%)]" />
        <div className="relative max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl md:text-4xl font-bold text-primary-foreground">
              3 fontes de receita com um único produto
            </h2>
            <p className="text-primary-foreground/70 mt-3">
              O parceiro licenciado SOIA não ganha só comissão: ele cria uma nova linha de serviço na sua operação.
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

      {/* PARA QUEM É — escuro */}
      <section className="relative overflow-hidden py-16 md:py-20 px-4 bg-audit-primary">
        <div className="absolute inset-0 opacity-[0.12] bg-[radial-gradient(circle_at_85%_75%,hsl(var(--audit-secondary))_0%,transparent_45%)]" />
        <div className="relative max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-4xl font-bold text-center mb-12 text-primary-foreground">
            Feito para quem já atende empresas
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
            <h2 className="text-2xl md:text-4xl font-bold">Por que a Ouvidoria SOIA vende com facilidade</h2>
            <p className="text-muted-foreground mt-3">
              Tecnologia pronta, conformidade documentada e um painel feito para quem gerencia várias empresas.
            </p>
          </div>
          <div className="grid gap-5 md:grid-cols-3">
            {differentials.map((d) => (
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
              Quero ser Parceiro Licenciado SOIA
            </h2>
            <p className="text-primary-foreground/70 mt-3">
              Preencha os dados abaixo. Nosso time de parcerias entra em contato para apresentar o programa e liberar sua
              conta de Gestora SST.
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

      <footer className="py-8 border-t bg-muted/40">
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
