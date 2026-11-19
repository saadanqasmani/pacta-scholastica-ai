/**
 * IMG/IPI intervention forecasting.
 *
 * Answers: "if the institution fixes X, what happens to its IMG and IPI?"
 * Each candidate intervention is simulated by re-running the Section 2.7
 * equations on the assessment inputs with that single item improved —
 * exact framework mathematics, not an AI estimate.
 */
import { computeIMGIPI, IMGIPIInputs, IMGIPIResult, imgBandOf, ipiBandOf, Band } from '@/lib/imgIpi';

export interface Intervention {
  id: string;
  title: string;
  description: string;
  irisModule: string; // which IRIS module (or governance action) delivers it
  apply: (inp: IMGIPIInputs) => IMGIPIInputs;
  applicable: (inp: IMGIPIInputs) => boolean;
}

export interface ForecastEntry {
  intervention: Intervention;
  img: number;
  imgDelta: number; // negative = improvement
  imgBand: Band;
  ipi: number;
  ipiDelta: number; // positive = improvement
  ipiBand: Band;
  bandChange: boolean;
}

export interface Forecast {
  baseline: IMGIPIResult;
  entries: ForecastEntry[]; // sorted by IMG improvement, best first
  combined: { img: number; imgBand: Band; ipi: number; ipiBand: Band } | null; // all applicable interventions together
}

const round3 = (x: number) => Math.round(x * 1000) / 1000;

export const INTERVENTIONS: Intervention[] = [
  {
    id: 'item7-software',
    title: 'Deploy purpose-built partnership software (Item 7)',
    description: 'Replace email/Excel with a dedicated partnership management platform as the primary tool.',
    irisModule: 'IRIS platform (Partners + MOU Management)',
    applicable: (i) => !i.item7_purposeBuiltSoftware,
    apply: (i) => ({ ...i, item7_purposeBuiltSoftware: true }),
  },
  {
    id: 'item8-records',
    title: 'Centralise partnership records digitally (Item 8)',
    description: 'One searchable repository for all partnership communications, documents and MOU versions.',
    irisModule: 'IRIS Documentation + Data Library',
    applicable: (i) => !i.item8_centralisedRecords,
    apply: (i) => ({ ...i, item8_centralisedRecords: true }),
  },
  {
    id: 'item9-mobility',
    title: 'Digitise mobility tracking (Item 9)',
    description: 'Track all student and faculty mobility in a digital system instead of spreadsheets.',
    irisModule: 'IRIS Mobility module',
    applicable: (i) => !i.item9_mobilityTracking,
    apply: (i) => ({ ...i, item9_mobilityTracking: true }),
  },
  {
    id: 'item10-integration',
    title: 'Integrate with national systems (Item 10)',
    description: 'Automatic data flow with YÖK, Erasmus+ or TÜBİTAK instead of manual entry.',
    irisModule: 'Integration roadmap',
    applicable: (i) => !i.item10_nationalIntegration,
    apply: (i) => ({ ...i, item10_nationalIntegration: true }),
  },
  {
    id: 'item11-dashboard',
    title: 'Adopt a performance dashboard (Item 11)',
    description: 'Live reporting on international partnership performance for leadership.',
    irisModule: 'IRIS Dashboard + Partner Analytics',
    applicable: (i) => !i.item11_dashboard,
    apply: (i) => ({ ...i, item11_dashboard: true }),
  },
  {
    id: 'item3-process',
    title: 'Document the partner-discovery process (Item 3)',
    description: 'A written, structured procedure for responding to faculty partner requests.',
    irisModule: 'IRIS Partners workflow + office policy',
    applicable: (i) => !i.item3_documentedProcess,
    apply: (i) => ({ ...i, item3_documentedProcess: true }),
  },
  {
    id: 'item2-platforms',
    title: 'Expand partner-search platform coverage (Item 2)',
    description: 'Actively use at least three additional partner-search databases (IAU WHED, Erasmus+ Partner Finder, U-Multirank…).',
    irisModule: 'IRIS Partner Discovery',
    applicable: (i) => i.item2_platformCount < 10,
    apply: (i) => ({ ...i, item2_platformCount: Math.min(10, i.item2_platformCount + 3) }),
  },
  {
    id: 'item1-response',
    title: 'Cut partner-candidate response time to one week (Item 1)',
    description: 'Digital discovery workflows bring the faculty-request-to-candidates cycle under 7 days.',
    irisModule: 'IRIS Partners (AI-assisted discovery)',
    applicable: (i) => i.item1_daysToCandidates > 7,
    apply: (i) => ({ ...i, item1_daysToCandidates: 7 }),
  },
  {
    id: 'item5-mou-cycle',
    title: 'Halve the MOU signature cycle (Item 5)',
    description: 'Templates, digital routing and status tracking compress request-to-signature time.',
    irisModule: 'IRIS MOU Management',
    applicable: (i) => i.item5_daysToSignedMOU > 30,
    apply: (i) => ({ ...i, item5_daysToSignedMOU: Math.max(21, Math.round(i.item5_daysToSignedMOU / 2)) }),
  },
  {
    id: 'lc1-strategy',
    title: 'Secure a rector-approved internationalization strategy (LC1)',
    description: 'A formally signed strategy document, dated within the past three years.',
    irisModule: 'Governance action (raises IPI directly)',
    applicable: (i) => !i.lc1_strategyDocument,
    apply: (i) => ({ ...i, lc1_strategyDocument: true }),
  },
  {
    id: 'lc2-office',
    title: 'Establish a dedicated International Relations office (LC2)',
    description: 'At least one full-time staff member with a formal mandate.',
    irisModule: 'Governance action (raises IPI directly)',
    applicable: (i) => !i.lc2_dedicatedOffice,
    apply: (i) => ({ ...i, lc2_dedicatedOffice: true }),
  },
  {
    id: 'lc3-budget',
    title: 'Allocate a dedicated internationalization budget line (LC3)',
    description: 'A budget line for internationalization in the current fiscal year.',
    irisModule: 'Governance action (raises IPI directly)',
    applicable: (i) => !i.lc3_budgetLine,
    apply: (i) => ({ ...i, lc3_budgetLine: true }),
  },
];

/** Simulate every applicable single intervention plus the combined scenario. */
export function forecastInterventions(inputs: IMGIPIInputs): Forecast {
  const baseline = computeIMGIPI(inputs);

  const entries: ForecastEntry[] = INTERVENTIONS.filter((iv) => iv.applicable(inputs)).map((iv) => {
    const result = computeIMGIPI(iv.apply(inputs));
    return {
      intervention: iv,
      img: result.img,
      imgDelta: round3(result.img - baseline.img),
      imgBand: result.imgBand,
      ipi: result.ipi,
      ipiDelta: round3(result.ipi - baseline.ipi),
      ipiBand: result.ipiBand,
      bandChange: result.imgBand !== baseline.imgBand || result.ipiBand !== baseline.ipiBand,
    };
  });

  // Best first: largest IMG reduction, then largest IPI gain.
  entries.sort((a, b) => a.imgDelta - b.imgDelta || b.ipiDelta - a.ipiDelta);

  let combined: Forecast['combined'] = null;
  if (entries.length > 0) {
    let all = inputs;
    for (const iv of INTERVENTIONS) if (iv.applicable(all)) all = iv.apply(all);
    const r = computeIMGIPI(all);
    combined = { img: r.img, imgBand: imgBandOf(r.img), ipi: r.ipi, ipiBand: ipiBandOf(r.ipi) };
  }

  return { baseline, entries, combined };
}
