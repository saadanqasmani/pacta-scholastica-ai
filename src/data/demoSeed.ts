/**
 * Demo operational dataset for the IRIS desktop proof of concept.
 *
 * Generates a coherent, deterministic network of MOUs, mobility flows,
 * partnership ROI, projects, interactions and research collaborations,
 * centred on the home institution (İstanbul Nişantaşı University), plus a
 * baseline IMG/IPI assessment for every university in the registry.
 *
 * Deterministic on purpose: the same data appears on every machine and every
 * launch (no randomness), so a rehearsed demo never changes under the
 * presenter. Seeding only fills EMPTY tables — real user data is never
 * touched or duplicated.
 */
import { db } from '@/lib/localdb';
import { computeIMGIPI, IMGIPIInputs } from '@/lib/imgIpi';

export const HOME_ID = '54dfc8d0-8e29-4ef8-ace4-147df5c9557d';

/** Deterministic 0..1 from a string (FNV-style). */
function h01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 10000) / 10000;
}

const pick = <T,>(arr: T[], seed: string): T => arr[Math.floor(h01(seed) * arr.length) % arr.length];
const iso = (y: number, m: number, d: number) =>
  new Date(Date.UTC(y, m - 1, d, 10, 0, 0)).toISOString();

// The home institution's partner network for the demo (mix of Turkish and
// international, chosen for a realistic mid-size private university).
const HOME_PARTNERS: { id: string; status: string; since: number }[] = [
  { id: 'int-warsaw', status: 'accepted', since: 2021 },
  { id: 'int-bucharest', status: 'accepted', since: 2021 },
  { id: 'int-sofia', status: 'accepted', since: 2022 },
  { id: 'int-tirana', status: 'accepted', since: 2022 },
  { id: 'int-sarajevo', status: 'accepted', since: 2023 },
  { id: 'int-baku', status: 'accepted', since: 2022 },
  { id: 'int-alfarabi', status: 'accepted', since: 2023 },
  { id: 'int-jordan', status: 'accepted', since: 2023 },
  { id: 'int-cairo', status: 'accepted', since: 2024 },
  { id: 'tr-bahcesehir', status: 'accepted', since: 2022 },
  { id: 'int-charles', status: 'pending', since: 2025 },
  { id: 'int-groningen', status: 'pending', since: 2025 },
  { id: 'int-qatar', status: 'counter_proposed', since: 2025 },
  { id: 'int-lagos', status: 'draft', since: 2025 },
  { id: 'int-polimi', status: 'rejected', since: 2024 },
];

const SCOPES = [
  ['student_exchange', 'faculty_mobility'],
  ['student_exchange', 'joint_research'],
  ['student_exchange', 'faculty_mobility', 'joint_research'],
  ['student_exchange', 'dual_degree'],
];

const YEARS = ['2022-2023', '2023-2024', '2024-2025', '2025-2026'];
const PROGRAMS: ('erasmus' | 'bilateral' | 'exchange')[] = ['erasmus', 'bilateral', 'exchange'];

function demoClauses(mouId: string, initiator: string): Record<string, unknown>[] {
  return [
    {
      id: `${mouId}-c1`,
      title: 'Student Exchange',
      content:
        'Each party may nominate up to ten (10) students per academic year for exchange periods of one or two semesters, with tuition payable only to the home institution.',
      proposed_by: initiator,
    },
    {
      id: `${mouId}-c2`,
      title: 'Credit Recognition (ECTS)',
      content:
        'Credits earned at the host institution shall be recognized in accordance with ECTS, on the basis of a Learning Agreement signed prior to each exchange period.',
      proposed_by: initiator,
    },
  ];
}

