/**
 * IRIS local client — a drop-in, offline replacement for the Supabase JS client.
 *
 * Implements the subset of the supabase-js API that the IRIS frontend uses
 * (query builder, auth, storage, functions) on top of the local IndexedDB
 * database (src/lib/localdb.ts). Swapping this in for the Supabase client
 * makes the entire app work standalone, with no network or external services.
 *
 * Covered surface (verified against the codebase):
 *   from(t).select().eq().neq().in().or().not().order().limit().single().maybeSingle()
 *   from(t).insert() / .update().eq() / .delete().in()  — with .select() chaining
 *   auth: getSession, onAuthStateChange, signUp, signInWithPassword, signOut
 *   storage: from(bucket).upload / getPublicUrl / remove / download
 *   functions.invoke(name, { body })  → routed to src/lib/aiService.ts
 */
import { db, ensureSeeded, newId } from '@/lib/localdb';
import { invokeLocalFunction } from '@/lib/aiService';

type Row = Record<string, unknown>;
type Filter = (row: Row) => boolean;

const SESSION_KEY = 'iris-auth-session';

// ---------------------------------------------------------------------------
// Query builder
// ---------------------------------------------------------------------------

/** Parse a supabase `.or()` filter string, e.g.
 *  "a.eq.1,b.eq.2" or "and(a.eq.1,b.eq.2),and(c.eq.3,d.eq.4)" */
function parseOrFilter(expr: string): Filter {
  const parts = splitTopLevel(expr);
  const branches: Filter[] = parts.map((part) => {
    part = part.trim();
    if (part.startsWith('and(') && part.endsWith(')')) {
      const inner = splitTopLevel(part.slice(4, -1));
      const conds = inner.map(parseCondition);
      return (row: Row) => conds.every((c) => c(row));
    }
    return parseCondition(part);
  });
  return (row: Row) => branches.some((b) => b(row));
}

/** Split on commas that are not inside parentheses. */
function splitTopLevel(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of s) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      out.push(cur);
      cur = '';
    } else {
      cur += ch;
    }
  }
  if (cur) out.push(cur);
  return out;
}

function parseCondition(cond: string): Filter {
  const [col, op, ...rest] = cond.trim().split('.');
  const value = rest.join('.');
  return (row: Row) => compare(row[col], op, value);
}

function compare(actual: unknown, op: string, value: string): boolean {
  switch (op) {
    case 'eq':
      return String(actual) === value;
    case 'neq':
      return String(actual) !== value;
    case 'gt':
      return Number(actual) > Number(value);
    case 'gte':
      return Number(actual) >= Number(value);
    case 'lt':
      return Number(actual) < Number(value);
    case 'lte':
      return Number(actual) <= Number(value);
    case 'is':
      return value === 'null' ? actual == null : String(actual) === value;
    case 'like':
    case 'ilike': {
      const pattern = value.replace(/%/g, '.*');
      return new RegExp(`^${pattern}$`, op === 'ilike' ? 'i' : '').test(String(actual));
    }
    default:
      return false;
  }
}

type PostgrestResult = { data: unknown; error: { message: string; code?: string } | null; count?: number | null };

class LocalQueryBuilder implements PromiseLike<PostgrestResult> {
  private filters: Filter[] = [];
  private orderBy: { col: string; ascending: boolean }[] = [];
  private limitN: number | null = null;
  private singleMode: 'single' | 'maybeSingle' | null = null;
  private op: 'select' | 'insert' | 'update' | 'delete' = 'select';
  private payload: Row | Row[] | null = null;
  private wantRows = true;

  constructor(private table: string) {}

  select(_cols?: string) {
    // Column projection is unnecessary locally — returning full rows is a
    // superset of any projection and the UI only reads named properties.
    if (this.op === 'select') this.wantRows = true;
    return this;
  }

  insert(rows: Row | Row[]) {
    this.op = 'insert';
    this.payload = rows;
    return this;
  }

  update(values: Row) {
    this.op = 'update';
    this.payload = values;
    return this;
  }

  upsert(rows: Row | Row[]) {
    return this.insert(rows);
  }

  delete() {
    this.op = 'delete';
    return this;
  }

  eq(col: string, value: unknown) {
    this.filters.push((row) => String(row[col]) === String(value));
    return this;
  }

  neq(col: string, value: unknown) {
    this.filters.push((row) => String(row[col]) !== String(value));
    return this;
  }

  in(col: string, values: unknown[]) {
    const set = new Set(values.map(String));
    this.filters.push((row) => set.has(String(row[col])));
    return this;
  }

  gte(col: string, value: unknown) {
    this.filters.push((row) => compare(row[col], 'gte', String(value)));
    return this;
  }

