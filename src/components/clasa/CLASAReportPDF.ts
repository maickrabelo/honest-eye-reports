import jsPDF from 'jspdf';
import {
  CLASA_QUESTIONS,
  CLASA_CATEGORY_LABELS,
  CLASA_RISK_LABELS,
  CLASACategoryScore,
  CLASARiskLevel,
  toRiskIndex,
  getRiskLevel,
} from '@/data/clasaQuestions';

export interface CLASAReportData {
  title: string;
  companyName: string;
  period: string;
  totalResponses: number;
  globalIndex: number;
  globalLevel: CLASARiskLevel;
  byCategory: CLASACategoryScore[];
  questionMeans: { number: number; mean: number }[];
  departmentBreakdown: { name: string; responses: number; index: number }[];
  openFeedbacks: string[];
}

const RISK_RGB: Record<CLASARiskLevel, [number, number, number]> = {
  baixo: [22, 163, 74],
  moderado: [245, 158, 11],
  alto: [220, 38, 38],
};

export function generateCLASAReportPDF(data: CLASAReportData) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 48;
  let y = 0;

  const newPage = () => { doc.addPage(); y = M; };
  const ensure = (needed: number) => { if (y + needed > H - M) newPage(); };

  // Capa
  doc.setFillColor(6, 95, 70);
  doc.rect(0, 0, W, 190, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Diagnóstico de Clima, Bem-Estar e', M, 76);
  doc.text('Riscos Psicossociais (NR-01)', M, 100);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Programa de Aprendizagem CLASA', M, 126);
  doc.setFontSize(10);
  doc.text(`${data.companyName}  ·  ${data.period}`, M, 150);

  y = 230;
  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text(data.title, M, y);
  y += 26;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);
  doc.text(`Total de respondentes: ${data.totalResponses}`, M, y); y += 16;
  doc.text('Escala: 1 = Proteção · 2 = Alerta · 3 = Risco. Índice normalizado de 0 (melhor) a 100 (pior).', M, y); y += 30;

  // Índice global
  const [r, g, b] = RISK_RGB[data.globalLevel];
  doc.setFillColor(r, g, b);
  doc.roundedRect(M, y, W - M * 2, 68, 8, 8, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.text(`${data.globalIndex}/100`, M + 20, y + 42);
  doc.setFontSize(12);
  doc.text(CLASA_RISK_LABELS[data.globalLevel].toUpperCase(), W - M - 20, y + 42, { align: 'right' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Índice global de risco psicossocial', M + 20, y + 58);
  y += 96;

  // Eixos
  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Resultado por eixo temático', M, y);
  y += 18;

  data.byCategory.forEach(cat => {
    ensure(46);
    const [cr, cg, cb] = RISK_RGB[cat.level];
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(17, 24, 39);
    doc.text(cat.label, M, y + 10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(cr, cg, cb);
    doc.text(`${cat.index}/100 — ${CLASA_RISK_LABELS[cat.level]}`, W - M, y + 10, { align: 'right' });

    const barW = W - M * 2;
    doc.setFillColor(229, 231, 235);
    doc.roundedRect(M, y + 16, barW, 8, 4, 4, 'F');
    doc.setFillColor(cr, cg, cb);
    const fill = Math.max(2, (cat.index / 100) * barW);
    doc.roundedRect(M, y + 16, fill, 8, 4, 4, 'F');
    y += 38;
  });

  // Por turma / setor
  if (data.departmentBreakdown.length > 0) {
    ensure(70);
    y += 10;
    doc.setTextColor(17, 24, 39);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Resultado por turma / setor', M, y);
    y += 20;
    doc.setFontSize(10);
    doc.text('Turma / Setor', M, y);
    doc.text('Respostas', W - M - 160, y, { align: 'right' });
    doc.text('Índice', W - M, y, { align: 'right' });
    y += 6;
    doc.setDrawColor(229, 231, 235);
    doc.line(M, y, W - M, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
    data.departmentBreakdown.forEach(d => {
      ensure(20);
      const lvl = getRiskLevel(d.index);
      const [dr, dg, db] = RISK_RGB[lvl];
      doc.setTextColor(17, 24, 39);
      doc.text(d.name.slice(0, 52), M, y);
      doc.text(String(d.responses), W - M - 160, y, { align: 'right' });
      doc.setTextColor(dr, dg, db);
      doc.text(`${d.index}/100`, W - M, y, { align: 'right' });
      y += 18;
    });
  }

  // Detalhamento por questão
  newPage();
  doc.setTextColor(17, 24, 39);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('Detalhamento por questão', M, y);
  y += 22;

  data.questionMeans.forEach(qm => {
    const q = CLASA_QUESTIONS.find(x => x.number === qm.number);
    if (!q) return;
    const idx = toRiskIndex(qm.mean);
    const lvl = getRiskLevel(idx);
    const [qr, qg, qb] = RISK_RGB[lvl];
    const lines = doc.splitTextToSize(`Q${q.number}. ${q.text}`, W - M * 2 - 90);
    ensure(lines.length * 12 + 18);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(55, 65, 81);
    doc.text(lines, M, y);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(qr, qg, qb);
    doc.text(`${qm.mean.toFixed(2)} · ${idx}/100`, W - M, y, { align: 'right' });
    y += lines.length * 12 + 8;
    doc.setDrawColor(243, 244, 246);
    doc.line(M, y - 3, W - M, y - 3);
    y += 4;
  });

  // Manifestações abertas
  if (data.openFeedbacks.length > 0) {
    newPage();
    doc.setTextColor(17, 24, 39);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.text('Manifestações dos aprendizes', M, y);
    y += 22;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(55, 65, 81);
    data.openFeedbacks.forEach((f, i) => {
      const lines = doc.splitTextToSize(`${i + 1}. ${f}`, W - M * 2);
      ensure(lines.length * 12 + 10);
      doc.text(lines, M, y);
      y += lines.length * 12 + 10;
    });
  }

  // Rodapé
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(156, 163, 175);
    doc.text('Relatório gerado pela plataforma SOIA · dados anônimos e agregados', M, H - 24);
    doc.text(`${i}/${pages}`, W - M, H - 24, { align: 'right' });
  }

  const safe = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  doc.save(`clasa-${safe}-${new Date().toISOString().split('T')[0]}.pdf`);
}

export { CLASA_CATEGORY_LABELS };
