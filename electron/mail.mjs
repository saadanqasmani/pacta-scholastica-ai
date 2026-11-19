/**
 * IRIS — Meeting Radar mail manager (IMAP via imapflow + mailparser).
 *
 * Connects to the user's work mailbox, scans recent INBOX messages and
 * classifies meeting-request / partnership-outreach emails. Every public
 * method is guarded: mail problems must never crash the app — errors are
 * returned as data ({ error } / { ok:false }) and the renderer shows them
 * inline. No leads are stored here; the renderer persists them to Dexie.
 *
 * Imported lazily from electron/main.js so a broken dependency can never
 * block app boot.
 *
 * NOTE: The classification/extraction regexes below mirror the reference
 * implementation in src/lib/meetingRadarCore.ts (the main process cannot
 * import TypeScript at runtime). Keep the two in sync.
 */
import path from "node:path";
import fs from "node:fs";
import { app } from "electron";

/** Hard limits for a scan. */
const SCAN_DAYS = 45;
const SCAN_MAX_MESSAGES = 300;
const BODY_CLASSIFY_CHARS = 2000;
const SNIPPET_CHARS = 300;
const SOURCE_MAX_BYTES = 128 * 1024; // enough for headers + text part
const TEST_TIMEOUT_MS = 15_000;

// --- Classification (mirrors src/lib/meetingRadarCore.ts) -------------------

function foldText(text) {
  return String(text ?? "")
    .toLowerCase()
    .replace(/ı/g, "i") // Turkish dotless ı is not decomposed by NFD
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

const INTENT_REGEX =
  /\b(meet(?:ing)?s?|call|zoom|teams|visits?|delegations?|partnerships?|collaborations?|mou|memorandum|erasmus|exchange\s+agreements?|gorusme(?:si|ler)?|toplanti(?:si|lar)?|isbirlig(?:i|imiz)?)\b/;

function classifyEmail(subject, body) {
  const haystack =
    foldText(subject) + "\n" + foldText(String(body ?? "").slice(0, BODY_CLASSIFY_CHARS));
  return INTENT_REGEX.test(haystack);
}

const MONTHS =
  "(?:jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t(?:ember)?)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)";

const DATETIME_PATTERNS = [
  // ISO dates, optionally with a time
  /\b\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2})?)?\b/gi,
  // "12 May", "3rd June 2026"
  new RegExp(String.raw`\b\d{1,2}(?:st|nd|rd|th)?\s+${MONTHS}\b(?:\s+\d{4})?`, "gi"),
  // "May 12", "June 3rd, 2026"
  new RegExp(String.raw`\b${MONTHS}\s+\d{1,2}(?:st|nd|rd|th)?\b(?:,?\s+\d{4})?`, "gi"),
  // Numeric day/month(/year): 12/05, 12.05.2026
  /\b\d{1,2}[/.]\d{1,2}(?:[/.]\d{2,4})?\b(?!\d)/g,
  // Relative: "next Tuesday", "this coming Friday", "next week"
  /\b(?:next|this(?:\s+coming)?|coming)\s+(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday|week|month)\b/gi,
  // Bare times: 14:30
  /\b\d{1,2}:\d{2}\b/g,
];

const MAX_PROPOSED_TIMES = 8;

function extractProposedTimes(body) {
  const text = String(body ?? "").slice(0, BODY_CLASSIFY_CHARS);
  const seen = new Set();
  const out = [];
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

// -----------------------------------------------------------------------------

/** Reject after `ms` while `promise` is still pending. */
function withTimeout(promise, ms, message) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => reject(new Error(message)), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(timer));
}

export class MailManager {
  constructor() {
    // Connection settings for the work mailbox. `pass` is an app password
    // (Gmail/Outlook "app password"); proper OAuth support comes later.
    this.configPath = path.join(app.getPath("userData"), "mail.json");
  }

  // -------------------------------------------------------------------------
  // Config — stored as JSON: { host, port, secure, user, pass }
  // -------------------------------------------------------------------------

