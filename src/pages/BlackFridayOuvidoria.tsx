import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import {
  ArrowRight,
  BellRing,
  Bot,
  Check,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  FileDown,
  FileSearch,
  Filter,
  HardHat,
  History,
  KanbanSquare,
  ListChecks,
  Loader2,
  Lock,
  Mail,
  MessageSquare,
  Play,
  ScrollText,
  ShieldCheck,
  Sparkles,
  UserCheck,
  UserCog,
  Users,
  Zap,
} from 'lucide-react';
import usePageSEO from '@/hooks/usePageSEO';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { calculateOperatorPrice, type OperatorPlanSlug } from '@/lib/licensedOperatorPricing';
import { BF_PROMO_CODE, BF_PROMO_DEADLINE, BF_PROMO_PRICE_CENTS } from '@/lib/blackFridayPromo';
import { fbqTrack } from '@/lib/metaPixel';
import OuvidoriaChatSimulation from '@/components/ouvidoria/OuvidoriaChatSimulation';
import OuvidoriaDashboardSimulation from '@/components/ouvidoria/OuvidoriaDashboardSimulation';

const brl = (c: number) => (c / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function useCountdown(target: string) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);
  const diff = Math.max(0, new Date(target).getTime() - now);
  return {
    ended: diff === 0,
    parts: [
      ['dias', Math.floor(diff / 86400000)],
      ['horas', Math.floor(diff / 3600000) % 24],
      ['min', Math.floor(diff / 60000) % 60],
      ['seg', Math.floor(diff / 1000) % 60],
    ] as [string, number][],
  };
}

const PLANS: {
  slug: OperatorPlanSlug;
  name: string;
  icon: typeof Bot;
  desc: string;
  features: string[];
  featured?: boolean;
}[] = [
  {
    slug: 'ouvidoria',
    name: 'Ouvidoria com IA',
    icon: Bot,
    featured: true,
    desc: 'Canal com a SOnIA: acolhimento, triagem e classificação automáticas.',
    features: [
      'Canal de denúncias com IA (SOnIA)',
      'Triagem e classificação automática',
      'Anonimato garantido (LGPD)',
      'Protocolo e acompanhamento',
      'Painel de gestão',
    ],
  },
  {
    slug: 'ouvidoria-smart',
    name: 'Ouvidoria Smart',
    icon: ClipboardList,
    desc: 'Formulário anônimo com protocolo e chave de acesso.',
    features: [
      'Formulário anônimo',
      'Protocolo + chave de acesso',
      'Anonimato garantido (LGPD)',
      'Painel de gestão',
      'Sem IA',
    ],
  },
];

const DIFFERENTIALS = [
  {
    icon: Bot,
    title: 'SOnIA — IA de acolhimento',
    desc: 'Conversa empática com o denunciante, faz as perguntas certas e estrutura o relato automaticamente.',
  },
  {
    icon: Lock,
    title: '100% anônimo + LGPD',
    desc: 'O relato pode ser feito sem login, nome ou e-mail. A identidade do denunciante não é solicitada pelo canal.',
  },
  {
    icon: FileSearch,
    title: 'Classificação automática por IA',
    desc: 'Assédio moral, sexual, discriminação e fraude: tipo, gravidade e urgência identificados em segundos.',
  },
  {
    icon: BellRing,
    title: 'Alerta imediato à comissão',
    desc: 'Casos críticos notificam o time responsável para que a apuração comece sem demora.',
  },
  {
    icon: MessageSquare,
    title: 'Diálogo anônimo contínuo',
    desc: 'Protocolo e chave de acesso permitem responder novas perguntas e acompanhar o caso sem se identificar.',
  },
  {
    icon: ScrollText,
    title: 'Relatórios para NR-01 e PGR',
    desc: 'Exporte evidências estruturadas para auditorias, comitê de compliance e Programa Psicossocial.',
  },
];

const BENEFITS = [
  'Conformidade com NR-01, Lei 14.457/22, Lei Anticorrupção e LGPD',
  'Redução de passivos trabalhistas e riscos de ações no MPT',
  'Evidência auditável de um ambiente psicologicamente seguro',
  'Insumos para o PGR Psicossocial',
  'Canal disponível 24/7 em qualquer dispositivo',
  'Trilha de auditoria completa: status, respostas e ações',
];

