import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowRight, Sparkles, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const HeroSection = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', phone: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const msg = `Olá! Quero uma demonstração da SOIA.%0A%0ANome: ${form.name}%0AE-mail: ${form.email}%0ATelefone: ${form.phone}`;
    window.open(`https://wa.me/5511996029222?text=${msg}`, '_blank');
  };

  return (
    <section
      className="relative overflow-hidden bg-background"
      aria-label="SOIA — Gestão de Riscos Psicossociais conforme NR-01"
    >
      {/* Decorative gradient blob */}
      <div className="absolute top-0 right-0 w-[60%] h-[80%] bg-gradient-to-bl from-audit-secondary/10 via-audit-secondary/5 to-transparent blur-3xl pointer-events-none" />
      <div className="absolute -top-20 -left-20 w-96 h-96 bg-audit-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="audit-container relative z-10 py-16 md:py-24">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* LEFT — Hero copy */}
          <div className="animate-fade-in">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-audit-primary text-white text-xs font-semibold mb-8">
              <Sparkles className="h-4 w-4 text-audit-secondary" />
              <span>PIONEIRISMO ABSOLUTO NO MUNDO</span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold text-audit-primary leading-[1.05] mb-6 tracking-tight">
              A primeira <span className="text-audit-secondary">I.A.</span>
              <br />
              de Gestão de
              <br />
              Riscos
              <br />
              Psicossociais
            </h1>

            {/* Highlight box */}
            <div className="rounded-xl bg-audit-secondary/10 border border-audit-secondary/30 px-5 py-4 mb-6 max-w-lg">
              <p className="text-xl md:text-2xl font-bold text-audit-primary">
                <span className="text-audit-secondary">Conformidade total</span> com a NR-01
              </p>
              <p className="text-xs uppercase tracking-wider text-audit-primary/70 font-semibold mt-1">
                Vigência maio/2026 · Multas até R$ 200 mil
              </p>
            </div>

            <p className="text-base md:text-lg text-muted-foreground mb-8 max-w-lg leading-relaxed">
              Plataforma completa de avaliação HSE-IT, COPSOQ, burnout, clima organizacional
              e canal de denúncias. Para empresas e gestoras de SST que querem proteger
              pessoas e cumprir a lei.
            </p>

            {/* Social proof */}
            <div className="flex items-center gap-3">
              <div className="flex -space-x-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="w-10 h-10 rounded-full border-2 border-background bg-gradient-to-br from-audit-primary to-audit-secondary"
                  />
                ))}
              </div>
              <p className="text-sm font-semibold text-audit-primary">
                +500 empresas <span className="font-normal text-muted-foreground">já confiam na SOIA</span>
              </p>
            </div>
          </div>

          {/* RIGHT — Form card */}
          <div className="lg:pl-8 animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <div className="bg-card rounded-2xl shadow-2xl border border-border p-6 md:p-8">
              <div className="text-center mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-audit-primary mb-2">
                  Conheça a SOIA
                </h2>
                <p className="text-sm text-muted-foreground">
                  Comece grátis ou fale com um especialista
                </p>
              </div>

              {/* Trial CTAs */}
              <div className="space-y-2 mb-6">
                <Button
                  size="lg"
                  onClick={() => navigate('/teste-gratis')}
                  className="w-full bg-audit-secondary hover:bg-audit-secondary/90 text-white font-semibold group"
                >
                  Sou empresa — quero testar grátis
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate('/teste-gratis')}
                  className="w-full border-audit-primary text-audit-primary hover:bg-audit-primary hover:text-white font-semibold group"
                >
                  Sou gestora SST — quero testar grátis
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </div>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-card px-3 text-muted-foreground uppercase tracking-wider">
                    ou solicite uma demo
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-3">
                <div>
                  <Label htmlFor="hero-name" className="text-xs uppercase tracking-wider text-muted-foreground">
                    Nome completo
                  </Label>
                  <Input
                    id="hero-name"
                    required
                    placeholder="Seu nome"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="mt-1 bg-muted/50"
                  />
                </div>
                <div>
                  <Label htmlFor="hero-email" className="text-xs uppercase tracking-wider text-muted-foreground">
                    E-mail corporativo
                  </Label>
                  <Input
                    id="hero-email"
                    type="email"
                    required
                    placeholder="seu@email.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="mt-1 bg-muted/50"
                  />
                </div>
                <div>
                  <Label htmlFor="hero-phone" className="text-xs uppercase tracking-wider text-muted-foreground">
                    WhatsApp / Telefone
                  </Label>
                  <Input
                    id="hero-phone"
                    required
                    placeholder="(00) 00000-0000"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                    className="mt-1 bg-muted/50"
                  />
                </div>
                <Button
                  type="submit"
                  size="lg"
                  className="w-full bg-audit-primary hover:bg-audit-primary/90 text-white font-semibold group mt-2"
                >
                  Solicitar demonstração
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </Button>
              </form>

              <div className="flex items-center justify-center gap-2 mt-5 text-xs text-muted-foreground">
                <ShieldCheck className="h-4 w-4 text-audit-secondary" />
                <span>Seus dados estão seguros · LGPD</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* URGENCY MARQUEE */}
      <div className="bg-audit-primary text-white py-3 overflow-hidden border-y border-audit-secondary/30">
        <div className="flex animate-marquee whitespace-nowrap">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="mx-8 text-sm font-semibold uppercase tracking-wider">
              ⚠️ URGENTE: NR-01 EXIGIRÁ GESTÃO DE RISCOS PSICOSSOCIAIS A PARTIR DE MAIO/2026 ·
              <span className="text-audit-secondary ml-2">MULTAS DE ATÉ R$ 200.000,00 POR DESCUMPRIMENTO</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
