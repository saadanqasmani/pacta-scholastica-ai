/**
 * IMG/IPI Assessment Report — expert-level multi-page PDF export.
 *
 * Produces the full institutional diagnostic report from a completed
 * assessment: executive summary, headline scores, cohort benchmark scatter,
 * dimension and item-level charts, gap diagnosis, intervention tornado,
 * priority matrix, and a phased step-by-step remediation gameplan with the
 * cumulative projected trajectory. All charts are drawn with jsPDF vector
 * primitives — generated fully offline, no external chart libraries.
 */
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { computeIMGIPI } from '@/lib/imgIpi';
import type { IMGIPIInputs, IMGIPIResult } from '@/lib/imgIpi';
import { forecastInterventions } from '@/lib/imgIpiForecast';
import type { ForecastEntry } from '@/lib/imgIpiForecast';

// ---------------------------------------------------------------------------
// Palette (consistent with the app: deep blue primary, slate muted, severity
// green/yellow/orange/red).
// ---------------------------------------------------------------------------
const PRIMARY: [number, number, number] = [30, 64, 175]; // deep blue
const MUTED: [number, number, number] = [100, 116, 139];
const SLATE_LIGHT: [number, number, number] = [148, 163, 184];
const TRACK: [number, number, number] = [226, 232, 240];
const PANEL: [number, number, number] = [241, 245, 249];
const INK: [number, number, number] = [15, 23, 42];
const GREEN: [number, number, number] = [22, 163, 74];
const YELLOW: [number, number, number] = [202, 138, 4];
const ORANGE: [number, number, number] = [234, 88, 12];
const RED: [number, number, number] = [220, 38, 38];

function bandColor(band: string): [number, number, number] {
  switch (band) {
    case 'Low':
      return GREEN;
    case 'Moderate':
      return YELLOW;
    case 'High':
      return ORANGE;
    case 'Critical':
      return RED;
    default:
      return GREEN; // Very High (IPI)
  }
}

/** Severity coloring for gap scores in [0,1] — higher is worse. */
function severityColor(v: number): [number, number, number] {
  if (v <= 0.25) return GREEN;
  if (v <= 0.5) return YELLOW;
  if (v <= 0.75) return ORANGE;
  return RED;
}

// ---------------------------------------------------------------------------
// Static effort ratings for the priority matrix / gameplan (1 = low, 3 = high).
// ---------------------------------------------------------------------------
const EFFORT: Record<string, { rating: number; label: string }> = {
  'lc1-strategy': { rating: 1, label: 'Low' },
  'lc2-office': { rating: 1, label: 'Low' },
  'lc3-budget': { rating: 1, label: 'Low' },
  'item3-process': { rating: 1, label: 'Low' },
  'item2-platforms': { rating: 1.5, label: 'Low-Med' },
  'item7-software': { rating: 2, label: 'Medium' },
  'item8-records': { rating: 2, label: 'Medium' },
  'item9-mobility': { rating: 2, label: 'Medium' },
  'item11-dashboard': { rating: 2, label: 'Medium' },
  'item1-response': { rating: 2.5, label: 'Med-High' },
  'item5-mou-cycle': { rating: 2.5, label: 'Med-High' },
  'item10-integration': { rating: 3, label: 'High' },
};
const DEFAULT_EFFORT = { rating: 2, label: 'Medium' };
const effortOf = (id: string) => EFFORT[id] ?? DEFAULT_EFFORT;

/** Short display names for chart point labels. */
const SHORT_NAME: Record<string, string> = {
  'item7-software': 'Software',
  'item8-records': 'Records',
  'item9-mobility': 'Mobility',
  'item10-integration': 'Integration',
  'item11-dashboard': 'Dashboard',
  'item3-process': 'Process doc',
  'item2-platforms': 'Platforms',
  'item1-response': 'Response time',
  'item5-mou-cycle': 'MOU cycle',
  'lc1-strategy': 'Strategy (LC1)',
  'lc2-office': 'IR office (LC2)',
  'lc3-budget': 'Budget (LC3)',
};
const shortNameOf = (id: string) => SHORT_NAME[id] ?? id;

/** Which checklist item each intervention fixes. */
const FIXES: Record<string, string> = {
  'item1-response': 'Item 1 (IA)',
  'item2-platforms': 'Item 2 (IA)',
  'item3-process': 'Item 3 (IA)',
  'item5-mou-cycle': 'Item 5 (WF)',
  'item7-software': 'Item 7 (DID)',
  'item8-records': 'Item 8 (DID)',
  'item9-mobility': 'Item 9 (DID)',
  'item10-integration': 'Item 10 (DID)',
  'item11-dashboard': 'Item 11 (DID)',
  'lc1-strategy': 'LC1',
  'lc2-office': 'LC2',
  'lc3-budget': 'LC3',
};
const fixesOf = (id: string) => FIXES[id] ?? '—';

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export interface CohortPoint {
  name: string;
  img: number;
  ipi: number;
  isSubject?: boolean;
}