const PANEL_FEATURES = [
  {
    icon: KanbanSquare,
    title: 'Quadro de tarefas Kanban',
    desc: 'Cada denúncia vira tarefas com responsáveis, envolvidos, prazos e checklist. O histórico do caso acompanha cada movimentação.',
  },
  {
    icon: UserCog,
    title: 'Papéis: Gestor e Auditor',
    desc: 'Gestores tratam denúncias e criam tarefas. Auditores, jurídico e conselho podem apenas visualizar, sem alterar os registros.',
  },
  {
    icon: History,
    title: 'Log de acessos e alterações',
    desc: 'Trilha de auditoria com quem acessou, quando e o que mudou. Consultas por protocolo também ficam registradas.',
  },
  {
    icon: Lock,
    title: 'Notas internas privadas',
    desc: 'Registre informações exclusivas da equipe sem expô-las ao denunciante, mantendo a comunicação externa separada.',
  },
  {
    icon: Filter,
    title: 'Filtros por categoria',
    desc: 'Filtre por assédio, discriminação, fraude, conduta e outras categorias para localizar e priorizar casos críticos.',
  },
  {
    icon: FileDown,
    title: 'Histórico em PDF',
    desc: 'Exporte atualizações, notas e acessos de uma denúncia em PDF para auditorias, compliance e eSocial.',
  },
  {
    icon: Mail,
    title: 'Campanhas por e-mail',
    desc: 'Importe contatos por CSV, gerencie a lista e envie convites ao canal com o link direto e controle de duplicidades.',
  },
  {
    icon: UserCheck,
    title: 'Convite de colaboradores',
    desc: 'Convide pessoas para acessar o painel da empresa com o papel adequado e recebimento de boas-vindas por e-mail.',
  },
  {
    icon: ListChecks,
    title: 'Checklist por tarefa',
    desc: 'Monte checklists de apuração dentro de cada tarefa e registre o avanço no histórico do caso.',
  },
];

const FLOW_STEPS = [
  { icon: MessageSquare, title: 'Relato anônimo', text: 'O colaborador relata pelo chat com IA ou formulário, sem login.' },
  { icon: Bot, title: 'Triagem automática', text: 'Tipo, gravidade e urgência são identificados pela IA.' },
  { icon: BellRing, title: 'Comissão notificada', text: 'Os responsáveis recebem o caso para iniciar o tratamento.' },
  { icon: KanbanSquare, title: 'Apuração em tarefas', text: 'Responsáveis, prazos e checklists organizam a investigação.' },
  { icon: FileDown, title: 'Encerramento auditável', text: 'O histórico pode ser exportado em PDF para auditorias.' },
];

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className="text-center max-w-3xl mx-auto mb-12">
      <p className="font-mono text-xs uppercase tracking-[0.2em] text-bf-neon mb-4">// {eyebrow}</p>
      <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">{title}</h2>
      {description && <p className="text-bf-muted text-lg mt-5 leading-relaxed">{description}</p>}
    </div>
  );
}