  #readConfig() {
    try {
      const raw = fs.readFileSync(this.configPath, "utf8");
      const cfg = JSON.parse(raw);
      if (!cfg || typeof cfg !== "object") return null;
      return cfg;
    } catch {
      return null; // not configured yet (or unreadable) — treat as absent
    }
  }

  /** Config for the renderer — the password never crosses the bridge. */
  getConfig() {
    const cfg = this.#readConfig();
    if (!cfg) return { configured: false };
    return {
      configured: Boolean(cfg.host && cfg.user),
      host: String(cfg.host ?? ""),
      port: Number(cfg.port) || 993,
      secure: cfg.secure !== false,
      user: String(cfg.user ?? ""),
      hasPassword: Boolean(cfg.pass),
    };
  }

  saveConfig(input) {
    const host = String(input?.host ?? "").trim();
    const user = String(input?.user ?? "").trim();
    const port = Number(input?.port) || 993;
    const secure = input?.secure !== false;
    if (!host) return { error: "IMAP host is required." };
    if (!user) return { error: "Mailbox user (email address) is required." };
    const previous = this.#readConfig();
    // An empty password keeps the stored one, so users can edit the host
    // or port without retyping their app password.
    const pass = String(input?.pass ?? "") || String(previous?.pass ?? "");
    if (!pass) return { error: "An app password is required." };
    const cfg = { host, port, secure, user, pass };
    fs.mkdirSync(path.dirname(this.configPath), { recursive: true });
    fs.writeFileSync(this.configPath, JSON.stringify(cfg, null, 2), { mode: 0o600 });
    return { ok: true };
  }

  /** Merge partial overrides (e.g. from the setup form) onto stored config. */
  #effectiveConfig(overrides) {
    const stored = this.#readConfig() ?? {};
    const merged = { ...stored, ...(overrides && typeof overrides === "object" ? overrides : {}) };
    if (!merged.pass) merged.pass = stored.pass;
    return {
      host: String(merged.host ?? "").trim(),
      port: Number(merged.port) || 993,
      secure: merged.secure !== false,
      user: String(merged.user ?? "").trim(),
      pass: String(merged.pass ?? ""),
    };
  }

  async #connect(cfg) {
    const { ImapFlow } = await import("imapflow");
    const client = new ImapFlow({
      host: cfg.host,
      port: cfg.port,
      secure: cfg.secure,
      auth: { user: cfg.user, pass: cfg.pass },
      logger: false,
      // Fail fast instead of hanging on unreachable hosts.
      connectionTimeout: TEST_TIMEOUT_MS,
      greetingTimeout: TEST_TIMEOUT_MS,
    });
    await client.connect();
    return client;
  }

  // -------------------------------------------------------------------------
  // Test connection
  // -------------------------------------------------------------------------

  /** Connect and log out again; 15s overall timeout. Returns { ok, message }. */
  async testConnection(overrides) {
    const cfg = this.#effectiveConfig(overrides);
    if (!cfg.host || !cfg.user || !cfg.pass) {
      return { ok: false, message: "Host, user and app password are required." };
    }
    let client = null;
    try {
      await withTimeout(
        (async () => {
          client = await this.#connect(cfg);
          await client.logout();
        })(),
        TEST_TIMEOUT_MS,
        "Connection timed out after 15 seconds."
      );
      return { ok: true, message: `Connected to ${cfg.host} as ${cfg.user}.` };
    } catch (err) {
      return {
        ok: false,
        message: err?.responseText || (err?.message ? String(err.message) : String(err)),
      };
    } finally {
      // If the timeout won the race, the socket may still be open.
      if (client) client.close();
    }
  }

  // -------------------------------------------------------------------------
  // Scan
  // -------------------------------------------------------------------------

  /**
   * Fetch INBOX messages from the last 45 days (newest first, capped at 300),
   * classify each one and return the matching leads. Nothing is persisted in
   * the main process — the renderer stores leads in its local database.
   */
  async scan(overrides) {
    const cfg = this.#effectiveConfig(overrides);
    if (!cfg.host || !cfg.user || !cfg.pass) {
      return { error: "Mailbox is not configured. Save the IMAP settings first." };
    }
    let client = null;
    let lock = null;
    try {
      const { simpleParser } = await import("mailparser");
      client = await this.#connect(cfg);
      lock = await client.getMailboxLock("INBOX");

      const since = new Date(Date.now() - SCAN_DAYS * 24 * 60 * 60 * 1000);
      const uids = await client.search({ since }, { uid: true });
      const recent = (Array.isArray(uids) ? uids : []).slice(-SCAN_MAX_MESSAGES);

      const leads = [];
      let scanned = 0;
      if (recent.length > 0) {
        for await (const msg of client.fetch(
          recent,
          { uid: true, envelope: true, source: { maxLength: SOURCE_MAX_BYTES } },
          { uid: true }
        )) {
          scanned += 1;
          const envelope = msg.envelope ?? {};
          const subject = String(envelope.subject ?? "");
          let bodyText = "";
          if (msg.source) {
            try {
              const parsed = await simpleParser(msg.source);
              bodyText = String(parsed.text ?? "");
            } catch {
              bodyText = ""; // unparseable message — classify on subject only
            }
          }
          if (!classifyEmail(subject, bodyText)) continue;

          const sender = envelope.from?.[0] ?? {};
          const snippet = bodyText.replace(/\s+/g, " ").trim().slice(0, SNIPPET_CHARS);
          leads.push({
            from: {
              name: String(sender.name ?? ""),
              address: String(sender.address ?? ""),
            },
            subject,
            date: envelope.date ? new Date(envelope.date).toISOString() : null,
            snippet,
            proposedTimes: extractProposedTimes(bodyText),
          });
        }
      }
      return { ok: true, scanned, leads };
    } catch (err) {
      return { error: err?.responseText || (err?.message ? String(err.message) : String(err)) };
    } finally {
      try {
        if (lock) lock.release();
      } catch {
        /* already released */
      }
      if (client) {
        await client.logout().catch(() => {});
        client.close();
      }
    }
  }
}

let managerInstance = null;

/** Singleton accessor used by electron/main.js. */
export function getMailManager() {
  if (!managerInstance) managerInstance = new MailManager();
  return managerInstance;
}