export interface AssessmentReportOptions {
  universityName: string;
  inputs: IMGIPIInputs;
  result: IMGIPIResult;
  assessedAt: string;
  /** IMG/IPI of every assessed university in the registry, subject flagged. */
  cohort: CohortPoint[];
}

// ---------------------------------------------------------------------------
// Small drawing helpers
// ---------------------------------------------------------------------------
const MARGIN = 14;
const BOTTOM_LIMIT = 282; // keep clear of the page footer

const ordinal = (n: number): string => {
  const rem100 = n % 100;
  if (rem100 >= 11 && rem100 <= 13) return `${n}th`;
  switch (n % 10) {
    case 1:
      return `${n}st`;
    case 2:
      return `${n}nd`;
    case 3:
      return `${n}rd`;
    default:
      return `${n}th`;
  }
};

const truncate = (s: string, max: number) => (s.length > max ? s.slice(0, max - 1).trimEnd() + '…' : s);

function ensureSpace(doc: jsPDF, y: number, needed: number): number {
  if (y + needed > BOTTOM_LIMIT) {
    doc.addPage();
    return 20;
  }
  return y;
}

function sectionTitle(doc: jsPDF, y: number, title: string, subtitle?: string): number {
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...INK);
  doc.text(title, MARGIN, y);
  y += 4.5;
  if (subtitle) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MUTED);
    const lines = doc.splitTextToSize(subtitle, doc.internal.pageSize.getWidth() - 2 * MARGIN) as string[];
    doc.text(lines, MARGIN, y);
    y += lines.length * 3.8 + 1;
  }
  return y + 1.5;
}

/** One labelled horizontal bar with a value caption. Returns row bottom y. */
function barRow(
  doc: jsPDF,
  y: number,
  label: string,
  value: number,
  color: [number, number, number],
  layout: { labelW: number; barW: number; rowH: number; barH: number; fontSize: number }
): number {
  const { labelW, barW, rowH, barH, fontSize } = layout;
  const barX = MARGIN + labelW;
  const barY = y + (rowH - barH) / 2;
  doc.setFontSize(fontSize);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...INK);
  doc.text(truncate(label, Math.floor(labelW / 1.5)), MARGIN, y + rowH / 2 + fontSize * 0.13);
  doc.setFillColor(...TRACK);
  doc.rect(barX, barY, barW, barH, 'F');
  const w = Math.max(0, Math.min(1, value)) * barW;
  if (w > 0) {
    doc.setFillColor(...color);
    doc.rect(barX, barY, w, barH, 'F');
  }
  doc.setTextColor(...MUTED);
  doc.setFont('helvetica', 'bold');
  doc.text(value.toFixed(3), barX + barW + 2.5, y + rowH / 2 + fontSize * 0.13);
  return y + rowH;
}

