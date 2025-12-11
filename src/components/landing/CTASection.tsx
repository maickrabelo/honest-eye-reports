import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, MessageCircle, Mail, Phone } from 'lucide-react';

const CTASection = () => {
  return (
    <section id="cta-section" className="py-20 bg-gradient-to-br from-audit-accent via-audit-primary to-audit-dark">
      <div className="audit-container">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-6">
            Pronto para proteger sua empresa?
          </h2>
          <p className="text-white/70 text-lg md:text-xl mb-10 max-w-2xl mx-auto">
            Agende uma demonstração gratuita e descubra como o SOIA pode transformar a gestão de riscos e a cultura da sua organização.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button 
              size="lg" 
              className="bg-white text-audit-primary hover:bg-white/90 font-semibold px-8 py-6 text-lg group w-full sm:w-auto"
              onClick={() => window.open('mailto:contato@soia.com.br?subject=Solicitação de Demonstração', '_blank')}
            >
              Agendar Demonstração
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              size="lg" 
              className="bg-audit-accent hover:bg-audit-accent/80 text-white font-semibold px-8 py-6 text-lg w-full sm:w-auto"
              onClick={() => window.open('https://wa.me/5511999999999?text=Olá! Gostaria de saber mais sobre o SOIA.', '_blank')}
            >
              <MessageCircle className="mr-2 h-5 w-5" />
              WhatsApp
            </Button>
          </div>

          <div className="grid sm:grid-cols-3 gap-6 text-white/80 text-sm">
            <div className="flex items-center justify-center gap-2">
              <Mail className="h-4 w-4" />
              <span>contato@soia.com.br</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Phone className="h-4 w-4" />
              <span>+55 (11) 99999-9999</span>
            </div>
            <div className="flex items-center justify-center gap-2">
              <MessageCircle className="h-4 w-4" />
              <span>Suporte 24/7</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