async function seedHomeNetwork(): Promise<void> {
  const now = iso(2026, 6, 20);
  const mous: Record<string, unknown>[] = [];
  const mobility: Record<string, unknown>[] = [];
  const roi: Record<string, unknown>[] = [];
  const projects: Record<string, unknown>[] = [];
  const interactions: Record<string, unknown>[] = [];
  const research: Record<string, unknown>[] = [];
  const requests: Record<string, unknown>[] = [];
  const messages: Record<string, unknown>[] = [];

  for (const p of HOME_PARTNERS) {
    const mouId = `demo-mou-${p.id}`;
    const s = h01(mouId);
    mous.push({
      id: mouId,
      initiator_university_id: s > 0.5 ? HOME_ID : p.id,
      partner_university_id: s > 0.5 ? p.id : HOME_ID,
      status: p.status,
      cooperation_scope: pick(SCOPES, mouId),
      clauses: demoClauses(mouId, HOME_ID),
      created_at: iso(p.since, 3 + Math.floor(s * 8), 1 + Math.floor(s * 25)),
      updated_at: now,
    });

    if (p.status !== 'accepted') continue;

    // Mobility: active partners exchange students each year since signing.
    for (const year of YEARS) {
      const startYear = Number(year.slice(0, 4));
      if (startYear < p.since) continue;
      for (const direction of ['incoming', 'outgoing'] as const) {
        const seed = `${mouId}-${year}-${direction}`;
        const v = h01(seed);
        if (v < 0.2) continue; // not every partner sends both ways every year
        mobility.push({
          id: `demo-mob-${seed}`,
          university_id: HOME_ID,
          partner_university_id: p.id,
          department_id: null,
          program_type: pick(PROGRAMS, seed),
          direction,
          student_count: 2 + Math.floor(v * 9),
          academic_year: year,
          completion_status: year === '2025-2026' ? 'ongoing' : 'completed',
          created_at: iso(startYear, 9, 15),
        });
      }
    }

    // ROI per partnership-year.
    for (const year of [2023, 2024, 2025]) {
      if (year < p.since) continue;
      const seed = `${mouId}-roi-${year}`;
      const v = h01(seed);
      roi.push({
        id: `demo-roi-${seed}`,
        university_id: HOME_ID,
        partner_university_id: p.id,
        partnership_year: year,
        student_exchange_count: 4 + Math.floor(v * 14),
        research_collaborations: Math.floor(v * 3),
        joint_publications: Math.floor(v * 5),
        grant_funding_usd: Math.floor(v * 90) * 1000,
        satisfaction_score: Math.round((3.2 + v * 1.6) * 10) / 10,
        created_at: iso(year, 12, 20),
      });
    }
  }

  // Joint projects with the strongest partners.
  const projectDefs: [string, string, string, string, number, number][] = [
    ['int-warsaw', 'Erasmus+ KA171 Mobility Consortium', 'mobility', 'active', 65, 42000],
    ['int-baku', 'Caspian Business Studies Dual Curriculum', 'academic', 'active', 40, 25000],
    ['int-jordan', 'Joint Summer School on Health Sciences', 'academic', 'completed', 100, 18000],
    ['int-alfarabi', 'Central Asia Student Recruitment Initiative', 'recruitment', 'active', 55, 30000],
    ['int-sofia', 'Balkan Digital Humanities Research Network', 'research', 'planning', 10, 60000],
  ];
  for (const [pid, name, type, status, progress, budget] of projectDefs) {
    projects.push({
      id: `demo-prj-${pid}`,
      university_id: HOME_ID,
      partner_university_id: pid,
      project_name: name,
      project_type: type,
      description: `${name} — joint initiative under the bilateral cooperation agreement.`,
      status,
      progress,
      start_date: iso(2025, 2, 1),
      end_date: iso(2026, 12, 31),
      budget_usd: budget,
      created_at: iso(2025, 1, 15),
      updated_at: now,
    });
  }

  // Interaction history for the two most active relationships.
  const interactionDefs: [string, string, string, string, string][] = [
    ['int-warsaw', 'Annual coordination meeting', 'meeting', 'completed', 'implementation'],
    ['int-warsaw', 'KA171 application planning call', 'video_call', 'completed', 'expansion'],
    ['int-charles', 'Initial partnership discussion', 'video_call', 'completed', 'negotiation'],
    ['int-charles', 'MOU draft review', 'email', 'in_progress', 'negotiation'],
    ['int-qatar', 'Counter-proposal discussion', 'meeting', 'scheduled', 'negotiation'],
  ];
  interactionDefs.forEach(([pid, title, type, status, stage], i) => {
    interactions.push({
      id: `demo-int-${pid}-${i}`,
      university_id: HOME_ID,
      partner_university_id: pid,
      title,
      interaction_type: type,
      status,
      stage,
      meeting_date: iso(2026, 1 + i, 10),
      discussion_notes: `${title} with the partner's international office.`,
      outcomes: status === 'completed' ? 'Action items agreed and recorded.' : null,
      goals: 'Advance the partnership to the next stage.',
      created_at: iso(2026, 1 + i, 10),
    });
  });

  // Research collaborations (drive the Analytics module).
  const researchDefs: [string, string, number, number][] = [
    ['int-warsaw', 'Comparative Study of Student Mobility Outcomes', 3, 45000],
    ['int-baku', 'Caspian Region Trade and Education Corridors', 2, 22000],
    ['int-jordan', 'Public Health Education in the Eastern Mediterranean', 4, 61000],
    ['int-alfarabi', 'Digital Transformation of University Administration', 1, 15000],
  ];
  for (const [pid, title, pubs, funding] of researchDefs) {
    research.push({
      id: `demo-res-${pid}`,
      university_id: HOME_ID,
      partner_university_id: pid,
      title,
      status: 'active',
      publications_count: pubs,
      funding_amount: funding,
      created_at: iso(2025, 5, 1),
    });
  }

  // A live inbox: incoming requests and messages.
  requests.push(
    {
      id: 'demo-req-1',
      from_university_id: 'int-indonesia',
      to_university_id: HOME_ID,
      request_type: 'partnership',
      subject: 'Exploring a student exchange agreement',
      message:
        'Universitas Indonesia is expanding its European and Turkish partner network and would welcome a conversation about a bilateral exchange agreement.',
      status: 'pending',
      priority: 'normal',
      created_at: iso(2026, 6, 12),
    },
    {
      id: 'demo-req-2',
      from_university_id: 'int-nazarbayev',
      to_university_id: HOME_ID,
      request_type: 'joint_research',
      subject: 'Joint application: Horizon Europe education call',
      message:
        'We are assembling a consortium for the upcoming Horizon Europe call on digital education and would like to include your institution.',
      status: 'pending',
      priority: 'high',
      created_at: iso(2026, 6, 18),
    }
  );
  messages.push({
    id: 'demo-msg-1',
    from_university_id: 'int-warsaw',
    to_university_id: HOME_ID,
    subject: 'Nomination deadline reminder',
    message: 'Kind reminder that spring semester nominations close on 15 October.',
    message_type: 'administrative',
    is_read: false,
    created_at: iso(2026, 6, 19),
  });

  await db.mous.bulkPut(mous as { id: string }[]);
  await db.mobility_records.bulkPut(mobility as { id: string }[]);
  await db.partner_roi.bulkPut(roi as { id: string }[]);
  await db.partner_projects.bulkPut(projects as { id: string }[]);
  await db.partnership_interactions.bulkPut(interactions as { id: string }[]);
  await db.research_collaborations.bulkPut(research as { id: string }[]);
  await db.partner_requests.bulkPut(requests as { id: string }[]);
  await db.partner_messages.bulkPut(messages as { id: string }[]);
}

