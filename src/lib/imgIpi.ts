/**
 * IMG / IPI computation engine.
 *
 * Implements Section 2.7 of the research framework exactly:
 *  - IMG = (IA + WF + DID) / 3            — structural internationalization gap
 *  - IPI = [(LC + RF) / 2] × (1 − IMG)    — capacity to respond to an AI-powered solution
 *
 * All normalization anchors are the fixed theoretical benchmarks from the
 * paper (exogenous benchmark normalization) — they never depend on sample data.
 */

export interface IMGIPIInputs {
  // IA — Information Asymmetry (items 1–3)
  item1_daysToCandidates: number; // avg days from faculty request → candidates presented (1–365)
  item2_platformCount: number; // partner-search platforms actively used (0–10)
  item3_documentedProcess: boolean; // documented discovery process exists

  // WF — Workflow Fragmentation (items 4–6)
  item4_approvalDepartments: number; // internal approvals required for an MOU (1–10)
  item5_daysToSignedMOU: number; // avg days request → signed MOU (7–365)
  item6_initiated: number; // partnership conversations initiated, past 12 months
  item6_signed: number; // of those, MOUs signed

  // DID — Digital Infrastructure Deficit (items 7–11; true = capability EXISTS)
  item7_purposeBuiltSoftware: boolean;
  item8_centralisedRecords: boolean;
  item9_mobilityTracking: boolean;
  item10_nationalIntegration: boolean;
  item11_dashboard: boolean;

  // Item 12 — diagnostic only, NOT scored (count of tools in active use, 0–5)
  item12_toolCount: number;

  // LC — Leadership Commitment (LC1–LC3)
  lc1_strategyDocument: boolean;
  lc2_dedicatedOffice: boolean;
  lc3_budgetLine: boolean;

  // RF — Readiness Factor (items 13–17: faculty survey MEANS, 1–5)
  item13_digitalComfort: number;
  item14_aiFamiliarity: number;
  item15_aiTrust: number;
  item16_aiConcern: number; // reverse-scored in the formula
  item17_likelihoodOfUse: number;
  surveyRespondents: number; // n (paper recommends ≥ 20)
  rfStdDev?: number; // optional: SD of normalized RF scores, for SE(IPI)
}

export type Band = 'Low' | 'Moderate' | 'High' | 'Critical' | 'Very High';

export interface DimensionResult {
  score: number;
  items: { id: string; label: string; raw: string; score: number }[];
}

export interface IMGIPIResult {
  ia: DimensionResult;
  wf: DimensionResult;
  did: DimensionResult;
  img: number;
  imgBand: Band;
  lc: number;
  rf: number;
  ipi: number;
  ipiBand: Band;
  seIpi: number | null;
  ipiCI95: [number, number] | null;
  profile: InstitutionalProfile;
  gaps: GapDiagnosis[];
}

export interface InstitutionalProfile {
  quadrant: 'high-gap-low-capacity' | 'high-gap-high-capacity' | 'low-gap-high-capacity' | 'low-gap-low-capacity';
  title: string;
  implication: string;
}