// ---------------------------------------------------------------------------
// Chart: cohort benchmark scatter (the centerpiece)
// ---------------------------------------------------------------------------
function drawBenchmarkScatter(doc: jsPDF, y: number, points: CohortPoint[], subject: CohortPoint): number {
  const px = 32;
  const pw = 150;
  const ph = 100;
  const py = y;
  const X = (img: number) => px + Math.max(0, Math.min(1, img)) * pw;
  const Y = (ipi: number) => py + (1 - Math.max(0, Math.min(1, ipi))) * ph;

  // Plot frame and gridlines.
  doc.setDrawColor(...TRACK);
  doc.setLineWidth(0.2);
  for (const t of [0.25, 0.75]) {
    doc.line(X(t), py, X(t), py + ph);
    doc.line(px, Y(t), px + pw, Y(t));
  }
  // Quadrant dividers at 0.5 / 0.5 (dashed, slightly stronger).
  doc.setDrawColor(...SLATE_LIGHT);
  doc.setLineWidth(0.3);
  doc.setLineDashPattern([1.4, 1.4], 0);
  doc.line(X(0.5), py, X(0.5), py + ph);
  doc.line(px, Y(0.5), px + pw, Y(0.5));
  doc.setLineDashPattern([], 0);
  doc.setDrawColor(...MUTED);
  doc.setLineWidth(0.35);
  doc.rect(px, py, pw, ph);

  // Faint Table-7 quadrant names in the corners.
  doc.setFontSize(7);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...SLATE_LIGHT);
  doc.text('Small gap, strong capacity', px + 2.5, py + 5);
  doc.text('Large gap, latent capacity', px + pw - 2.5, py + 5, { align: 'right' });
  doc.text('Managed gap, rigid processes', px + 2.5, py + ph - 2.5);
  doc.text('Large gap, insufficient capacity', px + pw - 2.5, py + ph - 2.5, { align: 'right' });

  // Axes ticks and titles.
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.setDrawColor(...MUTED);
  doc.setLineWidth(0.2);
  for (const t of [0, 0.25, 0.5, 0.75, 1]) {
    doc.line(X(t), py + ph, X(t), py + ph + 1.4);
    doc.text(t.toFixed(2), X(t), py + ph + 4.6, { align: 'center' });
    doc.line(px - 1.4, Y(t), px, Y(t));
    doc.text(t.toFixed(2), px - 2.2, Y(t) + 1, { align: 'right' });
  }
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('IMG — Internationalization Maturity Gap (lower is better)', px + pw / 2, py + ph + 9.5, {
    align: 'center',
  });
  doc.text('IPI — Internationalization Potential Index (higher is better)', px - 8, py + ph / 2, {
    align: 'center',
    angle: 90,
  });

  // Cohort dots.
  doc.setFillColor(...SLATE_LIGHT);
  for (const p of points) {
    if (p.isSubject) continue;
    doc.circle(X(p.img), Y(p.ipi), 0.9, 'F');
  }
  // Subject: larger highlighted dot with halo + label.
  const sx = X(subject.img);
  const sy = Y(subject.ipi);
  doc.setFillColor(219, 234, 254);
  doc.circle(sx, sy, 3.4, 'F');
  doc.setFillColor(...PRIMARY);
  doc.circle(sx, sy, 2.1, 'F');
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(0.4);
  doc.circle(sx, sy, 2.1, 'S');
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY);
  const label = truncate(subject.name, 34);
  const labelLeft = sx > px + pw * 0.62;
  doc.text(label, labelLeft ? sx - 4.5 : sx + 4.5, sy - 2.2, { align: labelLeft ? 'right' : 'left' });

  return py + ph + 13;
}

// ---------------------------------------------------------------------------
// Chart: forecast tornado (delta-IMG per single intervention)
// ---------------------------------------------------------------------------
function drawTornado(
  doc: jsPDF,
  y: number,
  entries: ForecastEntry[],
  combinedDelta: number | null
): number {
  const labelW = 78;
  const barW = 74;
  const rowH = 6.2;
  const barX = MARGIN + labelW;
  const maxAbs = Math.max(
    0.001,
    ...entries.map((e) => Math.abs(e.imgDelta)),
    combinedDelta != null ? Math.abs(combinedDelta) : 0
  );
  const row = (label: string, delta: number, color: [number, number, number], bold: boolean) => {
    doc.setFontSize(8);
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setTextColor(...INK);
    doc.text(truncate(label, 52), MARGIN, y + rowH / 2 + 1);
    doc.setFillColor(...TRACK);
    doc.rect(barX, y + 1.1, barW, rowH - 2.2, 'F');
    const w = (Math.abs(delta) / maxAbs) * barW;
    if (w > 0.05) {
      doc.setFillColor(...color);
      doc.rect(barX, y + 1.1, w, rowH - 2.2, 'F');
    }
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...MUTED);
    doc.text(delta === 0 ? '0.000' : delta.toFixed(3), barX + barW + 2.5, y + rowH / 2 + 1);
    y += rowH;
  };
  // Most negative delta-IMG (= biggest improvement) first; entries are pre-sorted.
  for (const e of entries) {
    const label = `${shortNameOf(e.intervention.id)} — ${fixesOf(e.intervention.id)}`;
    row(label, e.imgDelta, e.imgDelta < 0 ? GREEN : SLATE_LIGHT, false);
  }
  if (combinedDelta != null) {
    y += 1.2;
    row('ALL interventions combined', combinedDelta, PRIMARY, true);
  }
  return y + 2;
}