/** A cross-network of MOUs among the other universities, so "Viewing as" any
 *  institution shows a living system rather than an empty one. */
async function seedCrossNetwork(): Promise<void> {
  const unis = (await db.universities.toArray()) as { id: string; internationalization_maturity?: string }[];
  const ids = unis.map((u) => u.id).filter((id) => id !== HOME_ID);
  const mous: Record<string, unknown>[] = [];
  for (const a of ids) {
    const links = 2 + Math.floor(h01('deg' + a) * 3); // 2-4 partners each
    for (let k = 0; k < links; k++) {
      const b = ids[Math.floor(h01(`${a}-link-${k}`) * ids.length) % ids.length];
      if (b === a) continue;
      const [x, y] = a < b ? [a, b] : [b, a];
      const mouId = `demo-net-${x}-${y}`;
      const v = h01(mouId);
      mous.push({
        id: mouId,
        initiator_university_id: x,
        partner_university_id: y,
        status: v < 0.75 ? 'accepted' : 'pending',
        cooperation_scope: pick(SCOPES, mouId),
        clauses: [],
        created_at: iso(2021 + Math.floor(v * 4), 1 + Math.floor(v * 11), 5),
        updated_at: iso(2026, 5, 1),
      });
    }
  }
  await db.mous.bulkPut(mous as { id: string }[]); // bulkPut dedupes on id
}

