/**
 * IMG/IPI Assessment Report — PDF export.
 *
 * Produces the institutional diagnostic report from a completed assessment:
 * scores, bands, dimension breakdown, institutional profile, gap-to-module
 * mapping, and the intervention forecast. Generated fully offline.
 */
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { IMGIPIInputs, IMGIPIResult } from '@/lib/imgIpi';
import { forecastInterventions } from '@/lib/imgIpiForecast';

const PRIMARY: [number, number, number] = [30, 64, 175]; // deep blue
const MUTED: [number, number, number] = [100, 116, 139];

function bandColor(band: string): [number, number, number] {
  switch (band) {
    case 'Low':
      return [22, 163, 74];
    case 'Moderate':
      return [202, 138, 4];
    case 'High':
      return [234, 88, 12];
    case 'Critical':
      return [220, 38, 38];
    default:
      return [22, 163, 74]; // Very High (IPI)
  }
}

export function generateAssessmentReport(opts: {
  universityName: string;
  inputs: IMGIPIInputs;
  result: IMGIPIResult;
  assessedAt: string;
}): void {
  const { universityName, inputs, result, assessedAt } = opts;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  let y = 0;

  // ---- Header band ---------------------------------------------------------
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, W, 34, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('IRIS', 14, 14);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('International Relations Intelligent System', 14, 20);
  doc.setFontSize(13);
  doc.setFont('helvetica', 'bold');
  doc.text('IMG/IPI Institutional Assessment Report', 14, 29);
  y = 44;

  // ---- Institution block ---------------------------------------------------
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(universityName, 14, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MUTED);
  doc.text(
    `Assessment date: ${new Date(assessedAt).toLocaleDateString()}   ·   Faculty survey n = ${inputs.surveyRespondents}   ·   Framework: IMG/IPI dual composite index (Section 2.7)`,
    14,
    y
  );
  y += 10;

  // ---- Headline scores -----------------------------------------------------
  const box = (x: number, label: string, value: string, band: string) => {
    doc.setDrawColor(...MUTED);
    doc.roundedRect(x, y, 86, 26, 2, 2);
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.setFont('helvetica', 'normal');
    doc.text(label, x + 5, y + 7);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    doc.text(value, x + 5, y + 17);
    const [r, g, b] = bandColor(band);
    doc.setFillColor(r, g, b);
    doc.roundedRect(x + 5, y + 19.5, 30, 5.5, 1, 1, 'F');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(band.toUpperCase(), x + 20, y + 23.4, { align: 'center' });
  };
  box(14, 'Internationalization Maturity Gap (IMG)', result.img.toFixed(3), result.imgBand);
  box(110, 'Internationalization Potential Index (IPI)', result.ipi.toFixed(3), result.ipiBand);
  y += 32;

  if (result.ipiCI95) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MUTED);
    doc.text(
      `IPI 95% confidence interval: [${result.ipiCI95[0].toFixed(3)}, ${result.ipiCI95[1].toFixed(3)}] (SE = ${result.seIpi?.toFixed(3)}). IMG carries no standard error: all items are verified institutional facts.`,
      14,
      y
    );
    y += 7;
  }

  // ---- Institutional profile -----------------------------------------------
  doc.setFillColor(241, 245, 249);
  const profileLines = doc.splitTextToSize(result.profile.implication, W - 38) as string[];
  const profileH = 14 + profileLines.length * 4.2;
  doc.roundedRect(14, y, W - 28, profileH, 2, 2, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY);
  doc.text(`Institutional profile: ${result.profile.title}`, 19, y + 8);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(profileLines, 19, y + 14);
  y += profileH + 8;

  // ---- Dimension breakdown table ---------------------------------------------
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Dimension breakdown', 14, y);
  autoTable(doc, {
    startY: y + 3,
    head: [['Dimension', 'Item', 'Measured value', 'Normalized score']],
    body: [
      ...result.ia.items.map((it, i) => [
        i === 0 ? `IA — Information Asymmetry (${result.ia.score.toFixed(3)})` : '',
        `#${it.id} ${it.label}`,
        it.raw,
        it.score.toFixed(3),
      ]),
      ...result.wf.items.map((it, i) => [
        i === 0 ? `WF — Workflow Fragmentation (${result.wf.score.toFixed(3)})` : '',
        `#${it.id} ${it.label}`,
        it.raw,
        it.score.toFixed(3),
      ]),
      ...result.did.items.map((it, i) => [
        i === 0 ? `DID — Digital Infrastructure Deficit (${result.did.score.toFixed(3)})` : '',
        `#${it.id} ${it.label}`,
        it.raw,
        it.score.toFixed(3),
      ]),
      [
        'IPI components',
        `LC — Leadership Commitment: ${result.lc.toFixed(3)}`,
        `RF — Readiness Factor: ${result.rf.toFixed(3)}`,
        `IPI = [(LC+RF)/2] × (1−IMG)`,
      ],
    ],
    styles: { fontSize: 8, cellPadding: 1.6 },
    headStyles: { fillColor: PRIMARY, fontSize: 8.5 },
    columnStyles: { 0: { cellWidth: 52, fontStyle: 'bold' }, 3: { halign: 'right' } },
    theme: 'grid',
  });
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 9;

  // ---- Gap diagnosis ---------------------------------------------------------
  if (y > 230) {
    doc.addPage();
    y = 20;
  }
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Gap diagnosis and remediation mapping', 14, y);
  autoTable(doc, {
    startY: y + 3,
    head: [['Gap', 'Severity', 'Finding', 'Addressed by']],
    body: result.gaps.map((g) => [g.dimension, g.severity.toFixed(3), g.finding, g.irisModule]),
    styles: { fontSize: 8, cellPadding: 1.6 },
    headStyles: { fillColor: PRIMARY, fontSize: 8.5 },
    columnStyles: { 0: { cellWidth: 14, fontStyle: 'bold' }, 1: { cellWidth: 18, halign: 'right' }, 3: { cellWidth: 52 } },
    theme: 'grid',
  });
  y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 9;

  // ---- Intervention forecast --------------------------------------------------
  const forecast = forecastInterventions(inputs);
  if (forecast.entries.length > 0) {
    if (y > 210) {
      doc.addPage();
      y = 20;
    }
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Intervention forecast (framework simulation)', 14, y);
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MUTED);
    doc.text(
      'Each row re-computes the Section 2.7 equations with that single intervention applied — deterministic framework mathematics, not an AI estimate.',
      14,
      y + 4.5
    );
    autoTable(doc, {
      startY: y + 7,
      head: [['Intervention', 'IMG →', 'ΔIMG', 'IPI →', 'ΔIPI']],
      body: [
        ...forecast.entries
          .slice(0, 8)
          .map((e) => [
            e.intervention.title,
            `${e.img.toFixed(3)} (${e.imgBand})`,
            e.imgDelta.toFixed(3),
            `${e.ipi.toFixed(3)} (${e.ipiBand})`,
            `+${e.ipiDelta.toFixed(3)}`,
          ]),
        ...(forecast.combined
          ? [[
              { content: 'ALL interventions combined', styles: { fontStyle: 'bold' as const } },
              { content: `${forecast.combined.img.toFixed(3)} (${forecast.combined.imgBand})`, styles: { fontStyle: 'bold' as const } },
              { content: (forecast.combined.img - result.img).toFixed(3), styles: { fontStyle: 'bold' as const } },
              { content: `${forecast.combined.ipi.toFixed(3)} (${forecast.combined.ipiBand})`, styles: { fontStyle: 'bold' as const } },
              { content: `+${(forecast.combined.ipi - result.ipi).toFixed(3)}`, styles: { fontStyle: 'bold' as const } },
            ]]
          : []),
      ],
      styles: { fontSize: 8, cellPadding: 1.6 },
      headStyles: { fillColor: PRIMARY, fontSize: 8.5 },
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right' } },
      theme: 'grid',
    });
  }

  // ---- Footer on every page ----------------------------------------------------
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(
      `Generated offline by IRIS · IMG/IPI dual composite index with theoretically anchored normalization (exogenous benchmarks) · Page ${p} of ${pages}`,
      14,
      doc.internal.pageSize.getHeight() - 8
    );
  }

  doc.save(`IRIS-Assessment-${universityName.replace(/[^\w\dÀ-ž]+/g, '-')}.pdf`);
}
