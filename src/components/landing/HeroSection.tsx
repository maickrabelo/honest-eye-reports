import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, Shield, MessageCircle, CheckCircle2 } from 'lucide-react';

const HeroSection = () => {
  return (
    <section
      className="relative min-h-[88vh] flex items-center overflow-hidden bg-gradient-to-br from-audit-dark via-audit-primary to-audit-accent"
      aria-label="Sistema NR-01 para gestão de riscos psicossociais"
    >
      {/* Decorative blobs */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-10 -left-20 w-96 h-96 bg-audit-secondary rounded-full blur-3xl" />
        <div className="absolute bottom-10 -right-20 w-[28rem] h-[28rem] bg-audit-accent rounded-full blur-3xl" />
      </div>
      {/* Subtle grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:60px_60px] pointer-events-none" />

      <div className="audit-container relative z-10 py-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 text-white/90 text-sm mb-8 animate-fade-in">
            <Shield className="h-4 w-4" />
            <span>Conformidade total com a NR-01</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-[1.1] animate-fade-in" style={{ animationDelay: '0.1s' }}>
            Gestão de Riscos Psicossociais
            <br />
            <span className="text-audit-secondary">conforme a NR-01</span>
          </h1>

          <p className="text-lg md:text-xl text-white/80 mb-10 max-w-2xl mx-auto animate-fade-in" style={{ animationDelay: '0.2s' }}>
            Plataforma completa para identificar, avaliar e tratar riscos psicossociais.
            Avaliações HSE-IT e COPSOQ, burnout, clima organizacional e canal de denúncias — tudo em um só lugar.
          </p>

          {/* Two trial CTAs side by side */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in" style={{ animationDelay: '0.3s' }}>
            <Button
              size="lg"
              onClick={() => window.location.href = '/teste-gratis-empresa'}
              className="bg-audit-secondary hover:bg-audit-secondary/90 text-white font-semibold px-8 py-6 text-base group w-full sm:w-auto"
            >
              Empresa? Teste grátis
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              onClick={() => window.location.href = '/teste-gratis-sst'}
              className="bg-white text-audit-primary hover:bg-white/90 font-semibold px-8 py-6 text-base group w-full sm:w-auto"
            >
              Gestora SST? Teste grátis
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          <button
            onClick={() => window.open('https://wa.me/5511996029222?text=Olá! Gostaria de uma demonstração do SOIA.', '_blank')}
            className="mt-5 text-white/70 hover:text-white text-sm inline-flex items-center gap-2 underline-offset-4 hover:underline animate-fade-in"
            style={{ animationDelay: '0.4s' }}
          >
            <MessageCircle className="h-4 w-4" />
            Ver demonstração com especialista
          </button>

          {/* Trust line */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-white/70 text-sm animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-audit-secondary" /> 7 dias grátis</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-audit-secondary" /> Sem cartão de crédito</span>
            <span className="inline-flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-audit-secondary" /> 100% conforme NR-01</span>
          </div>

          {/* Stats */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto animate-fade-in" style={{ animationDelay: '0.6s' }}>
            {[
              { value: '98%', label: 'Taxa de Resolução' },
              { value: '<24h', label: 'Tempo de Resposta' },
              { value: '100%', label: 'Anonimato Garantido' },
              { value: '+500', label: 'Empresas Atendidas' },
            ].map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-2xl md:text-3xl font-bold text-white mb-1">{stat.value}</div>
                <div className="text-xs text-white/60">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
