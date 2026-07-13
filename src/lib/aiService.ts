/**
 * Local AI service — client-side replacement for the Supabase edge functions.
 *
 * Re-implements ai-evaluate, ai-chat, market-intelligence, mou-suggest,
 * partner-advisor, partnership-analysis, parse-transcript,
 * special-case-analyze and document-requirements by calling the user's own
 * AI provider (Gemini or OpenAI) directly from the browser. Context data
 * that the edge functions fetched from Postgres is read from the local
 * Dexie database instead. Response shapes match the edge functions exactly.
 */
import { db, ensureSeeded } from '@/lib/localdb';

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

export type AIProvider = 'none' | 'gemini' | 'openai';

export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model: string;
}

const CONFIG_KEY = 'iris-ai-config';

const DEFAULT_MODELS: Record<Exclude<AIProvider, 'none'>, string> = {
  gemini: 'gemini-2.5-flash',
  openai: 'gpt-4o-mini',
};

export function getAIConfig(): AIConfig {
  try {
    const raw = localStorage.getItem(CONFIG_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        const provider: AIProvider =
          parsed.provider === 'gemini' || parsed.provider === 'openai' ? parsed.provider : 'none';
        return {
          provider,
          apiKey: typeof parsed.apiKey === 'string' ? parsed.apiKey : '',
          // Google removed free-tier quota for gemini-2.0-flash; migrate old default.
          model:
            typeof parsed.model === 'string'
              ? parsed.model === 'gemini-2.0-flash'
                ? 'gemini-2.5-flash'
                : parsed.model
              : '',
        };
      }
    }
  } catch {
    // fall through to default
  }
  return { provider: 'none', apiKey: '', model: '' };
}

export function saveAIConfig(cfg: AIConfig): void {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(cfg));
}

const NOT_CONFIGURED_MESSAGE =
  'AI is not configured or you are offline. The app works fully without AI — connect ChatGPT or Gemini in Settings to enable AI features.';

// ---------------------------------------------------------------------------
// Provider calls
// ---------------------------------------------------------------------------

interface CallOptions {
  json?: boolean;
  temperature?: number;
  maxTokens?: number;
}

function resolveModel(cfg: AIConfig): string {
  if (cfg.model && cfg.model.trim()) return cfg.model.trim();
  if (cfg.provider === 'gemini' || cfg.provider === 'openai') return DEFAULT_MODELS[cfg.provider];
  return '';
}

async function callGemini(
  cfg: AIConfig,
  systemPrompt: string,
  userPrompt: string,
  opts: CallOptions
): Promise<string> {
  const model = resolveModel(cfg);
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(
    model
  )}:generateContent?key=${encodeURIComponent(cfg.apiKey)}`;

  const generationConfig: Record<string, unknown> = {
    temperature: opts.temperature ?? 0.7,
    maxOutputTokens: opts.maxTokens ?? 8192,
  };
  if (opts.json) generationConfig.responseMimeType = 'application/json';

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig,
    }),
  });

  if (!res.ok) {
    let detail = '';
    try {
      const err = await res.json();
      detail = err?.error?.message || '';
    } catch {
      /* ignore */
    }
    throw new Error(`Gemini API error (${res.status})${detail ? `: ${detail}` : ''}`);
  }

  const data = await res.json();
  const parts = data?.candidates?.[0]?.content?.parts;
  const text = Array.isArray(parts)
    ? parts.map((p: { text?: string }) => p?.text || '').join('')
    : '';
  if (!text) throw new Error('Gemini returned an empty response.');
  return text;
}

async function callOpenAI(
  cfg: AIConfig,
  systemPrompt: string,
  userPrompt: string,
  opts: CallOptions
): Promise<string> {
  const body: Record<string, unknown> = {
    model: resolveModel(cfg),
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ],
    temperature: opts.temperature ?? 0.7,
    max_tokens: opts.maxTokens ?? 8192,
  };
  if (opts.json) body.response_format = { type: 'json_object' };

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let detail = '';
    try {
      const err = await res.json();
      detail = err?.error?.message || '';
    } catch {
      /* ignore */
    }
    throw new Error(`OpenAI API error (${res.status})${detail ? `: ${detail}` : ''}`);
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content || '';
  if (!text) throw new Error('OpenAI returned an empty response.');
  return text;
}

async function callAI(
  cfg: AIConfig,
  systemPrompt: string,
  userPrompt: string,
  opts: CallOptions = {}
): Promise<string> {
  if (cfg.provider === 'gemini') return callGemini(cfg, systemPrompt, userPrompt, opts);
  if (cfg.provider === 'openai') return callOpenAI(cfg, systemPrompt, userPrompt, opts);
  throw new Error(NOT_CONFIGURED_MESSAGE);
}

export async function testAIConnection(cfg: AIConfig): Promise<{ ok: boolean; message: string }> {
  if (cfg.provider === 'none') return { ok: false, message: 'No AI provider selected.' };
  if (!cfg.apiKey) return { ok: false, message: 'API key is missing.' };
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { ok: false, message: 'You are offline. Connect to the internet to use AI features.' };
  }
  try {
    await callAI(cfg, 'You are a connectivity test. Reply with the single word OK.', 'Say OK.', {
      temperature: 0,
      maxTokens: 16,
    });
    return { ok: true, message: `Connected to ${cfg.provider} (${resolveModel(cfg)}).` };
  } catch (err) {
    let message = err instanceof Error ? err.message : 'Connection failed.';
    if (/429|quota|rate.?limit/i.test(message)) {
      message =
        `The provider rejected the request for quota reasons (429). ` +
        (cfg.provider === 'gemini'
          ? `Your Google account has no free-tier quota for the model "${resolveModel(cfg)}". ` +
            `Try the model "gemini-2.5-flash" or "gemini-2.5-flash-lite" (both have a free tier), ` +
            `or wait a minute and test again. `
          : `Check your plan and billing on the provider's dashboard. `) +
        `Meanwhile IRIS keeps working with its built-in offline engine.`;
    }
    return { ok: false, message };
  }
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type Row = Record<string, unknown>;

