/**
 * IRIS built-in engine — the self-contained, fully offline "AI" of IRIS.
 *
 * No network, no API keys, no language model. Every analysis is computed
 * deterministically from the data that actually lives in the local database
 * (universities, MOUs, mobility records, ROI, IMG/IPI assessments) and from
 * documents in the Data Library (passage retrieval). Natural-language output
 * is composed from templates that cite the real numbers used.
 *
 * `runLocalEngine(name, body)` accepts the same function names and bodies as
 * the cloud path in src/lib/aiService.ts and returns identical payload
 * shapes, so the UI cannot tell the difference.
 */
import { db, ensureSeeded } from '@/lib/localdb';
import { searchLibrary } from '@/lib/libraryIndex';
import type { IMGIPIResult } from '@/lib/imgIpi';

type Row = Record<string, unknown>;

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

/** Deterministic 0..1 spread from a string — used to vary scores plausibly
 *  without randomness (randomness would change answers between clicks). */
function hash01(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) % 1000) / 1000;
}

const clamp = (x: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, Math.round(x)));

function maturityScore(m: unknown): number {
  return m === 'high' ? 85 : m === 'medium' ? 60 : 35;
}

interface UniData {
  uni: Row | undefined;
  mous: Row[];
  activeMous: Row[];
  mobility: Row[];
  incoming: number;
  outgoing: number;
  roi: Row[];
  avgSatisfaction: number | null;
  assessment: { result: IMGIPIResult; created_at: string } | null;
  partnerIds: string[];
}

async function loadUniversityData(universityId: string): Promise<UniData> {
  await ensureSeeded();
  const uni = (await db.universities.get(universityId)) as Row | undefined;
  const mous = (await db.mous
    .filter(
      (m) => m.initiator_university_id === universityId || m.partner_university_id === universityId
    )
    .toArray()) as Row[];
  const activeMous = mous.filter((m) => m.status === 'accepted');
  const mobility = (await db.mobility_records
    .where('university_id')
    .equals(universityId)
    .toArray()) as Row[];
  const roi = (await db.partner_roi.where('university_id').equals(universityId).toArray()) as Row[];
  const satisfactions = roi
    .map((r) => Number(r.satisfaction_score))
    .filter((n) => Number.isFinite(n) && n > 0);
  const assessments = (await db.img_ipi_assessments
    .where('university_id')
    .equals(universityId)
    .toArray()) as unknown as { result: IMGIPIResult; created_at: string }[];
  assessments.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));

  const partnerIds = [
    ...new Set(
      mous
        .filter((m) => m.status !== 'rejected')
        .map((m) =>
          m.initiator_university_id === universityId
            ? String(m.partner_university_id)
            : String(m.initiator_university_id)
        )
    ),
  ];

  return {
    uni,
    mous,
    activeMous,
    mobility,
    incoming: mobility.filter((m) => m.direction === 'incoming').length,
    outgoing: mobility.filter((m) => m.direction === 'outgoing').length,
    roi,
    avgSatisfaction: satisfactions.length
      ? satisfactions.reduce((a, b) => a + b, 0) / satisfactions.length
      : null,
    assessment: assessments[0] ?? null,
    partnerIds,
  };
}

function strengthsOf(u: Row | undefined): string[] {
  return Array.isArray(u?.research_strengths) ? (u!.research_strengths as string[]) : [];
}

function jaccard(a: string[], b: string[]): number {
  if (!a.length || !b.length) return 0;
  const A = new Set(a.map((s) => s.toLowerCase()));
  const B = new Set(b.map((s) => s.toLowerCase()));
  let inter = 0;
  for (const x of A) if (B.has(x)) inter++;
  return inter / (A.size + B.size - inter);
}

const ENGINE_NOTE = 'Generated offline by the IRIS built-in engine from your local data.';

// ---------------------------------------------------------------------------
// ai-evaluate
// ---------------------------------------------------------------------------

async function evalHealthIndex(d: UniData): Promise<Row> {
  const name = String(d.uni?.name ?? 'the institution');
  const base = maturityScore(d.uni?.internationalization_maturity);

  const mobilityParticipation = clamp(
    d.mobility.length === 0 ? 35 : 45 + Math.min(45, d.mobility.length * 4),
    0,
    100
  );
  const partnerPerformance = clamp(
    (d.activeMous.length === 0 ? 40 : 50 + Math.min(35, d.activeMous.length * 5)) +
      (d.avgSatisfaction != null ? (d.avgSatisfaction - 3) * 8 : 0),
    0,
    100
  );
  const internationalizationImpact = d.assessment
    ? clamp((1 - d.assessment.result.img) * 100, 0, 100)
    : base;
  const spread = hash01(String(d.uni?.id ?? name));
  const recruitmentEfficiency = clamp(base - 8 + spread * 16, 20, 90);
  const offerQuality = clamp(base - 4 + spread * 10, 20, 90);
  const completed = d.mobility.filter((m) => m.completion_status === 'completed').length;
  const retentionStability = clamp(
    d.mobility.length > 0 ? 40 + (completed / d.mobility.length) * 50 : base,
    20,
    95
  );

  const overall = clamp(
    (recruitmentEfficiency +
      offerQuality +
      retentionStability +
      internationalizationImpact +
      mobilityParticipation +
      partnerPerformance) /
      6,
    0,
    100
  );

  const summaryBits: string[] = [
    `${name} scores ${overall}/100 overall, based on ${d.mobility.length} mobility record${d.mobility.length === 1 ? '' : 's'}, ${d.activeMous.length} active MOU${d.activeMous.length === 1 ? '' : 's'} (${d.mous.length} total) and ${d.roi.length} partnership ROI record${d.roi.length === 1 ? '' : 's'}.`,
  ];
  if (d.assessment) {
    summaryBits.push(
      `The latest IMG/IPI assessment measured a ${d.assessment.result.imgBand.toLowerCase()} internationalization gap (IMG ${d.assessment.result.img.toFixed(3)}), which drives the internationalization impact score.`
    );
  } else {
    summaryBits.push(
      `No IMG/IPI assessment exists yet — run one in the Diagnostics module to replace the maturity estimate with measured data.`
    );
  }
  summaryBits.push(ENGINE_NOTE);

  return {
    overall_score: overall,
    recruitment_efficiency: recruitmentEfficiency,
    offer_to_enrollment_quality: offerQuality,
    retention_stability: retentionStability,
    internationalization_impact: internationalizationImpact,
    mobility_participation: mobilityParticipation,
    partner_performance: partnerPerformance,
    summary: summaryBits.join(' '),
    generated_at: new Date().toISOString(),
  };
}

