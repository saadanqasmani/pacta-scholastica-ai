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
import { db, newId } from '@/lib/localdb';
import { computeIMGIPI, IMGIPIInputs } from '@/lib/imgIpi';
import { chunkText } from '@/lib/libraryIndex';

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


/** Operational life for EVERY university in the network: each accepted
 *  cross-network MOU produces mobility, ROI and (for a subset) projects,
 *  research, interactions and inbox items on BOTH sides — so "Viewing as"
 *  any institution shows a fully populated system. Deterministic ids make
 *  this idempotent under bulkPut. */
async function seedCrossOperational(): Promise<void> {
  const mous = (await db.mous.filter((m) => String(m.id).startsWith('demo-net-')).toArray()) as Record<
    string,
    unknown
  >[];
  const mobility: Record<string, unknown>[] = [];
  const roi: Record<string, unknown>[] = [];
  const projects: Record<string, unknown>[] = [];
  const research: Record<string, unknown>[] = [];
  const interactions: Record<string, unknown>[] = [];
  const requests: Record<string, unknown>[] = [];
  const messages: Record<string, unknown>[] = [];

  const PROJECT_NAMES = [
    'Joint Summer School Programme',
    'Double Degree Feasibility Study',
    'Erasmus+ KA171 Mobility Project',
    'Joint Research Seed Fund',
    'Staff Training Week Exchange',
  ];
  const RESEARCH_TITLES = [
    'Comparative Higher Education Systems Study',
    'Sustainable Campus Operations Research',
    'Digital Learning Outcomes Analysis',
    'Regional Labour Market Alignment Study',
  ];

  for (const mou of mous) {
    if (mou.status !== 'accepted') continue;
    const a = String(mou.initiator_university_id);
    const b = String(mou.partner_university_id);
    const mouId = String(mou.id);
    const startYear = Math.max(2022, new Date(String(mou.created_at)).getUTCFullYear());

    for (const [self, other] of [
      [a, b],
      [b, a],
    ] as const) {
      // Mobility: both directions for the last two academic years.
      for (const year of YEARS) {
        if (Number(year.slice(0, 4)) < startYear) continue;
        for (const direction of ['incoming', 'outgoing'] as const) {
          const seed = `${mouId}-${self}-${year}-${direction}`;
          const v = h01(seed);
          if (v < 0.35) continue;
          mobility.push({
            id: `demo-xmob-${seed}`,
            university_id: self,
            partner_university_id: other,
            department_id: null,
            program_type: pick(PROGRAMS, seed),
            direction,
            student_count: 1 + Math.floor(v * 7),
            academic_year: year,
            completion_status: year === '2025-2026' ? 'ongoing' : 'completed',
            created_at: iso(Number(year.slice(0, 4)), 9, 20),
          });
        }
      }
      // ROI for the most recent full year.
      const rv = h01(`${mouId}-${self}-roi`);
      roi.push({
        id: `demo-xroi-${mouId}-${self}`,
        university_id: self,
        partner_university_id: other,
        partnership_year: 2025,
        student_exchange_count: 2 + Math.floor(rv * 10),
        research_collaborations: Math.floor(rv * 3),
        joint_publications: Math.floor(rv * 4),
        grant_funding_usd: Math.floor(rv * 60) * 1000,
        satisfaction_score: Math.round((3.0 + rv * 1.8) * 10) / 10,
        created_at: iso(2025, 12, 15),
      });
      // A subset get projects / research / an interaction on record.
      if (h01(`${mouId}-${self}-prj`) > 0.7) {
        const pv = h01(`${mouId}-${self}-prjv`);
        projects.push({
          id: `demo-xprj-${mouId}-${self}`,
          university_id: self,
          partner_university_id: other,
          project_name: pick(PROJECT_NAMES, `${mouId}-${self}`),
          project_type: 'academic',
          description: 'Joint initiative under the bilateral cooperation agreement.',
          status: pv > 0.5 ? 'active' : 'planning',
          progress: Math.floor(pv * 80),
          start_date: iso(2025, 3, 1),
          end_date: iso(2026, 12, 31),
          budget_usd: 10000 + Math.floor(pv * 40) * 1000,
          created_at: iso(2025, 2, 10),
          updated_at: iso(2026, 6, 1),
        });
      }
      if (h01(`${mouId}-${self}-res`) > 0.75) {
        const rv2 = h01(`${mouId}-${self}-resv`);
        research.push({
          id: `demo-xres-${mouId}-${self}`,
          university_id: self,
          partner_university_id: other,
          title: pick(RESEARCH_TITLES, `${mouId}-${self}`),
          status: 'active',
          publications_count: 1 + Math.floor(rv2 * 4),
          funding_amount: 8000 + Math.floor(rv2 * 50) * 1000,
          created_at: iso(2025, 5, 20),
        });
      }
      if (h01(`${mouId}-${self}-int`) > 0.8) {
        interactions.push({
          id: `demo-xint-${mouId}-${self}`,
          university_id: self,
          partner_university_id: other,
          title: 'Annual partnership review meeting',
          interaction_type: 'video_call',
          status: 'completed',
          stage: 'implementation',
          meeting_date: iso(2026, 4, 14),
          discussion_notes: 'Reviewed exchange numbers and agreed next-year nomination quotas.',
          outcomes: 'Quotas confirmed; joint activity calendar drafted.',
          goals: 'Maintain balanced two-way mobility.',
          created_at: iso(2026, 4, 14),
        });
      }
    }
  }

  // A small live inbox for every university.
  const unis = (await db.universities.toArray()) as { id: string; name: string }[];
  for (const u of unis) {
    if (u.id === HOME_ID) continue; // home inbox is richer, seeded separately
    const v = h01('inbox' + u.id);
    const from = unis[Math.floor(v * unis.length) % unis.length];
    if (from.id === u.id) continue;
    requests.push({
      id: `demo-xreq-${u.id}`,
      from_university_id: from.id,
      to_university_id: u.id,
      request_type: 'partnership',
      subject: 'Interest in a bilateral exchange agreement',
      message: `${from.name} would welcome a conversation about establishing a student exchange agreement.`,
      status: 'pending',
      priority: v > 0.6 ? 'high' : 'normal',
      created_at: iso(2026, 6, 1 + Math.floor(v * 25)),
    });
    messages.push({
      id: `demo-xmsg-${u.id}`,
      from_university_id: from.id,
      to_university_id: u.id,
      subject: 'Nomination period opening soon',
      message: 'Our spring nomination window opens next month — please confirm your coordinator contact.',
      message_type: 'administrative',
      is_read: v > 0.5,
      created_at: iso(2026, 6, 5 + Math.floor(v * 20)),
    });
  }

  await db.mobility_records.bulkPut(mobility as { id: string }[]);
  await db.partner_roi.bulkPut(roi as { id: string }[]);
  await db.partner_projects.bulkPut(projects as { id: string }[]);
  await db.research_collaborations.bulkPut(research as { id: string }[]);
  await db.partnership_interactions.bulkPut(interactions as { id: string }[]);
  await db.partner_requests.bulkPut(requests as { id: string }[]);
  await db.partner_messages.bulkPut(messages as { id: string }[]);
}

