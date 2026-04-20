import React from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import {
  MessageCircle,
  Sparkles,
  ClipboardList,
  Brain,
  Flame,
  FileText,
} from 'lucide-react';

const features = [
  {
    icon: MessageCircle,
    title: 'Canal de Denúncias',
    description: 'Chat inteligente que guia o colaborador a relatar situações com segurança e anonimato garantido.',
    tags: ['100% anônimo', 'Chat com IA', 'Código de rastreio'],
  },
  {
    icon: ClipboardList,
    title: 'Pesquisa de Clima',
    description: 'Questionários personalizáveis com análise NPS para medir o pulso da sua organização.',
    tags: ['Personalizável', 'Análise NPS', 'Relatórios detalhados'],
  },
  {
    icon: Sparkles,
    title: 'Análise com IA',
    description: 'Inteligência artificial que classifica, prioriza e identifica padrões nas denúncias e respostas.',
    tags: ['Classificação automática', 'Priorização', 'Detecção de padrões'],
  },
  {
    icon: Brain,
    title: 'Riscos Psicossociais',
    description: 'Mapeamento HSE-IT e COPSOQ com 35 indicadores em 7 categorias e plano de ação conforme NR-01.',
    tags: ['HSE-IT', 'COPSOQ', 'Plano de ação NR-01'],
  },
  {
    icon: Flame,
    title: 'Avaliação de Burnout',
    description: 'Questionários cientificamente validados para medir exaustão, despersonalização e realização profissional.',
    tags: ['Validado cientificamente', 'Relatório PDF', 'Dashboard'],
  },
  {
    icon: FileText,
    title: 'Relatórios Automáticos',
    description: 'Gere relatórios completos e auditáveis para reuniões, fiscalizações e tomada de decisão estratégica.',
    tags: ['PDF/Excel', 'Personalizáveis', 'PGR-compliant'],
  },
];

const FeaturesSection = () => {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.1 });

  return (
    <section
      ref={ref}
      id="ferramentas"
      className="py-20 md:py-28 bg-background"
      aria-label="Ferramentas SOIA — Hub completo de gestão de riscos psicossociais"
    >
      <div className="audit-container">
        <div className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <p className="text-sm uppercase tracking-widest text-audit-secondary font-bold mb-3">Ferramentas</p>
          <h2 className="text-3xl md:text-5xl font-bold text-audit-primary mb-6 leading-tight">
            Um hub completo de <span className="text-audit-secondary">Gestão de Riscos</span>.
          </h2>
          <p className="text-lg text-muted-foreground">
            Esqueça formulários estáticos e planilhas confusas. A SOIA automatiza o levantamento
            de evidências, a análise e a tomada de decisão.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.title}
                className={`group bg-card rounded-2xl border border-border p-6 md:p-8 hover:border-audit-secondary hover:shadow-xl hover:-translate-y-1 transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
                style={{ transitionDelay: `${idx * 70}ms` }}
              >
                <div className="w-14 h-14 rounded-2xl bg-audit-secondary/10 flex items-center justify-center mb-5 group-hover:bg-audit-secondary group-hover:scale-110 transition-all">
                  <Icon className="h-7 w-7 text-audit-secondary group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-xl font-bold text-audit-primary mb-3">{feature.title}</h3>
                <p className="text-sm text-muted-foreground mb-5 leading-relaxed">{feature.description}</p>
                <div className="flex flex-wrap gap-2">
                  {feature.tags.map((tag) => (
                    <span
                      key={tag}
                      className="text-xs font-semibold px-2.5 py-1 rounded-full bg-audit-primary/5 text-audit-primary border border-audit-primary/10"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
