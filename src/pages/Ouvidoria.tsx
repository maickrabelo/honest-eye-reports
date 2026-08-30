import React, { useState, useEffect, useRef } from 'react';
import soniaAvatar from '@/assets/sonia-avatar.png';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ShieldCheck,
  MessageSquare,
  Lock,
  Bot,
  FileSearch,
  BellRing,
  UserCheck,
  ClipboardList,
  ScrollText,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Loader2,
  AlertTriangle,
  Zap,
  HardHat,
  Users,
  ListChecks,
  KanbanSquare,
  History,
  Filter,
  UserCog,
  FileDown,
  Mail,
} from 'lucide-react';
import usePageSEO from '@/hooks/usePageSEO';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { fbqTrack } from '@/lib/metaPixel';
import OuvidoriaDashboardSimulation from '@/components/ouvidoria/OuvidoriaDashboardSimulation';
const logoSoia = '/lovable-uploads/Logo_SOIA.png';

type ChatMsg = { from: 'sonia' | 'user'; text: string };
const CHAT_SCRIPT: ChatMsg[] = [
  { from: 'sonia', text: 'Olá 💛 Sou a SOnIA, sua ouvidora virtual. Aqui você é 100% anônimo — nem a empresa, nem eu sabemos quem você é. Quer relatar algo?' },
  { from: 'user', text: 'Sim… meu gestor tem feito comentários constrangedores nas reuniões.' },
  { from: 'sonia', text: 'Sinto muito que esteja passando por isso. Você está seguro(a) aqui. Esses comentários acontecem com que frequência?' },
  { from: 'user', text: 'Praticamente toda semana. Outras colegas também ouviram.' },
  { from: 'sonia', text: 'Entendi. Isso configura um padrão importante para a apuração. Você se sente confortável em descrever um exemplo recente?' },
  { from: 'user', text: 'Semana passada ele fez uma piada de cunho sexual na frente do time.' },
  { from: 'sonia', text: '✅ Relato classificado: Assédio moral/sexual · Gravidade ALTA · Padrão recorrente com testemunhas. Estou notificando a comissão agora. Guarde seu protocolo: #OV-2026-8471.' },
];

function ChatSimulation() {
  const [visible, setVisible] = useState<ChatMsg[]>([]);
  const [typing, setTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let i = 0;
    let cancelled = false;
    const timers: number[] = [];
    const later = (fn: () => void, ms: number) => {
      timers.push(window.setTimeout(fn, ms));
    };
    const run = () => {
      if (cancelled) return;
      if (document.hidden) {
        later(run, 1000);
        return;
      }
      if (i >= CHAT_SCRIPT.length) {
        later(() => { if (!cancelled) { setVisible([]); i = 0; run(); } }, 5000);
        return;
      }
      setTyping(true);
      later(() => {
        if (cancelled) return;
        const nextMessage = CHAT_SCRIPT[i];
        if (!nextMessage) {
          setTyping(false);
          later(run, 1000);
          return;
        }
        setTyping(false);
        setVisible(v => [...v, nextMessage]);
        i++;
        later(run, 1400);
      }, 1200);
    };
    run();
    return () => {
      cancelled = true;
      timers.forEach(t => window.clearTimeout(t));
    };
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [visible, typing]);


  return (
    <div className="relative max-w-2xl mx-auto">
      <div className="absolute -inset-2 bg-gradient-to-br from-audit-secondary/40 to-audit-primary/40 rounded-3xl blur-xl opacity-50" />
      <div className="relative bg-card rounded-2xl border-2 border-audit-secondary/30 shadow-2xl overflow-hidden">
        {/* header */}
        <div className="bg-audit-primary p-4 flex items-center gap-3">
          <div className="relative">
            <img src={soniaAvatar} alt="SOnIA" className="w-11 h-11 rounded-full border-2 border-audit-secondary" />
            <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-green-400 rounded-full border-2 border-audit-primary" />
          </div>
          <div className="flex-1">
            <div className="font-bold text-white text-sm">SOnIA — Ouvidoria</div>
            <div className="text-[11px] text-audit-secondary flex items-center gap-1.5">
              <Lock className="h-3 w-3" /> Conversa criptografada · 100% anônima
            </div>
          </div>
          <Badge className="bg-audit-secondary text-audit-primary border-0 font-bold text-[10px]">AO VIVO</Badge>
        </div>
        {/* messages */}
        <div ref={scrollRef} className="bg-muted/30 p-4 h-[420px] overflow-y-auto space-y-3">
          {visible.map((m, idx) => (
            <div key={idx} className={`flex gap-2 animate-fade-in ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
              {m.from === 'sonia' && (
                <img src={soniaAvatar} alt="" className="w-7 h-7 rounded-full flex-shrink-0 mt-1" />
              )}
              <div
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  m.from === 'user'
                    ? 'bg-audit-primary text-white rounded-br-sm'
                    : 'bg-card border border-border text-foreground rounded-bl-sm shadow-sm'
                }`}
              >
                {m.text}
              </div>
            </div>
          ))}
          {typing && (
            <div className="flex gap-2 justify-start animate-fade-in">
              <img src={soniaAvatar} alt="" className="w-7 h-7 rounded-full flex-shrink-0 mt-1" />
              <div className="bg-card border border-border rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-audit-secondary animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-audit-secondary animate-bounce" style={{ animationDelay: '0.15s' }} />
                  <span className="w-2 h-2 rounded-full bg-audit-secondary animate-bounce" style={{ animationDelay: '0.3s' }} />
                </div>
              </div>
            </div>
          )}
        </div>
        {/* fake input */}
        <div className="p-3 bg-card border-t border-border flex items-center gap-2">
          <div className="flex-1 h-10 rounded-full bg-muted/60 flex items-center px-4 text-xs text-muted-foreground">
            Digite sua mensagem com segurança...
          </div>
          <div className="w-10 h-10 rounded-full bg-audit-secondary flex items-center justify-center">
            <ArrowRight className="h-4 w-4 text-white" />
          </div>
        </div>
      </div>
    </div>
  );
}