// ---------------------------------------------------------------------------
// Chart: 2x2 priority matrix (effort vs combined impact)
// ---------------------------------------------------------------------------
function drawPriorityMatrix(doc: jsPDF, y: number, entries: ForecastEntry[]): number {
  const px = 32;
  const pw = 146;
  const ph = 78;
  const py = y;
  const impactOf = (e: ForecastEntry) => Math.abs(e.imgDelta) + Math.max(0, e.ipiDelta);
  const maxImpact = Math.max(0.02, ...entries.map(impactOf)) * 1.18;
  const X = (effort: number) => px + ((effort - 0.5) / 3) * pw; // effort domain [0.5, 3.5]
  const Y = (impact: number) => py + ph - (Math.min(impact, maxImpact) / maxImpact) * ph;

  // Frame + quadrant dividers (effort midpoint 2, impact midpoint half-scale).
  doc.setDrawColor(...SLATE_LIGHT);
  doc.setLineWidth(0.3);
  doc.setLineDashPattern([1.4, 1.4], 0);
  doc.line(X(2), py, X(2), py + ph);
  doc.line(px, Y(maxImpact / 2), px + pw, Y(maxImpact / 2));
  doc.setLineDashPattern([], 0);
  doc.setDrawColor(...MUTED);
  doc.setLineWidth(0.35);
  doc.rect(px, py, pw, ph);

  // Quadrant captions.
  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...SLATE_LIGHT);
  doc.text('Quick wins', px + 2.5, py + 5);
  doc.text('Strategic bets', px + pw - 2.5, py + 5, { align: 'right' });
  doc.text('Fill-ins', px + 2.5, py + ph - 2.5);
  doc.text('Question marks', px + pw - 2.5, py + ph - 2.5, { align: 'right' });

  // Axis ticks: effort Low / Medium / High; impact 0 → max.
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.setDrawColor(...MUTED);
  doc.setLineWidth(0.2);
  const effortTicks: [number, string][] = [
    [1, 'Low'],
    [2, 'Medium'],
    [3, 'High'],
  ];
  for (const [t, lab] of effortTicks) {
    doc.line(X(t), py + ph, X(t), py + ph + 1.4);
    doc.text(lab, X(t), py + ph + 4.6, { align: 'center' });
  }
  for (const frac of [0, 0.5, 1]) {
    const v = maxImpact * frac;
    doc.line(px - 1.4, Y(v), px, Y(v));
    doc.text(v.toFixed(2), px - 2.2, Y(v) + 1, { align: 'right' });
  }
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('Implementation effort', px + pw / 2, py + ph + 9.5, { align: 'center' });
  doc.text('Combined impact  |dIMG| + dIPI', px - 8, py + ph / 2, { align: 'center', angle: 90 });

  // Points with short labels (alternate left/right placement near edges).
  doc.setFontSize(6.6);
  entries.forEach((e, i) => {
    const cx = X(effortOf(e.intervention.id).rating);
    const cy = Y(impactOf(e));
    doc.setFillColor(...PRIMARY);
    doc.circle(cx, cy, 1.4, 'F');
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...INK);
    const toLeft = cx > px + pw - 30;
    const dy = i % 2 === 0 ? -1.6 : 3.4; // stagger stacked labels
    doc.text(shortNameOf(e.intervention.id), toLeft ? cx - 2.6 : cx + 2.6, cy + dy, {
      align: toLeft ? 'right' : 'left',
    });
  });

  return py + ph + 13;
}