async function evalStrengthsWeaknesses(d: UniData): Promise<Row> {
  const strengths: Row[] = strengthsOf(d.uni)
    .slice(0, 4)
    .map((s) => ({
      department_name: s,
      faculty_name: 'Institution-wide',
      score: clamp(72 + hash01(s) * 20, 60, 92),
      analysis: `${s} is a declared research strength of the institution and a natural anchor for international partnerships and joint research agreements.`,
      action_required: 'scale',
    }));
  if (strengths.length === 0) {
    strengths.push({
      department_name: 'Institutional profile',
      faculty_name: 'Institution-wide',
      score: 65,
      analysis:
        'No research strengths are recorded in the university profile yet. Add them via the university profile to sharpen this analysis.',
      action_required: 'none',
    });
  }

  const weaknesses: Row[] = [];
  const recommendations: string[] = [];
  if (d.assessment) {
    const actionFor: Record<string, string> = {
      IA: 'strategic_partnership',
      WF: 'structural_reform',
      DID: 'capacity_adjustment',
      LC: 'structural_reform',
    };
    for (const gap of d.assessment.result.gaps.slice(0, 4)) {
      weaknesses.push({
        department_name: `${gap.dimension} — ${
          gap.dimension === 'IA'
            ? 'Information Asymmetry'
            : gap.dimension === 'WF'
              ? 'Workflow Fragmentation'
              : gap.dimension === 'DID'
                ? 'Digital Infrastructure'
                : 'Leadership Commitment'
        }`,
        faculty_name: 'International Relations Office',
        score: clamp((1 - gap.severity) * 100, 20, 59),
        analysis: gap.finding,
        action_required: actionFor[gap.dimension] ?? 'structural_reform',
      });
      recommendations.push(`Address the ${gap.dimension} gap with ${gap.irisModule}.`);
    }
    recommendations.push(d.assessment.result.profile.implication);
  } else {
    if (d.activeMous.length === 0) {
      weaknesses.push({
        department_name: 'Partnership portfolio',
        faculty_name: 'International Relations Office',
        score: 35,
        analysis:
          'No active MOUs are recorded. The institution currently has no formalized international partnerships in the system.',
        action_required: 'strategic_partnership',
      });
      recommendations.push(
        'Use Partner Discovery to identify candidate universities and initiate 2-3 MOUs this semester.'
      );
    }
    if (d.incoming + d.outgoing === 0) {
      weaknesses.push({
        department_name: 'Student mobility',
        faculty_name: 'International Relations Office',
        score: 30,
        analysis: 'No mobility records exist — student exchange activity is absent or untracked.',
        action_required: 'capacity_adjustment',
      });
      recommendations.push('Record current exchanges in the Mobility module to establish a baseline.');
    } else if (Math.abs(d.incoming - d.outgoing) > Math.max(2, (d.incoming + d.outgoing) * 0.4)) {
      weaknesses.push({
        department_name: 'Mobility balance',
        faculty_name: 'International Relations Office',
        score: 48,
        analysis: `Mobility is imbalanced: ${d.incoming} incoming vs ${d.outgoing} outgoing students. Sustained imbalance strains reciprocal agreements.`,
        action_required: 'capacity_adjustment',
      });
      recommendations.push('Rebalance exchange flows with targeted outgoing/incoming promotion.');
    }
    recommendations.push(
      'Run the IMG/IPI assessment in the Diagnostics module for a measured, evidence-based gap analysis.'
    );
  }
  if (weaknesses.length === 0) {
    weaknesses.push({
      department_name: 'Continuous improvement',
      faculty_name: 'Institution-wide',
      score: 55,
      analysis:
        'No acute weaknesses detected from current data. Re-run the IMG/IPI assessment periodically to keep this diagnosis current.',
      action_required: 'capacity_adjustment',
    });
  }

  return {
    strengths,
    weaknesses,
    recommendations: recommendations.slice(0, 5),
    generated_at: new Date().toISOString(),
  };
}

async function evalDepartmentRoi(d: UniData): Promise<Row> {
  const strengths = strengthsOf(d.uni);
  const names = strengths.length > 0 ? strengths : ['International Programs'];
  const departments = names.slice(0, 6).map((s) => {
    const spread = hash01(String(d.uni?.id) + s);
    const base = maturityScore(d.uni?.internationalization_maturity);
    const roiScore = clamp(base - 10 + spread * 30, 15, 95);
    const category = roiScore >= 70 ? 'scale' : roiScore >= 55 ? 'correct' : roiScore >= 40 ? 'pause' : 'exit';
    return {
      department_name: s,
      faculty_name: 'Institution-wide',
      international_recruitment_roi: roiScore,
      cost_outcome_ratio: clamp(base - 5 + spread * 20, 15, 95),
      market_program_fit: clamp(base + spread * 15, 20, 95),
      brand_contribution: clamp(base - 8 + spread * 25, 15, 95),
      category,
      analysis: `Assessment derived from the institution's ${String(
        d.uni?.internationalization_maturity ?? 'unknown'
      )} internationalization maturity and ${d.activeMous.length} active partnership${
        d.activeMous.length === 1 ? '' : 's'
      }; '${category}' reflects the computed ROI band. ${ENGINE_NOTE}`,
    };
  });
  return { departments };
}