/** Baseline IMG/IPI assessment for every university, derived from its
 *  maturity tier with deterministic per-institution variation. */
async function seedAssessments(): Promise<void> {
  const unis = (await db.universities.toArray()) as {
    id: string;
    internationalization_maturity?: string;
  }[];
  const existing = new Set(
    ((await db.img_ipi_assessments.toArray()) as { university_id?: string }[]).map((a) =>
      String(a.university_id)
    )
  );

  const rows: Record<string, unknown>[] = [];
  for (const u of unis) {
    if (existing.has(u.id)) continue; // never overwrite a real assessment
    const v = h01('imgipi' + u.id);
    const tier = u.internationalization_maturity ?? 'low';

    let inputs: IMGIPIInputs;
    if (u.id === HOME_ID) {
      // The home institution's baseline narrative: a real, moderate-to-high
      // gap with clear, fixable digital-infrastructure deficits.
      inputs = {
        item1_daysToCandidates: 21,
        item2_platformCount: 3,
        item3_documentedProcess: false,
        item4_approvalDepartments: 5,
        item5_daysToSignedMOU: 95,
        item6_initiated: 24,
        item6_signed: 15,
        item7_purposeBuiltSoftware: false,
        item8_centralisedRecords: false,
        item9_mobilityTracking: true,
        item10_nationalIntegration: false,
        item11_dashboard: true,
        item12_toolCount: 2,
        lc1_strategyDocument: true,
        lc2_dedicatedOffice: true,
        lc3_budgetLine: false,
        item13_digitalComfort: 3.6,
        item14_aiFamiliarity: 3.1,
        item15_aiTrust: 3.0,
        item16_aiConcern: 3.2,
        item17_likelihoodOfUse: 4.1,
        surveyRespondents: 26,
        rfStdDev: 0.16,
      };
    } else if (tier === 'high') {
      inputs = {
        item1_daysToCandidates: 2 + Math.round(v * 8),
        item2_platformCount: 6 + Math.round(v * 3),
        item3_documentedProcess: true,
        item4_approvalDepartments: 2 + Math.round(v * 2),
        item5_daysToSignedMOU: 20 + Math.round(v * 40),
        item6_initiated: 30 + Math.round(v * 30),
        item6_signed: 26 + Math.round(v * 26),
        item7_purposeBuiltSoftware: v > 0.4,
        item8_centralisedRecords: true,
        item9_mobilityTracking: true,
        item10_nationalIntegration: v > 0.6,
        item11_dashboard: true,
        item12_toolCount: 4,
        lc1_strategyDocument: true,
        lc2_dedicatedOffice: true,
        lc3_budgetLine: true,
        item13_digitalComfort: 3.8 + v * 0.8,
        item14_aiFamiliarity: 3.4 + v * 0.8,
        item15_aiTrust: 3.2 + v * 0.8,
        item16_aiConcern: 2.4 + v * 0.6,
        item17_likelihoodOfUse: 4.0 + v * 0.7,
        surveyRespondents: 24 + Math.round(v * 30),
        rfStdDev: 0.14,
      };
    } else if (tier === 'medium') {
      inputs = {
        item1_daysToCandidates: 15 + Math.round(v * 30),
        item2_platformCount: 2 + Math.round(v * 3),
        item3_documentedProcess: v > 0.55,
        item4_approvalDepartments: 4 + Math.round(v * 3),
        item5_daysToSignedMOU: 75 + Math.round(v * 80),
        item6_initiated: 15 + Math.round(v * 20),
        item6_signed: 9 + Math.round(v * 12),
        item7_purposeBuiltSoftware: false,
        item8_centralisedRecords: v > 0.5,
        item9_mobilityTracking: v > 0.35,
        item10_nationalIntegration: false,
        item11_dashboard: v > 0.7,
        item12_toolCount: 2,
        lc1_strategyDocument: v > 0.3,
        lc2_dedicatedOffice: true,
        lc3_budgetLine: v > 0.55,
        item13_digitalComfort: 3.0 + v * 0.9,
        item14_aiFamiliarity: 2.6 + v * 0.9,
        item15_aiTrust: 2.5 + v * 0.9,
        item16_aiConcern: 3.0 + v * 0.8,
        item17_likelihoodOfUse: 3.2 + v * 0.9,
        surveyRespondents: 20 + Math.round(v * 15),
        rfStdDev: 0.17,
      };
    } else {
      inputs = {
        item1_daysToCandidates: 45 + Math.round(v * 90),
        item2_platformCount: Math.round(v * 2),
        item3_documentedProcess: false,
        item4_approvalDepartments: 6 + Math.round(v * 3),
        item5_daysToSignedMOU: 140 + Math.round(v * 120),
        item6_initiated: 8 + Math.round(v * 14),
        item6_signed: 3 + Math.round(v * 7),
        item7_purposeBuiltSoftware: false,
        item8_centralisedRecords: false,
        item9_mobilityTracking: v > 0.75,
        item10_nationalIntegration: false,
        item11_dashboard: false,
        item12_toolCount: v > 0.6 ? 1 : 0,
        lc1_strategyDocument: v > 0.7,
        lc2_dedicatedOffice: v > 0.25,
        lc3_budgetLine: v > 0.8,
        item13_digitalComfort: 2.4 + v * 0.9,
        item14_aiFamiliarity: 2.0 + v * 0.9,
        item15_aiTrust: 2.0 + v * 0.9,
        item16_aiConcern: 3.4 + v * 0.9,
        item17_likelihoodOfUse: 2.6 + v * 1.0,
        surveyRespondents: 20 + Math.round(v * 8),
        rfStdDev: 0.19,
      };
    }

    // Bound derived fields to valid ranges.
    inputs.item6_signed = Math.min(inputs.item6_signed, inputs.item6_initiated);
    const capped = (x: number) => Math.min(5, Math.round(x * 10) / 10);
    inputs.item13_digitalComfort = capped(inputs.item13_digitalComfort);
    inputs.item14_aiFamiliarity = capped(inputs.item14_aiFamiliarity);
    inputs.item15_aiTrust = capped(inputs.item15_aiTrust);
    inputs.item16_aiConcern = capped(inputs.item16_aiConcern);
    inputs.item17_likelihoodOfUse = capped(inputs.item17_likelihoodOfUse);

    rows.push({
      id: `demo-imgipi-${u.id}`,
      university_id: u.id,
      inputs,
      result: computeIMGIPI(inputs),
      created_at: iso(2026, 3, 3 + Math.floor(v * 20)),
    });
  }
  await db.img_ipi_assessments.bulkPut(rows as { id: string }[]);
}

/** Idempotent entry point — fills only tables that are still empty. */
export async function ensureDemoData(): Promise<void> {
  if ((await db.mous.count()) === 0) {
    await seedHomeNetwork();
    await seedCrossNetwork();
  }
  await seedAssessments(); // per-university check inside
}
