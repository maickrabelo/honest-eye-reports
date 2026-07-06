import jsPDF from 'jspdf';
import {
  COPSOQ_QUESTIONS,
  COPSOQ_CATEGORY_LABELS,
  COPSOQCategory,
  CATEGORY_GROUPS,
  getRiskLevel,
  RISK_LEVEL_LABELS,
  normalizeScore,
} from '@/data/copsoqQuestions';

export interface COPSOQActionItem {
  id: string;
  category: string;
  priority: 'immediate' | 'short_term' | 'medium_term';
  description: string;
  recommendation: string;
}

export interface COPSOQScheduleItem {
  id: string;
  action: string;
  deadline: string;
  responsible: string;
}

export interface COPSOQReportData {
  assessment: {
    id: string;
    title: string;
    description: string | null;
    companyName: string;
    createdAt: string;
  };
  companyInfo: {
    cnpj?: string;
    address?: string;
    cnae?: string;
    riskGrade?: string;
    employeeCount?: number;
  };
  responsesCount: number;
  departments: string[];
  categoryAverages: { category: COPSOQCategory; average: number; label: string }[];
  overallAverage: number;
  questionAverages: { number: number; text: string; category: string; average: number }[];
  actionItems: COPSOQActionItem[];
  scheduleItems: COPSOQScheduleItem[];
  executiveSummary: string;
  sstLogoUrl?: string | null;
  sstName?: string | null;
  sstCpf?: string;
  sstRegistration?: string;
}

const PRIORITY_LABELS: Record<string, string> = {
  immediate: 'Imediato (até 30 dias)',
  short_term: 'Curto prazo (1-3 meses)',
  medium_term: 'Médio prazo (3-6 meses)',
};

function riskRGB(avg: number): [number, number, number] {
  const r = getRiskLevel(avg);
  return r === 'risk' ? [220, 53, 69] : r === 'intermediate' ? [255, 152, 0] : [40, 167, 69];
}

