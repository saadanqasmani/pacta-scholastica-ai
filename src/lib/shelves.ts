/**
 * Library shelves — named collections inside the Data Library.
 *
 * Ported from the cloud "book shelves" feature to the offline database.
 * A shelf holds library documents (which stay searchable by Ask IRIS),
 * web links and notes. Shared shelves are visible to every account on
 * this installation; private shelves only to their owner.
 */
import { db, newId } from '@/lib/localdb';

export type ShelfColor = 'blue' | 'green' | 'amber' | 'purple' | 'rose' | 'slate';

export interface Shelf {
  id: string;
  owner_id: string;
  owner_name: string | null;
  name: string;
  description: string | null;
  color: ShelfColor;
  is_shared: boolean;
  created_at: string;
  updated_at: string;
}

export type ShelfItemKind = 'document' | 'link' | 'note';

export interface ShelfItem {
  id: string;
  shelf_id: string;
  kind: ShelfItemKind;
  title: string;
  document_id: string | null;
  url: string | null;
  note: string | null;
  created_by_name: string | null;
  created_at: string;
}

export const SHELF_COLORS: { value: ShelfColor; dot: string; tint: string }[] = [
  { value: 'blue', dot: 'bg-blue-500', tint: 'from-blue-500/20' },
  { value: 'green', dot: 'bg-emerald-500', tint: 'from-emerald-500/20' },
  { value: 'amber', dot: 'bg-amber-500', tint: 'from-amber-500/20' },
  { value: 'purple', dot: 'bg-violet-500', tint: 'from-violet-500/20' },
  { value: 'rose', dot: 'bg-rose-500', tint: 'from-rose-500/20' },
  { value: 'slate', dot: 'bg-slate-500', tint: 'from-slate-500/20' },
];

export const shelfColor = (c: string | null | undefined) =>
  SHELF_COLORS.find((x) => x.value === c) ?? SHELF_COLORS[0];

const now = () => new Date().toISOString();

/** Starter shelves curated from the bundled literature and handbooks. */
const STARTER_SHELVES: { id: string; name: string; description: string; color: ShelfColor; docs: string[] }[] = [
  {
    id: 'shelf-starter-erasmus',
    name: 'Erasmus+ essentials',
    description: 'Programme rules, credit recognition and the mobility handbook.',
    color: 'blue',
    docs: ['demo-handbook-erasmus-ka171-guide.md', 'demo-handbook-partnership-handbook.md'],
  },
  {
    id: 'shelf-starter-strategy',
    name: 'Internationalization strategy',
    description: 'Foundational scholarship on what internationalization is and how to lead it.',
    color: 'purple',
    docs: [],
  },
  {
    id: 'shelf-starter-admissions',
    name: 'Admissions & recognition',
    description: 'Requirements, diploma equivalency and recognition conventions.',
    color: 'amber',
    docs: ['demo-handbook-admission-requirements.txt'],
  },
];

/** Literature matched to starter shelves by keywords in their titles. */
const STARTER_KEYWORDS: Record<string, RegExp> = {
  'shelf-starter-erasmus': /erasmus|ects|bologna|charter for higher education/i,
  'shelf-starter-strategy': /internationali[sz]ation|comprehensive|knight|de wit/i,
  'shelf-starter-admissions': /lisbon|recognition|global convention|cross-border/i,
};

export async function ensureStarterShelves(): Promise<void> {
  if (await db.library_shelves.get(STARTER_SHELVES[0].id)) return;
  const docs = (await db.library_documents.toArray()) as { id: string; title: string }[];
  const docIds = new Set(docs.map((d) => d.id));
  for (const s of STARTER_SHELVES) {
    await db.library_shelves.put({
      id: s.id,
      owner_id: 'system',
      owner_name: 'IRIS',
      name: s.name,
      description: s.description,
      color: s.color,
      is_shared: true,
      created_at: now(),
      updated_at: now(),
    });
    const matched = docs
      .filter((d) => d.id.startsWith('lit-') && STARTER_KEYWORDS[s.id]?.test(d.title))
      .slice(0, 8)
      .map((d) => d.id);
    const ids = [...s.docs.filter((id) => docIds.has(id)), ...matched];
    await db.library_shelf_items.bulkPut(
      ids.map((docId) => ({
        id: `${s.id}-${docId}`,
        shelf_id: s.id,
        kind: 'document',
        title: docs.find((d) => d.id === docId)?.title ?? 'Document',
        document_id: docId,
        url: null,
        note: null,
        created_by_name: 'IRIS',
        created_at: now(),
      }))
    );
  }
}

/** Shelves visible to this user: all shared shelves plus their own. */
export async function listShelves(userId: string | null): Promise<(Shelf & { count: number })[]> {
  const shelves = (await db.library_shelves.toArray()) as unknown as Shelf[];
  const items = (await db.library_shelf_items.toArray()) as unknown as ShelfItem[];
  return shelves
    .filter((s) => s.is_shared || s.owner_id === userId)
    .map((s) => ({ ...s, count: items.filter((i) => i.shelf_id === s.id).length }))
    .sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export async function saveShelf(
  input: Pick<Shelf, 'name' | 'description' | 'color' | 'is_shared'> & { id?: string },
  owner: { id: string; name: string | null }
): Promise<string> {
  const existing = input.id ? ((await db.library_shelves.get(input.id)) as unknown as Shelf | undefined) : undefined;
  const id = existing?.id ?? newId();
  await db.library_shelves.put({
    id,
    owner_id: existing?.owner_id ?? owner.id,
    owner_name: existing?.owner_name ?? owner.name,
    name: input.name.trim(),
    description: input.description?.trim() || null,
    color: input.color,
    is_shared: input.is_shared,
    created_at: existing?.created_at ?? now(),
    updated_at: now(),
  });
  return id;
}

export async function deleteShelf(id: string): Promise<void> {
  await db.library_shelf_items.where('shelf_id').equals(id).delete();
  await db.library_shelves.delete(id);
}

export async function listShelfItems(shelfId: string): Promise<ShelfItem[]> {
  const items = (await db.library_shelf_items.where('shelf_id').equals(shelfId).toArray()) as unknown as ShelfItem[];
  return items.sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export async function addShelfItem(
  item: Omit<ShelfItem, 'id' | 'created_at'>
): Promise<void> {
  await db.library_shelf_items.put({ ...item, id: newId(), created_at: now() });
}

export async function removeShelfItem(id: string): Promise<void> {
  await db.library_shelf_items.delete(id);
}
