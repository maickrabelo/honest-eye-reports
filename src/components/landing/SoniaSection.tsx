import { Sparkles, Brain, MessageSquare, FileText, BarChart3, Lightbulb, Shield } from "lucide-react";
import soniaPortrait from "@/assets/sonia-portrait.png";

const capabilities = [
  {
    icon: MessageSquare,
    title: "Avaliações conversacionais",
    description: "Aplica HSE-IT, COPSOQ II e Burnout em formato de chat humanizado.",
  },
  {
    icon: Brain,
    title: "Análise inteligente",
    description: "Cruza dados e identifica padrões críticos por setor e demografia.",
  },
  {
    icon: FileText,
    title: "Relatórios PGR",
    description: "Gera documentos completos em conformidade com a NR-01.",
  },
  {
    icon: Lightbulb,
    title: "Planos de ação",
    description: "Sugere intervenções baseadas em evidências para cada risco.",
  },
  {
    icon: BarChart3,
    title: "Triagem de denúncias",
    description: "Categoriza, prioriza e resume relatos do canal de denúncias.",
  },
  {
    icon: Shield,
    title: "Apoio 24/7",
    description: "Tira dúvidas sobre NR-01 e melhores práticas em SST a qualquer hora.",
  },
];

export default function SoniaSection() {
  return (
    <section className="py-20 md:py-28 bg-audit-primary relative overflow-hidden">
      {/* Decorative blobs */}
      <div className="absolute top-20 -left-32 w-96 h-96 rounded-full bg-audit-secondary/20 blur-3xl" />
      <div className="absolute bottom-20 -right-32 w-96 h-96 rounded-full bg-audit-secondary/10 blur-3xl" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_120%,hsl(var(--audit-secondary)/0.15),transparent_60%)]" />

      <div className="container mx-auto px-4 relative">
        {/* Hero block */}
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-16 items-center max-w-6xl mx-auto mb-20">
          {/* Portrait */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 rounded-full bg-audit-secondary blur-3xl opacity-40 scale-110" />
              <img
                src={soniaPortrait}
                alt="SOnIA - Assistente de IA especializada em riscos psicossociais"
                className="w-64 h-64 md:w-80 md:h-80 rounded-full object-cover relative z-10"
                loading="lazy"
              />
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 z-20 bg-audit-secondary text-audit-primary px-4 py-1.5 rounded-full shadow-xl">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-audit-primary animate-pulse" />
                  <span className="font-bold text-xs uppercase tracking-wider">Online 24/7</span>
                </div>
              </div>
            </div>
          </div>

          {/* Text */}
          <div className="lg:col-span-7 space-y-5 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-audit-secondary/15 border border-audit-secondary/40">
              <Sparkles className="h-3.5 w-3.5 text-audit-secondary" />
              <span className="text-xs font-bold text-audit-secondary uppercase tracking-wider">
                Conheça a SOnIA
              </span>
            </div>

            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white leading-[1.15]">
              A primeira IA do mundo<br />
              <span className="text-audit-secondary">para riscos psicossociais</span>
            </h2>

            <p className="text-base md:text-lg text-white/80 leading-relaxed max-w-xl mx-auto lg:mx-0">
              Treinada exclusivamente em <strong className="text-white">NR-01, HSE-IT, COPSOQ II e legislação trabalhista brasileira</strong>. Não é um chatbot genérico — é sua copiloto técnica em SST.
            </p>
          </div>
        </div>

        {/* Capabilities grid */}
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h3 className="text-2xl md:text-3xl font-bold text-white mb-2">
              O que ela faz por você
            </h3>
            <p className="text-white/60 text-sm md:text-base">
              Integrada em cada módulo, automatizando o trabalho do seu time
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {capabilities.map((cap, i) => (
              <div
                key={i}
                className="group bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl p-5 hover:bg-white/10 hover:border-audit-secondary/50 transition-all duration-300"
              >
                <div className="flex items-start gap-3">
                  <div className="shrink-0 w-10 h-10 rounded-lg bg-audit-secondary/20 flex items-center justify-center group-hover:bg-audit-secondary transition-colors">
                    <cap.icon className="h-5 w-5 text-audit-secondary group-hover:text-audit-primary transition-colors" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-semibold text-white text-base leading-tight">{cap.title}</h4>
                    <p className="text-sm text-white/60 leading-relaxed">{cap.description}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