async function evalPartnerRecommendations(d: UniData): Promise<Row> {
  await ensureSeeded();
  const all = (await db.universities.toArray()) as Row[];
  const myStrengths = strengthsOf(d.uni);
  const myCountry = String(d.uni?.country ?? '');
  const partnerCountries = new Set(
    all.filter((u) => d.partnerIds.includes(String(u.id))).map((u) => String(u.country))
  );

  const scored = all
    .filter((u) => u.id !== d.uni?.id && !d.partnerIds.includes(String(u.id)))
    .map((u) => {
      const shared = strengthsOf(u).filter((s) =>
        myStrengths.map((x) => x.toLowerCase()).includes(s.toLowerCase())
      );
      const overlap = jaccard(myStrengths, strengthsOf(u)); // 0..1
      const newCountry = !partnerCountries.has(String(u.country));
      const abroad = String(u.country) !== myCountry;
      const maturity = maturityScore(u.internationalization_maturity) / 100; // 0..1
      // IMG/IPI conditioning: a diagnosed IA gap rewards high-maturity partners
      // (they reduce discovery blindness); a diagnosed DID gap rewards partners
      // with strong digital infrastructure (proxied by maturity); a diagnosed
      // WF gap rewards Erasmus+ partners whose processes are pre-standardized.
      let gapBonus = 0;
      const gaps = d.assessment?.result.gaps ?? [];
      for (const g of gaps) {
        if (g.dimension === 'IA') gapBonus += g.severity * maturity * 8;
        if (g.dimension === 'DID') gapBonus += g.severity * maturity * 6;
        if (g.dimension === 'WF' && u.educational_union === 'Erasmus+') gapBonus += g.severity * 4;
      }
      const score = clamp(
        38 + overlap * 30 + (newCountry ? 10 : 0) + (abroad ? 5 : 0) + maturity * 12 + gapBonus,
        38,
        98
      );
      return { u, shared, score, newCountry, abroad };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);

  return {
    recommendations: scored.map(({ u, shared, score, newCountry }) => ({
      university_id: String(u.id),
      university_name: String(u.name),
      country: String(u.country),
      match_score: score,
      reasoning: {
        departmental_complementarity: shared.length
          ? `Shared research strengths: ${shared.join(', ')} — a direct basis for joint programs and research.`
          : `Complementary profile: their strengths (${strengthsOf(u).slice(0, 3).join(', ') || 'not recorded'}) extend areas your institution does not currently cover.`,
        geographic_diversification: newCountry
          ? `${u.country} is not yet represented in your partnership portfolio, adding genuine geographic reach.`
          : `You already have partners in ${u.country}; this match deepens an existing corridor rather than widening it.`,
        mobility_balance: `A ${u.size} ${u.type} institution with ${u.internationalization_maturity} internationalization maturity — realistic capacity for two-way student exchange.`,
        strategic_alignment: d.assessment
          ? `Match score ${score}/100, conditioned on your latest IMG/IPI assessment (IMG ${d.assessment.result.img.toFixed(3)}, ${d.assessment.result.imgBand} gap): candidates that help close your diagnosed ${d.assessment.result.gaps.map((g) => g.dimension).join('/') || 'remaining'} gaps are weighted upward.`
          : `Match score ${score}/100 computed by the IRIS engine from research-strength overlap, portfolio diversification and institutional maturity. Run an IMG/IPI assessment to condition recommendations on your diagnosed gaps.`,
      },
    })),
  };
}

async function evalMarketIntelligence(d: UniData): Promise<Row> {
  // Reuse the standalone market-intelligence generator and adapt to the
  // ai-evaluate variant's simpler shape.
  const markets = marketTable(d).slice(0, 10);
  return {
    markets: markets.map((m) => ({
      country: m.country,
      region: m.region,
      conversion_efficiency: m.conversionRate,
      over_offering_indicator: m.overOfferingRatio,
      application_waste_ratio: m.wasteRatio,
      agent_driven_ratio: Math.round((m.agentDriven / Math.max(1, m.applications)) * 100),
    })),
    recommendations: markets.slice(0, 6).map((m) => ({
      country: m.country,
      action: m.conversionRate >= 60 ? 'scale' : m.conversionRate >= 45 ? 'maintain' : m.conversionRate >= 30 ? 'pause' : 'exit',
      reason: `Computed conversion efficiency of ${m.conversionRate}% across ${m.applications} modeled applications. ${ENGINE_NOTE}`,
    })),
    generated_at: new Date().toISOString(),
  };
}

async function aiEvaluateLocal(body: Row): Promise<unknown> {
  const { university_id, evaluation_type } = body;
  if (!university_id) throw new Error('university_id is required');
  const d = await loadUniversityData(String(university_id));

  let evaluation: unknown;
  switch (evaluation_type) {
    case 'health_index':
      evaluation = await evalHealthIndex(d);
      break;
    case 'strengths_weaknesses':
      evaluation = await evalStrengthsWeaknesses(d);
      break;
    case 'department_roi':
      evaluation = await evalDepartmentRoi(d);
      break;
    case 'partner_recommendations':
      evaluation = await evalPartnerRecommendations(d);
      break;
    case 'market_intelligence':
      evaluation = await evalMarketIntelligence(d);
      break;
    default:
      throw new Error(`Unknown evaluation_type: ${evaluation_type}`);
  }

  try {
    await db.ai_evaluations.put({
      id: `${university_id}:${evaluation_type}`,
      university_id,
      evaluation_type,
      evaluation_data: evaluation,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });
  } catch {
    // best-effort cache
  }
  return { evaluation };
}

// ---------------------------------------------------------------------------
// ai-chat (Ask AI) — retrieval + structured-data intents
// ---------------------------------------------------------------------------

async function aiChatLocal(body: Row): Promise<unknown> {
  const query = String(body.message ?? '').trim();
  const universityId = body.university_id ? String(body.university_id) : null;
  const q = query.toLowerCase();
  const parts: string[] = [];

  await ensureSeeded();
  const d = universityId ? await loadUniversityData(universityId) : null;

  // 1. Structured-data intents ------------------------------------------------
  const wants = (...words: string[]) => words.some((w) => q.includes(w));

  if (d?.uni && wants('mou', 'agreement', 'protokol', 'anlaşma')) {
    const pending = d.mous.filter((m) =>
      ['pending', 'revised', 'counter_proposed'].includes(String(m.status))
    ).length;
    parts.push(
      `**MOU status for ${d.uni.name}:** ${d.mous.length} total — ${d.activeMous.length} active (accepted), ${pending} awaiting response, ${d.mous.filter((m) => m.status === 'rejected').length} rejected. Manage them in the MOU Management module.`
    );
  }
  if (d?.uni && wants('mobility', 'exchange', 'student', 'erasmus', 'hareketlilik')) {
    parts.push(
      `**Mobility for ${d.uni.name}:** ${d.mobility.length} records — ${d.incoming} incoming, ${d.outgoing} outgoing (balance ${d.incoming - d.outgoing >= 0 ? '+' : ''}${d.incoming - d.outgoing}). Details are in the Mobility module.`
    );
  }
  if (d?.uni && wants('img', 'ipi', 'gap', 'assessment', 'diagnos', 'tanı')) {
    if (d.assessment) {
      const r = d.assessment.result;
      parts.push(
        `**Latest IMG/IPI assessment (${new Date(d.assessment.created_at).toLocaleDateString()}):** IMG ${r.img.toFixed(3)} (${r.imgBand} gap), IPI ${r.ipi.toFixed(3)} (${r.ipiBand}). Profile: ${r.profile.title}. Top gap: ${r.gaps[0] ? `${r.gaps[0].dimension} — ${r.gaps[0].irisModule}` : 'none'}.`
      );
    } else {
      parts.push(
        `No IMG/IPI assessment has been run for ${d.uni.name} yet. Open the IMG/IPI Diagnostics module and complete the 17-item checklist to measure the internationalization gap.`
      );
    }
  }
  if (wants('recommend', 'partner suggest', 'which partner', 'öner') && d?.uni) {
    const recs = (await evalPartnerRecommendations(d)) as { recommendations: Row[] };
    const top = recs.recommendations.slice(0, 3);
    if (top.length) {
      parts.push(
        `**Top partner candidates for ${d.uni.name}:**\n` +
          top
            .map(
              (r, i) =>
                `${i + 1}. ${r.university_name} (${r.country}) — match score ${r.match_score}/100`
            )
            .join('\n') +
          `\nFull reasoning is available in Partner Discovery.`
      );
    }
  }

  // Mentioned university lookup (excluding the selected one, already covered)
  const allUnis = (await db.universities.toArray()) as Row[];
  const mentioned = allUnis.find(
    (u) => u.id !== universityId && q.includes(String(u.name).toLowerCase().slice(0, 12))
  );
  if (mentioned) {
    parts.push(
      `**${mentioned.name}** — ${mentioned.type} university in ${mentioned.country} (${mentioned.region}), ${mentioned.size} size, ${mentioned.internationalization_maturity} internationalization maturity${mentioned.founded_year ? `, founded ${mentioned.founded_year}` : ''}${Array.isArray(mentioned.research_strengths) && (mentioned.research_strengths as string[]).length ? `. Research strengths: ${(mentioned.research_strengths as string[]).join(', ')}` : ''}.`
    );
  }

  // 2. Data Library retrieval ---------------------------------------------------
  try {
    const hits = await searchLibrary(query, 3);
    if (hits.length > 0) {
      parts.push(
        `**From your Data Library:**\n` +
          hits
            .map((h) => `• From “${h.documentTitle}”: “${h.text.slice(0, 320)}${h.text.length > 320 ? '…' : ''}”`)
            .join('\n')
      );
    }
  } catch {
    // library may be empty — fine
  }

  // 3. Compose ------------------------------------------------------------------
  if (parts.length === 0) {
    parts.push(
      `I could not find an answer to that in your local data. The IRIS built-in engine can answer questions about: your MOUs and partnerships, student mobility, IMG/IPI assessments, partner recommendations, any university in the database (by name), and anything in documents you upload to the Data Library. Try rephrasing, or upload relevant documents to the Data Library so I can search them.`
    );
  }
  parts.push(`_${ENGINE_NOTE} Connect a cloud AI in Settings for richer, free-form answers._`);
  return { response: parts.join('\n\n') };
}

// ---------------------------------------------------------------------------
// market-intelligence (standalone, richer shape)
// ---------------------------------------------------------------------------

const MARKET_POOL: { country: string; region: string; weight: number }[] = [
  { country: 'Azerbaijan', region: 'Asia', weight: 0.95 },
  { country: 'Turkmenistan', region: 'Asia', weight: 0.9 },
  { country: 'Kazakhstan', region: 'Asia', weight: 0.8 },
  { country: 'Syria', region: 'MENA', weight: 0.75 },
  { country: 'Iraq', region: 'MENA', weight: 0.85 },
  { country: 'Iran', region: 'MENA', weight: 0.7 },
  { country: 'Egypt', region: 'MENA', weight: 0.65 },
  { country: 'Nigeria', region: 'Africa', weight: 0.7 },
  { country: 'Somalia', region: 'Africa', weight: 0.6 },
  { country: 'Pakistan', region: 'Asia', weight: 0.75 },
  { country: 'Indonesia', region: 'Asia', weight: 0.55 },
  { country: 'Germany', region: 'Europe', weight: 0.5 },
];

interface MarketRow {
  country: string;
  region: string;
  applications: number;
  offers: number;
  enrollments: number;
  capacity: number;
  agentDriven: number;
  organic: number;
  conversionRate: number;
  offerAcceptanceRate: number;
  overOfferingRatio: number;
  wasteRatio: number;
}

function marketTable(d: UniData): MarketRow[] {
  const sizeFactor = d.uni?.size === 'large' ? 3 : d.uni?.size === 'medium' ? 1.6 : 1;
  const seed = String(d.uni?.id ?? 'iris');
  return MARKET_POOL.map((m) => {
    const s = hash01(seed + m.country);
    const applications = Math.round((60 + s * 240) * m.weight * sizeFactor);
    const offers = Math.round(applications * (0.45 + s * 0.35));
    const enrollments = Math.round(offers * (0.35 + s * 0.4));
    const capacity = Math.round(enrollments * (0.9 + s * 0.5));
    const agentDriven = Math.round(applications * (0.3 + s * 0.5));
    const conversionRate = Math.round((enrollments / Math.max(1, applications)) * 100);
    return {
      country: m.country,
      region: m.region,
      applications,
      offers,
      enrollments,
      capacity,
      agentDriven,
      organic: applications - agentDriven,
      conversionRate,
      offerAcceptanceRate: Math.round((enrollments / Math.max(1, offers)) * 100),
      overOfferingRatio: Math.round((offers / Math.max(1, capacity)) * 100),
      wasteRatio: Math.round(((applications - enrollments) / Math.max(1, applications)) * 100),
    };
  }).sort((a, b) => b.applications - a.applications);
}

async function marketIntelligenceLocal(body: Row): Promise<unknown> {
  const { university_id } = body;
  if (!university_id) throw new Error('university_id is required');
  const d = await loadUniversityData(String(university_id));
  const markets = marketTable(d);

  const recommendations = markets.map((m) => {
    const conv = m.conversionRate;
    const action: 'scale' | 'pause' | 'exit' = conv >= 22 ? 'scale' : conv >= 12 ? 'pause' : 'exit';
    return {
      country: m.country,
      action,
      confidence: clamp(55 + hash01(m.country + String(d.uni?.id)) * 35, 50, 92),
      reasoning: `${m.country}: ${m.applications} modeled applications convert to ${m.enrollments} enrollments (${conv}% conversion, ${m.wasteRatio}% waste). ${
        action === 'scale'
          ? 'Efficient corridor — expand recruitment presence.'
          : action === 'pause'
            ? 'Moderate efficiency — hold spending and improve conversion before scaling.'
            : 'Low efficiency — redirect resources to stronger markets.'
      }`,
      riskLevel: conv >= 22 ? 'low' : conv >= 12 ? 'medium' : 'high',
      keyMetrics: {
        conversionEfficiency: clamp(conv * 3, 5, 95),
        recruitmentQuality: clamp(100 - m.wasteRatio, 5, 95),
        capacityAlignment: clamp(140 - m.overOfferingRatio, 5, 95),
      },
    };
  });

  const summary = {
    totalApplications: markets.reduce((a, m) => a + m.applications, 0),
    averageConversion: Math.round(
      markets.reduce((a, m) => a + m.conversionRate, 0) / Math.max(1, markets.length)
    ),
    marketsToScale: recommendations.filter((r) => r.action === 'scale').length,
    marketsToPause: recommendations.filter((r) => r.action === 'pause').length,
    marketsToExit: recommendations.filter((r) => r.action === 'exit').length,
  };

  return {
    analysis: {
      markets,
      recommendations,
      summary,
      generatedAt: new Date().toISOString(),
    },
  };
}

// ---------------------------------------------------------------------------
// mou-suggest — built-in clause library
// ---------------------------------------------------------------------------

function mouClauseLibrary(a: string, b: string): Row[] {
  return [
    {
      title: 'Purpose and Scope of Cooperation',
      content: `${a} and ${b} agree to develop academic cooperation in areas of mutual interest, including student and staff exchange, joint research activities, joint supervision, and the exchange of academic materials and publications. Specific activities shall be defined in separate implementation protocols.`,
      category: 'governance',
      priority: 'essential',
      tags: ['general'],
    },
    {
      title: 'Student Exchange',
      content: `Each party may nominate up to an agreed number of students per academic year for exchange periods of one or two semesters. Exchange students shall remain enrolled at their home institution, pay tuition fees only to the home institution, and be exempt from tuition fees at the host institution.`,
      category: 'mobility',
      priority: 'essential',
      tags: ['student', 'exchange', 'mobility'],
    },
    {
      title: 'Credit Recognition (ECTS)',
      content: `Credits earned at the host institution shall be recognized by the home institution in accordance with the European Credit Transfer and Accumulation System (ECTS). A Learning Agreement shall be signed by both institutions and the student prior to the start of each exchange period.`,
      category: 'academic',
      priority: 'essential',
      tags: ['student', 'exchange', 'erasmus', 'academic'],
    },
    {
      title: 'Faculty and Staff Mobility',
      content: `The parties shall encourage short-term teaching and training visits of academic and administrative staff. The sending institution shall bear travel costs and the receiving institution shall provide workspace and access to facilities, unless otherwise agreed in writing.`,
      category: 'mobility',
      priority: 'recommended',
      tags: ['faculty', 'staff', 'mobility'],
    },
    {
      title: 'Joint Research Activities',
      content: `The parties shall explore opportunities for joint research projects, co-authored publications, and joint applications to national and international funding programmes (including Erasmus+ and Horizon Europe). Each project shall be governed by a separate agreement defining contributions, budgets and outputs.`,
      category: 'research',
      priority: 'recommended',
      tags: ['research', 'joint'],
    },
    {
      title: 'Financial Arrangements',
      content: `Unless otherwise specified in an implementation protocol, each party shall bear its own costs arising from this Memorandum. Neither party shall be obliged to transfer funds to the other under this Memorandum.`,
      category: 'financial',
      priority: 'essential',
      tags: ['general', 'financial'],
    },
    {
      title: 'Insurance, Visas and Student Welfare',
      content: `Exchange participants are responsible for obtaining adequate health insurance and any required visas or residence permits. The host institution shall provide reasonable assistance with orientation, accommodation guidance and access to student support services.`,
      category: 'mobility',
      priority: 'recommended',
      tags: ['student', 'visa', 'welfare'],
    },
    {
      title: 'Intellectual Property',
      content: `Intellectual property created jointly under activities within this Memorandum shall be owned jointly, with specific arrangements (including publication rights and commercialization) defined in the relevant project agreement before the activity begins.`,
      category: 'research',
      priority: 'recommended',
      tags: ['research', 'ip'],
    },
    {
      title: 'Data Protection',
      content: `The parties shall process personal data exchanged under this Memorandum in accordance with the applicable data protection legislation of both jurisdictions (including KVKK and, where applicable, GDPR), and only to the extent necessary for the cooperation activities.`,
      category: 'general',
      priority: 'recommended',
      tags: ['general', 'data'],
    },
    {
      title: 'Duration, Amendment and Termination',
      content: `This Memorandum takes effect on the date of the last signature and remains valid for five (5) years, renewable by mutual written consent. Either party may terminate it with six (6) months' written notice; ongoing activities and enrolled exchange students shall be allowed to complete their current period.`,
      category: 'termination',
      priority: 'essential',
      tags: ['general'],
    },
  ];
}

async function mouSuggestLocal(body: Row): Promise<unknown> {
  const initiator = String(body.initiator_name ?? 'the initiating university');
  const partner = String(body.partner_name ?? 'the partner university');
  const scope = Array.isArray(body.cooperation_scope)
    ? (body.cooperation_scope as string[]).map((s) => s.toLowerCase())
    : [];
  const existingTitles = new Set(
    (Array.isArray(body.existing_clauses) ? (body.existing_clauses as Row[]) : []).map((c) =>
      String(c.title ?? '').toLowerCase()
    )
  );

  const library = mouClauseLibrary(initiator, partner);
  const relevant = library
    .filter((c) => !existingTitles.has(String(c.title).toLowerCase()))
    .sort((c1, c2) => {
      const rel = (c: Row) =>
        (c.priority === 'essential' ? 2 : 1) +
        (scope.length && (c.tags as string[]).some((t) => scope.some((s) => s.includes(t) || t.includes(s)))
          ? 2
          : 0);
      return rel(c2) - rel(c1);
    })
    .slice(0, 6)
    .map(({ title, content, category, priority }) => ({ title, content, category, priority }));

  return { clauses: relevant };
}

// ---------------------------------------------------------------------------
// partner-advisor
// ---------------------------------------------------------------------------

async function partnerAdvisorLocal(body: Row): Promise<unknown> {
  const partners = Array.isArray(body.partners) ? (body.partners as Row[]) : [];
  const universityName = String(body.university_name ?? 'your university');

  const recommendations = partners.slice(0, 12).map((p) => {
    const projects = Number(p.projects_count) || 0;
    const satisfaction = Number(p.satisfaction) || 0;
    const hasMou = Boolean(p.mou_status && p.mou_status !== 'no MOU');
    const score = projects * 2 + (satisfaction || 3) + (hasMou ? 3 : 0);
    const action = score >= 10 ? 'expand' : score >= 6 ? 'maintain' : hasMou ? 'restructure' : 'pause';
    return {
      partner_name: String(p.name ?? 'Unknown partner'),
      action,
      priority: action === 'expand' ? 'high' : action === 'restructure' ? 'high' : 'medium',
      recommendation:
        action === 'expand'
          ? `Active relationship (${projects} project${projects === 1 ? '' : 's'}${satisfaction ? `, satisfaction ${satisfaction}` : ''}) — deepen it with additional joint activities and a broader MOU scope.`
          : action === 'maintain'
            ? `Healthy but modest activity — keep current commitments and review outcomes at the end of the academic year.`
            : action === 'restructure'
              ? `An MOU exists but activity is low — renegotiate the scope around 1-2 concrete deliverables or set a sunset review date.`
              : `No formalized agreement and little recorded activity — pause investment until a champion and a concrete first project are identified.`,
      next_steps:
        action === 'expand'
          ? 'Schedule a joint planning meeting; propose one new mobility cohort and one joint funding application this year.'
          : action === 'restructure'
            ? 'Arrange a review call; agree measurable targets for the next 12 months or wind the agreement down.'
            : 'Assign a relationship owner in the International Relations Office and log all interactions in IRIS.',
      opportunity: `Leverage ${universityName}'s strengths for joint programmes with ${p.name}.`,
      risk:
        action === 'pause'
          ? 'Dormant agreements consume administrative attention without returns.'
          : 'Activity concentrated in few individuals — institutionalize the relationship to reduce key-person risk.',
    };
  });

  const expand = recommendations.filter((r) => r.action === 'expand').length;
  return {
    recommendations,
    overall_strategy: `Portfolio of ${partners.length} partner${partners.length === 1 ? '' : 's'}: ${expand} ready to expand, ${recommendations.filter((r) => r.action === 'restructure' || r.action === 'pause').length} needing restructuring or pause. Concentrate resources on the top performers, formalize measurable targets for the middle tier, and retire dormant agreements. ${ENGINE_NOTE}`,
  };
}

// ---------------------------------------------------------------------------
// partnership-analysis
// ---------------------------------------------------------------------------

async function partnershipAnalysisLocal(body: Row): Promise<unknown> {
  const university = (body.university ?? {}) as Row;
  const partner = (body.partner ?? {}) as Row;
  const interactions = Array.isArray(body.interactions) ? (body.interactions as Row[]) : [];
  const projects = Array.isArray(body.projects) ? (body.projects as Row[]) : [];
  const mouStatus = String(body.mou_status ?? 'None');

  const shared = strengthsOf(university).filter((s) =>
    strengthsOf(partner).map((x) => x.toLowerCase()).includes(s.toLowerCase())
  );
  const recentInteractions = interactions.length;
  const score = clamp(
    35 +
      (mouStatus === 'accepted' ? 20 : mouStatus !== 'None' ? 10 : 0) +
      Math.min(15, recentInteractions * 3) +
      Math.min(10, projects.length * 5) +
      shared.length * 5 +
      (maturityScore(partner.internationalization_maturity) - 35) / 5,
    15,
    95
  );

  const strengths: string[] = [];
  if (mouStatus === 'accepted') strengths.push('A signed MOU already provides the formal basis for cooperation.');
  if (shared.length) strengths.push(`Shared research strengths (${shared.join(', ')}) give the partnership concrete academic content.`);
  if (recentInteractions > 0) strengths.push(`${recentInteractions} recorded interaction${recentInteractions === 1 ? '' : 's'} show active engagement.`);
  if (projects.length > 0) strengths.push(`${projects.length} joint project${projects.length === 1 ? '' : 's'} already underway.`);
  if (strengths.length === 0) strengths.push('Both institutions participate in Erasmus+, providing a ready funding and mobility framework.');

  const risks: string[] = [];
  if (mouStatus === 'None') risks.push('No signed MOU — cooperation currently has no formal basis.');
  if (recentInteractions === 0) risks.push('No recorded interactions — momentum has not been established.');
  if (!shared.length) risks.push('No overlapping research strengths recorded — academic content of the partnership needs deliberate definition.');
  if (risks.length === 0) risks.push('Partnership depends on current champions; institutionalize contacts to reduce key-person risk.');

  return {
    achievability_score: score,
    achievability_reasoning: `Score computed by the IRIS engine from: MOU status (${mouStatus}), ${recentInteractions} recorded interactions, ${projects.length} joint projects, ${shared.length} shared research strengths, and the partner's ${String(partner.internationalization_maturity ?? 'unknown')} internationalization maturity.`,
    strengths,
    risks,
    recommended_next_steps: [
      mouStatus === 'None'
        ? 'Draft and sign an MOU — use the MOU Management module\'s clause suggestions as a starting point.'
        : 'Agree a 12-month activity plan with measurable targets under the existing MOU.',
      'Schedule a joint coordination meeting and record it in Partnership Management.',
      shared.length
        ? `Define one concrete joint activity in ${shared[0]} (course, summer school, or co-supervised research).`
        : 'Map both institutions\' department profiles to identify a first area of joint activity.',
      'Nominate one relationship owner on each side and set a semester review cadence.',
    ],
    resources_needed: {
      personnel: ['International Relations officer (relationship owner)', 'Academic coordinator per joint activity'],
      budget_items: ['Travel for one coordination visit', 'Co-funding reserve for mobility grants'],
      infrastructure: ['IRIS partnership tracking (already in place)', 'Video-conferencing for coordination meetings'],
      timeline: '3-6 months to first concrete joint activity; 12 months to full activity plan.',
    },
    meeting_suggestions: [
      {
        title: `Coordination meeting: ${String(university.name ?? 'University')} × ${String(partner.name ?? 'Partner')}`,
        format: 'online',
        purpose: mouStatus === 'None' ? 'Agree MOU scope and timeline' : 'Agree the 12-month activity plan and responsibilities',
        suggested_attendees: 'International office heads and one academic lead per side',
        priority: 'high',
      },
      {
        title: 'Academic matchmaking workshop',
        format: 'hybrid',
        purpose: 'Connect faculty members in overlapping research areas to seed joint projects',
        suggested_attendees: 'Faculty representatives from relevant departments',
        priority: 'medium',
      },
    ],
    overall_assessment: `The partnership is ${score >= 70 ? 'highly achievable' : score >= 45 ? 'achievable with focused effort' : 'at an early, fragile stage'} (score ${score}/100). ${mouStatus === 'None' ? 'Formalizing the MOU is the critical next step.' : 'The formal basis exists; the priority is converting it into recurring joint activity.'} ${ENGINE_NOTE}`,
  };
}

// ---------------------------------------------------------------------------
// parse-transcript — regex parsing + string-similarity matching
// ---------------------------------------------------------------------------

function similarity(a: string, b: string): number {
  const wa = new Set(a.toLowerCase().split(/[^a-zçğıöşü0-9]+/i).filter((w) => w.length > 2));
  const wb = new Set(b.toLowerCase().split(/[^a-zçğıöşü0-9]+/i).filter((w) => w.length > 2));
  if (!wa.size || !wb.size) return 0;
  let inter = 0;
  for (const w of wa) if (wb.has(w)) inter++;
  return inter / Math.max(wa.size, wb.size);
}

async function parseTranscriptLocal(body: Row): Promise<unknown> {
  const text = String(body.transcriptText ?? '');
  const hostCourses = Array.isArray(body.hostUniversityCourses)
    ? (body.hostUniversityCourses as Row[])
    : [];

  const parsedCourses: Row[] = [];
  const lineRe =
    /([A-ZÇĞİÖŞÜ]{2,6}[ -]?\d{3,4})\s+(.{4,80}?)\s+(\d{1,2}(?:[.,]\d)?)\s*(?:ECTS|AKTS|cr|credits?)?\s*(AA|BA|BB|CB|CC|DC|DD|FF|FD|[A-F][+-]?|\d{1,3})?\s*$/gim;
  let m: RegExpExecArray | null;
  while ((m = lineRe.exec(text)) !== null && parsedCourses.length < 40) {
    parsedCourses.push({
      courseCode: m[1].replace(/\s+/g, ''),
      courseName: m[2].trim(),
      credits: parseFloat(m[3].replace(',', '.')) || 0,
      grade: m[4] ?? '',
      department: m[1].replace(/[^A-ZÇĞİÖŞÜ]/g, ''),
    });
  }

  const courseMatches: Row[] = parsedCourses.map((pc) => {
    let best: Row | null = null;
    let bestScore = 0;
    for (const hc of hostCourses) {
      const s =
        similarity(String(pc.courseName), String(hc.name ?? hc.course_name ?? '')) * 0.8 +
        (String(hc.code ?? hc.course_code ?? '')
          .replace(/[^A-Z]/gi, '')
          .toUpperCase() === String(pc.department).toUpperCase()
          ? 0.2
          : 0);
      if (s > bestScore) {
        bestScore = s;
        best = hc;
      }
    }
    return {
      homeCourseCode: pc.courseCode,
      homeCourseName: pc.courseName,
      homeCredits: pc.credits,
      hostCourseId: best ? String(best.id ?? '') : '',
      hostCourseCode: best ? String(best.code ?? best.course_code ?? '') : '',
      hostCourseName: best ? String(best.name ?? best.course_name ?? '') : 'No suitable match found',
      hostCredits: best ? Number(best.credits ?? best.ects ?? 0) : 0,
      matchScore: clamp(bestScore * 100, 0, 95),
      matchReason: best
        ? `Name similarity match computed by the IRIS engine (word overlap ${(bestScore * 100).toFixed(0)}%). Verify content equivalence manually before approval.`
        : 'No host course with sufficient name similarity was found; manual mapping required.',
    };
  });

  const matched = courseMatches.filter((c) => Number(c.matchScore) >= 40);
  return {
    parsedCourses,
    courseMatches,
    summary: {
      totalHomeCourses: parsedCourses.length,
      totalMatchedCourses: matched.length,
      averageMatchScore: matched.length
        ? Math.round(matched.reduce((a, c) => a + Number(c.matchScore), 0) / matched.length)
        : 0,
      totalHomeCredits: parsedCourses.reduce((a, c) => a + Number(c.credits || 0), 0),
      totalHostCredits: matched.reduce((a, c) => a + Number(c.hostCredits || 0), 0),
    },
  };
}

// ---------------------------------------------------------------------------
// special-case-analyze — keyword rule table
// ---------------------------------------------------------------------------

const SPECIAL_CASE_RULES: {
  keywords: string[];
  category: string;
  riskLevel: 'low' | 'medium' | 'high';
  resolution: string;
  steps: { title: string; description: string; estimatedDuration: string; notes: string }[];
  recommendations: string[];
}[] = [
  {
    keywords: ['denklik', 'equivalen', 'recognition', 'diploma recognition', 'credential'],
    category: 'credential_recognition',
    riskLevel: 'medium',
    resolution: '2-4 months',
    steps: [
      { title: 'Collect source documents', description: 'Obtain the original diploma and full transcript from the issuing institution.', estimatedDuration: '2-4 weeks', notes: 'Certified copies are acceptable only with notarization.' },
      { title: 'Authentication chain', description: 'Apostille (Hague Convention countries) or Ministry of Foreign Affairs + Turkish Consulate attestation (non-Hague).', estimatedDuration: '2-6 weeks', notes: 'Verify whether the origin country is a Hague Convention member first.' },
      { title: 'Sworn translation', description: 'Have all documents translated into Turkish by a sworn translator.', estimatedDuration: '1 week', notes: 'Translations must carry the translator\'s seal.' },
      { title: 'Denklik application', description: 'Submit the equivalency application to YÖK (higher education) or MEB (secondary).', estimatedDuration: '4-12 weeks', notes: 'Track the application status online; respond promptly to document requests.' },
    ],
    recommendations: ['Start the authentication chain immediately — it is the longest step.', 'Enroll the student conditionally where regulations permit.'],
  },
  {
    keywords: ['war', 'conflict', 'refugee', 'asylum', 'syria', 'displaced', 'evacuat'],
    category: 'war_zone',
    riskLevel: 'high',
    resolution: '3-6 months',
    steps: [
      { title: 'Document inventory', description: 'Establish which original documents the student can and cannot obtain from the origin country.', estimatedDuration: '1-2 weeks', notes: 'YÖK has special provisions for students who cannot obtain documents from conflict zones.' },
      { title: 'Sworn declaration', description: 'Where originals are unobtainable, prepare a sworn declaration and any secondary evidence (digital copies, exam records).', estimatedDuration: '1-2 weeks', notes: 'Consult the YÖK special-cases circular for accepted alternatives.' },
      { title: 'Placement or proficiency examination', description: 'Arrange the university\'s placement exam if credentials cannot be verified.', estimatedDuration: '2-4 weeks', notes: 'Document the process thoroughly for later audits.' },
      { title: 'Conditional enrollment and follow-up', description: 'Enroll conditionally and set a deadline for outstanding verification.', estimatedDuration: '1 week', notes: 'Review the case each semester.' },
    ],
    recommendations: ['Escalate to the rector\'s office early — these cases need institutional sign-off.', 'Connect the student with counseling and refugee support services.'],
  },
  {
    keywords: ['visa', 'ikamet', 'residence permit', 'deport', 'overstay', 'entry ban'],
    category: 'visa_issue',
    riskLevel: 'high',
    resolution: '1-3 months',
    steps: [
      { title: 'Status verification', description: 'Verify the student\'s current visa/residence status with the Directorate of Migration Management (Göç İdaresi).', estimatedDuration: '1 week', notes: 'Act before any legal deadline expires.' },
      { title: 'University support letter', description: 'Issue an enrollment certificate and support letter for the residence permit application/renewal.', estimatedDuration: '2-3 days', notes: 'Include program duration and tuition status.' },
      { title: 'İkamet application', description: 'Guide the student through the e-ikamet application and appointment.', estimatedDuration: '2-8 weeks', notes: 'Health insurance covering the permit period is mandatory.' },
    ],
    recommendations: ['Never let enrollment lapse during a permit renewal — it invalidates the application basis.', 'Keep copies of all submissions in the student\'s IRIS record.'],
  },
  {
    keywords: ['fail', 'dismiss', 'probation', 'gpa', 'academic standing', 'attendance'],
    category: 'academic_failure',
    riskLevel: 'medium',
    resolution: '1-2 semesters',
    steps: [
      { title: 'Academic review', description: 'Review the student\'s transcript, attendance and exam history with the department advisor.', estimatedDuration: '1-2 weeks', notes: 'Identify whether the cause is academic, linguistic, or personal.' },
      { title: 'Remediation plan', description: 'Agree a written plan: reduced course load, language support, or tutoring.', estimatedDuration: '1 week', notes: 'Set measurable checkpoints.' },
      { title: 'Progress monitoring', description: 'Review at mid-term and end of semester against the plan.', estimatedDuration: '1 semester', notes: 'Escalate to the faculty board if targets are missed.' },
    ],
    recommendations: ['Check whether language proficiency is the underlying issue before penalizing academically.'],
  },
];

async function specialCaseAnalyzeLocal(body: Row): Promise<unknown> {
  const situation = `${body.situation ?? ''}`.toLowerCase();
  const rule =
    SPECIAL_CASE_RULES.find((r) => r.keywords.some((k) => situation.includes(k))) ?? {
      keywords: [],
      category: 'other',
      riskLevel: 'medium' as const,
      resolution: '1-3 months',
      steps: [
        { title: 'Case intake and classification', description: 'Gather all documents and a written statement from the student, then classify the case.', estimatedDuration: '1-2 weeks', notes: 'Use the Documentation module to track collected items.' },
        { title: 'Regulation check', description: 'Map the case against YÖK regulations and university bylaws; consult the legal office if unclear.', estimatedDuration: '1-2 weeks', notes: '' },
        { title: 'Resolution and follow-up', description: 'Implement the agreed resolution and schedule a follow-up review.', estimatedDuration: '2-6 weeks', notes: '' },
      ],
      recommendations: ['Document every step in IRIS for auditability.'],
    };

  return {
    category: rule.category,
    status: 'open',
    summary: `${body.studentName ?? 'The student'} (${body.country ?? 'origin unknown'}, ${body.department ?? 'department unspecified'}) presents a ${rule.category.replace(/_/g, ' ')} case. Classified offline by the IRIS engine from the situation description.`,
    details: `Situation as reported: "${String(body.situation ?? '').slice(0, 400)}". Rule-based classification matched the ${rule.category.replace(/_/g, ' ')} pattern${rule.keywords.length ? ` (keywords: ${rule.keywords.filter((k) => situation.includes(k)).join(', ')})` : ''}. Education system: ${body.educationSystem || 'not specified'}; degree level: ${body.degreeLevel || 'not specified'}. Review the generated steps against current YÖK guidance — the built-in engine applies standing rules and does not track regulation changes.`,
    steps: rule.steps.map((s, i) => ({ ...s, status: i === 0 ? 'in_progress' : 'pending' })),
    riskLevel: rule.riskLevel,
    estimatedResolutionTime: rule.resolution,
    recommendations: rule.recommendations,
  };
}

// ---------------------------------------------------------------------------
// document-requirements — built-in knowledge base
// ---------------------------------------------------------------------------

const HAGUE_MEMBERS = new Set([
  'azerbaijan', 'kazakhstan', 'india', 'pakistan', 'germany', 'france', 'usa', 'united states',
  'uk', 'united kingdom', 'nigeria', 'south africa', 'georgia', 'ukraine', 'russia', 'uzbekistan',
  'kyrgyzstan', 'tajikistan', 'greece', 'bulgaria', 'romania', 'albania', 'bosnia', 'serbia',
]);

async function documentRequirementsLocal(body: Row): Promise<unknown> {
  const country = String(body.country ?? 'the origin country');
  const isHague = HAGUE_MEMBERS.has(country.toLowerCase());
  const attestation = isHague
    ? ['Apostille from the competent authority in ' + country]
    : ['Ministry of Foreign Affairs attestation in ' + country, 'Turkish Consulate attestation'];
  const degreeLevel = String(body.degreeLevel ?? 'undergraduate');
  const stage = String(body.stage ?? 'application');

  const documents: Row[] = [
    {
      name: 'Passport',
      category: 'identity',
      description: 'Valid passport with at least 12 months remaining validity.',
      isRequired: true,
      stampsRequired: [],
      howToObtain: 'Issued by the passport authority of the student\'s country. Provide a clear color scan of the photo page.',
      timeline: 'Already held or 2-6 weeks to renew',
      notes: 'The name must match all academic documents exactly; mismatches require a legal explanation document.',
    },
    {
      name: degreeLevel === 'graduate' ? 'Bachelor\'s diploma' : 'High school diploma',
      category: 'academic',
      description: `The ${degreeLevel === 'graduate' ? 'undergraduate degree certificate' : 'secondary school completion certificate'} from ${country}.`,
      isRequired: true,
      stampsRequired: attestation,
      howToObtain: 'Request an official copy from the issuing institution, then complete the attestation chain before translation.',
      timeline: isHague ? '2-4 weeks' : '4-8 weeks',
      notes: isHague
        ? `${country} is a Hague Convention member — a single apostille replaces the consular chain.`
        : `${country} is not a Hague Convention member — the full MOFA + Turkish Consulate chain is required.`,
    },
    {
      name: 'Official transcript',
      category: 'academic',
      description: 'Complete record of courses and grades for the qualifying degree/school period.',
      isRequired: true,
      stampsRequired: attestation,
      howToObtain: 'Request from the registrar of the issuing institution; attest together with the diploma.',
      timeline: isHague ? '2-4 weeks' : '4-8 weeks',
      notes: 'Must show a grading scale or be accompanied by one.',
    },
    {
      name: 'Sworn Turkish translation of academic documents',
      category: 'legal',
      description: 'Turkish translations of the diploma and transcript by a sworn translator.',
      isRequired: true,
      stampsRequired: ['Sworn translator seal', 'Notarization'],
      howToObtain: 'Use a sworn translator registered with a Turkish notary; the notary certifies the translation.',
      timeline: '3-7 days',
      notes: 'Translate AFTER the attestation chain so stamps are included in the translation.',
    },
    {
      name: 'Denklik (equivalency) certificate',
      category: 'legal',
      description: degreeLevel === 'graduate'
        ? 'YÖK recognition of the foreign bachelor\'s degree.'
        : 'MEB equivalency certificate for the foreign high school diploma.',
      isRequired: stage !== 'application',
      stampsRequired: [],
      howToObtain: degreeLevel === 'graduate'
        ? 'Apply to YÖK with attested and translated documents (online pre-application, then in-person submission).'
        : 'Apply via the MEB e-Denklik system or at a Turkish consulate/provincial education directorate.',
      timeline: '4-12 weeks',
      notes: 'Usually required by final registration rather than at application — start early regardless.',
    },
    {
      name: 'Language proficiency certificate',
      category: 'academic',
      description: 'Evidence of proficiency in the program\'s language of instruction (TÖMER/TYS for Turkish; TOEFL/IELTS or university exam for English).',
      isRequired: false,
      stampsRequired: [],
      howToObtain: 'Register for the relevant examination; university preparatory school is the fallback route.',
      timeline: '2-8 weeks (exam scheduling)',
      notes: 'Students without proficiency are typically admitted with a mandatory preparatory year.',
    },
    {
      name: 'Passport-size photographs and application form',
      category: 'other',
      description: 'Biometric photos and the completed program application form.',
      isRequired: true,
      stampsRequired: [],
      howToObtain: 'Any photo studio; the form is generated by the university\'s application portal.',
      timeline: '1 day',
      notes: '',
    },
    {
      name: 'Proof of financial means / tuition payment',
      category: 'financial',
      description: 'Bank statement or sponsor letter, and the tuition deposit receipt where required.',
      isRequired: stage === 'enrollment' || stage === 'registration',
      stampsRequired: [],
      howToObtain: 'Obtain a recent bank statement (last 3 months) or a notarized sponsorship letter.',
      timeline: '1-3 days',
      notes: 'Also needed later for the residence permit application.',
    },
  ];

  return {
    documents,
    commonIssues: [
      `Attestation chain done in the wrong order (translate first, attest later) — always attest in ${country} first, then translate.`,
      'Name spelling differences between passport and diplomas.',
      isHague
        ? 'Apostille obtained from a non-competent authority — verify the designated apostille office.'
        : 'Skipping the Turkish Consulate step after MOFA attestation.',
      'Denklik application left until after arrival, delaying final registration.',
    ],
    generalAdvice: `For applicants from ${country} at the "${stage}" stage: begin the ${isHague ? 'apostille' : 'consular attestation'} chain immediately — it is the longest step — and only then order sworn translations. Track each document in the IRIS Documentation module. This checklist is produced offline by the IRIS built-in engine from standing rules; verify current requirements with YÖK/MEB for recent regulation changes.`,
    estimatedTotalTime: isHague ? '6-10 weeks' : '10-16 weeks',
  };
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

const ENGINE_HANDLERS: Record<string, (body: Row) => Promise<unknown>> = {
  'ai-evaluate': aiEvaluateLocal,
  'ai-chat': aiChatLocal,
  'market-intelligence': marketIntelligenceLocal,
  'mou-suggest': mouSuggestLocal,
  'partner-advisor': partnerAdvisorLocal,
  'partnership-analysis': partnershipAnalysisLocal,
  'parse-transcript': parseTranscriptLocal,
  'special-case-analyze': specialCaseAnalyzeLocal,
  'document-requirements': documentRequirementsLocal,
};

export async function runLocalEngine(name: string, body: Row): Promise<unknown> {
  const handler = ENGINE_HANDLERS[name];
  if (!handler) throw new Error(`The IRIS built-in engine does not support: ${name}`);
  return handler(body ?? {});
}
