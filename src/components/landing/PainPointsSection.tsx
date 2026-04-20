import React from 'react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { AlertTriangle } from 'lucide-react';

const stats = [
  { value: '80%', label: 'Aumento de afastamentos', source: 'em 2 anos (Fonte: Veja)' },
  { value: 'R$ 200B', label: 'Custo do presenteísmo', source: 'anuais no Brasil (IBEF-SP)' },
  { value: 'R$ 50M+', label: 'Indenizações trabalhistas', source: 'por ano em assédio' },
  { value: 'R$ 200k', label: 'Multas NR-01', source: 'limite por empresa' },
];

const PainPointsSection = () => {
  const { ref, isVisible } = useScrollAnimation();

  return (
    <section
      ref={ref}
      id="oportunidade"
      className="py-20 md:py-28 bg-audit-primary text-white relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--audit-secondary)/0.15),transparent_50%)] pointer-events-none" />

      <div className="audit-container relative z-10">
        <div className={`text-center max-w-3xl mx-auto mb-16 transition-all duration-700 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
            O mercado de SST mudou.{' '}
            <span className="text-audit-secondary">Sua empresa está em risco.</span>
          </h2>
          <p className="text-lg text-white/70">
            A saúde mental não é mais "bem-estar" — é uma <strong className="text-white">exigência legal</strong> e um
            <strong className="text-white"> ralo financeiro</strong> para empresas que ignoram.
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-16">
          {stats.map((stat, idx) => (
            <div
              key={idx}
              className={`bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 md:p-8 hover:border-audit-secondary/50 transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
              style={{ transitionDelay: `${idx * 80}ms` }}
            >
              <div className="text-3xl md:text-5xl font-bold text-audit-secondary mb-2">{stat.value}</div>
              <div className="text-sm md:text-base font-semibold text-white mb-1">{stat.label}</div>
              <div className="text-xs text-white/50">{stat.source}</div>
            </div>
          ))}
        </div>

        {/* "O Custo de Ignorar" highlight */}
        <div className={`max-w-4xl mx-auto rounded-3xl bg-gradient-to-br from-audit-secondary/20 to-audit-secondary/5 border border-audit-secondary/40 p-8 md:p-12 transition-all duration-700 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`} style={{ transitionDelay: '400ms' }}>
          <div className="flex items-start gap-4 mb-6">
            <AlertTriangle className="h-8 w-8 text-audit-secondary flex-shrink-0 mt-1" />
            <div>
              <p className="text-sm uppercase tracking-wider text-audit-secondary font-bold mb-2">O custo de ignorar</p>
              <p className="text-4xl md:text-6xl font-bold text-white mb-2">R$ 6.084,16</p>
              <p className="text-white/70">é quanto um único colaborador afastado custa para a empresa, diretamente.</p>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-4 pt-6 border-t border-white/10">
            <div>
              <p className="font-bold text-white mb-1">Multas NR-01</p>
              <p className="text-sm text-white/60">Até R$ 200.000,00 por estabelecimento.</p>
            </div>
            <div>
              <p className="font-bold text-white mb-1">Processos</p>
              <p className="text-sm text-white/60">Indenizações por assédio superam R$ 50 milhões/ano.</p>
            </div>
            <div>
              <p className="font-bold text-white mb-1">Reputação</p>
              <p className="text-sm text-white/60">Escândalos destroem marcas em horas.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PainPointsSection;