  lte(col: string, value: unknown) {
    this.filters.push((row) => compare(row[col], 'lte', String(value)));
    return this;
  }

  gt(col: string, value: unknown) {
    this.filters.push((row) => compare(row[col], 'gt', String(value)));
    return this;
  }

  lt(col: string, value: unknown) {
    this.filters.push((row) => compare(row[col], 'lt', String(value)));
    return this;
  }

  is(col: string, value: unknown) {
    this.filters.push((row) => (value === null ? row[col] == null : row[col] === value));
    return this;
  }

  or(expr: string) {
    this.filters.push(parseOrFilter(expr));
    return this;
  }

  not(col: string, op: string, value: unknown) {
    this.filters.push((row) => !compare(row[col], op, String(value)));
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }) {
    this.orderBy.push({ col, ascending: opts?.ascending !== false });
    return this;
  }

  limit(n: number) {
    this.limitN = n;
    return this;
  }

  range(from: number, to: number) {
    this.limitN = to - from + 1;
    return this;
  }

  single() {
    this.singleMode = 'single';
    return this;
  }

  maybeSingle() {
    this.singleMode = 'maybeSingle';
    return this;
  }

  then<T1 = PostgrestResult, T2 = never>(
    onfulfilled?: ((value: PostgrestResult) => T1 | PromiseLike<T1>) | null,
    onrejected?: ((reason: unknown) => T2 | PromiseLike<T2>) | null
  ): PromiseLike<T1 | T2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  private dexieTable() {
    const t = (db as unknown as Record<string, unknown>)[this.table];
    if (!t || typeof (t as { toArray?: unknown }).toArray !== 'function') return null;
    return t as typeof db.universities;
  }

  private async execute(): Promise<PostgrestResult> {
    try {
      await ensureSeeded();
      const table = this.dexieTable();
      if (!table) {
        return { data: this.singleMode ? null : [], error: { message: `Unknown table: ${this.table}` } };
      }

      if (this.op === 'insert') {
        const rows = (Array.isArray(this.payload) ? this.payload : [this.payload]) as Row[];
        const now = new Date().toISOString();
        const prepared = rows.map((r) => ({
          id: (r.id as string) || newId(),
          created_at: now,
          updated_at: now,
          ...r,
        }));
        await table.bulkPut(prepared);
        const data = Array.isArray(this.payload) ? prepared : prepared[0];
        return { data: this.singleMode || !Array.isArray(this.payload) ? prepared[0] : data, error: null };
      }

      // For select/update/delete: materialize matching rows.
      let rows = (await table.toArray()) as Row[];
      for (const f of this.filters) rows = rows.filter(f);

      if (this.op === 'update') {
        const values = this.payload as Row;
        const now = new Date().toISOString();
        const updated = rows.map((r) => ({ ...r, ...values, updated_at: now }));
        await table.bulkPut(updated as unknown as (Row & { id: string })[]);
        return { data: this.singleMode ? updated[0] ?? null : updated, error: null };
      }

      if (this.op === 'delete') {
        await table.bulkDelete(rows.map((r) => r.id as string));
        return { data: null, error: null };
      }

      // select
      for (const ord of [...this.orderBy].reverse()) {
        rows.sort((a, b) => {
          const av = a[ord.col];
          const bv = b[ord.col];
          if (av == null && bv == null) return 0;
          if (av == null) return 1;
          if (bv == null) return -1;
          const cmp = av < bv ? -1 : av > bv ? 1 : 0;
          return ord.ascending ? cmp : -cmp;
        });
      }
      if (this.limitN != null) rows = rows.slice(0, this.limitN);

      if (this.singleMode === 'single') {
        if (rows.length !== 1) {
          return rows.length === 0
            ? { data: null, error: { message: 'No rows found', code: 'PGRST116' } }
            : { data: rows[0], error: null };
        }
        return { data: rows[0], error: null };
      }
      if (this.singleMode === 'maybeSingle') {
        return { data: rows[0] ?? null, error: null };
      }
      return { data: rows, error: null, count: rows.length };
    } catch (e) {
      return { data: null, error: { message: e instanceof Error ? e.message : String(e) } };
    }
  }
}

// ---------------------------------------------------------------------------
// Auth — local accounts stored in IndexedDB, session in localStorage.
// ---------------------------------------------------------------------------

interface LocalSession {
  user: { id: string; email: string; user_metadata: Record<string, unknown> };
  access_token: string;
  expires_at?: number;
}

type AuthCallback = (event: string, session: LocalSession | null) => void;
const authListeners = new Set<AuthCallback>();

function readSession(): LocalSession | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as LocalSession) : null;
  } catch {
    return null;
  }
}