/** Robustly parse model output that should be JSON (strips code fences etc.). */
function parseJsonResponse(raw: string): unknown {
  let text = raw.trim();
  text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
  try {
    return JSON.parse(text);
  } catch {
    // Try to extract the outermost JSON object or array.
    const objStart = text.indexOf('{');
    const arrStart = text.indexOf('[');
    let start = -1;
    let endChar = '';
    if (objStart !== -1 && (arrStart === -1 || objStart < arrStart)) {
      start = objStart;
      endChar = '}';
    } else if (arrStart !== -1) {
      start = arrStart;
      endChar = ']';
    }
    if (start !== -1) {
      const end = text.lastIndexOf(endChar);
      if (end > start) {
        try {
          return JSON.parse(text.slice(start, end + 1));
        } catch {
          /* fall through */
        }
      }
    }
    throw new Error('Failed to parse the AI response as JSON. Please try again.');
  }
}

const LANGUAGE_INSTRUCTIONS: Record<string, string> = {
  en: 'Respond entirely in English. All text fields in the JSON must be in English.',
  tr: 'Tüm yanıtlarını Türkçe olarak ver. JSON içindeki tüm metin alanları Türkçe olmalı.',
  de: 'Antworte vollständig auf Deutsch. Alle Textfelder im JSON müssen auf Deutsch sein.',
  ar: 'أجب بالكامل باللغة العربية. جميع حقول النص في JSON يجب أن تكون بالعربية.',
};

function langInstruction(language: unknown): string {
  return LANGUAGE_INSTRUCTIONS[String(language || 'en')] || LANGUAGE_INSTRUCTIONS.en;
}

