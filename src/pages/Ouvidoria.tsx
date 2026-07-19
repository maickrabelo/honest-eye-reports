import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import PricingSection from '@/components/commercial/PricingSection';
import DemoRequestDialog from '@/components/DemoRequestDialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
} from 'lucide-react';
import usePageSEO from '@/hooks/usePageSEO';

const Ouvidoria = () => {
  const navigate = useNavigate();
  const [demoOpen, setDemoOpen] = useState(false);

  usePageSEO({
    title: 'Canal de Ouvidoria com IA | Denúncias Anônimas LGPD | SOIA',
    description:
      'Canal de ouvidoria 100% anônimo com Inteligência Artificial. Receba, classifique e trate denúncias de assédio, discriminação e riscos psicossociais em conformidade com NR-01 e LGPD.',
  });

  const scrollToPlanos = () => {
    document.getElementById('planos')?.scrollIntoView({ behavior: 'smooth' });
  };

  const features = [
    {
      icon: Lock,
      title: '100% Anônimo e Seguro',
      desc: 'Identidade do denunciante blindada. Criptografia ponta-a-ponta e conformidade total com a LGPD.',
    },
    {
      icon: Bot,
      title: 'SOnIA — IA que acolhe',
      desc: 'Nossa assistente conversacional coleta os detalhes com empatia, faz as perguntas certas e estrutura a denúncia.',
    },
    {
      icon: FileSearch,
      title: 'Classificação automática',
      desc: 'A IA identifica tipo, gravidade e urgência (assédio moral, sexual, discriminação, fraude, etc.) para priorização imediata.',
    },
    {
      icon: BellRing,
      title: 'Alertas em tempo real',
      desc: 'Notificações instantâneas para a comissão responsável assim que uma denúncia crítica for registrada.',
    },
    {
      icon: MessageSquare,
      title: 'Diálogo anônimo contínuo',
      desc: 'O denunciante recebe protocolo e chave de acesso para acompanhar o caso e responder novas perguntas sem se identificar.',
    },
    {
      icon: ClipboardList,
      title: 'Trilha de auditoria completa',
      desc: 'Todo o histórico de status, respostas e ações fica registrado — pronto para fiscalização MPT e auditorias internas.',
    },
    {
      icon: UserCheck,
      title: 'Gestão por comitê',
      desc: 'Distribua acessos por perfil (RH, jurídico, ética), controle quem enxerga cada caso e defina fluxos de aprovação.',
    },
    {
      icon: ScrollText,
      title: 'Relatórios prontos para NR-01',
      desc: 'Exporte relatórios executivos e indicadores para o PGR e para o comitê de compliance.',
    },
  ];

  const steps = [
    {
      n: '1',
      title: 'Colaborador acessa o canal',
      desc: 'Via QR Code, link exclusivo da empresa ou botão no portal interno — sem necessidade de login.',
    },
    {
      n: '2',
      title: 'SOnIA conduz o relato',
      desc: 'A IA conversa de forma acolhedora, coleta fatos, datas, envolvidos e evidências.',
    },
    {
      n: '3',
      title: 'Protocolo + chave gerados',
      desc: 'O denunciante recebe um código para acompanhar o caso e responder a interações da comissão.',
    },
    {
      n: '4',
      title: 'Comissão trata e resolve',
      desc: 'Equipe recebe alerta, investiga, muda status e registra a resolução — tudo auditável.',
    },
  ];

  const benefits = [
    'Conformidade com NR-01, Lei Anticorrupção e LGPD',
    'Redução de passivos trabalhistas e ações no MPT',
    'Ambiente psicologicamente seguro comprovado',
    'Evidências estruturadas para o PGR Psicossocial',
    'Aumento de confiança e engajamento do time',
    'Canal disponível 24/7 em qualquer dispositivo',
  ];

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />

      <main className="flex-grow">
        {/* HERO */}
        <section className="relative overflow-hidden bg-background">
          <div className="absolute top-0 right-0 w-[60%] h-[80%] bg-gradient-to-bl from-audit-secondary/10 via-audit-secondary/5 to-transparent blur-3xl pointer-events-none" />
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-audit-primary/5 rounded-full blur-3xl pointer-events-none" />

          <div className="audit-container relative z-10 py-16 md:py-24">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="animate-fade-in">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-audit-primary text-white text-xs font-semibold mb-6">
                  <Sparkles className="h-4 w-4 text-audit-secondary" />
                  <span>CANAL DE OUVIDORIA COM I.A.</span>
                </div>

                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-audit-primary leading-[1.1] mb-6 tracking-tight">
                  Sua empresa segura contra{' '}
                  <span className="text-audit-secondary">assédio, denúncias e passivos trabalhistas</span>
                </h1>

                <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-lg leading-relaxed">
                  Um canal 100% anônimo, conduzido pela SOnIA — a primeira IA de acolhimento
                  do Brasil. Denúncias estruturadas, classificadas e prontas para a comissão
                  agir em minutos.
                </p>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    size="lg"
                    onClick={() => setDemoOpen(true)}
                    className="bg-audit-primary hover:bg-audit-primary/90 text-white font-semibold group"
                  >
                    Agendar demonstração
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                  <Button
                    size="lg"
                    onClick={scrollToPlanos}
                    className="bg-audit-secondary hover:bg-audit-secondary/90 text-white font-semibold group"
                  >
                    Contratar agora
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>

                <div className="mt-8 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <div className="inline-flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-audit-secondary" /> LGPD
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <Lock className="h-4 w-4 text-audit-secondary" /> 100% anônimo
                  </div>
                  <div className="inline-flex items-center gap-2">
                    <CheckCircle2 className="h-4 w-4 text-audit-secondary" /> Conforme NR-01
                  </div>
                </div>
              </div>

              {/* Visual card */}
              <div className="lg:pl-8 animate-fade-in" style={{ animationDelay: '0.15s' }}>
                <div className="bg-card rounded-2xl shadow-2xl border border-border p-6 md:p-8 space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-audit-secondary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-5 w-5 text-audit-secondary" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-tl-sm p-3 text-sm">
                      Olá! Sou a SOnIA. Você está em um canal 100% anônimo e seguro.
                      Pode me contar, no seu tempo, o que aconteceu?
                    </div>
                  </div>
                  <div className="flex items-start gap-3 justify-end">
                    <div className="bg-audit-primary text-white rounded-2xl rounded-tr-sm p-3 text-sm max-w-[80%]">
                      Meu supervisor faz comentários constrangedores nas reuniões...
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-audit-secondary/10 flex items-center justify-center flex-shrink-0">
                      <Bot className="h-5 w-5 text-audit-secondary" />
                    </div>
                    <div className="bg-muted rounded-2xl rounded-tl-sm p-3 text-sm">
                      Entendo, obrigada pela coragem de compartilhar. Vou te fazer algumas
                      perguntas para registrarmos tudo corretamente.
                    </div>
                  </div>
                  <div className="pt-3 border-t border-border">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Protocolo gerado</span>
                      <Badge className="bg-audit-secondary/10 text-audit-secondary border-audit-secondary/20">
                        DEN-2026-00184
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* URGÊNCIA */}
        <section className="bg-audit-primary text-white py-10 border-y border-audit-secondary/30">
          <div className="audit-container text-center">
            <p className="text-lg md:text-2xl font-bold">
              Empresas sem canal de denúncias podem sofrer{' '}
              <span className="text-audit-secondary">multas de até R$ 200 mil</span> e
              responder judicialmente por omissão.
            </p>
            <p className="text-sm md:text-base text-white/70 mt-2">
              NR-01 · Lei 14.457/2022 · Lei Anticorrupção
            </p>
          </div>
        </section>

        {/* FEATURES */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-7xl">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
                Como funciona
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                A ouvidoria mais completa do Brasil
              </h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Tudo que sua empresa precisa para acolher denúncias, tratar casos e comprovar
                conformidade — em uma única plataforma.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((f) => (
                <Card key={f.title} className="hover:shadow-lg hover:-translate-y-1 transition-all border-border">
                  <CardContent className="p-6">
                    <div className="w-12 h-12 rounded-lg bg-audit-secondary/10 flex items-center justify-center mb-4">
                      <f.icon className="h-6 w-6 text-audit-secondary" />
                    </div>
                    <h3 className="font-bold text-foreground mb-2">{f.title}</h3>
                    <p className="text-sm text-muted-foreground">{f.desc}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* PASSO A PASSO */}
        <section className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-12">
              <Badge className="mb-4 bg-audit-secondary/10 text-audit-secondary border-audit-secondary/20">
                Fluxo simples
              </Badge>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Da denúncia à resolução em 4 etapas
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {steps.map((s) => (
                <div key={s.n} className="text-center">
                  <div className="w-14 h-14 mx-auto rounded-full bg-audit-primary text-white flex items-center justify-center text-2xl font-bold mb-4">
                    {s.n}
                  </div>
                  <h3 className="font-bold text-foreground mb-2">{s.title}</h3>
                  <p className="text-sm text-muted-foreground">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* BENEFÍCIOS */}
        <section className="py-20 px-4">
          <div className="container mx-auto max-w-5xl">
            <div className="grid md:grid-cols-2 gap-10 items-center">
              <div>
                <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">Por que a SOIA</Badge>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                  Proteção jurídica + cultura organizacional saudável
                </h2>
                <p className="text-muted-foreground mb-6">
                  Mais do que um canal de denúncias, um sistema completo de gestão ética
                  que reduz passivos e fortalece a confiança do seu time.
                </p>
                <Button
                  size="lg"
                  onClick={() => setDemoOpen(true)}
                  className="bg-audit-primary hover:bg-audit-primary/90 text-white"
                >
                  Quero ver funcionando
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-3">
                {benefits.map((b) => (
                  <div key={b} className="flex items-start gap-3 p-4 rounded-lg bg-card border border-border">
                    <CheckCircle2 className="h-5 w-5 text-audit-secondary mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">{b}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* PLANOS (mesmos da index) */}
        <PricingSection />

        {/* CTA FINAL */}
        <section className="py-20 md:py-28 bg-audit-primary relative overflow-hidden">
          <div className="absolute top-0 left-0 w-96 h-96 bg-audit-secondary/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-[28rem] h-[28rem] bg-audit-secondary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="audit-container relative z-10 text-center max-w-4xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
              Ative sua ouvidoria em <span className="text-audit-secondary">minutos</span>
            </h2>
            <p className="text-lg text-white/70 mb-10 max-w-2xl mx-auto">
              Não espere a primeira denúncia virar processo. Comece hoje com a única IA
              de acolhimento humanizado do Brasil.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                onClick={() => setDemoOpen(true)}
                className="bg-white hover:bg-white/90 text-audit-primary font-semibold px-8 py-6 text-base w-full sm:w-auto"
              >
                Agendar demonstração
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button
                size="lg"
                onClick={scrollToPlanos}
                className="bg-audit-secondary hover:bg-audit-secondary/90 text-white font-semibold px-8 py-6 text-base w-full sm:w-auto"
              >
                Contratar agora
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <DemoRequestDialog
        open={demoOpen}
        onOpenChange={setDemoOpen}
        source="ouvidoria_landing"
        whatsappMessage="Olá! Gostaria de agendar uma demonstração do canal de Ouvidoria da SOIA."
      />
    </div>
  );
};

export default Ouvidoria;