// ---------------------------------------------------------------------------
// Report builder
// ---------------------------------------------------------------------------
export function buildAssessmentReport(opts: AssessmentReportOptions): jsPDF {
  const { universityName, inputs, result, assessedAt, cohort } = opts;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const contentW = W - 2 * MARGIN;
  let y = 0;

  const forecast = forecastInterventions(inputs);
  const hasForecast = forecast.entries.length > 0;

  // Cohort bookkeeping: make sure the subject exists exactly once.
  const flaggedSubject = cohort.find((c) => c.isSubject);
  const subject: CohortPoint =
    flaggedSubject ?? { name: universityName, img: result.img, ipi: result.ipi, isSubject: true };
  const peers = cohort.filter((c) => !c.isSubject);
  const allPoints = [...peers, subject];
  const cohortSize = allPoints.length;
  const hasCohort = cohortSize >= 2; // benchmarking needs at least one peer
  const imgRank = peers.filter((p) => p.img < subject.img).length + 1; // lower IMG = better
  const ipiRank = peers.filter((p) => p.ipi > subject.ipi).length + 1; // higher IPI = better

  // ---- 1) Cover header band -------------------------------------------------
  doc.setFillColor(...PRIMARY);
  doc.rect(0, 0, W, 38, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('IRIS', MARGIN, 14);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('International Relations Intelligent System', MARGIN, 20);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('IMG/IPI Institutional Assessment Report', MARGIN, 29);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Benchmark, diagnosis and phased remediation gameplan', MARGIN, 34.5);
  y = 48;

  // ---- Institution block ------------------------------------------------------
  doc.setTextColor(...INK);
  doc.setFontSize(15);
  doc.setFont('helvetica', 'bold');
  doc.text(universityName, MARGIN, y);
  y += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MUTED);
  doc.text(
    `Assessment date: ${new Date(assessedAt).toLocaleDateString()}   ·   Faculty survey n = ${inputs.surveyRespondents}   ·   Framework: IMG/IPI dual composite index (Section 2.7)`,
    MARGIN,
    y
  );
  y += 9;

  // ---- Executive summary --------------------------------------------------------
  const topGap = result.gaps[0];
  const topIv = forecast.entries[0];
  const summaryParts: string[] = [
    `${universityName} records an Internationalization Maturity Gap (IMG) of ${result.img.toFixed(3)} — the ${result.imgBand} band — and an Internationalization Potential Index (IPI) of ${result.ipi.toFixed(3)} (${result.ipiBand}).`,
  ];
  if (hasCohort) {
    summaryParts.push(
      `Within the ${cohortSize}-institution assessed cohort this places it ${ordinal(imgRank)} on gap severity (lower is better) and ${ordinal(ipiRank)} on potential, outperforming ${Math.round((peers.filter((p) => p.img > subject.img).length / peers.length) * 100)}% of peers on IMG and ${Math.round((peers.filter((p) => p.ipi < subject.ipi).length / peers.length) * 100)}% on IPI.`
    );
  }
  if (topGap) {
    summaryParts.push(
      `The most severe diagnosed gap is ${topGap.dimension} at severity ${topGap.severity.toFixed(3)}, addressed by ${topGap.irisModule}.`
    );
  }
  if (topIv) {
    summaryParts.push(
      `The single highest-impact intervention is "${topIv.intervention.title}": it moves IMG from ${result.img.toFixed(3)} to ${topIv.img.toFixed(3)} (${topIv.imgDelta.toFixed(3)}) and IPI from ${result.ipi.toFixed(3)} to ${topIv.ipi.toFixed(3)} (+${topIv.ipiDelta.toFixed(3)}).`
    );
  }
  if (forecast.combined) {
    summaryParts.push(
      `Executing the full gameplan in this report is projected to land the institution at IMG ${forecast.combined.img.toFixed(3)} (${forecast.combined.imgBand}) and IPI ${forecast.combined.ipi.toFixed(3)} (${forecast.combined.ipiBand}).`
    );
  }
  const summaryLines = doc.splitTextToSize(summaryParts.join(' '), contentW - 10) as string[];
  const summaryH = 12 + summaryLines.length * 4.1;
  doc.setFillColor(...PANEL);
  doc.roundedRect(MARGIN, y, contentW, summaryH, 2, 2, 'F');
  doc.setFillColor(...PRIMARY);
  doc.rect(MARGIN, y, 1.6, summaryH, 'F');
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY);
  doc.text('Executive summary', MARGIN + 5, y + 7);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(summaryLines, MARGIN + 5, y + 12.5);
  y += summaryH + 8;

  // ---- 2) Headline score boxes -----------------------------------------------
  const box = (x: number, label: string, value: string, band: string) => {
    doc.setDrawColor(...MUTED);
    doc.roundedRect(x, y, 86, 26, 2, 2);
    doc.setFontSize(9);
    doc.setTextColor(...MUTED);
    doc.setFont('helvetica', 'normal');
    doc.text(label, x + 5, y + 7);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...INK);
    doc.text(value, x + 5, y + 17);
    const [r, g, b] = bandColor(band);
    doc.setFillColor(r, g, b);
    doc.roundedRect(x + 5, y + 19.5, 30, 5.5, 1, 1, 'F');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(band.toUpperCase(), x + 20, y + 23.4, { align: 'center' });
  };
  box(MARGIN, 'Internationalization Maturity Gap (IMG)', result.img.toFixed(3), result.imgBand);
  box(110, 'Internationalization Potential Index (IPI)', result.ipi.toFixed(3), result.ipiBand);
  y += 32;

  if (result.ipiCI95) {
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MUTED);
    doc.text(
      `IPI 95% confidence interval: [${result.ipiCI95[0].toFixed(3)}, ${result.ipiCI95[1].toFixed(3)}] (SE = ${result.seIpi?.toFixed(3)}). IMG carries no standard error: all items are verified institutional facts.`,
      MARGIN,
      y
    );
    y += 7;
  }

  // ---- Institutional profile ---------------------------------------------------
  const profileLines = doc.splitTextToSize(result.profile.implication, contentW - 10) as string[];
  const profileH = 14 + profileLines.length * 4.2;
  y = ensureSpace(doc, y, profileH + 6);
  doc.setFillColor(...PANEL);
  doc.roundedRect(MARGIN, y, contentW, profileH, 2, 2, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PRIMARY);
  doc.text(`Institutional profile: ${result.profile.title}`, MARGIN + 5, y + 8);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);
  doc.text(profileLines, MARGIN + 5, y + 14);
  y += profileH + 9;

  // ---- 3) Benchmark scatter plot ------------------------------------------------
  if (hasCohort) {
    y = ensureSpace(doc, y, 140);
    y = sectionTitle(
      doc,
      y,
      'Cohort benchmark — where the institution sits',
      `Every assessed institution in the registry, plotted on the Table-7 plane (n = ${cohortSize}). Quadrant boundaries at IMG 0.5 / IPI 0.5.`
    );
    y = drawBenchmarkScatter(doc, y + 1, allPoints, subject);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...INK);
    doc.text(
      `${universityName} ranks ${ordinal(imgRank)} of ${cohortSize} institutions on gap severity (lower is better) and ${ordinal(ipiRank)} of ${cohortSize} on potential.`,
      MARGIN,
      y
    );
    y += 9;
  }

  // ---- 4) Dimension bar chart ----------------------------------------------------
  const dimLayout = { labelW: 72, barW: 84, rowH: 9, barH: 4.6, fontSize: 8.5 };
  y = ensureSpace(doc, y, 5 * dimLayout.rowH + 16);
  y = sectionTitle(
    doc,
    y,
    'Dimension scores',
    'IA / WF / DID are gap dimensions colored by severity (higher = worse). LC and RF feed the IPI (higher = better).'
  );
  y = barRow(doc, y, 'IA — Information Asymmetry', result.ia.score, severityColor(result.ia.score), dimLayout);
  y = barRow(doc, y, 'WF — Workflow Fragmentation', result.wf.score, severityColor(result.wf.score), dimLayout);
  y = barRow(doc, y, 'DID — Digital Infrastructure Deficit', result.did.score, severityColor(result.did.score), dimLayout);
  y = barRow(doc, y, 'LC — Leadership Commitment', result.lc, GREEN, dimLayout);
  y = barRow(doc, y, 'RF — Readiness Factor', result.rf, GREEN, dimLayout);
  y += 7;

  // ---- 5) Item-level profile -------------------------------------------------------
  const rfNorm = (v: number) => Math.min(1, Math.max(0, (v - 1) / 4));
  const itemRows: { label: string; score: number; positive: boolean }[] = [
    ...result.ia.items.map((it) => ({ label: `#${it.id} ${it.label}`, score: it.score, positive: false })),
    ...result.wf.items.map((it) => ({ label: `#${it.id} ${it.label}`, score: it.score, positive: false })),
    ...result.did.items.map((it) => ({ label: `#${it.id} ${it.label}`, score: it.score, positive: false })),
    { label: 'LC1-LC3 Leadership Commitment (composite)', score: result.lc, positive: true },
    { label: '#13 Faculty digital comfort', score: rfNorm(inputs.item13_digitalComfort), positive: true },
    { label: '#14 Familiarity with AI tools', score: rfNorm(inputs.item14_aiFamiliarity), positive: true },
    { label: '#15 Trust in AI recommendations', score: rfNorm(inputs.item15_aiTrust), positive: true },
    { label: '#16 AI concern (reverse-scored)', score: rfNorm(6 - inputs.item16_aiConcern), positive: true },
    { label: '#17 Likelihood of platform use', score: rfNorm(inputs.item17_likelihoodOfUse), positive: true },
  ];
  const itemLayout = { labelW: 88, barW: 68, rowH: 5.4, barH: 3, fontSize: 7.5 };
  y = ensureSpace(doc, y, itemRows.length * itemLayout.rowH + 18);
  y = sectionTitle(
    doc,
    y,
    'Item-level profile (17 normalized scores)',
    'Items 1-11 are gap scores (severity coloring); LC and items 13-17 are capacity scores (green, higher = better).'
  );
  for (const row of itemRows) {
    y = barRow(doc, y, row.label, row.score, row.positive ? GREEN : severityColor(row.score), itemLayout);
  }
  y += 7;

  // ---- 6a) Dimension breakdown table ---------------------------------------------
  y = ensureSpace(doc, y, 60);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...INK);
  doc.text('Dimension breakdown', MARGIN, y);
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

  // ---- 6b) Gap diagnosis table ------------------------------------------------------
  if (result.gaps.length > 0) {
    y = ensureSpace(doc, y, 50);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...INK);
    doc.text('Gap diagnosis and remediation mapping', MARGIN, y);
    autoTable(doc, {
      startY: y + 3,
      head: [['Gap', 'Severity', 'Finding', 'Addressed by']],
      body: result.gaps.map((g) => [g.dimension, g.severity.toFixed(3), g.finding, g.irisModule]),
      styles: { fontSize: 8, cellPadding: 1.6 },
      headStyles: { fillColor: PRIMARY, fontSize: 8.5 },
      columnStyles: {
        0: { cellWidth: 14, fontStyle: 'bold' },
        1: { cellWidth: 18, halign: 'right' },
        3: { cellWidth: 52 },
      },
      theme: 'grid',
    });
    y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 9;
  }

  // ---- 7) Forecast tornado chart -------------------------------------------------------
  if (hasForecast) {
    const tornadoH = (forecast.entries.length + 1) * 6.2 + 22;
    y = ensureSpace(doc, y, tornadoH);
    y = sectionTitle(
      doc,
      y,
      'Intervention forecast — dIMG tornado',
      'Change in IMG when each single intervention is applied in isolation (longest bar = largest gap reduction), plus the combined scenario. Each value re-computes the Section 2.7 equations — deterministic framework simulation, not an AI estimate. Governance actions (LC1-LC3) act on IPI only, so their dIMG is 0.'
    );
    y = drawTornado(doc, y + 1, forecast.entries, forecast.combined ? forecast.combined.img - result.img : null);
    y += 5;
  }

  // ---- 8) Priority matrix ------------------------------------------------------------
  if (hasForecast) {
    y = ensureSpace(doc, y, 112);
    y = sectionTitle(
      doc,
      y,
      'Priority matrix — impact vs implementation effort',
      'Combined impact = |dIMG| + dIPI per intervention; effort is a static implementation rating (governance and documentation actions are low-effort, software adoptions medium, process re-engineering and national-system integration higher).'
    );
    y = drawPriorityMatrix(doc, y + 1, forecast.entries);
    y += 4;
  }

  // ---- 9) Step-by-step gameplan --------------------------------------------------------
  if (hasForecast) {
    doc.addPage();
    y = 20;
    y = sectionTitle(
      doc,
      y,
      'Step-by-step remediation gameplan',
      'Interventions ranked by impact-per-effort and phased over twelve months. The IMG/IPI trajectory is CUMULATIVE: each step is applied on top of all previous steps and the Section 2.7 equations are re-computed, so the final row of Phase 3 is the fully-remediated position.'
    );
    y += 1;

    const impactOf = (e: ForecastEntry) => Math.abs(e.imgDelta) + Math.max(0, e.ipiDelta);
    const ranked = [...forecast.entries].sort(
      (a, b) =>
        impactOf(b) / effortOf(b.intervention.id).rating - impactOf(a) / effortOf(a.intervention.id).rating
    );
    const n = ranked.length;
    const cut1 = Math.min(n, Math.max(1, Math.ceil(n / 3)));
    const cut2 = Math.min(n, cut1 + Math.max(1, Math.ceil((n - cut1) / 2)));
    const phases: { title: string; entries: ForecastEntry[] }[] = [
      { title: 'Phase 1 — First 90 days (quick wins)', entries: ranked.slice(0, cut1) },
      { title: 'Phase 2 — Months 3-6', entries: ranked.slice(cut1, cut2) },
      { title: 'Phase 3 — Months 6-12', entries: ranked.slice(cut2) },
    ].filter((p) => p.entries.length > 0);

    let runningInputs: IMGIPIInputs = inputs;
    let prevImg = result.img;
    let prevImgBand = result.imgBand;
    let prevIpi = result.ipi;
    let prevIpiBand = result.ipiBand;
    let stepNo = 0;
    let finalImgText = '';
    let finalIpiText = '';

    for (const phase of phases) {
      const body: string[][] = [];
      for (const e of phase.entries) {
        stepNo += 1;
        runningInputs = e.intervention.apply(runningInputs);
        const r = computeIMGIPI(runningInputs);
        const imgCell = `${prevImg.toFixed(3)} ${prevImgBand} → ${r.img.toFixed(3)} ${r.imgBand}`;
        const ipiCell = `${prevIpi.toFixed(3)} ${prevIpiBand} → ${r.ipi.toFixed(3)} ${r.ipiBand}`;
        body.push([
          String(stepNo),
          `${e.intervention.title}\n${e.intervention.description}`,
          e.intervention.irisModule,
          fixesOf(e.intervention.id),
          effortOf(e.intervention.id).label,
          imgCell,
          ipiCell,
        ]);
        prevImg = r.img;
        prevImgBand = r.imgBand;
        prevIpi = r.ipi;
        prevIpiBand = r.ipiBand;
        finalImgText = `${r.img.toFixed(3)} (${r.imgBand})`;
        finalIpiText = `${r.ipi.toFixed(3)} (${r.ipiBand})`;
      }
      y = ensureSpace(doc, y, 34);
      doc.setFontSize(10.5);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(...PRIMARY);
      doc.text(phase.title, MARGIN, y);
      autoTable(doc, {
        startY: y + 2.5,
        head: [['#', 'Action', 'Executed via (IRIS)', 'Fixes', 'Effort', 'Cumulative IMG', 'Cumulative IPI']],
        body,
        styles: { fontSize: 7.2, cellPadding: 1.5, valign: 'top' },
        headStyles: { fillColor: PRIMARY, fontSize: 7.5 },
        columnStyles: {
          0: { cellWidth: 6, halign: 'center' },
          1: { cellWidth: 58 },
          2: { cellWidth: 32 },
          3: { cellWidth: 15 },
          4: { cellWidth: 14 },
          5: { cellWidth: 28.5 },
          6: { cellWidth: 28.5 },
        },
        theme: 'grid',
      });
      y = (doc as jsPDF & { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 7;
    }

    // Fully-remediated closing box.
    y = ensureSpace(doc, y, 20);
    doc.setFillColor(...PANEL);
    doc.roundedRect(MARGIN, y, contentW, 15, 2, 2, 'F');
    doc.setFontSize(9.5);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...PRIMARY);
    doc.text('Fully-remediated position after Phase 3:', MARGIN + 5, y + 6);
    doc.setTextColor(...INK);
    doc.text(
      `IMG ${result.img.toFixed(3)} (${result.imgBand}) → ${finalImgText}    ·    IPI ${result.ipi.toFixed(3)} (${result.ipiBand}) → ${finalIpiText}`,
      MARGIN + 5,
      y + 11.5
    );
    y += 21;

    // Operating IRIS to execute this plan.
    const bullets = [
      'Run quarterly re-assessments in Diagnostics and compare against this report to verify the projected IMG/IPI trajectory is being realized.',
      'Manage every new agreement through MOU Management (templates, digital routing, status tracking) to compress the Item 5 signature cycle.',
      'Centralize all partnership documents and MOU versions in the Data Library so Item 8 flips to "Present" and stays there.',
      'Track every student and faculty exchange in the Mobility module to close Item 9 and feed the performance dashboard (Item 11).',
      'Use Partner Discovery\'s gap-conditioned recommendations to widen platform coverage and cut candidate response time (IA, Items 1-2).',
      'Export this report for university leadership to secure the LC1-LC3 governance commitments — strategy mandate, dedicated office and budget line.',
    ];
    const bulletsH = bullets.length * 8.6 + 14;
    y = ensureSpace(doc, y, bulletsH);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(...INK);
    doc.text('Operating IRIS to execute this plan', MARGIN, y);
    y += 5.5;
    doc.setFontSize(8.8);
    for (const b of bullets) {
      const lines = doc.splitTextToSize(b, contentW - 7) as string[];
      y = ensureSpace(doc, y, lines.length * 4 + 3);
      doc.setFillColor(...PRIMARY);
      doc.circle(MARGIN + 1.4, y - 1.1, 0.9, 'F');
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(51, 65, 85);
      doc.text(lines, MARGIN + 5, y);
      y += lines.length * 4 + 2.6;
    }
    y += 4;
  }

  // ---- 10) Methodology footer block -------------------------------------------------------
  y = ensureSpace(doc, y, 46);
  doc.setDrawColor(...SLATE_LIGHT);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y, W - MARGIN, y);
  y += 6;
  doc.setFontSize(10.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...INK);
  doc.text('Methodology', MARGIN, y);
  y += 5;
  doc.setFontSize(8.2);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...MUTED);
  const methodology = [
    'Equations: IMG = (IA + WF + DID) / 3;  IPI = [(LC + RF) / 2] × (1 − IMG). Bands: 0-0.25 Low, 0.26-0.50 Moderate, 0.51-0.75 High, 0.76-1.0 Critical (IPI: Very High).',
    'Normalization uses the framework\'s fixed exogenous theoretical anchors (Tables 3-5) — scores never depend on sample data, so results are comparable across institutions and over time.',
    'IMG carries no standard error: every IMG item is a verified institutional fact. Survey uncertainty propagates to the IPI only, via SE(IPI) = ½ × (1 − IMG) × SE(RF).',
    'Intervention forecasts and the gameplan trajectory re-compute these equations with the stated inputs changed — deterministic framework simulation, not an AI estimate.',
    'Citation: IMG/IPI dual composite index, Section 2.7 of the research framework; institutional profiles per Table 7; cohort benchmark from the local IRIS assessment registry.',
  ];
  for (const m of methodology) {
    const lines = doc.splitTextToSize(m, contentW) as string[];
    y = ensureSpace(doc, y, lines.length * 3.6 + 2);
    doc.text(lines, MARGIN, y);
    y += lines.length * 3.6 + 1.6;
  }

  // ---- Footer on every page -----------------------------------------------------------------
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setFontSize(7.5);
    doc.setTextColor(...MUTED);
    doc.text(
      `Generated offline by IRIS · IMG/IPI dual composite index with theoretically anchored normalization (exogenous benchmarks) · Page ${p} of ${pages}`,
      MARGIN,
      doc.internal.pageSize.getHeight() - 8
    );
  }

  return doc;
}

export function generateAssessmentReport(opts: AssessmentReportOptions): void {
  const doc = buildAssessmentReport(opts);
  doc.save(`IRIS-Assessment-${opts.universityName.replace(/[^\w\dÀ-ž]+/g, '-')}.pdf`);
}
