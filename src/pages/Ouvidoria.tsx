import React, { useState } from 'react';
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
} from 'lucide-react';
import usePageSEO from '@/hooks/usePageSEO';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { fbqTrack } from '@/lib/metaPixel';
const logoSoia = '/lovable-uploads/Logo_SOIA.png';

const Ouvidoria = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setForm(p => ({ ...p, [name]: value }));
  };

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
      fbqTrack('Lead', { content_name: 'Ouvidoria — Solicitar Demonstração' });
      toast({ title: 'Solicitação enviada!', description: 'Você será redirecionado para o WhatsApp.' });
      setForm({ name: '', email: '', phone: '', company_name: '', employee_count: '', message: '' });
      window.open(
        `https://wa.me/5511999406560?text=${encodeURIComponent('Olá! Gostaria de agendar uma demonstração do canal de Ouvidoria da SOIA.')}`,
        '_blank'
      );
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
        {/* HERO com FORMULÁRIO em destaque */}
        <section className="relative overflow-hidden bg-background">
          <div className="absolute top-0 right-0 w-[60%] h-[80%] bg-gradient-to-bl from-audit-secondary/10 via-audit-secondary/5 to-transparent blur-3xl pointer-events-none" />
          <div className="absolute -top-20 -left-20 w-96 h-96 bg-audit-primary/5 rounded-full blur-3xl pointer-events-none" />

          <div className="audit-container relative z-10 py-10 md:py-16">
            <div className="grid lg:grid-cols-5 gap-10 lg:gap-14 items-center">
              {/* LEFT — copy 3 cols */}
              <div className="lg:col-span-3 animate-fade-in">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-audit-primary text-white text-xs font-bold uppercase tracking-wider mb-6">
                  <Sparkles className="h-4 w-4 text-audit-secondary" />
                  <span>Canal de Ouvidoria com I.A.</span>
                </div>

                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-audit-primary leading-[1.05] mb-6 tracking-tight">
                  Blinde sua empresa contra{' '}
                  <span className="text-audit-secondary">assédio, denúncias e processos trabalhistas</span>
                </h1>

                <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl leading-relaxed">
                  Canal 100% anônimo com <strong className="text-audit-primary">SOnIA</strong>, a primeira
                  IA de acolhimento do Brasil. Denúncias estruturadas, classificadas e prontas para
                  a comissão agir em minutos.
                </p>

                {/* Highlight quick differentials */}
                <div className="grid sm:grid-cols-2 gap-3 mb-8">
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

                <div className="hidden lg:block">
                  <Button
                    size="lg"
                    onClick={scrollToForm}
                    className="bg-audit-secondary hover:bg-audit-secondary/90 text-white font-bold px-8 py-6 text-base group shadow-lg shadow-audit-secondary/30"
                  >
                    Solicitar demonstração gratuita
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>

              {/* RIGHT — FORM em destaque, 2 cols */}
              <div id="form-captura" className="lg:col-span-2 animate-fade-in scroll-mt-24" style={{ animationDelay: '0.15s' }}>
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-br from-audit-secondary to-audit-primary rounded-3xl blur opacity-30" />
                  <div className="relative bg-card rounded-2xl shadow-2xl border-2 border-audit-secondary/30 p-6 md:p-8">
                    <div className="text-center mb-6">
                      <Badge className="mb-3 bg-audit-secondary text-white border-0 uppercase text-[10px] tracking-widest font-bold">
                        Demonstração Gratuita
                      </Badge>
                      <h2 className="text-2xl md:text-3xl font-bold text-audit-primary leading-tight">
                        Veja a ouvidoria funcionando na sua empresa
                      </h2>
                      <p className="text-sm text-muted-foreground mt-2">
                        Preenchendo abaixo, nosso especialista te chama no WhatsApp em minutos.
                      </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-3">
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
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label htmlFor="company_name" className="text-xs uppercase tracking-wider text-audit-primary font-bold">
                            Empresa
                          </Label>
                          <Input
                            id="company_name" name="company_name" value={form.company_name} onChange={handleChange}
                            className="mt-1 h-11 bg-muted/40 border-border focus:border-audit-secondary"
                          />
                        </div>
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
                            Quero ativar minha ouvidoria
                            <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                          </>
                        )}
                      </Button>

                      <div className="flex items-center justify-center gap-2 pt-2 text-xs text-muted-foreground">
                        <ShieldCheck className="h-4 w-4 text-audit-secondary" />
                        <span>Seus dados protegidos · LGPD · Sem spam</span>
                      </div>
                    </form>
                  </div>
                </div>
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
                onClick={scrollToForm}
                className="bg-audit-primary hover:bg-audit-primary/90 text-white font-bold px-10 py-6 text-base group shadow-lg"
              >
                Quero conhecer a SOnIA agora
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </section>

        {/* BENEFÍCIOS */}
        <section className="py-20 px-4">
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
                  onClick={scrollToForm}
                  className="bg-audit-secondary hover:bg-audit-secondary/90 text-white font-bold px-8 py-6 text-base group shadow-lg"
                >
                  Solicitar demonstração
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

        {/* CTA FINAL — reforço */}
        <section className="py-20 md:py-28 bg-audit-primary relative overflow-hidden">
          <div className="absolute top-0 left-0 w-96 h-96 bg-audit-secondary/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-[28rem] h-[28rem] bg-audit-secondary/10 rounded-full blur-3xl pointer-events-none" />
          <div className="audit-container relative z-10 text-center max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-audit-secondary/20 border border-audit-secondary/40 text-audit-secondary text-xs font-bold uppercase tracking-wider mb-6">
              <AlertTriangle className="h-4 w-4" />
              Última chamada
            </div>
            <h2 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight">
              Não espere a primeira denúncia virar <span className="text-audit-secondary">processo</span>
            </h2>
            <p className="text-lg md:text-xl text-white/70 mb-10 max-w-2xl mx-auto">
              Ative sua ouvidoria com IA em minutos. Preencha o formulário e nosso especialista
              te chama no WhatsApp agora.
            </p>
            <Button
              size="lg"
              onClick={scrollToForm}
              className="bg-audit-secondary hover:bg-audit-secondary/90 text-white font-bold px-10 py-7 text-lg group shadow-2xl shadow-audit-secondary/40"
            >
              Quero minha demonstração gratuita
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-white/60">
              <div className="inline-flex items-center gap-2">✓ Sem cartão de crédito</div>
              <div className="inline-flex items-center gap-2">✓ Ativação em minutos</div>
              <div className="inline-flex items-center gap-2">✓ 100% LGPD</div>
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