export interface GapDiagnosis {
  dimension: 'IA' | 'WF' | 'DID' | 'LC';
  severity: number; // [0,1] — for LC this is 1 − LC
  finding: string;
  irisModule: string; // which IRIS module addresses it
  irisRoute: string;
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const round3 = (x: number) => Math.round(x * 1000) / 1000;

export function imgBandOf(img: number): Band {
  if (img <= 0.25) return 'Low';
  if (img <= 0.5) return 'Moderate';
  if (img <= 0.75) return 'High';
  return 'Critical';
}

export function ipiBandOf(ipi: number): Band {
  if (ipi <= 0.25) return 'Low';
  if (ipi <= 0.5) return 'Moderate';
  if (ipi <= 0.75) return 'High';
  return 'Very High';
}

export function computeIMGIPI(inp: IMGIPIInputs): IMGIPIResult {
  // --- IA items (Table 3 anchors) ---
  const i1 = clamp01((inp.item1_daysToCandidates - 1) / 364);
  const i2 = clamp01(1 - inp.item2_platformCount / 10);
  const i3 = inp.item3_documentedProcess ? 0 : 1;
  const ia = (i1 + i2 + i3) / 3;

  // --- WF items (Table 4 anchors) ---
  const i4 = clamp01((inp.item4_approvalDepartments - 1) / 9);
  const i5 = clamp01((inp.item5_daysToSignedMOU - 7) / 358);
  const abandonment =
    inp.item6_initiated > 0
      ? ((inp.item6_initiated - inp.item6_signed) / inp.item6_initiated) * 100
      : 0;
  const i6 = clamp01(abandonment / 100);
  const wf = (i4 + i5 + i6) / 3;

  // --- DID items (binary: deficit present = 1) ---
  const didItems: [string, string, boolean][] = [
    ['7', 'Purpose-built partnership software', inp.item7_purposeBuiltSoftware],
    ['8', 'Centralised searchable digital records', inp.item8_centralisedRecords],
    ['9', 'Digital mobility tracking', inp.item9_mobilityTracking],
    ['10', 'Automatic YÖK / Erasmus+ / TÜBİTAK integration', inp.item10_nationalIntegration],
    ['11', 'Partnership performance dashboard', inp.item11_dashboard],
  ];
  const didScores = didItems.map(([, , has]) => (has ? 0 : 1));
  const did = didScores.reduce((a, b) => a + b, 0) / 5;

  // --- IMG ---
  const img = (ia + wf + did) / 3;

  // --- LC ---
  const lc =
    ((inp.lc1_strategyDocument ? 1 : 0) +
      (inp.lc2_dedicatedOffice ? 1 : 0) +
      (inp.lc3_budgetLine ? 1 : 0)) /
    3;

  // --- RF (corrected formula: range of the sum is [9, 21], span 12) ---
  const rfSum =
    inp.item13_digitalComfort +
    inp.item14_aiFamiliarity +
    inp.item15_aiTrust +
    (6 - inp.item16_aiConcern) +
    inp.item17_likelihoodOfUse;
  const rf = clamp01((rfSum - 9) / 12);

  // --- IPI ---
  const ipi = ((lc + rf) / 2) * (1 - img);

  // --- SE(IPI) = ½ × (1 − IMG) × SE(RF) ---
  let seIpi: number | null = null;
  let ipiCI95: [number, number] | null = null;
  if (inp.rfStdDev != null && inp.rfStdDev > 0 && inp.surveyRespondents > 0) {
    const seRf = inp.rfStdDev / Math.sqrt(inp.surveyRespondents);
    seIpi = 0.5 * (1 - img) * seRf;
    ipiCI95 = [round3(ipi - 1.96 * seIpi), round3(ipi + 1.96 * seIpi)];
  }

  return {
    ia: {
      score: round3(ia),
      items: [
        { id: '1', label: 'Days to present partner candidates', raw: `${inp.item1_daysToCandidates} days`, score: round3(i1) },
        { id: '2', label: 'Partner-search platforms in use', raw: `${inp.item2_platformCount} / 10`, score: round3(i2) },
        { id: '3', label: 'Documented discovery process', raw: inp.item3_documentedProcess ? 'Yes' : 'No', score: i3 },
      ],
    },
    wf: {
      score: round3(wf),
      items: [
        { id: '4', label: 'MOU approval departments', raw: `${inp.item4_approvalDepartments}`, score: round3(i4) },
        { id: '5', label: 'Days from request to signed MOU', raw: `${inp.item5_daysToSignedMOU} days`, score: round3(i5) },
        { id: '6', label: 'Abandonment rate', raw: `${round3(abandonment)}% (${inp.item6_initiated} → ${inp.item6_signed})`, score: round3(i6) },
      ],
    },
    did: {
      score: round3(did),
      items: didItems.map(([id, label, has], idx) => ({
        id,
        label,
        raw: has ? 'Present' : 'Missing',
        score: didScores[idx],
      })),
    },
    img: round3(img),
    imgBand: imgBandOf(img),
    lc: round3(lc),
    rf: round3(rf),
    ipi: round3(ipi),
    ipiBand: ipiBandOf(ipi),
    seIpi: seIpi != null ? round3(seIpi) : null,
    ipiCI95,
    profile: profileOf(img, ipi),
    gaps: diagnoseGaps(ia, wf, did, lc, inp),
  };
}

/** Table 7 — institutional profiles from combined IMG and IPI. */
function profileOf(img: number, ipi: number): InstitutionalProfile {
  const highGap = img > 0.5;
  const highCapacity = ipi > 0.5;
  if (highGap && !highCapacity)
    return {
      quadrant: 'high-gap-low-capacity',
      title: 'Large gap, insufficient capacity',
      implication:
        'First priority is governance: secure a formal strategy mandate (LC1), establish a dedicated office (LC2), and allocate a budget line (LC3). Technology deployment without an institutional mandate will not be sustained.',
    };
  if (highGap && highCapacity)
    return {
      quadrant: 'high-gap-high-capacity',
      title: 'Large gap, latent capacity in place',
      implication:
        'The most immediately amenable profile for AI system adoption — leadership commitment and faculty readiness exist. Prioritize IA and DID remediation through platform deployment.',
    };
  if (!highGap && highCapacity)
    return {
      quadrant: 'low-gap-high-capacity',
      title: 'Small gap, strong capacity',
      implication:
        'Structural challenges are largely resolved. Well-positioned for advanced functionality, pilot programmes, and peer benchmarking.',
    };
  return {
    quadrant: 'low-gap-low-capacity',
    title: 'Managed gap, rigid processes',
    implication:
      'The gap is managed but through entrenched processes. Invest in faculty capacity-building and leadership engagement before any technology intervention.',
  };
}

/** Map each diagnosed gap to the IRIS module that addresses it. */
function diagnoseGaps(ia: number, wf: number, did: number, lc: number, inp: IMGIPIInputs): GapDiagnosis[] {
  const gaps: GapDiagnosis[] = [];
  if (ia > 0.25)
    gaps.push({
      dimension: 'IA',
      severity: round3(ia),
      finding: 'The institution is partially blind to its partnership landscape: slow partner discovery, narrow platform coverage, or no structured discovery process.',
      irisModule: 'Partners — AI-assisted partner discovery and recommendation',
      irisRoute: '/partners',
    });
  if (wf > 0.25)
    gaps.push({
      dimension: 'WF',
      severity: round3(wf),
      finding: 'Internal processes obstruct partnership formalization: multi-body approvals, long cycle times, or partnership abandonment.',
      irisModule: 'MOU Management — structured lifecycle, templates and tracking',
      irisRoute: '/mou',
    });
  if (did > 0)
    gaps.push({
      dimension: 'DID',
      severity: round3(did),
      finding: [
        !inp.item7_purposeBuiltSoftware && 'no purpose-built software (IRIS platform itself)',
        !inp.item8_centralisedRecords && 'no centralised records (Documentation module)',
        !inp.item9_mobilityTracking && 'no mobility tracking (Mobility module)',
        !inp.item10_nationalIntegration && 'no national-system integration (roadmap)',
        !inp.item11_dashboard && 'no performance dashboard (Dashboard & Partner Analytics)',
      ]
        .filter(Boolean)
        .join('; ')
        .replace(/^./, (c) => c.toUpperCase()) + '.',
      irisModule: 'Dashboard, Documentation, Mobility & Partner Analytics',
      irisRoute: '/',
    });
  if (lc < 1)
    gaps.push({
      dimension: 'LC',
      severity: round3(1 - lc),
      finding: [
        !inp.lc1_strategyDocument && 'no current rector-approved internationalization strategy',
        !inp.lc2_dedicatedOffice && 'no dedicated International Relations office with full-time staff',
        !inp.lc3_budgetLine && 'no dedicated internationalization budget line',
      ]
        .filter(Boolean)
        .join('; ')
        .replace(/^./, (c) => c.toUpperCase()) + '.',
      irisModule: 'Profile — institutional health and governance tracking',
      irisRoute: '/profile',
    });
  return gaps.sort((a, b) => b.severity - a.severity);
}

/** Verification against the paper's fully worked example (Institution A). */
export const INSTITUTION_A_EXAMPLE: IMGIPIInputs = {
  item1_daysToCandidates: 45,
  item2_platformCount: 1,
  item3_documentedProcess: false,
  item4_approvalDepartments: 6,
  item5_daysToSignedMOU: 140,
  item6_initiated: 48,
  item6_signed: 36,
  item7_purposeBuiltSoftware: false,
  item8_centralisedRecords: false,
  item9_mobilityTracking: false,
  item10_nationalIntegration: false,
  item11_dashboard: false,
  item12_toolCount: 0,
  lc1_strategyDocument: false,
  lc2_dedicatedOffice: false,
  lc3_budgetLine: false,
  item13_digitalComfort: 3.2,
  item14_aiFamiliarity: 2.8,
  item15_aiTrust: 2.5,
  item16_aiConcern: 3.8,
  item17_likelihoodOfUse: 3.0,
  surveyRespondents: 20,
  rfStdDev: 0.179,
};
