import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { generatePGRReport } from "@/components/hseit/HSEITPGRReportPDF";
import { HSEIT_QUESTIONS, HSEIT_CATEGORY_LABELS, calculateCategoryAverage, type HSEITCategory } from "@/data/hseitQuestions";

const CATEGORIES: HSEITCategory[] = ['demands', 'control', 'managerSupport', 'peerSupport', 'relationships', 'role', 'change'];

// Realistic demo answers for 45 respondents across 4 departments
function generateDemoData() {
  const departments = ['Administrativo', 'Operacional', 'Comercial', 'TI'];
  const respondentCounts = [12, 15, 10, 8];

  // Simulated average tendencies per department (1-5 scale, raw values)
  const deptTendencies: Record<string, Record<HSEITCategory, { mean: number; spread: number }>> = {
    'Administrativo': {
      demands: { mean: 3.2, spread: 0.8 }, control: { mean: 3.8, spread: 0.6 },
      managerSupport: { mean: 3.5, spread: 0.7 }, peerSupport: { mean: 4.0, spread: 0.5 },
      relationships: { mean: 2.1, spread: 0.6 }, role: { mean: 4.2, spread: 0.4 },
      change: { mean: 3.0, spread: 0.8 },
    },
    'Operacional': {
      demands: { mean: 3.8, spread: 0.7 }, control: { mean: 2.5, spread: 0.8 },
      managerSupport: { mean: 2.8, spread: 0.9 }, peerSupport: { mean: 3.5, spread: 0.7 },
      relationships: { mean: 2.5, spread: 0.7 }, role: { mean: 3.6, spread: 0.6 },
      change: { mean: 2.4, spread: 0.7 },
    },
    'Comercial': {
      demands: { mean: 3.5, spread: 0.9 }, control: { mean: 3.2, spread: 0.7 },
      managerSupport: { mean: 3.8, spread: 0.6 }, peerSupport: { mean: 3.3, spread: 0.8 },
      relationships: { mean: 1.8, spread: 0.5 }, role: { mean: 3.9, spread: 0.5 },
      change: { mean: 3.3, spread: 0.6 },
    },
    'TI': {
      demands: { mean: 3.0, spread: 0.7 }, control: { mean: 4.0, spread: 0.5 },
      managerSupport: { mean: 3.2, spread: 0.8 }, peerSupport: { mean: 4.1, spread: 0.4 },
      relationships: { mean: 1.5, spread: 0.4 }, role: { mean: 4.3, spread: 0.3 },
      change: { mean: 3.5, spread: 0.6 },
    },
  };

  // Seeded pseudo-random for consistency
  let seed = 42;
  const rand = () => { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; };
  const clamp = (v: number) => Math.max(1, Math.min(5, Math.round(v)));

  const responses: { id: string; department: string | null; completedAt: string | null; answers: { questionNumber: number; value: number }[] }[] = [];

  let idx = 0;
  departments.forEach((dept, di) => {
    const count = respondentCounts[di];
    const tendencies = deptTendencies[dept];

    for (let r = 0; r < count; r++) {
      const answers = HSEIT_QUESTIONS.map(q => {
        const t = tendencies[q.category];
        const value = clamp(t.mean + (rand() - 0.5) * 2 * t.spread);
        return { questionNumber: q.number, value };
      });

      responses.push({
        id: `demo-${idx++}`,
        department: dept,
        completedAt: '2026-02-15T10:00:00Z',
        answers,
      });
    }
  });

  // Calculate overall category averages
  const allAnswers = responses.flatMap(r => r.answers);
  const categoryAverages = CATEGORIES.map(cat => ({
    category: cat,
    average: calculateCategoryAverage(allAnswers, cat),
    label: HSEIT_CATEGORY_LABELS[cat],
  }));

  // Question averages
  const questionAverages = HSEIT_QUESTIONS.map(q => {
    const vals = responses.map(r => {
      const a = r.answers.find(a => a.questionNumber === q.number);
      return a ? a.value : 3;
    });
    const avg = vals.reduce((s, v) => s + v, 0) / vals.length;
    return { questionNumber: q.number, text: q.text, category: q.category, average: avg };
  });

  return { responses, categoryAverages, departments, questionAverages };
}

