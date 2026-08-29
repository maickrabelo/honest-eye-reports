import jsPDF from 'jspdf';

export interface HistoryUpdate {
  created_at: string;
  message: string;
  author_label: string;
  visibility?: string | null;
}

export interface HistoryNote {
  created_at: string;
  note: string;
  author_label: string;
}

export interface OuvidoriaHistoryData {
  companyName?: string | null;
  trackingCode: string;
  channelLabel: string;
  createdAt: string;
  status: string;
  type?: string | null;
  category?: string | null;
  sector?: string | null;
  occurrence?: string | null;
  description: string;
  summary?: string | null;
  updates: HistoryUpdate[];
  internalNotes: HistoryNote[];
  attachments: string[];
  accessLogs?: { created_at: string; success: boolean; user_agent?: string | null }[];
}

const fmt = (iso: string) => new Date(iso).toLocaleString('pt-BR');

export const downloadOuvidoriaHistoryPdf = (data: OuvidoriaHistoryData) => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const marginX = 48;
  const pageHeight = doc.internal.pageSize.getHeight();
  const maxWidth = doc.internal.pageSize.getWidth() - marginX * 2;
  let y = 56;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 56) {
      doc.addPage();
      y = 56;
    }
  };

  const heading = (text: string) => {
    ensureSpace(34);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 52, 96);
    doc.text(text, marginX, y);
    y += 8;
    doc.setDrawColor(220);
    doc.line(marginX, y, marginX + maxWidth, y);
    y += 14;
    doc.setTextColor(40);
  };

  const paragraph = (text: string, size = 10, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    const lines = doc.splitTextToSize(text || '—', maxWidth);
    lines.forEach((line: string) => {
      ensureSpace(16);
      doc.text(line, marginX, y);
      y += 14;
    });
  };

  // Cabeçalho
  doc.setFillColor(15, 52, 96);
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 90, 'F');
  doc.setTextColor(255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Histórico da Denúncia', marginX, 44);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(
    `${data.companyName ?? 'Canal de Ouvidoria'} · ${data.channelLabel}`,
    marginX,
    64
  );
  doc.text(`Emitido em ${new Date().toLocaleString('pt-BR')}`, marginX, 78);
  doc.setTextColor(40);
  y = 118;

  heading('Identificação');
  paragraph(`Protocolo: ${data.trackingCode}`, 10, true);
  paragraph(`Abertura: ${fmt(data.createdAt)}`);
  paragraph(`Situação atual: ${data.status}`);
  if (data.type) paragraph(`Tipo: ${data.type}`);
  if (data.category) paragraph(`Categoria: ${data.category}`);
  if (data.sector) paragraph(`Setor / Local: ${data.sector}`);
  if (data.occurrence) paragraph(`Período do ocorrido: ${data.occurrence}`);
  y += 6;

  if (data.summary) {
    heading('Resumo');
    paragraph(data.summary);
    y += 6;
  }

  heading('Relato / Transcrição');
  paragraph(data.description);
  y += 6;

  heading(`Atualizações (${data.updates.length})`);
  if (data.updates.length === 0) {
    paragraph('Nenhuma atualização registrada.');
  } else {
    data.updates.forEach((u) => {
      paragraph(`${fmt(u.created_at)} — ${u.author_label}`, 10, true);
      paragraph(u.message);
      y += 4;
    });
  }
  y += 6;

  heading(`Notas internas (${data.internalNotes.length})`);
  paragraph('Conteúdo restrito ao time interno. Não visível ao denunciante.', 9);
  y += 4;
  if (data.internalNotes.length === 0) {
    paragraph('Nenhuma nota interna registrada.');
  } else {
    data.internalNotes.forEach((n) => {
      paragraph(`${fmt(n.created_at)} — ${n.author_label}`, 10, true);
      paragraph(n.note);
      y += 4;
    });
  }
  y += 6;

  heading(`Anexos (${data.attachments.length})`);
  if (data.attachments.length === 0) paragraph('Nenhum anexo.');
  else data.attachments.forEach((a) => paragraph(`• ${a}`));
  y += 6;

  if (data.accessLogs && data.accessLogs.length > 0) {
    heading(`Logs de acesso do denunciante (${data.accessLogs.length})`);
    data.accessLogs.slice(0, 40).forEach((l) => {
      paragraph(
        `${fmt(l.created_at)} — ${l.success ? 'Consulta realizada' : 'Tentativa sem sucesso'}`
      );
    });
  }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(
      `Documento confidencial · SOIA · Página ${i} de ${pages}`,
      marginX,
      pageHeight - 28
    );
  }

  doc.save(`historico-${data.trackingCode}.pdf`);
};