function num(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

/** Build the shared university context block used by ai-evaluate / ai-chat. */
async function buildUniversityContext(universityId: string): Promise<string> {
  await ensureSeeded();
  const university = (await db.universities.get(universityId)) as Row | undefined;
  if (!university) throw new Error('University not found');

  const faculties = (await db.faculties
    .where('university_id')
    .equals(universityId)
    .toArray()) as Row[];
  const facultyIds = faculties.map((f) => String(f.id));
  const departments = facultyIds.length
    ? ((await db.departments.where('faculty_id').anyOf(facultyIds).toArray()) as Row[])
    : [];
  const mobilityData = (await db.mobility_records
    .filter(
      (m) => m.university_id === universityId || m.partner_university_id === universityId
    )
    .toArray()) as Row[];
  const mous = (await db.mous
    .filter(
      (m) =>
        m.initiator_university_id === universityId || m.partner_university_id === universityId
    )
    .toArray()) as Row[];
  const allUniversities = (await db.universities
    .filter((u) => u.id !== universityId)
    .toArray()) as Row[];

  const facultyLines =
    faculties
      .map((f) => {
        const deptNames = departments
          .filter((d) => d.faculty_id === f.id)
          .map((d) => String(d.name));
        return `- ${f.name}: ${deptNames.join(', ') || 'No departments listed'}`;
      })
      .join('\n') || 'No faculty data';

  const incoming = mobilityData
    .filter((m) => m.direction === 'incoming')
    .reduce((sum, m) => sum + num(m.student_count), 0);
  const outgoing = mobilityData
    .filter((m) => m.direction === 'outgoing')
    .reduce((sum, m) => sum + num(m.student_count), 0);

  return `
UNIVERSITY PROFILE:
Name: ${university.name}
Country: ${university.country}
Region: ${university.region}
Type: ${university.type}
Size: ${university.size}
Internationalization Maturity: ${university.internationalization_maturity}

FACULTIES AND DEPARTMENTS:
${facultyLines}

MOBILITY STATISTICS:
Total Records: ${mobilityData.length}
Erasmus Programs: ${mobilityData.filter((m) => m.program_type === 'erasmus').length}
Incoming Students: ${incoming}
Outgoing Students: ${outgoing}

PARTNERSHIPS:
Total MOUs: ${mous.length}
Active: ${mous.filter((m) => m.status === 'accepted').length}
Pending: ${mous.filter((m) => ['pending', 'revised', 'counter_proposed'].includes(String(m.status))).length}

AVAILABLE PARTNER UNIVERSITIES:
${
    allUniversities
      .slice(0, 20)
      .map((u) => `- ${u.name} (${u.country}, ${u.type}, ${u.internationalization_maturity} maturity)`)
      .join('\n') || 'None'
  }
`;
}

// ---------------------------------------------------------------------------
// Function implementations (one per former edge function)
// ---------------------------------------------------------------------------

async function aiEvaluate(cfg: AIConfig, body: Row): Promise<unknown> {
  const { university_id, evaluation_type, language } = body;
  if (!university_id) throw new Error('university_id is required');

  const universityContext = await buildUniversityContext(String(university_id));
  const lang = langInstruction(language);

  let systemPrompt = '';
  let userPrompt = '';

  switch (evaluation_type) {
    case 'health_index':
      systemPrompt = `You are an AI governance analyst for IARSMS. Generate an Institutional Health Index for a university.

${lang}

Return ONLY valid JSON with this exact structure (no markdown, no code blocks):
{
  "overall_score": <number 0-100>,
  "recruitment_efficiency": <number 0-100>,
  "offer_to_enrollment_quality": <number 0-100>,
  "retention_stability": <number 0-100>,
  "internationalization_impact": <number 0-100>,
  "mobility_participation": <number 0-100>,
  "partner_performance": <number 0-100>,
  "summary": "<2-3 sentence executive summary>"
}

Base scores on: institution type, size, internationalization maturity, mobility data, and partnerships. Private institutions with high maturity should score higher. Generate realistic, varied scores.`;
      userPrompt = `Generate an Institutional Health Index for:\n${universityContext}`;
      break;

    case 'strengths_weaknesses':
      systemPrompt = `You are an AI governance analyst for IARSMS. Analyze university strengths and weaknesses by department.

${lang}

Return ONLY valid JSON with this exact structure (no markdown, no code blocks):
{
  "strengths": [
    {
      "department_name": "<name>",
      "faculty_name": "<name>",
      "score": <number 60-100>,
      "analysis": "<1-2 sentences>",
      "action_required": "scale" or "none"
    }
  ],
  "weaknesses": [
    {
      "department_name": "<name>",
      "faculty_name": "<name>",
      "score": <number 20-59>,
      "analysis": "<1-2 sentences>",
      "action_required": "structural_reform" or "strategic_partnership" or "capacity_adjustment"
    }
  ],
  "recommendations": ["<actionable recommendation 1>", "<actionable recommendation 2>", "<actionable recommendation 3>"]
}

Include 2-4 strengths and 2-4 weaknesses based on the university profile. Use actual department/faculty names from the data.`;
      userPrompt = `Analyze strengths and weaknesses for:\n${universityContext}`;
      break;

    case 'department_roi':
      systemPrompt = `You are an AI governance analyst for IARSMS. Evaluate department-level ROI for international recruitment.

${lang}

Return ONLY valid JSON with this exact structure (no markdown, no code blocks):
{
  "departments": [
    {
      "department_name": "<name>",
      "faculty_name": "<name>",
      "international_recruitment_roi": <number 0-100>,
      "cost_outcome_ratio": <number 0-100>,
      "market_program_fit": <number 0-100>,
      "brand_contribution": <number 0-100>,
      "category": "scale" or "correct" or "pause" or "exit",
      "analysis": "<1-2 sentences explaining the categorization>"
    }
  ]
}

Evaluate ALL departments from the faculty data. Assign realistic scores and categories based on department type and university profile.`;
      userPrompt = `Generate department ROI analysis for:\n${universityContext}`;
      break;

    case 'partner_recommendations':
      systemPrompt = `You are an AI governance analyst for IARSMS. Recommend strategic partner universities.

${lang}

Return ONLY valid JSON with this exact structure (no markdown, no code blocks):
{
  "recommendations": [
    {
      "university_name": "<exact name from available partners>",
      "country": "<country>",
      "match_score": <number 60-100>,
      "reasoning": {
        "departmental_complementarity": "<1 sentence>",
        "geographic_diversification": "<1 sentence>",
        "mobility_balance": "<1 sentence>",
        "strategic_alignment": "<1 sentence>"
      }
    }
  ]
}

Recommend 5-8 universities from the AVAILABLE PARTNER UNIVERSITIES list. Use EXACT names. Prioritize universities that complement weaknesses and diversify geographic reach.`;
      userPrompt = `Recommend strategic partners for:\n${universityContext}`;
      break;

    case 'market_intelligence':
      systemPrompt = `You are an AI governance analyst for IARSMS. Generate market intelligence for student recruitment.

${lang}

Return ONLY valid JSON with this exact structure (no markdown, no code blocks):
{
  "markets": [
    {
      "country": "<country name>",
      "region": "<Europe/Asia/MENA/North America/Africa/Latin America>",
      "conversion_efficiency": <number 0-100>,
      "over_offering_indicator": <number 0-100>,
      "application_waste_ratio": <number 0-100>,
      "agent_driven_ratio": <number 0-100>
    }
  ],
  "recommendations": [
    {
      "country": "<country>",
      "action": "scale" or "maintain" or "pause" or "exit",
      "reason": "<1-2 sentences>"
    }
  ]
}

Generate data for 8-12 markets relevant to the university's region and profile. Turkish universities should include European, Central Asian, MENA, and African markets.`;
      userPrompt = `Generate market intelligence for:\n${universityContext}`;
      break;

    default:
      throw new Error(`Unknown evaluation_type: ${evaluation_type}`);
  }

  const content = await callAI(cfg, systemPrompt, userPrompt, { json: true });
  const evaluationData = parseJsonResponse(content);

  // Cache locally (mirrors the edge function's ai_evaluations upsert).
  try {
    await db.ai_evaluations.put({
      id: `${university_id}:${evaluation_type}`,
      university_id,
      evaluation_type,
      evaluation_data: evaluationData,
      created_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
    });
  } catch {
    // Caching is best-effort only.
  }

  return { evaluation: evaluationData };
}

async function aiChat(cfg: AIConfig, body: Row): Promise<unknown> {
  const { message, university_id, university_name, language } = body;

  let universityContext = '';
  if (university_id) {
    try {
      universityContext = await buildUniversityContext(String(university_id));
    } catch {
      universityContext = `UNIVERSITY PROFILE:\nName: ${university_name || 'Unknown'}`;
    }
  }

  const chatLangInstructions: Record<string, string> = {
    en: 'Respond entirely in English.',
    tr: 'Tüm yanıtlarını Türkçe olarak ver. Her kelime Türkçe olmalı.',
    de: 'Antworte vollständig auf Deutsch.',
    ar: 'أجب بالكامل باللغة العربية.',
  };
  const lang = chatLangInstructions[String(language || 'en')] || chatLangInstructions.en;

  const systemPrompt = `You are an authoritative AI governance advisor for IARSMS (International Academic Relations Strategic Management System). You provide data-driven, strategic intelligence for university internationalization.

${lang}

Your role is to:
1. Analyze institutional performance with precision
2. Identify strengths, weaknesses, and opportunities
3. Recommend strategic partnerships and interventions
4. Provide actionable guidance, not vague suggestions

Response style:
- Be concise but comprehensive
- Use data when available
- Structure responses with clear sections if needed
- Be direct and authoritative - you are a governance tool, not a chatbot
- Never apologize or hedge excessively
- If asked about specific metrics, generate realistic assessments based on the institution profile

${universityContext ? `\nCURRENT CONTEXT:\n${universityContext}` : 'No specific university context provided.'}`;

  const response = await callAI(cfg, systemPrompt, String(message ?? ''), { maxTokens: 1024 });
  return { response };
}

async function marketIntelligence(cfg: AIConfig, body: Row): Promise<unknown> {
  const { university_id, language } = body;
  if (!university_id) throw new Error('university_id is required');

  await ensureSeeded();
  const uniId = String(university_id);
  const university = (await db.universities.get(uniId)) as Row | undefined;
  const mobilityData = (await db.mobility_records
    .where('university_id')
    .equals(uniId)
    .toArray()) as Row[];
  const mous = (await db.mous
    .filter((m) => m.initiator_university_id === uniId || m.partner_university_id === uniId)
    .toArray()) as Row[];

  // Resolve partner countries from the partner side of each MOU.
  const partnerIds = [
    ...new Set(
      mous
        .map((m) =>
          m.initiator_university_id === uniId
            ? String(m.partner_university_id)
            : String(m.initiator_university_id)
        )
        .filter(Boolean)
    ),
  ];
  const partnerRows = partnerIds.length
    ? ((await db.universities.where('id').anyOf(partnerIds).toArray()) as Row[])
    : [];
  const partnerCountries = [...new Set(partnerRows.map((p) => String(p.country)).filter(Boolean))];

  const universityContext = `
University: ${university?.name || 'Unknown'}
Country: ${university?.country || 'Unknown'}
Total Mobility Records: ${mobilityData.length}
Active Partnerships: ${mous.length}

Mobility by Direction:
- Outgoing: ${mobilityData.filter((m) => m.direction === 'outgoing').length}
- Incoming: ${mobilityData.filter((m) => m.direction === 'incoming').length}

Partner Countries: ${partnerCountries.join(', ') || 'None'}
  `.trim();

  const systemPrompt = `You are an expert in international higher education recruitment and market intelligence. Analyze recruitment markets and provide actionable recommendations.

${langInstruction(language)}

You must respond with a valid JSON object (no markdown, no code blocks) with this exact structure:
{
  "markets": [
    {
      "country": "string",
      "applications": number,
      "offers": number,
      "enrollments": number,
      "capacity": number,
      "agentDriven": number,
      "organic": number,
      "conversionRate": number,
      "offerAcceptanceRate": number,
      "overOfferingRatio": number,
      "wasteRatio": number
    }
  ],
  "recommendations": [
    {
      "country": "string",
      "action": "scale" | "pause" | "exit",
      "confidence": number (0-100),
      "reasoning": "string (1-2 sentences)",
      "riskLevel": "low" | "medium" | "high",
      "keyMetrics": {
        "conversionEfficiency": number (0-100),
        "recruitmentQuality": number (0-100),
        "capacityAlignment": number (0-100)
      }
    }
  ],
  "summary": {
    "totalApplications": number,
    "averageConversion": number,
    "marketsToScale": number,
    "marketsToPause": number,
    "marketsToExit": number
  },
  "generatedAt": "ISO date string"
}

Generate realistic simulated data for 8-12 recruitment markets based on the university context.`;

  const userPrompt = `Analyze the recruitment markets for this university and generate market intelligence data with scale/pause/exit recommendations:

${universityContext}

Generate realistic market data and AI recommendations based on the university's profile.`;

  const content = await callAI(cfg, systemPrompt, userPrompt, { json: true });
  const analysis = parseJsonResponse(content);
  return { analysis };
}

async function mouSuggest(cfg: AIConfig, body: Row): Promise<unknown> {
  const { cooperation_scope, initiator_name, partner_name, existing_clauses, language } = body;

  const systemPrompt = `You are an expert in international academic cooperation agreements and MOU (Memorandum of Understanding) drafting.
Your task is to suggest professional, balanced, and legally sound clauses for university partnership agreements.
Always consider both parties' interests and follow international best practices for academic cooperation.

${langInstruction(language)}

Return ONLY valid JSON with this exact structure (no markdown, no code blocks):
{
  "clauses": [
    {
      "title": "<short title for the clause>",
      "content": "<full text of the clause>",
      "category": "governance" | "academic" | "financial" | "mobility" | "research" | "termination" | "general",
      "priority": "essential" | "recommended" | "optional"
    }
  ]
}`;

  const scope = Array.isArray(cooperation_scope) ? cooperation_scope.join(', ') : '';
  const existing = Array.isArray(existing_clauses) ? existing_clauses : [];

  const userPrompt = `Generate recommended MOU clauses for a partnership between "${initiator_name}" and "${partner_name}".

Cooperation Scope: ${scope || 'General academic cooperation'}

${
    existing.length > 0
      ? `Existing clauses to build upon:\n${existing
          .map((c: Row) => `- ${c.title}: ${c.content}`)
          .join('\n')}`
      : 'No existing clauses yet.'
  }

Please suggest 3-5 professional MOU clauses that cover the essential aspects of this partnership. Each clause should be specific, actionable, and balanced.`;

  const content = await callAI(cfg, systemPrompt, userPrompt, { json: true });
  const result = parseJsonResponse(content) as Row;
  return { clauses: Array.isArray(result?.clauses) ? result.clauses : [] };
}

async function partnerAdvisor(cfg: AIConfig, body: Row): Promise<unknown> {
  const { partners, university_name, language } = body;

  const systemPrompt = `You are an expert strategic advisor for international academic partnerships.
Analyze partnership data and provide actionable recommendations for each partner relationship.
Focus on maximizing ROI, improving collaboration outcomes, and identifying opportunities for growth.
Be specific and data-driven in your recommendations.

${langInstruction(language)}

Return ONLY valid JSON with this exact structure (no markdown, no code blocks):
{
  "recommendations": [
    {
      "partner_name": "<name>",
      "action": "expand" | "maintain" | "restructure" | "pause",
      "priority": "high" | "medium" | "low",
      "recommendation": "<strategic recommendation>",
      "next_steps": "<specific next steps>",
      "opportunity": "<key opportunity>",
      "risk": "<key risk>"
    }
  ],
  "overall_strategy": "<overall portfolio strategy>"
}`;

  const partnerList = Array.isArray(partners) ? partners : [];
  const partnerSummary = partnerList
    .map(
      (p: Row) =>
        `- ${p.name} (${p.country}): ${p.projects_count} projects, ${p.mou_status || 'no MOU'}, satisfaction: ${p.satisfaction || 'N/A'}`
    )
    .join('\n');

  const userPrompt = `Analyze the partnership portfolio for "${university_name}" and provide strategic recommendations.

Current Partners:
${partnerSummary}

For each partner, provide:
1. A strategic action recommendation (expand, maintain, restructure, or pause)
2. Specific next steps to take
3. Priority level (high, medium, low)
4. Key opportunity or risk to address`;

  const content = await callAI(cfg, systemPrompt, userPrompt, { json: true });
  const result = parseJsonResponse(content) as Row;
  return {
    recommendations: Array.isArray(result?.recommendations) ? result.recommendations : [],
    overall_strategy: typeof result?.overall_strategy === 'string' ? result.overall_strategy : '',
  };
}

async function partnershipAnalysis(cfg: AIConfig, body: Row): Promise<unknown> {
  const { university, partner, interactions, projects, mou_status, language } = body as {
    university: Row;
    partner: Row;
    interactions: Row[];
    projects: Row[];
    mou_status: unknown;
    language: unknown;
  };

  const systemPrompt = `You are an expert strategic advisor for international academic partnerships.
Analyze the partnership history, meetings, and current stage to provide:
1. An achievability assessment of stated goals
2. Resource requirements for upcoming activities
3. Strategic recommendations for next steps
4. Risk assessment and mitigation strategies

Be specific, data-driven, and actionable. Consider both universities' profiles.

${langInstruction(language)}

Return ONLY valid JSON with this exact structure (no markdown, no code blocks):
{
  "achievability_score": <number 0-100>,
  "achievability_reasoning": "<detailed reasoning for the score>",
  "strengths": ["<key strength>", ...],
  "risks": ["<key risk>", ...],
  "recommended_next_steps": ["<specific actionable step>", ...],
  "resources_needed": {
    "personnel": ["<role>", ...],
    "budget_items": ["<item>", ...],
    "infrastructure": ["<item>", ...],
    "timeline": "<overall timeline>"
  },
  "meeting_suggestions": [
    {
      "title": "<meeting title>",
      "format": "online" | "in_person" | "hybrid",
      "purpose": "<purpose>",
      "suggested_attendees": "<attendees>",
      "priority": "high" | "medium" | "low"
    }
  ],
  "overall_assessment": "<overall assessment>"
}`;

  const interactionList = Array.isArray(interactions) ? interactions : [];
  const interactionsSummary = interactionList
    .map(
      (i: Row) =>
        `- ${i.meeting_date ? new Date(String(i.meeting_date)).toLocaleDateString() : 'N/A'}: ${i.title} (${i.interaction_type}, ${i.status}) - Stage: ${i.stage}
        Notes: ${i.discussion_notes || 'N/A'}
        Outcomes: ${i.outcomes || 'N/A'}
        Goals: ${i.goals || 'N/A'}
        Waiting for: ${i.waiting_for || 'N/A'}`
    )
    .join('\n');

  const uniStrengths = Array.isArray(university?.research_strengths)
    ? (university.research_strengths as string[]).join(', ')
    : 'N/A';
  const uniAccreditations = Array.isArray(university?.accreditations)
    ? (university.accreditations as string[]).join(', ')
    : 'N/A';
  const partnerStrengths = Array.isArray(partner?.research_strengths)
    ? (partner.research_strengths as string[]).join(', ')
    : 'N/A';
  const partnerAccreditations = Array.isArray(partner?.accreditations)
    ? (partner.accreditations as string[]).join(', ')
    : 'N/A';

  const userPrompt = `Analyze this partnership between "${university?.name}" (${university?.country}) and "${partner?.name}" (${partner?.country}).

University Profile:
- Type: ${university?.type}, Size: ${university?.size}
- Internationalization: ${university?.internationalization_maturity}
- Research strengths: ${uniStrengths}
- Accreditations: ${uniAccreditations}

Partner Profile:
- Type: ${partner?.type}, Size: ${partner?.size}
- Internationalization: ${partner?.internationalization_maturity}
- Research strengths: ${partnerStrengths}
- Accreditations: ${partnerAccreditations}

MOU Status: ${mou_status || 'None'}
Active Projects: ${Array.isArray(projects) ? projects.length : 0}

Interaction History:
${interactionsSummary || 'No interactions recorded yet.'}

Provide a comprehensive analysis.`;

  const content = await callAI(cfg, systemPrompt, userPrompt, { json: true });
  return parseJsonResponse(content);
}

async function parseTranscript(cfg: AIConfig, body: Row): Promise<unknown> {
  const { transcriptText, hostUniversityCourses } = body;

  const systemPrompt = `You are an academic course matching expert specializing in student mobility and credit transfer. Your task is to:
1. Parse the student's transcript text to extract course information (code, name, credits, department)
2. Match each home course with the BEST equivalent course at the host university based on CONTENT DESCRIPTION SIMILARITY
3. Calculate an accurate match score (0-100) based on how well the course descriptions align

CRITICAL MATCHING RULES - READ CAREFULLY:

1. DEPARTMENT MATCHING IS MANDATORY:
   - Civil Engineering courses → ONLY match with Civil Engineering courses
   - Computer Engineering courses → ONLY match with Computer Engineering courses
   - Economics courses → ONLY match with Economics courses
   - NEVER match across unrelated fields (e.g., Engineering to Business, Arts to Engineering)

2. CONTENT-BASED SCORING using course DESCRIPTIONS:
   - 90-100: Same department, nearly identical topics in descriptions
   - 80-89: Same department, very similar content with minor topic differences
   - 70-79: Same department, similar core topics but some variation in depth/scope
   - 60-69: Same department, related topics with notable differences
   - 50-59: Same department but only partially overlapping content
   - 30-49: Related department, some transferable concepts
   - 0-29: No suitable match OR cross-department mismatch (ALWAYS use this for mismatched departments!)

3. If no suitable match exists in the same/related department, return score 0-20 and explain why.

Return ONLY valid JSON with this exact structure (no markdown, no code blocks):
{
  "parsedCourses": [
    {
      "courseCode": "<course code from transcript>",
      "courseName": "<course name>",
      "credits": <number>,
      "grade": "<grade if visible>",
      "department": "<department or subject area>"
    }
  ],
  "courseMatches": [
    {
      "homeCourseCode": "<string>",
      "homeCourseName": "<string>",
      "homeCredits": <number>,
      "hostCourseId": "<id of matched host course>",
      "hostCourseCode": "<string>",
      "hostCourseName": "<string>",
      "hostCredits": <number>,
      "matchScore": <number 0-100>,
      "matchReason": "<brief explanation of why these courses match>"
    }
  ],
  "summary": {
    "totalHomeCourses": <number>,
    "totalMatchedCourses": <number>,
    "averageMatchScore": <number>,
    "totalHomeCredits": <number>,
    "totalHostCredits": <number>
  }
}`;

  const userPrompt = `Match home university courses with host university courses based on CONTENT SIMILARITY.

HOME COURSES (from student's transcript):
${transcriptText}

HOST UNIVERSITY COURSES (available for matching):
${JSON.stringify(hostUniversityCourses, null, 2)}

MATCHING INSTRUCTIONS:
1. For each home course, identify its DEPARTMENT (e.g., "CE101 - Statics" → Civil Engineering)
2. Filter host courses to ONLY those in the SAME department
3. Compare course DESCRIPTIONS to find the best content match
4. Score based on how many topics/concepts overlap between descriptions
5. If no host course exists in the same department, score 0-20 and explain

CRITICAL: A Civil Engineering course like "Statics" MUST match with a Civil Engineering course like "Statics for Civil Engineers", NOT with Economics, Business, or Computer courses. The department field in the host courses tells you which department each course belongs to.`;

  const content = await callAI(cfg, systemPrompt, userPrompt, { json: true, temperature: 0.3 });
  const result = parseJsonResponse(content) as Row;
  return {
    parsedCourses: Array.isArray(result?.parsedCourses) ? result.parsedCourses : [],
    courseMatches: Array.isArray(result?.courseMatches) ? result.courseMatches : [],
    summary: result?.summary && typeof result.summary === 'object' ? result.summary : {},
  };
}

async function specialCaseAnalyze(cfg: AIConfig, body: Row): Promise<unknown> {
  const { studentName, studentId, department, country, educationSystem, degreeLevel, situation, language } =
    body;

  const systemPrompt = `You are an expert university admissions officer specializing in international student documentation, credential recognition (Denklik), and special cases for Turkish universities. You understand YÖK regulations, MEB Denklik processes, Hague Convention apostille requirements, and country-specific authentication chains.

Given a student's details and their situation description, you must:
1. Classify the case category (credential_recognition, academic_failure, war_zone, visa_issue, or other)
2. Determine the case status (open, in_progress, pending_documents, escalated)
3. Write a clear summary of the issue
4. Write detailed case analysis
5. Generate a step-by-step progress timeline with realistic steps needed to resolve the case

${language === 'tr' ? 'Respond in Turkish.' : 'Respond in English.'}

Return ONLY valid JSON with this exact structure (no markdown, no code blocks):
{
  "category": "credential_recognition" | "academic_failure" | "war_zone" | "visa_issue" | "other",
  "status": "open" | "in_progress" | "pending_documents" | "escalated",
  "summary": "<concise 1-2 sentence summary of the issue>",
  "details": "<detailed analysis including relevant regulations, challenges, and context>",
  "steps": [
    {
      "title": "<step title>",
      "description": "<what needs to be done>",
      "status": "pending" | "in_progress" | "completed" | "blocked",
      "estimatedDuration": "<e.g. '1-2 weeks'>",
      "notes": "<important notes or tips>"
    }
  ],
  "riskLevel": "low" | "medium" | "high",
  "estimatedResolutionTime": "<e.g. '2-3 months'>",
  "recommendations": ["<key recommendation>", ...]
}`;

  const userPrompt = `Student Details:
- Name: ${studentName}
- Student ID: ${studentId}
- Department: ${department}
- Country of Origin: ${country}
- Education System: ${educationSystem || 'Not specified'}
- Degree Level: ${degreeLevel || 'Not specified'}

Situation Description:
${situation}

Analyze this case and provide a comprehensive assessment.`;

  const content = await callAI(cfg, systemPrompt, userPrompt, { json: true });
  return parseJsonResponse(content);
}

async function documentRequirements(cfg: AIConfig, body: Row): Promise<unknown> {
  const { country, educationSystem, stage, degreeLevel, language } = body;

  const systemPrompt = `You are an expert in international student document requirements for Turkish universities.
You have comprehensive knowledge of:
- Document requirements for different countries' education systems
- Stamp and attestation requirements (MOFA, Apostille, Turkish Consulate, etc.)
- Denklik (equivalency) processes
- İkamet (residence permit) requirements
- Specific requirements for different exam boards (Cambridge, IB, WAEC, CBSE, etc.)

${langInstruction(language)}

Provide detailed, accurate, and actionable information about required documents.`;

  const userPrompt = `A student from ${country} with ${educationSystem || 'standard national'} education system is applying for ${degreeLevel} program.
Their current stage is: ${stage}.

Please provide:
1. List of required documents specific to their country and education system
2. For each document:
   - Exact name and description
   - Required stamps/attestations (be specific about which ministry/authority)
   - Step-by-step instructions on how to obtain it
   - Any special notes or warnings
3. Common issues or rejections for students from this country
4. Timeline estimates for obtaining documents

Format your response as a JSON object with this structure (return ONLY valid JSON, no markdown, no code blocks):
{
  "documents": [
    {
      "name": "Document Name",
      "category": "academic|legal|identity|financial|other",
      "description": "What this document is",
      "isRequired": true/false,
      "stampsRequired": ["Stamp 1", "Stamp 2"],
      "howToObtain": "Step by step instructions",
      "timeline": "Estimated time to obtain",
      "notes": "Any special notes or warnings"
    }
  ],
  "commonIssues": ["Issue 1", "Issue 2"],
  "generalAdvice": "Overall advice for students from this country",
  "estimatedTotalTime": "Total time to gather all documents"
}`;

  const content = await callAI(cfg, systemPrompt, userPrompt, { json: true, temperature: 0.3 });
  try {
    return parseJsonResponse(content);
  } catch {
    // Mirror the edge function's fallback shape on parse failure.
    return {
      documents: [],
      commonIssues: [],
      generalAdvice: content,
      estimatedTotalTime: 'Unknown',
      parseError: true,
    };
  }
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

const HANDLERS: Record<string, (cfg: AIConfig, body: Row) => Promise<unknown>> = {
  'ai-evaluate': aiEvaluate,
  'ai-chat': aiChat,
  'market-intelligence': marketIntelligence,
  'mou-suggest': mouSuggest,
  'partner-advisor': partnerAdvisor,
  'partnership-analysis': partnershipAnalysis,
  'parse-transcript': parseTranscript,
  'special-case-analyze': specialCaseAnalyze,
  'document-requirements': documentRequirements,
};

/**
 * Drop-in local replacement for `supabase.functions.invoke(name, { body })`.
 * Returns `{ data, error }` with the exact same `data` shapes the edge
 * functions produced.
 *
 * Fallback chain for ai-chat: cloud provider (if configured) → local LLM
 * (desktop app with a downloaded model) → deterministic built-in engine.
 * All other functions go cloud → built-in engine.
 */
export async function invokeLocalFunction(
  name: string,
  body: Record<string, unknown>
): Promise<{ data: unknown; error: { message: string } | null }> {
  const cfg = getAIConfig();
  const cloudConfigured =
    cfg.provider !== 'none' &&
    !!cfg.apiKey &&
    (typeof navigator === 'undefined' || navigator.onLine);

  // Cloud AI first when the user linked a provider and is online…
  if (cloudConfigured) {
    const handler = HANDLERS[name];
    if (handler) {
      try {
        const data = await handler(cfg, body || {});
        return { data, error: null };
      } catch (err) {
        // …but never fail the feature: fall through to the built-in engine
        // (quota errors, network hiccups, model changes, parse failures).
        console.warn(`[IRIS] Cloud AI failed for "${name}", using built-in engine:`, err);
      }
    }
  }

  // Local LLM (real language model running fully offline in the desktop
  // app) — chat only. Any failure falls through to the built-in engine.
  if (name === 'ai-chat') {
    try {
      const { isLocalLLMAvailable, askLocalLLM } = await import('@/lib/localLLM');
      if (await isLocalLLMAvailable()) {
        const response = await askLocalLLM(
          String((body || {}).message ?? ''),
          body?.university_id ? String(body.university_id) : null
        );
        if (response) return { data: { response }, error: null };
      }
    } catch (err) {
      console.warn('[IRIS] Local LLM failed for "ai-chat", using built-in engine:', err);
    }
  }

  // IRIS built-in engine: fully offline, computes from local data.
  try {
    const { runLocalEngine } = await import('@/lib/localEngine');
    const data = await runLocalEngine(name, body || {});
    return { data, error: null };
  } catch (err) {
    return {
      data: null,
      error: { message: err instanceof Error ? err.message : 'AI request failed.' },
    };
  }
}