const RelatorioDemo = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerateDemo = async () => {
    setIsGenerating(true);
    try {
      const { responses, categoryAverages, departments, questionAverages } = generateDemoData();

      await generatePGRReport({
        assessment: {
          id: 'demo-assessment',
          title: 'Avaliação de Riscos Psicossociais — Demonstração',
          description: 'Relatório demonstrativo gerado com dados simulados para apresentação do modelo PGR.',
          companyName: 'Empresa Demonstração Ltda.',
          createdAt: '2026-01-15T08:00:00Z',
        },
        companyInfo: {
          cnpj: '12.345.678/0001-99',
          address: 'Av. Paulista, 1000, São Paulo — SP',
          cnae: '6201-5/01',
          riskGrade: '2',
          employeeCount: 45,
        },
        responses,
        categoryAverages,
        departments,
        questionAverages,
        actionItems: [
          {
            id: '1',
            category: 'demands',
            priority: 'immediate',
            description: 'Sobrecarga de trabalho identificada no setor Operacional com média de risco elevada.',
            recommendation: 'Revisar distribuição de tarefas e implementar pausas programadas. Avaliar necessidade de contratação adicional.',
          },
          {
            id: '2',
            category: 'control',
            priority: 'immediate',
            description: 'Baixa autonomia no setor Operacional, com índice de controle abaixo do limiar aceitável.',
            recommendation: 'Implementar programa de delegação progressiva e criar canais de participação nas decisões operacionais.',
          },
          {
            id: '3',
            category: 'change',
            priority: 'short_term',
            description: 'Gestão de mudanças deficiente no setor Operacional, gerando insegurança nos colaboradores.',
            recommendation: 'Criar protocolo de comunicação de mudanças com antecedência mínima de 15 dias e reuniões de esclarecimento.',
          },
          {
            id: '4',
            category: 'managerSupport',
            priority: 'short_term',
            description: 'Suporte gerencial insuficiente nos setores Operacional e TI.',
            recommendation: 'Capacitar líderes em feedback construtivo e implementar reuniões semanais de acompanhamento 1:1.',
          },
          {
            id: '5',
            category: 'peerSupport',
            priority: 'medium_term',
            description: 'Oportunidade de fortalecimento da colaboração entre pares no setor Comercial.',
            recommendation: 'Promover atividades de integração entre equipes e criar grupos de trabalho multidisciplinares.',
          },
        ],
        scheduleItems: [
          { id: '1', action: 'Revisão de carga de trabalho — Operacional', deadline: '2026-04-30', responsible: 'RH / Gestão Operacional', status: 'pending' },
          { id: '2', action: 'Programa de delegação progressiva', deadline: '2026-05-31', responsible: 'Lideranças', status: 'pending' },
          { id: '3', action: 'Protocolo de comunicação de mudanças', deadline: '2026-06-30', responsible: 'Diretoria / RH', status: 'pending' },
          { id: '4', action: 'Capacitação de líderes em feedback', deadline: '2026-07-31', responsible: 'RH / Consultoria SST', status: 'pending' },
          { id: '5', action: 'Atividades de integração entre equipes', deadline: '2026-09-30', responsible: 'RH', status: 'pending' },
        ],
        executiveSummary: 'A avaliação de riscos psicossociais realizada na Empresa Demonstração Ltda. por meio do instrumento HSE-IT (Health and Safety Executive — Indicator Tool) identificou fatores de atenção prioritária nas dimensões de Demandas e Controle, especialmente no setor Operacional. Os resultados indicam necessidade de intervenção imediata na gestão de carga de trabalho e autonomia dos colaboradores. As dimensões de Papel/Cargo e Apoio dos Colegas apresentaram resultados favoráveis na maioria dos setores. O presente documento apresenta o inventário completo de riscos, análise por GHE (setor) e plano de ação com cronograma de implementação, em conformidade com as exigências da NR-1, NR-17 e Portaria MTE nº 1.419/2024.',
        sstName: 'Dr. João Silva — Engenheiro de Segurança do Trabalho',
        sstCpf: '123.456.789-00',
        sstRegistration: 'CREA-SP 123456',
        methodology: 'hseit',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <img 
          src="/lovable-uploads/Logo_SOIA.png" 
          alt="SOIA Logo" 
          className="h-10 mx-auto"
        />
        <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
          <FileText className="h-8 w-8 text-primary" />
        </div>
        <h1 className="text-2xl font-bold text-foreground">Relatório PGR — Riscos Psicossociais</h1>
        <p className="text-muted-foreground">
          Clique no botão abaixo para gerar e baixar o relatório demonstrativo no formato PGR, conforme NR-1 e Portaria MTE 1.419/2024.
        </p>
        <Button size="lg" className="gap-2 w-full" onClick={handleGenerateDemo} disabled={isGenerating}>
          {isGenerating ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              Gerando relatório...
            </>
          ) : (
            <>
              <Download className="h-5 w-5" />
              Gerar e Baixar Relatório PDF
            </>
          )}
        </Button>
        <Link to="/">
          <Button variant="ghost" className="gap-2 mt-2">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao site
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default RelatorioDemo;
