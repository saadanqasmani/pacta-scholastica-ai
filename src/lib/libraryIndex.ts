/**
 * Data Library — local document ingestion and search. No AI involved.
 *
 * Files uploaded by the user are parsed to plain text in the browser
 * (PDF via pdfjs, Word via mammoth, plus txt/md/csv/json natively),
 * split into passages, and indexed with MiniSearch (BM25-style fuzzy
 * full-text search). Questions are answered by returning the most
 * relevant passages with their source documents — classic information
 * retrieval, fully offline.
 */
import MiniSearch from 'minisearch';
import { db, newId } from '@/lib/localdb';

export interface LibraryDocument {
  id: string;
  title: string;
  filename: string;
  filetype: string;
  size: number;
  university_id: string | null; // linked university profile, if any
  chunk_count: number;
  created_at: string;
}

export interface LibraryChunk {
  id: string;
  document_id: string;
  seq: number;
  text: string;
}

export interface SearchHit {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  text: string;
  score: number;
  terms: string[];
}

// ---------------------------------------------------------------------------
// Text extraction
// ---------------------------------------------------------------------------

export async function extractText(file: File): Promise<string> {
  const name = file.name.toLowerCase();

  if (name.endsWith('.pdf')) {
    const pdfjs = await import('pdfjs-dist');
    const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
    const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
    const pages: string[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const content = await page.getTextContent();
      pages.push(
        content.items
          .map((it) => ('str' in it ? (it as { str: string }).str : ''))
          .join(' ')
      );
    }
    return pages.join('\n\n');
  }

  if (name.endsWith('.docx')) {
    const mammoth = await import('mammoth');
    const result = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() });
    return result.value;
  }

  if (/\.(txt|md|csv|json|html|htm)$/.test(name)) {
    const text = await file.text();
    // Strip tags from HTML files so search hits read cleanly.
    if (/\.(html|htm)$/.test(name)) {
      const div = document.createElement('div');
      div.innerHTML = text;
      return div.textContent ?? '';
    }
    return text;
  }

  throw new Error(`Unsupported file type: ${file.name}. Supported: PDF, DOCX, TXT, MD, CSV, JSON, HTML.`);
}

/** Split text into overlapping passages of roughly `target` characters,
 *  breaking on sentence/paragraph boundaries where possible. */
export function chunkText(text: string, target = 700): string[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return [];
  const sentences = clean.split(/(?<=[.!?])\s+/);
  const chunks: string[] = [];
  let current = '';
  for (const s of sentences) {
    if (current && current.length + s.length + 1 > target) {
      chunks.push(current);
      // Overlap: carry the last sentence over so answers spanning a
      // boundary are still findable.
      current = current.split(/(?<=[.!?])\s+/).slice(-1).join(' ') + ' ' + s;
    } else {
      current = current ? current + ' ' + s : s;
    }
  }
  if (current.trim()) chunks.push(current.trim());
  return chunks;
}

// ---------------------------------------------------------------------------
// Ingestion
// ---------------------------------------------------------------------------

export async function ingestFile(
  file: File,
  opts?: { universityId?: string | null; title?: string }
): Promise<LibraryDocument> {
  const text = await extractText(file);
  const chunks = chunkText(text);
  if (chunks.length === 0) throw new Error(`No readable text found in ${file.name}`);

  const docId = newId();
  const docRow: LibraryDocument = {
    id: docId,
    title: opts?.title || file.name.replace(/\.[^.]+$/, ''),
    filename: file.name,
    filetype: file.name.split('.').pop()?.toUpperCase() ?? '',
    size: file.size,
    university_id: opts?.universityId ?? null,
    chunk_count: chunks.length,
    created_at: new Date().toISOString(),
  };

  await db.library_documents.add(docRow as unknown as Record<string, unknown>);
  await db.library_chunks.bulkAdd(
    chunks.map((text, seq) => ({ id: `${docId}-${seq}`, document_id: docId, seq, text }))
  );
  // Keep the original file too, so it can be re-downloaded.
  await db.storage_files.put({
    id: `library/${docId}/${file.name}`,
    bucket: 'library',
    path: `${docId}/${file.name}`,
    blob: file,
    created_at: docRow.created_at,
  });

  invalidateIndex();
  return docRow;
}

export async function deleteDocument(docId: string): Promise<void> {
  const doc = (await db.library_documents.get(docId)) as unknown as LibraryDocument | undefined;
  await db.library_chunks.where('document_id').equals(docId).delete();
  await db.library_documents.delete(docId);
  if (doc) await db.storage_files.delete(`library/${docId}/${doc.filename}`);
  invalidateIndex();
}

export async function listDocuments(): Promise<LibraryDocument[]> {
  const docs = (await db.library_documents.toArray()) as unknown as LibraryDocument[];
  return docs.sort((a, b) => b.created_at.localeCompare(a.created_at));
}

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

let index: MiniSearch | null = null;
let indexedDocTitles = new Map<string, string>();

function invalidateIndex() {
  index = null;
}

async function buildIndex(): Promise<MiniSearch> {
  if (index) return index;
  const chunks = (await db.library_chunks.toArray()) as unknown as LibraryChunk[];
  const docs = (await db.library_documents.toArray()) as unknown as LibraryDocument[];
  indexedDocTitles = new Map(docs.map((d) => [d.id, d.title]));

  const mini = new MiniSearch({
    fields: ['text'],
    storeFields: ['text', 'document_id'],
    searchOptions: {
      boost: { text: 1 },
      fuzzy: 0.2,
      prefix: true,
      combineWith: 'OR',
    },
  });
  mini.addAll(chunks.map((c) => ({ id: c.id, text: c.text, document_id: c.document_id })));
  index = mini;
  return mini;
}

/** Answer a question by retrieving the most relevant passages. Pure IR — no AI. */
export async function searchLibrary(question: string, limit = 8): Promise<SearchHit[]> {
  const mini = await buildIndex();
  const results = mini.search(question);
  return results.slice(0, limit).map((r) => ({
    chunkId: String(r.id),
    documentId: r.document_id as string,
    documentTitle: indexedDocTitles.get(r.document_id as string) ?? 'Unknown document',
    text: r.text as string,
    score: r.score,
    terms: r.terms,
  }));
}

export async function downloadOriginal(doc: LibraryDocument): Promise<void> {
  const rec = await db.storage_files.get(`library/${doc.id}/${doc.filename}`);
  if (!rec) throw new Error('Original file not found');
  const url = URL.createObjectURL(rec.blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = doc.filename;
  a.click();
  URL.revokeObjectURL(url);
}