/** Pre-load the Data Library with realistic institutional documents so
 *  Ask AI and library search have content out of the box. */
async function seedLibrary(): Promise<void> {
  if ((await db.library_documents.count()) > 0) return;

  const DOCS: { title: string; filename: string; text: string }[] = [
    {
      title: 'International Partnership Handbook — İstanbul Nişantaşı University',
      filename: 'partnership-handbook.md',
      text: `International Partnership Handbook. İstanbul Nişantaşı University, International Relations Office, 2026 edition.
Partner nominations: partner universities must submit student nominations by 15 May for the fall semester and 15 October for the spring semester. Late nominations are accepted only with written approval from the International Relations Office director.
Tuition policy: exchange students under a bilateral MOU or Erasmus+ agreement pay tuition only to their home institution. No tuition fees are charged by Nişantaşı to incoming exchange students.
Credit recognition: all exchange study is governed by a Learning Agreement signed before mobility begins. Credits are recognized using ECTS. A minimum of 30 ECTS per semester constitutes a full study load.
Language of instruction: exchange students may take courses in English from the approved English-medium course catalogue. A B2 level of English (or equivalent) is required; no TOEFL or IELTS certificate is required if the home university certifies the student's level.
Accommodation: the university does not guarantee dormitory placement for exchange students but provides a verified list of private housing providers and a buddy-programme contact within 48 hours of nomination acceptance.
Insurance and visas: incoming students must hold health insurance valid in Turkey for the entire mobility period and are responsible for obtaining a student visa before arrival. The office issues acceptance letters within 10 working days of complete nomination.
Contacts: International Relations Office, Maslak Campus. Erasmus institutional coordinator: erasmus@nisantasi.edu.tr. Bilateral agreements: partnerships@nisantasi.edu.tr.`,
    },
    {
      title: 'Erasmus+ KA171 Quick Reference Guide',
      filename: 'erasmus-ka171-guide.md',
      text: `Erasmus+ KA171 (International Credit Mobility) quick reference.
What it funds: student mobility for studies (2 to 12 months), student mobility for traineeships, staff mobility for teaching, and staff mobility for training between programme countries and partner countries.
Student grant rates: incoming students to Turkey receive a monthly grant of approximately 800 EUR plus a distance-based travel contribution between 275 and 820 EUR. Outgoing rates depend on the destination country group.
Staff mobility: teaching assignments require a minimum of 8 teaching hours per week. Staff mobility duration is typically 5 days plus travel.
Application windows: institutional applications are submitted to the National Agency in February each year. Inter-institutional agreements must be signed before any mobility begins.
Selection principles: transparent and documented selection criteria, equal treatment, and priority for participants with fewer opportunities. Selection results must be published and an appeals channel provided.
Reporting: participants must complete the EU Survey within 30 days of completing mobility. Institutions report through the Beneficiary Module.
Recognition: full academic recognition of satisfactorily completed mobility is mandatory, using ECTS and the Learning Agreement.`,
    },
    {
      title: 'International Student Admission Requirements 2026',
      filename: 'admission-requirements-2026.txt',
      text: `International student admission requirements, 2026 intake.
Undergraduate applicants must provide: a high school diploma (attested by apostille for Hague Convention countries, or Ministry of Foreign Affairs plus Turkish Consulate attestation otherwise), a complete official transcript, a valid passport copy, two biometric photographs, and a completed application form.
Diploma equivalency: a Denklik (equivalency) certificate from the Turkish Ministry of National Education is required before final registration. Applications can be started online through the e-Denklik system and typically take 4 to 12 weeks.
Language requirements: programmes taught in Turkish require TÖMER C1 or completion of the university's Turkish preparatory year. Programmes taught in English require B2 proficiency, demonstrated by TOEFL iBT 72, IELTS 5.5 (specific programmes may require higher), or the university's own English proficiency examination.
Application deadlines: early admission closes 30 April 2026; regular admission closes 31 July 2026; late applications are considered until 5 September 2026 subject to quota availability.
Tuition deposits: admitted students confirm their place with a 500 USD deposit, deducted from first-semester tuition. The deposit is refundable only if a student visa is refused, upon presentation of the refusal letter.
Scholarships: merit scholarships between 25 and 100 percent of tuition are available based on academic standing; applications are automatic with admission. Sibling and early-payment discounts cannot be combined with merit scholarships above 50 percent.
Residence permits: after arrival, students must apply for a student residence permit (ikamet) within 30 days through e-ikamet, with university enrollment certificate and valid health insurance.`,
    },
  ];

  const now = iso(2026, 5, 10);
  for (const doc of DOCS) {
    const docId = newId();
    const chunks = chunkText(doc.text);
    await db.library_documents.add({
      id: docId,
      title: doc.title,
      filename: doc.filename,
      filetype: doc.filename.split('.').pop()?.toUpperCase() ?? 'MD',
      size: doc.text.length,
      university_id: HOME_ID,
      chunk_count: chunks.length,
      created_at: now,
    });
    await db.library_chunks.bulkAdd(
      chunks.map((text, seq) => ({ id: `${docId}-${seq}`, document_id: docId, seq, text }))
    );
    await db.storage_files.put({
      id: `library/${docId}/${doc.filename}`,
      bucket: 'library',
      path: `${docId}/${doc.filename}`,
      blob: new Blob([doc.text], { type: 'text/plain' }),
      created_at: now,
    });
  }
}

/** Idempotent entry point — fills only what is missing, never user data. */
export async function ensureDemoData(): Promise<void> {
  if ((await db.mous.count()) === 0) {
    await seedHomeNetwork();
    await seedCrossNetwork();
  }
  await seedAssessments(); // per-university check inside
  // v2 expansion: operational data for the whole network + library preload.
  // Marker row keeps this cheap on every startup; bulkPut with deterministic
  // ids makes a re-run harmless anyway.
  const marker = await db.ai_evaluations.get('iris-demo-seed-v2');
  if (!marker) {
    await seedCrossOperational();
    await seedLibrary();
    await db.ai_evaluations.put({
      id: 'iris-demo-seed-v2',
      university_id: 'system',
      evaluation_type: 'seed-marker',
      evaluation_data: { version: 2 },
      created_at: new Date().toISOString(),
      expires_at: '2099-01-01T00:00:00Z',
    });
  }
}
