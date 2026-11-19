// IRIS desktop runs fully offline: the app-wide `supabase` export is now the
// local IndexedDB-backed client (see src/lib/localClient.ts), which implements
// the same API surface. Every existing query in the codebase keeps working,
// but reads/writes local data instead of the cloud.
//
// The original Supabase client is preserved below (commented) in case a
// cloud-sync mode is reintroduced later:
//
// import { createClient } from '@supabase/supabase-js';
// import type { Database } from './types';
// const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
// const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
// export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
//   auth: { storage: localStorage, persistSession: true, autoRefreshToken: true }
// });

import { localClient } from '@/lib/localClient';

// Typed as `any` deliberately: call sites use the supabase-js fluent API and
// destructure { data, error } — the local client returns the same shapes.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = localClient as any;
