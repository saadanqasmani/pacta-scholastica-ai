import { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Library,
  Upload,
  Search,
  FileText,
  Trash2,
  Download,
  Loader2,
  HelpCircle,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';
import { useUniversity } from '@/contexts/UniversityContext';
import {
  ingestFile,
  listDocuments,
  deleteDocument,
  searchLibrary,
  downloadOriginal,
  LibraryDocument,
  SearchHit,
} from '@/lib/libraryIndex';

function formatSize(bytes: number): string {
  if (bytes > 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  if (bytes > 1024) return (bytes / 1024).toFixed(0) + ' KB';
  return bytes + ' B';
}

/** Highlight matched terms inside a passage. */
function Passage({ text, terms }: { text: string; terms: string[] }) {
  if (terms.length === 0) return <>{text}</>;
  const pattern = new RegExp(
    `(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
    'gi'
  );
  const parts = text.split(pattern);
  return (
    <>
      {parts.map((part, i) =>
        pattern.test(part) ? (
          <mark key={i} className="bg-yellow-100 rounded px-0.5">
            {part}
          </mark>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

export default function DataLibrary() {
  const { universities, selectedUniversity } = useUniversity();
  const [documents, setDocuments] = useState<LibraryDocument[]>([]);
  const [uploading, setUploading] = useState(false);
  const [linkTo, setLinkTo] = useState<string>('none');
  const [question, setQuestion] = useState('');
  const [hits, setHits] = useState<SearchHit[] | null>(null);
  const [searching, setSearching] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const refresh = async () => setDocuments(await listDocuments());

  useEffect(() => {
    refresh();
  }, []);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    let ok = 0;
    for (const file of Array.from(files)) {
      try {
        await ingestFile(file, { universityId: linkTo === 'none' ? null : linkTo });
        ok++;
      } catch (e) {
        toast.error(e instanceof Error ? e.message : `Failed to read ${file.name}`);
      }
    }
    setUploading(false);
    if (ok > 0) {
      toast.success(`${ok} file${ok > 1 ? 's' : ''} added to the library and indexed.`);
      refresh();
    }
    if (fileInput.current) fileInput.current.value = '';
  };

  const handleAsk = async () => {
    const q = question.trim();
    if (!q) return;
    setSearching(true);
    try {
      const results = await searchLibrary(q);
      setHits(results);
    } finally {
      setSearching(false);
    }
  };

  const universityName = (id: string | null) =>
    id ? universities.find((u) => u.id === id)?.name ?? 'Unknown university' : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Library className="h-7 w-7 text-primary" />
          Data Library
        </h1>
        <p className="text-muted-foreground">
          Your institutional knowledge repository. Upload documents and ask questions — answers are
          retrieved directly from your files by a local search engine. Works fully offline, no AI involved.
        </p>
      </div>

      <Tabs defaultValue="ask">
        <TabsList>
          <TabsTrigger value="ask">
            <HelpCircle className="h-4 w-4 mr-1" /> Ask the library
          </TabsTrigger>
          <TabsTrigger value="documents">
            <FileText className="h-4 w-4 mr-1" /> Documents ({documents.length})
          </TabsTrigger>
        </TabsList>

        {/* -------------------------------- ASK -------------------------------- */}
        <TabsContent value="ask" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Ask a question</CardTitle>
              <CardDescription>
                The library finds the most relevant passages across all your uploaded documents and shows
                them with their sources.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-2">
              <Input
                placeholder="e.g. What are the admission requirements for exchange students?"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
              />
              <Button onClick={handleAsk} disabled={searching || documents.length === 0}>
                {searching ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                <span className="ml-1">Search</span>
              </Button>
            </CardContent>
          </Card>

          {documents.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                The library is empty. Upload documents in the Documents tab to start asking questions.
              </CardContent>
            </Card>
          )}

          {hits !== null && (
            <div className="space-y-3">
              {hits.length === 0 ? (
                <Card>
                  <CardContent className="py-8 text-center text-sm text-muted-foreground">
                    No relevant passages found. Try different keywords.
                  </CardContent>
                </Card>
              ) : (
                hits.map((hit, idx) => (
                  <Card key={hit.chunkId}>
                    <CardContent className="py-4 space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Badge variant="secondary">#{idx + 1}</Badge>
                          <FileText className="h-3 w-3" />
                          <span className="font-medium">{hit.documentTitle}</span>
                        </div>
                        <span className="text-xs text-muted-foreground font-mono">
                          relevance {hit.score.toFixed(1)}
                        </span>
                      </div>
                      <p className="text-sm leading-relaxed">
                        <Passage text={hit.text} terms={hit.terms} />
                      </p>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>

        {/* ----------------------------- DOCUMENTS ----------------------------- */}
        <TabsContent value="documents" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Upload documents</CardTitle>
              <CardDescription>
                PDF, Word (.docx), text, Markdown, CSV, JSON or HTML. Files are parsed and indexed locally —
                nothing leaves your computer.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex flex-col md:flex-row gap-2">
                <Select value={linkTo} onValueChange={setLinkTo}>
                  <SelectTrigger className="md:w-96">
                    <SelectValue placeholder="Link uploads to a university (optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No university link (general knowledge)</SelectItem>
                    {selectedUniversity && (
                      <SelectItem value={selectedUniversity.id}>
                        {selectedUniversity.name} (current)
                      </SelectItem>
                    )}
                    {universities
                      .filter((u) => u.id !== selectedUniversity?.id)
                      .map((u) => (
                        <SelectItem key={u.id} value={u.id}>
                          {u.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <input
                  ref={fileInput}
                  type="file"
                  multiple
                  accept=".pdf,.docx,.txt,.md,.csv,.json,.html,.htm"
                  className="hidden"
                  onChange={(e) => handleFiles(e.target.files)}
                />
                <Button onClick={() => fileInput.current?.click()} disabled={uploading}>
                  {uploading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-1" />
                  ) : (
                    <Upload className="h-4 w-4 mr-1" />
                  )}
                  Choose files
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-2">
            {documents.map((doc) => (
              <Card key={doc.id}>
                <CardContent className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium truncate">{doc.title}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">{doc.filetype}</Badge>
                      {formatSize(doc.size)} · {doc.chunk_count} passages ·{' '}
                      {new Date(doc.created_at).toLocaleDateString()}
                      {doc.university_id && (
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" /> {universityName(doc.university_id)}
                        </span>
                      )}
                    </p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => downloadOriginal(doc).catch((e) => toast.error(e.message))}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        await deleteDocument(doc.id);
                        toast.success('Document removed');
                        refresh();
                        setHits(null);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
