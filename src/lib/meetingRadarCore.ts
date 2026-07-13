/**
 * Meeting Radar — pure classification & matching helpers.
 *
 * No DOM, no Dexie, no Electron imports: this module must stay runnable in
 * plain Node so the classifier and the domain matcher can be unit-tested
 * without a mailbox. The Electron main process keeps a mirrored copy of the
 * classification regexes in electron/mail.mjs (it cannot import TypeScript
 * at runtime) — if you change the logic here, update mail.mjs too.
 */

/**
 * Fold case and (Turkish) diacritics so keyword matching tolerates both
 * "işbirliği" and "isbirligi", "Görüşme" and "GORUSME", etc.
 */
export function foldText(text: string): string {
  return String(text ?? '')
    .toLowerCase()
    // Turkish dotless ı is not decomposed by NFD, map it explicitly.
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

/**
 * Meeting / partnership intent keywords. Matched against folded text, so the
 * Turkish entries are written in their diacritic-stripped form.
 */
const INTENT_REGEX =
  /\b(meet(?:ing)?s?|call|zoom|teams|visits?|delegations?|partnerships?|collaborations?|mou|memorandum|erasmus|exchange\s+agreements?|gorusme(?:si|ler)?|toplanti(?:si|lar)?|isbirlig(?:i|imiz)?)\b/;

/** How much of the body is considered when classifying. */
export const BODY_CLASSIFY_CHARS = 2000;

/**
 * True when the subject or the first 2000 characters of the body look like a
 * meeting request / partnership outreach email.
 */
export function classifyEmail(subject: string, body: string): boolean {
  const haystack =
    foldText(subject) + '\n' + foldText(String(body ?? '').slice(0, BODY_CLASSIFY_CHARS));
  return INTENT_REGEX.test(haystack);
}

const MONTHS =
  '(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)';

/** Raw datetime-looking substrings, in the order they appear in the text. */
const DATETIME_PATTERNS: RegExp[] = [
  // ISO dates, optionally with a time: 2026-07-21, 2026-07-21T14:00, 2026-07-21 14:00
  /\b\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2})?)?\b/gi,
  // "12 May", "3rd June 2026"
  new RegExp(String.raw`\b\d{1,2}(?:st|nd|rd|th)?\s+${MONTHS}\b(?:\s+\d{4})?`, 'gi'),
  // "May 12", "June 3rd, 2026"
  new RegExp(String.raw`\b${MONTHS}\s+\d{1,2}(?:st|nd|rd|th)?\b(?:,?\s+\d{4})?`, 'gi'),
  // Numeric day/month(/year): 12/05, 12.05.2026 — not part of a longer number.
  /\b\d{1,2}[/.]\d{1,2}(?:[/.]\d{2,4})?\b(?!\d)/g,
  // Relative weekday/period: "next Tuesday", "this coming Friday", "next week"
  /\b(?:next|this(?:\s+coming)?|coming)\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|week|month)\b/gi,
  // Bare times when nothing else matched nearby: 14:30, 09:00
  /\b\d{1,2}:\d{2}\b/g,
];

const MAX_PROPOSED_TIMES = 8;

/**
 * Extract raw datetime-looking candidates ("proposed times") from an email
 * body. Returns the matched substrings verbatim (no parsing), de-duplicated,
 * capped at 8.
 */
export function extractProposedTimes(body: string): string[] {
  const text = String(body ?? '').slice(0, BODY_CLASSIFY_CHARS);
  const seen = new Set<string>();
  const out: string[] = [];
  for (const pattern of DATETIME_PATTERNS) {
    pattern.lastIndex = 0;
    for (const match of text.matchAll(pattern)) {
      const raw = match[0].trim();
      const key = raw.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(raw);
      if (out.length >= MAX_PROPOSED_TIMES) return out;
    }
  }
  return out;
}

/** Domain part of an email address, lowercased; null when there is none. */
export function extractEmailDomain(address: string): string | null {
  const at = String(address ?? '').lastIndexOf('@');
  if (at < 0) return null;
  const domain = String(address).slice(at + 1).trim().toLowerCase().replace(/[>\s]+$/g, '');
  return domain || null;
}

/** "https://www.metu.edu.tr/intl" → "metu.edu.tr"; null for empty/invalid. */
export function normalizeWebsiteDomain(website: string): string | null {
  let host = String(website ?? '').trim().toLowerCase();
  if (!host) return null;
  host = host.replace(/^[a-z][a-z0-9+.-]*:\/\//, ''); // strip protocol
  host = host.split(/[/?#]/)[0]; // strip path/query
  host = host.split('@').pop() ?? host; // strip userinfo
  host = host.split(':')[0]; // strip port
  host = host.replace(/^www\./, '');
  return host.includes('.') ? host : null;
}

/**
 * True when an email-sender domain and a university website domain belong
 * together: exact match, or one is a subdomain of the other
 * (intl.metu.edu.tr ↔ metu.edu.tr).
 */
export function domainsMatch(leadDomain: string, uniDomain: string): boolean {
  if (!leadDomain || !uniDomain) return false;
  return (
    leadDomain === uniDomain ||
    leadDomain.endsWith('.' + uniDomain) ||
    uniDomain.endsWith('.' + leadDomain)
  );
}

/**
 * Match a sender address against a list of university website URLs.
 * Returns the index of the first matching website, or -1.
 */
export function matchDomain(address: string, websites: string[]): number {
  const leadDomain = extractEmailDomain(address);
  if (!leadDomain) return -1;
  for (let i = 0; i < websites.length; i++) {
    const uniDomain = normalizeWebsiteDomain(websites[i]);
    if (uniDomain && domainsMatch(leadDomain, uniDomain)) return i;
  }
  return -1;
}