export default function BlackFridayOuvidoria() {
  usePageSEO({
    title: 'Black Friday Ouvidoria SOIA | R$ 9,90/mês nos 3 primeiros meses',
    description: 'Black Friday SOIA: canal de ouvidoria e denúncias anônimas com IA por R$ 9,90/mês nos 3 primeiros meses. Conforme NR-01 e LGPD.',
  });
  const { toast } = useToast();
  const { ended, parts } = useCountdown(BF_PROMO_DEADLINE);
  const [employees, setEmployees] = useState('50');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', company_name: '', employee_count: '', message: '' });
  const count = Math.max(1, Math.round(Number(employees) || 0));

  const scrollToPlans = () => document.getElementById('planos-black-friday')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const scrollToForm = () => document.getElementById('contato-black-friday')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const go = (slug: OperatorPlanSlug, name: string) => {
    try {
      fbqTrack('InitiateCheckout', { content_name: `${name} — Black Friday`, content_category: 'ouvidoria', currency: 'BRL', value: 9.9 });
    } catch {
      // O checkout não depende do rastreamento.
    }
    window.location.href = `/contratar?plano=${slug}&ciclo=monthly&vidas=${count}&promo=${BF_PROMO_CODE}`;
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!form.name || !form.email || !form.phone) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha nome, e-mail e WhatsApp.', variant: 'destructive' });
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
        source: 'blackfriday_ouvidoria_landing',
      });
      if (error) throw error;
      try {
        fbqTrack('Lead', { content_name: 'Ouvidoria Black Friday — Solicitar Demonstração' });
      } catch {
        // O envio do formulário não depende do rastreamento.
      }
      setForm({ name: '', email: '', phone: '', company_name: '', employee_count: '', message: '' });
      setSubmitted(true);
      toast({ title: 'Solicitação enviada!', description: 'Nosso especialista entrará em contato.' });
    } catch (error) {
      toast({
        title: 'Erro ao enviar',
        description: error instanceof Error ? error.message : 'Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const whatsappUrl = `https://wa.me/5511999406560?text=${encodeURIComponent('Olá! Quero saber mais sobre a oferta de Black Friday da Ouvidoria SOIA.')}`;
  const inputClass = 'mt-1.5 w-full h-11 rounded-lg bg-bf-bg/70 border border-bf-fg/15 px-3 text-sm text-bf-fg placeholder:text-bf-muted/60 focus:outline-none focus:border-bf-neon';

  return (
    <div className="min-h-screen bg-bf-bg text-bf-fg overflow-hidden relative">
      <div className="pointer-events-none fixed inset-0 opacity-[0.07] [background-image:linear-gradient(hsl(var(--bf-neon))_1px,transparent_1px),linear-gradient(90deg,hsl(var(--bf-neon))_1px,transparent_1px)] [background-size:48px_48px]" />
      <div className="pointer-events-none absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-bf-neon/20 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 -right-40 w-[480px] h-[480px] rounded-full bg-bf-hot/20 blur-3xl" />

      <header className="relative z-10 max-w-6xl mx-auto px-4 py-6 flex items-center justify-between">
        <a href="/ouvidoria" aria-label="Conhecer a Ouvidoria SOIA">
          <img src="/lovable-uploads/Logo_SOIA.png" alt="SOIA" className="h-9 brightness-0 invert" />
        </a>
        <span className="font-mono text-xs text-bf-muted">// black_friday.2026</span>
      </header>

      <main className="relative z-10">
        <section className="max-w-6xl mx-auto px-4 pt-10 pb-16 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-bf-neon/40 bg-bf-neon/10 font-mono text-xs tracking-widest text-bf-neon mb-8">
            <Zap className="h-3.5 w-3.5" /> OFERTA POR TEMPO LIMITADO
          </div>
          <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-none">
            BLACK<span className="text-transparent bg-clip-text bg-gradient-to-r from-bf-neon to-bf-hot">FRIDAY</span>
          </h1>
          <p className="mt-6 text-xl md:text-2xl text-bf-muted max-w-2xl mx-auto">Qualquer plano de ouvidoria por apenas</p>
          <p className="mt-2 text-7xl md:text-8xl font-black text-bf-neon drop-shadow-[0_0_30px_hsl(var(--bf-neon)/0.5)]">
            R$ 9,90<span className="text-2xl md:text-3xl text-bf-fg font-bold">/mês</span>
          </p>
          <p className="mt-2 text-xs text-bf-muted">*nos 3 primeiros meses</p>

          <div className="mt-10 flex justify-center gap-3">
            {ended ? (
              <p className="font-mono text-bf-hot">Oferta encerrada.</p>
            ) : (
              parts.map(([label, value]) => (
                <div key={label} className="w-20 md:w-24 py-3 rounded-xl border border-bf-neon/30 bg-bf-surface/80 backdrop-blur">
                  <div className="font-mono text-3xl md:text-4xl font-bold">{String(value).padStart(2, '0')}</div>
                  <div className="text-[10px] uppercase tracking-widest text-bf-muted">{label}</div>
                </div>
              ))
            )}
          </div>
          <button onClick={scrollToPlans} className="mt-10 inline-flex items-center gap-2 rounded-xl px-8 py-4 font-bold bg-gradient-to-r from-bf-neon to-bf-hot text-bf-bg hover:opacity-90 transition">
            Aproveitar a oferta <ArrowRight className="h-5 w-5" />
          </button>
        </section>

        <section id="planos-black-friday" className="max-w-5xl mx-auto px-4 pb-20 scroll-mt-6">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10">
            <label htmlFor="bf-emp" className="text-sm text-bf-muted">Quantos colaboradores sua empresa tem?</label>
            <input
              id="bf-emp"
              type="number"
              min={1}
              value={employees}
              onChange={(event) => setEmployees(event.target.value)}
              className="w-28 rounded-lg bg-bf-surface border border-bf-neon/30 px-3 py-2 text-center font-mono text-bf-fg focus:outline-none focus:border-bf-neon"
            />
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {PLANS.map((plan) => {
              const regular = calculateOperatorPrice(plan.slug, count, 'monthly').monthlyCents;
              const Icon = plan.icon;
              return (
                <div key={plan.slug} className={`relative rounded-2xl p-7 bg-bf-surface/80 backdrop-blur border ${plan.featured ? 'border-bf-neon shadow-[0_0_40px_-10px_hsl(var(--bf-neon)/0.6)]' : 'border-bf-fg/10'}`}>
                  {plan.featured && <span className="absolute -top-3 left-7 px-3 py-0.5 rounded-full bg-bf-neon text-bf-bg text-[11px] font-bold uppercase">Mais completo</span>}
                  <Icon className="h-8 w-8 text-bf-neon mb-4" />
                  <h2 className="text-2xl font-bold">{plan.name}</h2>
                  <p className="text-sm text-bf-muted mt-1 mb-5">{plan.desc}</p>
                  <p className="text-sm text-bf-muted line-through">{brl(regular)}/mês</p>
                  <p className="text-5xl font-black text-bf-neon">{brl(BF_PROMO_PRICE_CENTS)}<span className="text-lg text-bf-fg">/mês</span></p>
                  <p className="text-[11px] text-bf-muted mt-1">*nos 3 primeiros meses. Depois, {brl(regular)}/mês.</p>
                  <ul className="mt-6 space-y-2">
                    {plan.features.map((feature) => <li key={feature} className="flex gap-2 text-sm"><Check className="h-4 w-4 text-bf-neon shrink-0 mt-0.5" />{feature}</li>)}
                  </ul>
                  <button disabled={ended} onClick={() => go(plan.slug, plan.name)} className="mt-7 w-full rounded-xl py-3.5 font-bold bg-gradient-to-r from-bf-neon to-bf-hot text-bf-bg hover:opacity-90 disabled:opacity-40 transition">
                    Garantir por R$ 9,90
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-12 grid sm:grid-cols-3 gap-4 text-sm">
            {[
              [ShieldCheck, 'NR-01 e LGPD', 'Canal estruturado para apoiar a conformidade.'],
              [Lock, '100% anônimo', 'Sem login, nome ou e-mail do denunciante.'],
              [CreditCard, 'Cancele quando quiser', 'Sem multa, direto com a gente.'],
            ].map(([Icon, title, description]: any) => (
              <div key={title} className="rounded-xl border border-bf-fg/10 bg-bf-surface/60 p-5">
                <Icon className="h-5 w-5 text-bf-hot mb-2" />
                <p className="font-semibold">{title}</p>
                <p className="text-bf-muted">{description}</p>
              </div>
            ))}
          </div>

          <p className="mt-10 text-[11px] text-bf-muted text-center max-w-3xl mx-auto leading-relaxed">
            Condições: oferta válida para novas assinaturas mensais dos planos Ouvidoria e Ouvidoria Smart contratadas até 30/11/2026, com pagamento por cartão de crédito.
            R$ 9,90/mês nos 3 primeiros meses. A partir do 4º mês, a cobrança passa automaticamente ao valor normal do plano conforme o número de colaboradores, salvo cancelamento antes da 4ª cobrança.
          </p>
        </section>

        <section className="border-y border-bf-fg/10 bg-bf-surface/40 py-20 px-4">
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-bf-neon mb-4">// o que é a ouvidoria</p>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">Um canal seguro para ouvir, apurar e agir</h2>
              <p className="text-lg text-bf-muted mt-6 leading-relaxed">
                A Ouvidoria SOIA permite que colaboradores e terceiros relatem assédio, discriminação, fraudes, conflitos e riscos à segurança de forma anônima. Sua empresa recebe os relatos em um painel organizado e conduz cada caso com registro de todas as etapas.
              </p>
              <p className="text-bf-muted mt-4 leading-relaxed">
                Você pode escolher a conversa acolhedora com a SOnIA ou o formulário direto da Ouvidoria Smart. Nos dois planos, o denunciante recebe um protocolo para acompanhar o andamento sem revelar sua identidade.
              </p>
              <button onClick={scrollToPlans} className="mt-8 inline-flex items-center gap-2 font-bold text-bf-neon hover:text-bf-hot transition">
                Escolher meu canal <ArrowRight className="h-5 w-5" />
              </button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { icon: Bot, text: 'IA de acolhimento exclusiva' },
                { icon: Lock, text: 'Anonimato e privacidade' },
                { icon: Zap, text: 'Ativação em minutos' },
                { icon: ShieldCheck, text: 'Apoio à NR-01 e Lei 14.457' },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="rounded-xl border border-bf-neon/20 bg-bf-bg/60 p-5">
                  <Icon className="h-7 w-7 text-bf-neon mb-4" />
                  <p className="font-semibold">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <SectionHeading
              eyebrow="diferenciais"
              title="Muito mais que um formulário de denúncias"
              description="A SOIA combina acolhimento, classificação, gestão e evidências em uma única plataforma."
            />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {DIFFERENTIALS.map((item, index) => (
                <article key={item.title} className="group rounded-2xl border border-bf-fg/10 bg-bf-surface/60 p-7 hover:border-bf-neon/50 hover:-translate-y-1 transition-all">
                  <div className="flex items-center justify-between mb-5">
                    <item.icon className="h-8 w-8 text-bf-neon" />
                    <span className="font-mono text-xs text-bf-muted">0{index + 1}</span>
                  </div>
                  <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                  <p className="text-sm text-bf-muted leading-relaxed">{item.desc}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4 border-y border-bf-neon/20 bg-bf-surface/40 relative overflow-hidden">
          <div className="pointer-events-none absolute top-0 left-0 w-96 h-96 bg-bf-neon/10 rounded-full blur-3xl" />
          <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-bf-neon mb-4">// demonstração ao vivo</p>
              <h2 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">Assim é uma denúncia com a <span className="text-bf-neon">SOnIA</span></h2>
              <p className="text-lg text-bf-muted mt-6 leading-relaxed">
                A SOnIA acolhe, faz as perguntas certas e estrutura o relato sem solicitar a identidade de quem está denunciando.
              </p>
              <ul className="space-y-3 mt-8">
                {[
                  'Conversa empática e orientada',
                  'Classificação automática por tipo e gravidade',
                  'Protocolo anônimo para retorno do denunciante',
                  'Comissão notificada nos casos críticos',
                ].map((text) => (
                  <li key={text} className="flex items-start gap-3 text-bf-fg/90">
                    <CheckCircle2 className="h-5 w-5 text-bf-neon mt-0.5 shrink-0" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
            </div>
            <OuvidoriaChatSimulation />
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="max-w-5xl mx-auto">
            <SectionHeading eyebrow="vídeo" title="Veja como funciona na prática" description="Conheça o caminho de uma denúncia, do primeiro relato até a gestão no painel." />
            <div className="relative w-full max-w-4xl mx-auto aspect-video rounded-2xl overflow-hidden shadow-2xl border border-bf-neon/40 bg-bf-surface">
              <iframe
                className="absolute inset-0 h-full w-full"
                src="https://www.youtube.com/embed/mm-l_pK6UGE?rel=0&modestbranding=1"
                title="Veja como funciona nossa ouvidoria na prática"
                loading="lazy"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                allowFullScreen
                referrerPolicy="strict-origin-when-cross-origin"
              />
            </div>
          </div>
        </section>

        <section className="py-20 px-4 border-y border-bf-fg/10 bg-bf-surface/40">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <div>
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-bf-neon mb-4">// por que agir agora</p>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight leading-tight">Proteção jurídica e cultura saudável em uma única plataforma</h2>
              <p className="text-bf-muted mt-6 text-lg leading-relaxed">
                Mais do que receber relatos: um sistema completo de gestão ética que ajuda a reduzir riscos, fortalece a confiança do time e organiza o compliance.
              </p>
              <button onClick={scrollToPlans} className="mt-8 inline-flex items-center gap-2 rounded-xl px-7 py-3.5 font-bold bg-bf-neon text-bf-bg hover:opacity-90 transition">
                Quero ativar meu canal <ArrowRight className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              {BENEFITS.map((benefit) => (
                <div key={benefit} className="flex items-start gap-3 p-4 rounded-xl bg-bf-bg/60 border border-bf-fg/10">
                  <CheckCircle2 className="h-6 w-6 text-bf-neon mt-0.5 shrink-0" />
                  <span className="text-bf-fg/90 font-medium">{benefit}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <SectionHeading
              eyebrow="painel de gestão completo"
              title="Cada denúncia vira um caso gerenciado de ponta a ponta"
              description="Tarefas, prazos, auditoria, papéis e comunicação anônima em um só painel."
            />
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {PANEL_FEATURES.map((feature) => (
                <article key={feature.title} className="rounded-2xl border border-bf-fg/10 bg-bf-surface/60 p-6 hover:border-bf-hot/50 transition-colors">
                  <feature.icon className="h-7 w-7 text-bf-hot mb-4" />
                  <h3 className="font-bold text-lg mb-2">{feature.title}</h3>
                  <p className="text-sm text-bf-muted leading-relaxed">{feature.desc}</p>
                </article>
              ))}
            </div>

            <div className="mt-20">
              <SectionHeading eyebrow="painel em funcionamento" title="Sua equipe vê tudo o que precisa" description="Fila de denúncias, tarefas e atividades recentes em uma visão operacional." />
              <OuvidoriaDashboardSimulation />
            </div>

            <div className="mt-20">
              <SectionHeading eyebrow="fluxo de trabalho" title="Do relato ao encerramento auditável" description="Um processo transparente que protege o denunciante e organiza a atuação da empresa." />
              <div className="grid md:grid-cols-5 gap-4">
                {FLOW_STEPS.map((step, index) => (
                  <div key={step.title} className="rounded-xl border border-bf-fg/10 bg-bf-surface/60 p-5 h-full">
                    <div className="flex items-center justify-between mb-4">
                      <span className="w-8 h-8 rounded-full bg-bf-neon text-bf-bg text-xs font-black flex items-center justify-center">{index + 1}</span>
                      <step.icon className="h-5 w-5 text-bf-neon" />
                    </div>
                    <p className="font-bold">{step.title}</p>
                    <p className="text-xs text-bf-muted mt-2 leading-relaxed">{step.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 px-4 border-y border-bf-neon/20 bg-bf-surface/40">
          <div className="max-w-5xl mx-auto grid lg:grid-cols-5 gap-10 items-center">
            <div className="lg:col-span-3">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-bf-neon mb-4">// sst e assessorias</p>
              <h2 className="text-3xl md:text-4xl font-black tracking-tight">Quer oferecer a Ouvidoria aos seus clientes?</h2>
              <p className="text-lg text-bf-muted mt-5 leading-relaxed">
                Empresas de SST e assessorias podem conhecer as condições para parceiros e ampliar a carteira com uma solução pronta e segura.
              </p>
              <ul className="grid sm:grid-cols-2 gap-3 mt-7">
                {['Condições para parceiros', 'Canal white-label', 'Treinamento e materiais', 'Comissões recorrentes'].map((text) => (
                  <li key={text} className="flex items-center gap-2 text-sm"><CheckCircle2 className="h-5 w-5 text-bf-neon shrink-0" />{text}</li>
                ))}
              </ul>
              <button onClick={scrollToForm} className="mt-8 inline-flex items-center gap-2 font-bold text-bf-neon hover:text-bf-hot transition">
                Quero ser parceiro SOIA <ArrowRight className="h-5 w-5" />
              </button>
            </div>
            <div className="lg:col-span-2 flex justify-center">
              <div className="w-48 h-48 rounded-full bg-bf-neon/10 border border-bf-neon/40 shadow-[0_0_60px_-10px_hsl(var(--bf-neon)/0.5)] flex items-center justify-center">
                <div className="text-center">
                  <HardHat className="h-16 w-16 text-bf-neon mx-auto mb-2" />
                  <Users className="h-10 w-10 text-bf-fg mx-auto" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="contato-black-friday" className="py-20 px-4 scroll-mt-6">
          <div className="max-w-3xl mx-auto">
            <SectionHeading eyebrow="fale com um especialista" title="Prefere uma demonstração antes de decidir?" description="Deixe seus dados e nosso time entra em contato para tirar dúvidas e mostrar a plataforma." />
            <div className="rounded-2xl border border-bf-neon/30 bg-bf-surface/80 p-6 md:p-8 shadow-[0_0_50px_-20px_hsl(var(--bf-neon)/0.5)]">
              {submitted ? (
                <div className="text-center py-6">
                  <CheckCircle2 className="h-14 w-14 text-bf-neon mx-auto mb-4" />
                  <h3 className="text-2xl font-black">Solicitação enviada com sucesso!</h3>
                  <p className="text-sm text-bf-muted mt-3 mb-6">Nosso especialista entrará em contato. Se preferir, fale agora pelo WhatsApp.</p>
                  <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center gap-2 w-full rounded-xl py-4 font-bold bg-bf-neon text-bf-bg hover:opacity-90 transition">
                    Falar agora no WhatsApp <ArrowRight className="h-5 w-5" />
                  </a>
                  <button type="button" onClick={() => setSubmitted(false)} className="mt-4 text-xs text-bf-muted underline underline-offset-4">Enviar outra solicitação</button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <label className="text-xs uppercase tracking-wider text-bf-fg font-bold">Nome *
                      <input name="name" required value={form.name} onChange={handleChange} placeholder="Seu nome completo" className={inputClass} />
                    </label>
                    <label className="text-xs uppercase tracking-wider text-bf-fg font-bold">E-mail corporativo *
                      <input name="email" type="email" required value={form.email} onChange={handleChange} placeholder="seu@empresa.com.br" className={inputClass} />
                    </label>
                    <label className="text-xs uppercase tracking-wider text-bf-fg font-bold">WhatsApp *
                      <input name="phone" required value={form.phone} onChange={handleChange} placeholder="(11) 99999-9999" className={inputClass} />
                    </label>
                    <label className="text-xs uppercase tracking-wider text-bf-fg font-bold">Empresa
                      <input name="company_name" value={form.company_name} onChange={handleChange} className={inputClass} />
                    </label>
                    <label className="text-xs uppercase tracking-wider text-bf-fg font-bold">Nº de colaboradores
                      <input name="employee_count" value={form.employee_count} onChange={handleChange} placeholder="Ex.: 50" className={inputClass} />
                    </label>
                    <label className="text-xs uppercase tracking-wider text-bf-fg font-bold">Mensagem
                      <textarea name="message" value={form.message} onChange={handleChange} placeholder="Conte sua necessidade" className={`${inputClass} min-h-11 py-3 resize-none`} />
                    </label>
                  </div>
                  <button type="submit" disabled={loading} className="w-full rounded-xl py-4 font-bold bg-gradient-to-r from-bf-neon to-bf-hot text-bf-bg hover:opacity-90 disabled:opacity-50 transition inline-flex items-center justify-center gap-2">
                    {loading ? <><Loader2 className="h-5 w-5 animate-spin" /> Enviando...</> : <>Quero falar com um especialista <ArrowRight className="h-5 w-5" /></>}
                  </button>
                  <p className="flex items-center justify-center gap-2 text-xs text-bf-muted"><ShieldCheck className="h-4 w-4 text-bf-neon" /> Seus dados protegidos · LGPD · Sem spam</p>
                </form>
              )}
            </div>
          </div>
        </section>

        <section className="pb-20 px-4 text-center">
          <div className="max-w-4xl mx-auto rounded-2xl border border-bf-neon/40 bg-bf-neon/10 p-8 md:p-12">
            <Sparkles className="h-9 w-9 text-bf-neon mx-auto mb-4" />
            <h2 className="text-3xl md:text-4xl font-black">Ative sua Ouvidoria por R$ 9,90/mês</h2>
            <p className="text-xs text-bf-muted mt-2">*nos 3 primeiros meses. Depois, cobrança mensal no valor normal do plano.</p>
            <button onClick={scrollToPlans} disabled={ended} className="mt-7 inline-flex items-center gap-2 rounded-xl px-8 py-4 font-bold bg-gradient-to-r from-bf-neon to-bf-hot text-bf-bg hover:opacity-90 disabled:opacity-40 transition">
              Garantir a oferta <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </section>
      </main>

      <footer className="relative z-10 border-t border-bf-fg/10 py-6 px-4">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-bf-muted">
          <span>© {new Date().getFullYear()} SOIA · Todos os direitos reservados</span>
          <span className="inline-flex items-center gap-2"><ShieldCheck className="h-3.5 w-3.5 text-bf-neon" /> LGPD · NR-01 · Lei 14.457/22</span>
        </div>
      </footer>
    </div>
  );
}
