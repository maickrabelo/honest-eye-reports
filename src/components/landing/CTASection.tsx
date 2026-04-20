import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, MessageCircle, ShieldCheck } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { useNavigate } from 'react-router-dom';

const CTASection = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.2 });
  const navigate = useNavigate();

  return (
    <section
      ref={ref}
      id="contato"
      className="py-20 md:py-28 bg-audit-primary relative overflow-hidden"
      aria-label="Comece a usar a SOIA"
    >
      {/* Decorative blobs */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-audit-secondary/20 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[28rem] h-[28rem] bg-audit-secondary/10 rounded-full blur-3xl pointer-events-none" />

      <div className="audit-container relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-audit-secondary/20 border border-audit-secondary/40 text-audit-secondary text-xs font-bold uppercase tracking-wider mb-6 transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            <ShieldCheck className="h-4 w-4" />
            Vigência NR-01 · Maio/2026
          </div>

          <h2 className={`text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-6 leading-tight transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            Não espere a primeira{' '}
            <span className="text-audit-secondary">multa</span> chegar.
          </h2>

          <p className={`text-lg md:text-xl text-white/70 mb-10 max-w-2xl mx-auto transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '100ms' }}>
            Seja a empresa que resolve o maior problema das organizações hoje.
            Comece em minutos com 7 dias grátis e zero compromisso.
          </p>

          <div className={`flex flex-col sm:flex-row items-center justify-center gap-3 mb-10 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`} style={{ transitionDelay: '200ms' }}>
            <Button
              size="lg"
              onClick={() => navigate('/teste-gratis-empresa')}
              className="bg-audit-secondary hover:bg-audit-secondary/90 text-white font-semibold px-8 py-6 text-base group w-full sm:w-auto"
            >
              Empresa? Começar grátis
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate('/teste-gratis-sst')}
              className="bg-transparent border-white/30 text-white hover:bg-white hover:text-audit-primary font-semibold px-8 py-6 text-base group w-full sm:w-auto"
            >
              Gestora SST? Começar grátis
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>

          <button
            onClick={() => window.open('https://wa.me/5511996029222?text=Olá! Quero falar com um especialista da SOIA.', '_blank')}
            className={`text-white/60 hover:text-white text-sm inline-flex items-center gap-2 transition-colors ${isVisible ? 'opacity-100' : 'opacity-0'}`}
            style={{ transitionDelay: '300ms' }}
          >
            <MessageCircle className="h-4 w-4" />
            Prefere falar com um especialista? Toque aqui
          </button>

          <div className={`mt-12 pt-8 border-t border-white/10 grid sm:grid-cols-3 gap-4 text-sm text-white/60 transition-all duration-700 ${isVisible ? 'opacity-100' : 'opacity-0'}`} style={{ transitionDelay: '400ms' }}>
            <div>✓ 7 dias grátis</div>
            <div>✓ Sem cartão de crédito</div>
            <div>✓ 100% conforme NR-01</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