const Ouvidoria = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const [form, setForm] = useState({
    name: '', email: '', phone: '', company_name: '', employee_count: '', message: '',
  });

  usePageSEO({
    title: 'Canal de Ouvidoria com IA | Denúncias Anônimas LGPD | SOIA',
    description:
      'Canal de ouvidoria 100% anônimo com Inteligência Artificial. Receba, classifique e trate denúncias de assédio, discriminação e riscos psicossociais em conformidade com NR-01 e LGPD.',
  });

  const scrollToForm = () => {
    document.getElementById('form-captura')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const scrollToPlans = () => {
    document.getElementById('planos-ouvidoria')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const goToCheckout = (slug: string, planName: string, priceBRL: number) => {
    try {
      fbqTrack('InitiateCheckout', {
        content_name: planName,
        content_category: 'ouvidoria',
        currency: 'BRL',
        value: priceBRL,
      });
    } catch (err) {
      console.warn('fbqTrack falhou:', err);
    }
    window.location.href = `/contratar?plano=${slug}&ciclo=monthly`;
  };


  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
  };

  const whatsappUrl = `https://wa.me/5511999406560?text=${encodeURIComponent(
    'Olá! Gostaria de agendar uma demonstração do canal de Ouvidoria da SOIA.'
  )}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.phone) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha nome, email e telefone.', variant: 'destructive' });
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
        source: 'ouvidoria_landing',
      });
      if (error) throw error;
      try { fbqTrack('Lead', { content_name: 'Ouvidoria — Solicitar Demonstração' }); } catch { /* noop */ }
      toast({ title: 'Solicitação enviada!', description: 'Nosso especialista entrará em contato.' });
      setForm({ name: '', email: '', phone: '', company_name: '', employee_count: '', message: '' });
      setSubmitted(true);
    } catch (err: any) {
      toast({ title: 'Erro ao enviar', description: err.message || 'Tente novamente.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };


  const differentials = [
    {
      icon: Bot,
      title: 'SOnIA — a única IA de acolhimento do Brasil',
      desc: 'Conversa empática com o denunciante, faz as perguntas certas e estrutura o relato automaticamente. Nenhum concorrente tem.',
    },
    {
      icon: Lock,
      title: '100% Anônimo + LGPD',
      desc: 'Criptografia ponta-a-ponta. A identidade do denunciante é blindada mesmo para o gestor da empresa.',
    },
    {
      icon: FileSearch,
      title: 'Classificação automática por IA',
      desc: 'Assédio moral, sexual, discriminação, fraude — tipo, gravidade e urgência identificados em segundos.',
    },
    {
      icon: BellRing,
      title: 'Alerta imediato à comissão',
      desc: 'Casos críticos notificam o comitê em tempo real. Ninguém fica sabendo depois da imprensa.',
    },
    {
      icon: MessageSquare,
      title: 'Diálogo anônimo contínuo',
      desc: 'Protocolo + chave de acesso permitem que o denunciante responda novas perguntas sem se identificar.',
    },
    {
      icon: ScrollText,
      title: 'Relatórios prontos para NR-01 e PGR',
      desc: 'Exporte evidências estruturadas para auditoria MPT, comitê de compliance e Programa Psicossocial.',
    },
  ];

  const painelFeatures = [
    {
      icon: KanbanSquare,
      title: 'Quadro de tarefas Kanban',
      desc: 'Cada denúncia vira tarefas com responsáveis, envolvidos, prazos e checklist interno. Arraste e solte entre estágios — o histórico da denúncia é atualizado automaticamente.',
    },
    {
      icon: UserCog,
      title: 'Papéis: Gestor e Auditor',
      desc: 'Gestores editam denúncias, criam tarefas e notas. Auditores (jurídico, conselho, auditoria externa) apenas visualizam — sem poder alterar nada.',
    },
    {
      icon: History,
      title: 'Log de acessos e alterações',
      desc: 'Trilha de auditoria completa: quem acessou, quando e o que mudou. Consultas por protocolo também ficam registradas com data e horário. Só o admin principal da empresa vê.',
    },
    {
      icon: Lock,
      title: 'Notas internas privadas',
      desc: 'Anote o que só o time precisa ver, sem expor ao denunciante. O nome de quem atualizou aparece só no painel interno — o denunciante vê apenas a mensagem e a data.',
    },
    {
      icon: Filter,
      title: 'Filtros por categoria',
      desc: 'Filtre por assédio, discriminação, fraude, conduta e mais. Encontre rapidamente os casos críticos e priorize o tratamento.',
    },
    {
      icon: FileDown,
      title: 'Histórico em PDF para auditoria',
      desc: 'Exporte todo o histórico de uma denúncia (atualizações, notas, acessos) em PDF para MPT, compliance e eSocial.',
    },
    {
      icon: Mail,
      title: 'Campanhas por e-mail',
      desc: 'Importe uma lista CSV de e-mails, gerencie contatos cadastrados e dispare o convite ao canal com o link direto. Detecta duplicidades automaticamente.',
    },
    {
      icon: UserCheck,
      title: 'Convite de colaboradores',
      desc: 'Convide e-mails para acessar o painel de ouvidoria da empresa. O convidado recebe um e-mail de boas-vindas, cria a conta e passa a ter acesso com o papel definido.',
    },
    {
      icon: ListChecks,
      title: 'Checklist interno por tarefa',
      desc: 'Monte checklists de apuração dentro de cada tarefa. Marque itens conforme avança — tudo fica registrado no histórico do caso.',
    },
  ];

  const fluxoSteps = [
    { icon: MessageSquare, title: 'Relato anônimo', text: 'O colaborador relata pelo chat com IA ou formulário, sem login.' },
    { icon: Bot, title: 'Triagem automática', text: 'Tipo, gravidade e urgência identificados em segundos pela IA.' },
    { icon: BellRing, title: 'Comissão notificada', text: 'Casos críticos alertam o time em tempo real.' },
    { icon: KanbanSquare, title: 'Apuração em tarefas', text: 'Responsáveis, prazos e checklists organizam a investigação.' },
    { icon: FileDown, title: 'Encerramento auditável', text: 'Histórico exportado em PDF para MPT e auditorias.' },
  ];



  const benefits = [
    'Conformidade com NR-01, Lei 14.457/22, Lei Anticorrupção e LGPD',
    'Redução drástica de passivos trabalhistas e ações no MPT',
    'Evidência auditável de ambiente psicologicamente seguro',
    'Insumos automáticos para o PGR Psicossocial',
    'Canal disponível 24/7 em qualquer dispositivo',
    'Trilha de auditoria completa (status, respostas, ações)',
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Minimal top bar — no login, no menu, no distractions */}
      <div className="border-b border-border/40 bg-background/80 backdrop-blur-sm sticky top-0 z-40">
        <div className="audit-container flex items-center justify-between py-3">
          <img src={logoSoia} alt="SOIA" className="h-8 md:h-9" />
          <div className="hidden sm:flex items-center gap-2 text-xs font-semibold text-audit-primary">
            <ShieldCheck className="h-4 w-4 text-audit-secondary" />
            Conforme NR-01 · LGPD
          </div>
        </div>
      </div>

      {/* URGÊNCIA TOP STRIP */}
      <div className="bg-audit-primary text-white py-2.5 border-b border-audit-secondary/30 overflow-hidden">
        <div className="audit-container flex items-center justify-center gap-2 text-xs md:text-sm font-semibold text-center">
          <AlertTriangle className="h-4 w-4 text-audit-secondary flex-shrink-0" />
          <span>
            NR-01 em vigor <span className="text-audit-secondary">MAI/2026</span> · Multas de até
            <span className="text-audit-secondary"> R$ 200.000</span> por omissão de canal
          </span>
        </div>
      </div>

      <main>
        {/* HERO — foco em contratar plano */}
        <section className="relative overflow-hidden bg-background">
          <div className="absolute top-0 right-0 w-[60%] h-[80%] bg-gradient-to-bl from-audit-secondary/10 via-audit-secondary/5 to-transparent blur-xl pointer-events-none" />
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-audit-primary/5 rounded-full blur-xl pointer-events-none" />

          <div className="audit-container relative z-10 py-14 md:py-24">
            <div className="max-w-4xl animate-fade-in">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-audit-primary text-white text-xs font-bold uppercase tracking-wider mb-6">
                <Sparkles className="h-4 w-4 text-audit-secondary" />
                <span>Canal de Ouvidoria com I.A.</span>
              </div>

              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-audit-primary leading-[1.05] mb-6 tracking-tight">
                Ative seu canal de ouvidoria em minutos e{' '}
                <span className="text-audit-secondary">proteja sua empresa</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl leading-relaxed">
                Contratação 100% online, sem burocracia. Escolha entre o canal com{' '}
                <strong className="text-audit-primary">SOnIA</strong> (IA de acolhimento) ou o{' '}
                <strong className="text-audit-primary">formulário anônimo Smart</strong>. Ambos em
                conformidade com NR-01 e LGPD.
              </p>

              {/* Highlight quick differentials */}
              <div className="grid sm:grid-cols-2 gap-3 mb-10 max-w-2xl">
                {[
                  { icon: Bot, txt: 'IA de acolhimento exclusiva' },
                  { icon: Lock, txt: '100% anônimo + LGPD' },
                  { icon: Zap, txt: 'Ativação em minutos' },
                  { icon: ShieldCheck, txt: 'Conforme NR-01 + Lei 14.457' },
                ].map(({ icon: Icon, txt }) => (
                  <div key={txt} className="flex items-center gap-2 text-sm font-semibold text-audit-primary">
                    <div className="w-8 h-8 rounded-lg bg-audit-secondary/15 flex items-center justify-center flex-shrink-0">
                      <Icon className="h-4 w-4 text-audit-secondary" />
                    </div>
                    {txt}
                  </div>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row items-start gap-4">
                <Button
                  size="lg"
                  onClick={scrollToPlans}
                  className="bg-audit-secondary hover:bg-audit-secondary/90 text-white font-bold px-8 py-6 text-base group shadow-lg shadow-audit-secondary/30"
                >
                  Escolher meu plano
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={scrollToForm}
                  className="border-audit-primary text-audit-primary hover:bg-audit-primary hover:text-white font-bold px-8 py-6 text-base"
                >
                  Falar com um especialista
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* DIFERENCIAIS — bloco de destaque */}
        <section className="py-20 px-4 bg-gradient-to-b from-muted/40 to-background">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-14">
              <Badge className="mb-4 bg-audit-primary text-white border-0 uppercase text-[10px] tracking-widest font-bold">
                O que ninguém mais tem
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold text-audit-primary mb-4 leading-tight">
                6 diferenciais que colocam a SOIA <span className="text-audit-secondary">à frente</span> de qualquer canal do mercado
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Enquanto outros são apenas um formulário de e-mail, a SOIA usa IA para acolher, classificar e proteger.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {differentials.map((f) => (
                <Card
                  key={f.title}
                  className="group hover:shadow-2xl hover:-translate-y-2 transition-all border-2 border-border hover:border-audit-secondary/50 bg-card"
                >
                  <CardContent className="p-7">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-audit-secondary to-audit-primary flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                      <f.icon className="h-7 w-7 text-white" />
                    </div>
                    <h3 className="font-bold text-lg text-audit-primary mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="text-center mt-12">
              <Button
                size="lg"
                onClick={scrollToPlans}
                className="bg-audit-primary hover:bg-audit-primary/90 text-white font-bold px-10 py-6 text-base group shadow-lg"
              >
                Ver planos e ativar agora
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </section>

        {/* SIMULAÇÃO CHAT SOnIA */}
        <section className="py-20 px-4 bg-audit-primary relative overflow-hidden">
          <div className="absolute top-0 left-0 w-96 h-96 bg-audit-secondary/20 rounded-full blur-xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-audit-secondary/10 rounded-full blur-xl pointer-events-none" />
          <div className="container mx-auto max-w-6xl relative z-10">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="text-white">
                <Badge className="mb-4 bg-audit-secondary text-audit-primary border-0 uppercase text-[10px] tracking-widest font-bold">
                  Veja funcionando ao vivo
                </Badge>
                <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
                  Assim é uma denúncia com a <span className="text-audit-secondary">SOnIA</span>
                </h2>
                <p className="text-lg text-white/80 mb-6 leading-relaxed">
                  Enquanto formulários frios afastam o denunciante, a SOnIA <strong className="text-white">acolhe, faz as perguntas certas e estrutura o relato</strong> — tudo em segundos, sem revelar identidade.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    'Conversa empática que aumenta o número de denúncias reais',
                    'Classificação automática por tipo e gravidade',
                    'Protocolo anônimo para retorno do denunciante',
                    'Comissão notificada em tempo real nos casos críticos',
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-3 text-white/90">
                      <CheckCircle2 className="h-5 w-5 text-audit-secondary mt-0.5 flex-shrink-0" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  size="lg"
                  onClick={scrollToPlans}
                  className="bg-audit-secondary hover:bg-audit-secondary/90 text-white font-bold px-8 py-6 group shadow-lg shadow-audit-secondary/40"
                >
                  Quero a SOnIA na minha empresa
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
              <div>
                <ChatSimulation />
              </div>
            </div>
          </div>
        </section>

        {/* BENEFÍCIOS */}
        <section className="py-20 px-4 bg-gradient-to-b from-muted/40 via-audit-secondary/5 to-muted/60 border-y border-audit-secondary/10">

          <div className="container mx-auto max-w-6xl">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div>
                <Badge className="mb-4 bg-audit-secondary/15 text-audit-secondary border-audit-secondary/30 uppercase text-[10px] tracking-widest font-bold">
                  Por que agir agora
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold text-audit-primary mb-6 leading-tight">
                  Proteção jurídica + cultura saudável em uma <span className="text-audit-secondary">única plataforma</span>
                </h2>
                <p className="text-muted-foreground mb-8 text-lg">
                  Mais do que um canal — um sistema completo de gestão ética que reduz passivos,
                  fortalece a confiança do time e blinda seu compliance.
                </p>
                <Button
                  size="lg"
                  onClick={scrollToPlans}
                  className="bg-audit-secondary hover:bg-audit-secondary/90 text-white font-bold px-8 py-6 text-base group shadow-lg"
                >
                  Ver planos exclusivos
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
              <div className="space-y-3">
                {benefits.map((b) => (
                  <div key={b} className="flex items-start gap-3 p-4 rounded-xl bg-card border-2 border-border hover:border-audit-secondary/40 transition-colors">
                    <CheckCircle2 className="h-6 w-6 text-audit-secondary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground font-medium">{b}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* RECURSOS DO PAINEL DE GESTÃO */}
        <section className="py-20 px-4 bg-background border-y border-border/60">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-14">
              <Badge className="mb-4 bg-audit-primary text-white border-0 uppercase text-[10px] tracking-widest font-bold">
                Painel de gestão completo
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold text-audit-primary mb-4 leading-tight">
                Muito mais que um canal: um <span className="text-audit-secondary">sistema de gestão ética</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Cada denúncia vira um caso gerenciado de ponta a ponta — com tarefas, prazos,
                auditoria, papéis e comunicação anônima, tudo em um só painel.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {painelFeatures.map((f) => (
                <Card
                  key={f.title}
                  className="group hover:shadow-xl hover:-translate-y-1 transition-all border-2 border-border hover:border-audit-secondary/40 bg-card"
                >
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-xl bg-audit-secondary/10 flex items-center justify-center mb-4 group-hover:bg-audit-secondary group-hover:scale-110 transition-all">
                      <f.icon className="h-6 w-6 text-audit-secondary group-hover:text-white transition-colors" />
                    </div>
                    <h3 className="font-bold text-base text-audit-primary mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Simulação do dashboard */}
            <div className="mt-16">
              <div className="text-center mb-10">
                <h3 className="text-2xl md:text-3xl font-bold text-audit-primary mb-3">
                  Veja o painel em <span className="text-audit-secondary">funcionamento</span>
                </h3>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Fila de denúncias, tarefas do caso e log de atividades — exatamente como a sua equipe vai operar.
                </p>
              </div>
              <OuvidoriaDashboardSimulation />
            </div>

            {/* Fluxo de trabalho visual */}
            <div className="mt-16">
              <div className="text-center mb-10">
                <h3 className="text-2xl md:text-3xl font-bold text-audit-primary mb-3">
                  Do relato ao <span className="text-audit-secondary">encerramento auditável</span>
                </h3>
                <p className="text-muted-foreground max-w-2xl mx-auto">
                  Um fluxo transparente que protege o denunciante e blinda a empresa juridicamente.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {fluxoSteps.map((s, i) => (
                  <div key={s.title} className="relative">
                    <div className="rounded-xl border-2 border-border bg-card p-5 h-full hover:border-audit-secondary/40 transition-colors">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="w-7 h-7 rounded-full bg-audit-secondary text-white text-xs font-bold flex items-center justify-center">
                          {i + 1}
                        </span>
                        <s.icon className="h-4 w-4 text-audit-secondary" />
                      </div>
                      <p className="font-bold text-sm text-audit-primary">{s.title}</p>
                      <p className="text-xs text-muted-foreground mt-1">{s.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* PLANOS — exclusivos desta página */}
        <section id="planos-ouvidoria" className="py-20 px-4 bg-background border-b border-border scroll-mt-24">
          <div className="container mx-auto max-w-5xl">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-audit-secondary/15 text-audit-secondary border-audit-secondary/30 uppercase text-[10px] tracking-widest font-bold">
                Planos exclusivos
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-audit-primary mb-3">
                Escolha seu canal de ouvidoria
              </h2>
              <p className="text-muted-foreground text-lg">
                Contratação 100% online. Ativação imediata após o pagamento.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Ouvidoria (com IA) */}
              <div className="relative rounded-2xl border-2 border-audit-secondary bg-card p-7 shadow-xl shadow-audit-secondary/10 flex flex-col">
                <Badge className="absolute -top-3 left-6 bg-audit-secondary text-white font-bold text-[10px] uppercase tracking-wider">
                  Mais completo
                </Badge>
                <div className="flex items-center gap-2 mb-1">
                  <Bot className="h-5 w-5 text-audit-secondary" />
                  <h3 className="text-xl font-bold text-audit-primary">Ouvidoria</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-5">
                  Canal com a SOnIA: conversa acolhedora, triagem e classificação automáticas.
                </p>
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-audit-primary">R$ 99</span>
                    <span className="text-muted-foreground text-sm">/mês</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">até 50 colaboradores</p>
                </div>
                <ul className="space-y-2.5 mb-7 flex-1">
                  {[
                    'Canal de denúncias com IA (SOnIA)',
                    'Triagem e classificação automática',
                    'Anonimato garantido (LGPD)',
                    'Protocolo e acompanhamento do relato',
                    'Painel de gestão das denúncias',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-audit-secondary mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  size="lg"
                  onClick={() => goToCheckout('ouvidoria', 'Ouvidoria', 99)}
                  className="w-full bg-audit-secondary hover:bg-audit-secondary/90 text-white font-bold py-6 group"
                >
                  Assinar Ouvidoria
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>

              {/* Ouvidoria Smart (sem IA) */}
              <div className="relative rounded-2xl border-2 border-border bg-card p-7 shadow-lg flex flex-col">
                <Badge className="absolute -top-3 left-6 bg-audit-primary text-white font-bold text-[10px] uppercase tracking-wider">
                  Melhor custo
                </Badge>
                <div className="flex items-center gap-2 mb-1">
                  <ClipboardList className="h-5 w-5 text-audit-primary" />
                  <h3 className="text-xl font-bold text-audit-primary">Ouvidoria Smart</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-5">
                  Formulário anônimo com protocolo e chave de acesso. Simples, direto e sem IA.
                </p>
                <div className="mb-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold text-audit-primary">R$ 39,90</span>
                    <span className="text-muted-foreground text-sm">/mês</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">até 50 colaboradores</p>
                </div>
                <ul className="space-y-2.5 mb-7 flex-1">
                  {[
                    'Canal de denúncias por formulário anônimo',
                    'Protocolo + chave de acesso para acompanhar',
                    'Anonimato garantido (LGPD)',
                    'Painel de gestão das denúncias',
                    'Sem inteligência artificial',
                  ].map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-foreground">
                      <CheckCircle2 className="h-4 w-4 text-audit-primary mt-0.5 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => goToCheckout('ouvidoria-smart', 'Ouvidoria Smart', 39.9)}
                  className="w-full border-2 border-audit-primary text-audit-primary hover:bg-audit-primary hover:text-white font-bold py-6 group"
                >
                  Assinar Ouvidoria Smart
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
            </div>

            <p className="text-center text-xs text-muted-foreground mt-6">
              Pagamento no cartão, PIX ou boleto · Cancele quando quiser
            </p>
          </div>
        </section>

        {/* SST / ASSESSORIA — direciona para formulário */}
        <section className="py-20 px-4 bg-audit-primary relative overflow-hidden">
          <div className="absolute top-0 left-0 w-96 h-96 bg-audit-secondary/20 rounded-full blur-xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-[28rem] h-[28rem] bg-audit-secondary/10 rounded-full blur-xl pointer-events-none" />
          <div className="container mx-auto max-w-5xl relative z-10">
            <div className="grid lg:grid-cols-5 gap-10 items-center">
              <div className="lg:col-span-3 text-white">
                <Badge className="mb-4 bg-audit-secondary text-audit-primary border-0 uppercase text-[10px] tracking-widest font-bold">
                  Para empresas de SST e assessorias
                </Badge>
                <h2 className="text-3xl md:text-4xl font-bold mb-4 leading-tight">
                  É empresa de SST ou Assessoria?
                </h2>
                <p className="text-lg text-white/80 mb-6 leading-relaxed">
                  Fale com a gente e conheça nossos planos especiais para oferecer o canal de
                  ouvidoria aos seus clientes. Seja parceiro SOIA e amplie sua carteira com uma
                  solução pronta, segura e em conformidade com a NR-01.
                </p>
                <ul className="space-y-3 mb-8">
                  {[
                    'Condições comerciais exclusivas para parceiros',
                    'Canal white-label para seus clientes',
                    'Treinamento e material de apoio',
                    'Comissões recorrentes por cliente ativo',
                  ].map((t) => (
                    <li key={t} className="flex items-start gap-3 text-white/90">
                      <CheckCircle2 className="h-5 w-5 text-audit-secondary mt-0.5 flex-shrink-0" />
                      <span>{t}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  size="lg"
                  onClick={scrollToForm}
                  className="bg-audit-secondary hover:bg-audit-secondary/90 text-white font-bold px-8 py-6 group shadow-lg shadow-audit-secondary/40"
                >
                  Quero ser parceiro SOIA
                  <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>
              <div className="lg:col-span-2 flex justify-center">
                <div className="relative">
                  <div className="absolute -inset-4 bg-audit-secondary/30 rounded-full blur-2xl" />
                  <div className="relative w-48 h-48 rounded-full bg-audit-secondary/20 border-4 border-audit-secondary/40 flex items-center justify-center">
                    <div className="text-center">
                      <HardHat className="h-16 w-16 text-audit-secondary mx-auto mb-2" />
                      <Users className="h-10 w-10 text-white mx-auto" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FORMULÁRIO DE CAPTURA — no final da página */}
        <section id="form-captura" className="py-20 px-4 bg-gradient-to-b from-muted/40 to-background scroll-mt-24">
          <div className="container mx-auto max-w-3xl">
            <div className="text-center mb-10">
              <Badge className="mb-4 bg-audit-primary text-white border-0 uppercase text-[10px] tracking-widest font-bold">
                Fale com um especialista
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-audit-primary mb-3">
                Prefere uma demonstração antes de decidir?
              </h2>
              <p className="text-muted-foreground text-lg">
                Preencha seus dados e nosso time entra em contato para tirar dúvidas e mostrar a plataforma.
              </p>
            </div>

            <div className="relative">
              <div className="absolute -inset-1 bg-gradient-to-br from-audit-secondary to-audit-primary rounded-3xl blur opacity-30" />
              <div className="relative bg-card rounded-2xl shadow-2xl border-2 border-audit-secondary/30 p-6 md:p-8">
                {submitted ? (
                  <div className="text-center py-6">
                    <div className="w-16 h-16 rounded-full bg-audit-secondary/15 flex items-center justify-center mx-auto mb-4">
                      <CheckCircle2 className="h-9 w-9 text-audit-secondary" />
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-audit-primary leading-tight mb-2">
                      Solicitação enviada com sucesso!
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6">
                      Nosso especialista vai te chamar no WhatsApp em minutos. Se preferir, fale agora mesmo com a gente.
                    </p>
                    <Button
                      asChild
                      size="lg"
                      className="w-full bg-audit-secondary hover:bg-audit-secondary/90 text-white font-bold h-14 text-base shadow-lg shadow-audit-secondary/30"
                    >
                      <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                        Falar agora no WhatsApp
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </a>
                    </Button>
                    <button
                      type="button"
                      onClick={() => setSubmitted(false)}
                      className="mt-4 text-xs text-muted-foreground underline underline-offset-4"
                    >
                      Enviar outra solicitação
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name" className="text-xs uppercase tracking-wider text-audit-primary font-bold">
                          Nome *
                        </Label>
                        <Input
                          id="name" name="name" required value={form.name} onChange={handleChange}
                          placeholder="Seu nome completo"
                          className="mt-1 h-11 bg-muted/40 border-border focus:border-audit-secondary"
                        />
                      </div>
                      <div>
                        <Label htmlFor="email" className="text-xs uppercase tracking-wider text-audit-primary font-bold">
                          E-mail corporativo *
                        </Label>
                        <Input
                          id="email" name="email" type="email" required value={form.email} onChange={handleChange}
                          placeholder="seu@empresa.com.br"
                          className="mt-1 h-11 bg-muted/40 border-border focus:border-audit-secondary"
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="phone" className="text-xs uppercase tracking-wider text-audit-primary font-bold">
                          WhatsApp *
                        </Label>
                        <Input
                          id="phone" name="phone" required value={form.phone} onChange={handleChange}
                          placeholder="(11) 99999-9999"
                          className="mt-1 h-11 bg-muted/40 border-border focus:border-audit-secondary"
                        />
                      </div>
                      <div>
                        <Label htmlFor="company_name" className="text-xs uppercase tracking-wider text-audit-primary font-bold">
                          Empresa
                        </Label>
                        <Input
                          id="company_name" name="company_name" value={form.company_name} onChange={handleChange}
                          className="mt-1 h-11 bg-muted/40 border-border focus:border-audit-secondary"
                        />
                      </div>
                    </div>
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="employee_count" className="text-xs uppercase tracking-wider text-audit-primary font-bold">
                          Nº colaboradores
                        </Label>
                        <Input
                          id="employee_count" name="employee_count" value={form.employee_count} onChange={handleChange}
                          placeholder="Ex: 50"
                          className="mt-1 h-11 bg-muted/40 border-border focus:border-audit-secondary"
                        />
                      </div>
                      <div>
                        <Label htmlFor="message" className="text-xs uppercase tracking-wider text-audit-primary font-bold">
                          Mensagem
                        </Label>
                        <Textarea
                          id="message" name="message" value={form.message} onChange={handleChange}
                          placeholder="Conte um pouco sobre sua necessidade..."
                          className="mt-1 min-h-[44px] bg-muted/40 border-border focus:border-audit-secondary resize-none"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      size="lg"
                      disabled={loading}
                      className="w-full bg-audit-secondary hover:bg-audit-secondary/90 text-white font-bold h-14 text-base group shadow-lg shadow-audit-secondary/30 mt-2"
                    >
                      {loading ? (
                        <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Enviando...</>
                      ) : (
                        <>
                          Quero falar com um especialista
                          <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </Button>

                    <div className="flex items-center justify-center gap-2 pt-2 text-xs text-muted-foreground">
                      <ShieldCheck className="h-4 w-4 text-audit-secondary" />
                      <span>Seus dados protegidos · LGPD · Sem spam</span>
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Rodapé mínimo — sem menu, sem pontos de fuga */}
      <footer className="bg-audit-primary/95 text-white/70 py-6 border-t border-audit-secondary/20">
        <div className="audit-container flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <span>© {new Date().getFullYear()} SOIA · Todos os direitos reservados</span>
          <span className="inline-flex items-center gap-2">
            <ShieldCheck className="h-3.5 w-3.5 text-audit-secondary" />
            LGPD · NR-01 · Lei 14.457/22
          </span>
        </div>
      </footer>
    </div>
  );
};

export default Ouvidoria;