function writeSession(session: LocalSession | null, event: string) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  else localStorage.removeItem(SESSION_KEY);
  for (const cb of authListeners) cb(event, session);
}

async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode('iris-salt:' + password);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

const localAuth = {
  async getSession() {
    return { data: { session: readSession() }, error: null };
  },

  onAuthStateChange(callback: AuthCallback) {
    authListeners.add(callback);
    return {
      data: {
        subscription: {
          unsubscribe: () => {
            authListeners.delete(callback);
          },
        },
      },
    };
  },

  async signUp(opts: { email: string; password: string; options?: { data?: Record<string, unknown> } }) {
    await ensureSeeded();
    const email = opts.email.trim().toLowerCase();
    const existing = await db.auth_users.where('email').equals(email).first();
    if (existing) {
      return { data: { user: null, session: null }, error: new Error('An account with this email already exists') };
    }
    const id = newId();
    const fullName = (opts.options?.data?.full_name as string) ?? null;
    await db.auth_users.add({
      id,
      email,
      password_hash: await hashPassword(opts.password),
      user_metadata: opts.options?.data ?? {},
      created_at: new Date().toISOString(),
    });
    // Mirror the Supabase trigger that created a profiles row on signup.
    await db.profiles.put({
      id,
      email,
      full_name: fullName,
      phone: null,
      role: 'admin',
      university_id: null,
    });
    const session: LocalSession = {
      user: { id, email, user_metadata: opts.options?.data ?? {} },
      access_token: 'local-' + id,
    };
    writeSession(session, 'SIGNED_IN');
    return { data: { user: session.user, session }, error: null };
  },

  async signInWithPassword(opts: { email: string; password: string }) {
    await ensureSeeded();
    const email = opts.email.trim().toLowerCase();
    const user = (await db.auth_users.where('email').equals(email).first()) as Row | undefined;
    if (!user || user.password_hash !== (await hashPassword(opts.password))) {
      return { data: { user: null, session: null }, error: new Error('Invalid email or password') };
    }
    const session: LocalSession = {
      user: {
        id: user.id as string,
        email,
        user_metadata: (user.user_metadata as Record<string, unknown>) ?? {},
      },
      access_token: 'local-' + (user.id as string),
    };
    writeSession(session, 'SIGNED_IN');
    return { data: { user: session.user, session }, error: null };
  },

  async signOut() {
    writeSession(null, 'SIGNED_OUT');
    return { error: null };
  },
};

// ---------------------------------------------------------------------------
// Storage — file blobs in IndexedDB, served back as object URLs / data URLs.
// ---------------------------------------------------------------------------

const objectUrlCache = new Map<string, string>();

function storageBucket(bucket: string) {
  return {
    async upload(path: string, file: Blob) {
      try {
        await db.storage_files.put({
          id: `${bucket}/${path}`,
          bucket,
          path,
          blob: file,
          created_at: new Date().toISOString(),
        });
        objectUrlCache.set(`${bucket}/${path}`, URL.createObjectURL(file));
        return { data: { path }, error: null };
      } catch (e) {
        return { data: null, error: e instanceof Error ? e : new Error(String(e)) };
      }
    },
    getPublicUrl(path: string) {
      const key = `${bucket}/${path}`;
      const cached = objectUrlCache.get(key);
      if (cached) return { data: { publicUrl: cached } };
      // Hydrate the cache asynchronously so the URL works on next render.
      db.storage_files.get(key).then((rec) => {
        if (rec) objectUrlCache.set(key, URL.createObjectURL(rec.blob));
      });
      return { data: { publicUrl: `iris-local://${key}` } };
    },
    async download(path: string) {
      const rec = await db.storage_files.get(`${bucket}/${path}`);
      return rec
        ? { data: rec.blob, error: null }
        : { data: null, error: new Error('File not found') };
    },
    async remove(paths: string[]) {
      await db.storage_files.bulkDelete(paths.map((p) => `${bucket}/${p}`));
      return { data: paths, error: null };
    },
    async list() {
      const all = await db.storage_files.where('bucket').equals(bucket).toArray();
      return { data: all.map((f) => ({ name: f.path })), error: null };
    },
  };
}

// ---------------------------------------------------------------------------
// Assembled client
// ---------------------------------------------------------------------------

export const localClient = {
  from(table: string) {
    return new LocalQueryBuilder(table);
  },
  auth: localAuth,
  storage: {
    from: storageBucket,
  },
  functions: {
    async invoke(name: string, opts?: { body?: Record<string, unknown> }) {
      return invokeLocalFunction(name, opts?.body ?? {});
    },
  },
};