export async function generateCOPSOQReport(data: COPSOQReportData): Promise<void> {
  const pdf = new jsPDF('p', 'mm', 'a4');
  const pw = pdf.internal.pageSize.getWidth();
  const ph = pdf.internal.pageSize.getHeight();
  const m = 20;
  let y = m;

  const check = (need: number) => {
    if (y + need > ph - 20) { pdf.addPage(); y = m; }
  };

  const drawFooter = () => {
    const total = (pdf as any).internal.getNumberOfPages();
    for (let i = 1; i <= total; i++) {
      pdf.setPage(i);
      pdf.setFontSize(8);
      pdf.setTextColor(140, 140, 140);
      pdf.text(
        `${data.assessment.companyName} — Relatório COPSOQ II — Página ${i} de ${total}`,
        pw / 2, ph - 10, { align: 'center' }
      );
    }
  };

  const section = (num: string, title: string) => {
    check(18);
    pdf.setFillColor(0, 51, 102);
    pdf.rect(m, y, pw - 2 * m, 9, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${num}. ${title}`, m + 3, y + 6);
    y += 14;
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');
  };

  const subSection = (title: string) => {
    check(10);
    pdf.setFontSize(11);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 51, 102);
    pdf.text(title, m, y);
    y += 6;
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');
  };

  const paragraph = (text: string, indent = 0) => {
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(50, 50, 50);
    const lines = pdf.splitTextToSize(text, pw - 2 * m - indent);
    lines.forEach((l: string) => {
      check(6);
      pdf.text(l, m + indent, y);
      y += 5;
    });
    y += 1;
  };

  // ═══════════════ COVER ═══════════════
  pdf.setFillColor(0, 51, 102);
  pdf.rect(0, 0, pw, 70, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(22);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Relatório COPSOQ II', pw / 2, 30, { align: 'center' });
  pdf.setFontSize(13);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Avaliação de Fatores Psicossociais no Trabalho', pw / 2, 40, { align: 'center' });
  pdf.setFontSize(10);
  pdf.text('Copenhagen Psychosocial Questionnaire — Versão Curta', pw / 2, 48, { align: 'center' });

  y = 90;
  pdf.setTextColor(0, 0, 0);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(data.assessment.companyName, pw / 2, y, { align: 'center' });
  y += 10;
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'normal');
  pdf.text(data.assessment.title, pw / 2, y, { align: 'center' });
  y += 20;

  pdf.setFontSize(10);
  pdf.setTextColor(80, 80, 80);
  const dt = new Date(data.assessment.createdAt).toLocaleDateString('pt-BR');
  pdf.text(`Data da avaliação: ${dt}`, pw / 2, y, { align: 'center' }); y += 6;
  pdf.text(`Data de emissão: ${new Date().toLocaleDateString('pt-BR')}`, pw / 2, y, { align: 'center' }); y += 6;
  pdf.text(`Total de respostas: ${data.responsesCount}`, pw / 2, y, { align: 'center' }); y += 6;
  pdf.text(`Setores avaliados: ${data.departments.length || 1}`, pw / 2, y, { align: 'center' }); y += 14;

  if (data.sstName) {
    pdf.setFontSize(10);
    pdf.setTextColor(0, 51, 102);
    pdf.text('Responsável Técnico SST', pw / 2, y, { align: 'center' }); y += 6;
    pdf.setTextColor(0, 0, 0);
    pdf.text(data.sstName, pw / 2, y, { align: 'center' }); y += 6;
    if (data.sstCpf) { pdf.text(`CPF: ${data.sstCpf}`, pw / 2, y, { align: 'center' }); y += 6; }
    if (data.sstRegistration) { pdf.text(`Registro: ${data.sstRegistration}`, pw / 2, y, { align: 'center' }); y += 6; }
  }

  // ═══════════════ 1. IDENTIFICAÇÃO DA EMPRESA ═══════════════
  pdf.addPage(); y = m;
  section('1', 'Identificação da Empresa');
  const info: [string, string][] = [
    ['Razão Social', data.assessment.companyName],
    ['CNPJ', data.companyInfo.cnpj || '—'],
    ['CNAE', data.companyInfo.cnae || '—'],
    ['Endereço', data.companyInfo.address || '—'],
    ['Grau de Risco (NR-4)', data.companyInfo.riskGrade || '—'],
    ['Total de respondentes', String(data.responsesCount)],
    ['Setores avaliados', data.departments.length ? data.departments.join(', ') : '—'],
  ];
  info.forEach(([k, v]) => {
    check(9);
    pdf.setFillColor(245, 247, 250);
    pdf.rect(m, y - 4, pw - 2 * m, 8, 'F');
    pdf.setFontSize(10);
    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(0, 51, 102);
    pdf.text(`${k}:`, m + 3, y + 2);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(0, 0, 0);
    const lines = pdf.splitTextToSize(v, pw - 2 * m - 60);
    pdf.text(lines[0] || '', m + 55, y + 2);
    y += 9;
    for (let i = 1; i < lines.length; i++) {
      check(6);
      pdf.text(lines[i], m + 55, y + 2);
      y += 5;
    }
  });
  y += 4;

  // ═══════════════ 2. RESUMO EXECUTIVO ═══════════════
  section('2', 'Resumo Executivo');
  paragraph(data.executiveSummary || 'Resumo executivo não informado.');

  // ═══════════════ 3. METODOLOGIA ═══════════════
  section('3', 'Metodologia');
  paragraph('O COPSOQ II (Copenhagen Psychosocial Questionnaire) é um instrumento internacionalmente validado, desenvolvido pelo National Research Centre for the Working Environment (Dinamarca), para avaliação de fatores psicossociais no trabalho. Esta avaliação utiliza a versão curta, composta por 40 questões distribuídas em 23 dimensões, organizadas em 6 grandes grupos.');

  subSection('3.1 Escala de resposta');
  paragraph('Escala Likert de 5 pontos (frequência ou concordância, conforme a questão). Questões de fator negativo têm pontuação invertida, de modo que scores mais altos representam sempre condições mais favoráveis.');

  subSection('3.2 Classificação de risco');
  const th: [string, string, [number, number, number]][] = [
    ['Favorável', '≥ 3,67', [40, 167, 69]],
    ['Intermediário', '2,33 – 3,66', [255, 152, 0]],
    ['Risco', '< 2,33', [220, 53, 69]],
  ];
  th.forEach(([lbl, range, [r, g, b]]) => {
    check(8);
    pdf.setFillColor(r, g, b);
    pdf.circle(m + 4, y - 1, 2.5, 'F');
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'bold');
    pdf.text(`${lbl} (${range})`, m + 10, y);
    y += 7;
  });
  y += 4;

  // ═══════════════ 4. RESULTADOS POR DIMENSÃO ═══════════════
  pdf.addPage(); y = m;
  section('4', 'Resultados por Dimensão');

  // Overall score card
  const [oR, oG, oB] = riskRGB(data.overallAverage);
  check(24);
  pdf.setFillColor(245, 247, 250);
  pdf.rect(m, y, pw - 2 * m, 20, 'F');
  pdf.setFontSize(10);
  pdf.setTextColor(80, 80, 80);
  pdf.text('Média Geral (normalizada, 1-5)', m + 5, y + 7);
  pdf.setFontSize(18);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(oR, oG, oB);
  pdf.text(data.overallAverage.toFixed(2), m + 5, y + 16);
  pdf.setFontSize(10);
  pdf.setTextColor(80, 80, 80);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Classificação:', pw - m - 60, y + 7);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(oR, oG, oB);
  pdf.text(RISK_LEVEL_LABELS[getRiskLevel(data.overallAverage)], pw - m - 60, y + 16);
  y += 26;

  // Bars by group
  Object.entries(CATEGORY_GROUPS).forEach(([groupName, cats]) => {
    check(10);
    subSection(groupName);
    cats.forEach(cat => {
      const item = data.categoryAverages.find(c => c.category === cat);
      const avg = item?.average ?? 0;
      const [r, g, b] = riskRGB(avg);
      check(9);
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(60, 60, 60);
      const label = COPSOQ_CATEGORY_LABELS[cat];
      const trimmed = label.length > 40 ? label.substring(0, 40) + '…' : label;
      pdf.text(trimmed, m, y + 4);
      // bar
      const barX = m + 75;
      const barW = pw - m - barX - 25;
      pdf.setFillColor(230, 230, 230);
      pdf.rect(barX, y, barW, 5, 'F');
      pdf.setFillColor(r, g, b);
      pdf.rect(barX, y, Math.max(0, Math.min(1, avg / 5)) * barW, 5, 'F');
      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(r, g, b);
      pdf.text(avg.toFixed(2), barX + barW + 2, y + 4);
      y += 7;
    });
    y += 3;
  });

  // ═══════════════ 5. QUESTÕES MAIS CRÍTICAS ═══════════════
  pdf.addPage(); y = m;
  section('5', 'Questões Mais Críticas (Top 15)');
  const critical = [...data.questionAverages].sort((a, b) => a.average - b.average).slice(0, 15);

  // Table header
  const cols = [
    { w: 10, label: '#' },
    { w: 105, label: 'Questão' },
    { w: 40, label: 'Dimensão' },
    { w: 20, label: 'Média' },
  ];
  pdf.setFillColor(0, 51, 102);
  pdf.rect(m, y, pw - 2 * m, 8, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  let cx = m + 2;
  cols.forEach(c => { pdf.text(c.label, cx, y + 5); cx += c.w; });
  y += 10;

  pdf.setTextColor(0, 0, 0);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  critical.forEach((q, idx) => {
    const qLines = pdf.splitTextToSize(q.text, 103);
    const rowH = Math.max(6, qLines.length * 4 + 2);
    check(rowH + 2);
    if (idx % 2 === 0) { pdf.setFillColor(248, 249, 250); pdf.rect(m, y - 1, pw - 2 * m, rowH, 'F'); }
    pdf.setTextColor(0, 0, 0);
    pdf.text(String(q.number), m + 2, y + 4);
    pdf.text(qLines, m + 12, y + 4);
    const dim = q.category.length > 22 ? q.category.substring(0, 22) + '…' : q.category;
    pdf.text(dim, m + 117, y + 4);
    const [r, g, b] = riskRGB(q.average);
    pdf.setTextColor(r, g, b);
    pdf.setFont('helvetica', 'bold');
    pdf.text(q.average.toFixed(2), m + 157, y + 4);
    pdf.setFont('helvetica', 'normal');
    y += rowH;
  });
  y += 4;

  // ═══════════════ 6. PLANO DE AÇÃO ═══════════════
  pdf.addPage(); y = m;
  section('6', 'Plano de Ação');
  if (data.actionItems.length === 0) {
    paragraph('Nenhuma ação registrada.');
  } else {
    data.actionItems.forEach((it, i) => {
      check(30);
      pdf.setFillColor(245, 247, 250);
      pdf.rect(m, y, pw - 2 * m, 8, 'F');
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 51, 102);
      pdf.text(`Ação ${i + 1} — ${it.category}`, m + 3, y + 5);
      pdf.setTextColor(120, 120, 120);
      pdf.setFontSize(8);
      pdf.text(PRIORITY_LABELS[it.priority] || it.priority, pw - m - 3, y + 5, { align: 'right' });
      y += 11;

      pdf.setFontSize(9);
      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('Situação identificada:', m + 3, y); y += 4;
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(50, 50, 50);
      const dLines = pdf.splitTextToSize(it.description || '—', pw - 2 * m - 6);
      dLines.forEach((l: string) => { check(5); pdf.text(l, m + 3, y); y += 4; });
      y += 1;

      pdf.setFont('helvetica', 'bold');
      pdf.setTextColor(0, 0, 0);
      pdf.text('Medida proposta:', m + 3, y); y += 4;
      pdf.setFont('helvetica', 'normal');
      pdf.setTextColor(50, 50, 50);
      const rLines = pdf.splitTextToSize(it.recommendation || '—', pw - 2 * m - 6);
      rLines.forEach((l: string) => { check(5); pdf.text(l, m + 3, y); y += 4; });
      y += 5;
    });
  }

  // ═══════════════ 7. CRONOGRAMA ═══════════════
  section('7', 'Cronograma de Implementação');
  if (data.scheduleItems.length === 0) {
    paragraph('Nenhum item de cronograma registrado.');
  } else {
    // Table header
    pdf.setFillColor(0, 51, 102);
    pdf.rect(m, y, pw - 2 * m, 8, 'F');
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Ação', m + 2, y + 5);
    pdf.text('Prazo', m + 100, y + 5);
    pdf.text('Responsável', m + 130, y + 5);
    y += 10;

    pdf.setTextColor(0, 0, 0);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    data.scheduleItems.forEach((s, idx) => {
      const aLines = pdf.splitTextToSize(s.action, 95);
      const rowH = Math.max(6, aLines.length * 4 + 2);
      check(rowH + 2);
      if (idx % 2 === 0) { pdf.setFillColor(248, 249, 250); pdf.rect(m, y - 1, pw - 2 * m, rowH, 'F'); }
      pdf.text(aLines, m + 2, y + 4);
      pdf.text(s.deadline || '—', m + 100, y + 4);
      pdf.text(s.responsible || '—', m + 130, y + 4);
      y += rowH;
    });
  }

  // ═══════════════ 8. ENCERRAMENTO ═══════════════
  pdf.addPage(); y = m;
  section('8', 'Considerações Finais');
  paragraph('Este relatório atende à obrigação de identificação e avaliação de fatores de risco psicossocial no ambiente de trabalho, contribuindo para o Programa de Gerenciamento de Riscos (PGR) previsto na NR-1 e para as diretrizes da NR-17. Recomenda-se reavaliação periódica (mínima anual) e monitoramento contínuo das medidas implementadas.');

  y += 10;
  if (data.sstName) {
    check(30);
    pdf.setDrawColor(0, 0, 0);
    pdf.line(m + 30, y + 20, pw - m - 30, y + 20);
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.text(data.sstName, pw / 2, y + 25, { align: 'center' });
    if (data.sstRegistration) pdf.text(`Registro: ${data.sstRegistration}`, pw / 2, y + 30, { align: 'center' });
    if (data.sstCpf) pdf.text(`CPF: ${data.sstCpf}`, pw / 2, y + 35, { align: 'center' });
    pdf.setFontSize(9);
    pdf.setTextColor(120, 120, 120);
    pdf.text('Responsável Técnico em Segurança e Saúde no Trabalho', pw / 2, y + 42, { align: 'center' });
  }

  drawFooter();

  const filename = `relatorio-copsoq-${data.assessment.companyName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(filename);
}
