/**
 * IRIS local database — IndexedDB via Dexie.
 *
 * This is the offline-first storage backing the whole app. All tables the
 * UI previously read from Supabase exist here with the same names and row
 * shapes, plus IRIS-specific tables (Data Library, IMG/IPI assessments,
 * local auth). Data lives entirely on the user's machine.
 */
import Dexie, { Table } from 'dexie';
import { TURKISH_UNIVERSITIES } from '@/data/turkishUniversities';

// Rows keep the exact shapes the UI already expects (see src/types/database.ts).
// Indexes: primary key `id` plus the columns the app filters on.
export class IrisDB extends Dexie {
  universities!: Table<Record<string, unknown>, string>;
  university_profiles!: Table<Record<string, unknown>, string>;
  profiles!: Table<Record<string, unknown>, string>;
  mous!: Table<Record<string, unknown>, string>;
  mou_history!: Table<Record<string, unknown>, string>;
  mobility_records!: Table<Record<string, unknown>, string>;
  partner_projects!: Table<Record<string, unknown>, string>;
  partner_roi!: Table<Record<string, unknown>, string>;
  partner_requests!: Table<Record<string, unknown>, string>;
  partner_messages!: Table<Record<string, unknown>, string>;
  partnership_interactions!: Table<Record<string, unknown>, string>;
  research_collaborations!: Table<Record<string, unknown>, string>;
  student_applications!: Table<Record<string, unknown>, string>;
  student_documents!: Table<Record<string, unknown>, string>;
  student_document_items!: Table<Record<string, unknown>, string>;
  courses!: Table<Record<string, unknown>, string>;
  faculties!: Table<Record<string, unknown>, string>;
  departments!: Table<Record<string, unknown>, string>;
  faculty_exchanges!: Table<Record<string, unknown>, string>;
  learning_agreements!: Table<Record<string, unknown>, string>;
  mobility_tasks!: Table<Record<string, unknown>, string>;
  document_requirement_templates!: Table<Record<string, unknown>, string>;
  country_document_rules!: Table<Record<string, unknown>, string>;
  ai_evaluations!: Table<Record<string, unknown>, string>;

  // IRIS desktop additions
  auth_users!: Table<Record<string, unknown>, string>;
  storage_files!: Table<{ id: string; bucket: string; path: string; blob: Blob; created_at: string }, string>;
  library_documents!: Table<Record<string, unknown>, string>;
  library_chunks!: Table<Record<string, unknown>, string>;
  img_ipi_assessments!: Table<Record<string, unknown>, string>;
  meeting_leads!: Table<Record<string, unknown>, string>;

  constructor() {
    super('iris-local-db');
    this.version(1).stores({
      universities: 'id, name, country',
      university_profiles: 'id, university_id',
      profiles: 'id, email, university_id',
      mous: 'id, initiator_university_id, partner_university_id, status',
      mou_history: 'id, mou_id',
      mobility_records: 'id, university_id, partner_university_id',
      partner_projects: 'id, university_id, partner_university_id',
      partner_roi: 'id, university_id, partner_university_id',
      partner_requests: 'id, from_university_id, to_university_id',
      partner_messages: 'id, from_university_id, to_university_id',
      partnership_interactions: 'id, university_id, partner_university_id',
      research_collaborations: 'id, university_id, partner_university_id',
      student_applications: 'id, university_id',
      student_documents: 'id, university_id',
      student_document_items: 'id, student_document_id',
      courses: 'id, university_id, department_id',
      faculties: 'id, university_id',
      departments: 'id, faculty_id',
      faculty_exchanges: 'id, university_id',
      learning_agreements: 'id, student_application_id',
      mobility_tasks: 'id, student_application_id',
      document_requirement_templates: 'id, country',
      country_document_rules: 'id, country',
      ai_evaluations: 'id, university_id, evaluation_type',
      auth_users: 'id, email',
      storage_files: 'id, bucket, path',
      library_documents: 'id, university_id, title, created_at',
      library_chunks: 'id, document_id',
      img_ipi_assessments: 'id, university_id, created_at',
    });
    // v2 — Meeting Radar: leads found by scanning the connected work mailbox.
    this.version(2).stores({
      meeting_leads: 'id, university_id, email_date, status',
    });
  }
}

export const db = new IrisDB();

let seedPromise: Promise<void> | null = null;

/** Seed the universities table with the bundled real-world dataset on first run. */
export function ensureSeeded(): Promise<void> {
  if (!seedPromise) {
    seedPromise = (async () => {
      const count = await db.universities.count();
      if (count === 0) {
        await db.universities.bulkAdd(TURKISH_UNIVERSITIES as unknown as Record<string, unknown>[]);
      }
      // International partner network (added after the Turkish registry
      // shipped, so also top up existing installations).
      const intlExisting = await db.universities.get('int-tum');
      if (!intlExisting) {
        const { INTERNATIONAL_UNIVERSITIES } = await import('@/data/internationalUniversities');
        await db.universities.bulkPut(
          INTERNATIONAL_UNIVERSITIES as unknown as (Record<string, unknown> & { id: string })[]
        );
      }
      // Demo operational dataset — idempotent, fills only empty tables
      // (dynamic import avoids a circular module dependency).
      const { ensureDemoData } = await import('@/data/demoSeed');
      await ensureDemoData();
    })();
    // Surface seeding failures instead of silently caching a rejection.
    seedPromise = seedPromise.catch((e) => {
      console.error('[IRIS] Seeding failed:', e);
      seedPromise = null;
      throw e;
    });
  }
  return seedPromise;
}

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}
