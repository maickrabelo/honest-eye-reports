import { Sparkles, Brain, MessageSquare, FileText, BarChart3, Lightbulb, Shield } from "lucide-react";
import soniaPortrait from "@/assets/sonia-portrait.png";

const capabilities = [
  {
    icon: MessageSquare,
    title: "Conduz avaliações conversacionais",
    description: "Aplica HSE-IT, COPSOQ II e Burnout em formato de chat humanizado, aumentando taxas de resposta.",
  },
  {
    icon: Brain,
    title: "Analisa riscos psicossociais",
    description: "Cruza dados de múltiplas avaliações e identifica padrões críticos por setor, cargo e demografia.",
  },
  {
    icon: FileText,
    title: "Gera relatórios PGR-compliant",
    description: "Produz documentos completos em conformidade com a NR-01, prontos para fiscalização.",
  },
  {
    icon: Lightbulb,
    title: "Sugere planos de ação",
    description: "Recomenda intervenções específicas baseadas em evidências para cada risco identificado.",
  },
  {
    icon: BarChart3,
    title: "Interpreta denúncias",
    description: "Categoriza, prioriza e resume relatos do canal de denúncias, acelerando a tomada de decisão.",
  },
  {
    icon: Shield,
    title: "Apoia gestores 24/7",
    description: "Tira dúvidas sobre NR-01, legislação e melhores práticas em SST a qualquer hora.",
  },
];

export default function SoniaSection() {
  return (
    <section className="py-20 md:py-28 bg-gradient-to-b from-audit-light/40 to-background relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-20 -left-32 w-96 h-96 rounded-full bg-audit-secondary/10 blur-3xl" />
      <div className="absolute bottom-20 -right-32 w-96 h-96 rounded-full bg-audit-primary/10 blur-3xl" />

      <div className="container mx-auto px-4 relative">
        {/* Top label */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-audit-secondary/15 border border-audit-secondary/30 mb-4">
            <Sparkles className="h-4 w-4 text-audit-secondary animate-pulse" />
            <span className="text-sm font-bold text-audit-primary uppercase tracking-wider">
              Conheça a SOnIA
            </span>
          </div>
          <h2 className="text-3xl md:text-5xl font-bold text-audit-primary max-w-4xl mx-auto leading-tight">
            A primeira inteligência artificial do mundo<br />
            <span className="text-audit-secondary">especializada em riscos psicossociais</span>
          </h2>
        </div>

        <div className="grid lg:grid-cols-5 gap-12 items-center max-w-7xl mx-auto">
          {/* Portrait */}
          <div className="lg:col-span-2 flex justify-center lg:justify-end">
            <div className="relative">
              {/* Glow ring */}
              <div className="absolute inset-0 rounded-full bg-audit-secondary blur-2xl opacity-30 scale-110" />
              <div className="relative">
                <img
                  src={soniaPortrait}
                  alt="SOnIA - Assistente de Inteligência Artificial especializada em riscos psicossociais"
                  className="w-72 h-72 md:w-96 md:h-96 rounded-full object-cover relative z-10"
                  loading="lazy"
                />
                {/* Floating badge */}
                <div className="absolute -bottom-4 -right-2 z-20 bg-audit-primary text-white px-5 py-3 rounded-2xl shadow-xl border-2 border-audit-secondary">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-audit-secondary animate-pulse" />
                    <span className="font-semibold text-sm">Online 24/7</span>
                  </div>
                </div>
                {/* Floating tag */}
                <div className="absolute -top-2 -left-4 z-20 bg-white px-4 py-2 rounded-xl shadow-xl border border-audit-secondary/30">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-audit-secondary" />
                    <span className="font-bold text-sm text-audit-primary">IA Pioneira</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="lg:col-span-3 space-y-6">
            <p className="text-xl md:text-2xl text-audit-primary font-semibold leading-snug">
              Olá, eu sou a <span className="text-audit-secondary">SOnIA</span> 👋
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Sou a primeira IA do mundo treinada exclusivamente em <strong className="text-audit-primary">riscos psicossociais, NR-01, saúde mental ocupacional e legislação trabalhista brasileira</strong>. Trabalho ao seu lado dentro da SOIA para automatizar avaliações, interpretar dados, gerar relatórios técnicos e sugerir intervenções práticas.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Não sou um chatbot genérico. Fui construída sobre as metodologias <strong className="text-audit-primary">HSE-IT, COPSOQ II e LBQ/MBI</strong>, e sigo rigorosamente os protocolos exigidos pela fiscalização.
            </p>

            <div className="pt-4 border-l-4 border-audit-secondary pl-5 bg-white/60 py-4 rounded-r-lg">
              <p className="text-base text-audit-primary italic">
                "Minha missão é tornar a gestão de riscos psicossociais acessível, técnica e eficiente — para que você foque no que importa: cuidar das pessoas."
              </p>
              <p className="text-sm text-audit-secondary font-bold mt-2">— SOnIA, sua copiloto em SST</p>
            </div>
          </div>
        </div>

        {/* Capabilities grid */}
        <div className="mt-20 max-w-6xl mx-auto">
          <h3 className="text-2xl md:text-3xl font-bold text-audit-primary text-center mb-3">
            O que a SOnIA faz por você dentro da plataforma
          </h3>
          <p className="text-center text-muted-foreground mb-10 max-w-2xl mx-auto">
            Ela está integrada em cada módulo, automatizando o que antes consumia horas do seu time.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {capabilities.map((cap, i) => (
              <div
                key={i}
                className="group bg-white border border-border rounded-2xl p-6 hover:border-audit-secondary hover:shadow-xl transition-all duration-300"
              >
                <div className="w-12 h-12 rounded-xl bg-audit-secondary/10 flex items-center justify-center mb-4 group-hover:bg-audit-secondary group-hover:scale-110 transition-all">
                  <cap.icon className="h-6 w-6 text-audit-secondary group-hover:text-white transition-colors" />
                </div>
                <h4 className="font-bold text-lg text-audit-primary mb-2">{cap.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{cap.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
