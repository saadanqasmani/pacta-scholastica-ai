import { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookMarked,
  Plus,
  Lock,
  Users,
  FileText,
  Link2,
  StickyNote,
  Trash2,
  Upload,
  Loader2,
  ExternalLink,
  Pencil,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useUniversity } from '@/contexts/UniversityContext';
import { cn } from '@/lib/utils';
import { ingestFile, listDocuments, downloadOriginal, type LibraryDocument } from '@/lib/libraryIndex';
import {
  SHELF_COLORS,
  addShelfItem,
  deleteShelf,
  ensureStarterShelves,
  listShelfItems,
  listShelves,
  removeShelfItem,
  saveShelf,
  shelfColor,
  type Shelf,
  type ShelfColor,
  type ShelfItem,
} from '@/lib/shelves';

type ShelfWithCount = Shelf & { count: number };

function ShelfForm({
  initial,
  onSave,
  onCancel,
}: {
  initial?: Partial<Shelf>;
  onSave: (v: { name: string; description: string; color: ShelfColor; is_shared: boolean }) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initial?.name ?? '');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [color, setColor] = useState<ShelfColor>((initial?.color as ShelfColor) ?? 'blue');
  const [shared, setShared] = useState(initial?.is_shared ?? true);
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Name</Label>
        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Partner due diligence" />
      </div>
      <div className="space-y-1.5">
        <Label>Description (optional)</Label>
        <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="space-y-1.5">
        <Label>Colour</Label>
        <div className="flex gap-2">
          {SHELF_COLORS.map((c) => (
            <button
              key={c.value}
              type="button"
              aria-label={c.value}
              onClick={() => setColor(c.value)}
              className={cn(
                'h-8 w-8 rounded-full ring-offset-2 ring-offset-background transition',
                c.dot,
                color === c.value ? 'ring-2 ring-primary' : 'opacity-70 hover:opacity-100'
              )}
            />
          ))}
        </div>
      </div>
      <div className="flex items-center justify-between rounded-xl border p-3">
        <div>
          <div className="text-sm font-medium">Shared with everyone on IRIS</div>
          <div className="text-xs text-muted-foreground">Turn off to keep this shelf private to you.</div>
        </div>
        <Switch checked={shared} onCheckedChange={setShared} />
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          disabled={!name.trim()}
          onClick={() => onSave({ name, description, color, is_shared: shared })}
        >
          Save shelf
        </Button>
      </div>
    </div>
  );
}

function ShelfDetail({
  shelf,
  canEdit,
  onChanged,
  onEdit,
  onDelete,
}: {
  shelf: ShelfWithCount;
  canEdit: boolean;
  onChanged: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const { profile, user } = useAuth();
  const { selectedUniversity } = useUniversity();
  const [items, setItems] = useState<ShelfItem[]>([]);
  const [docs, setDocs] = useState<LibraryDocument[]>([]);
  const [docChoice, setDocChoice] = useState('');
  const [link, setLink] = useState({ title: '', url: '' });
  const [note, setNote] = useState({ title: '', text: '' });
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const author = profile?.full_name || user?.email || null;

  const load = async () => setItems(await listShelfItems(shelf.id));
  useEffect(() => {
    load();
    listDocuments().then(setDocs);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shelf.id]);

  const onShelf = useMemo(() => new Set(items.map((i) => i.document_id)), [items]);
  const docById = useMemo(() => new Map(docs.map((d) => [d.id, d])), [docs]);

  const add = async (item: Omit<ShelfItem, 'id' | 'created_at'>) => {
    await addShelfItem(item);
    await load();
    onChanged();
  };

  const icon = (k: ShelfItem['kind']) => (k === 'document' ? FileText : k === 'link' ? Link2 : StickyNote);

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        {items.length === 0 && (
          <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
            This shelf is empty. Add a document, a link or a note below.
          </p>
        )}
        {items.map((it) => {
          const Icon = icon(it.kind);
          const doc = it.document_id ? docById.get(it.document_id) : undefined;
          return (
            <div key={it.id} className="flex items-start gap-3 rounded-xl border bg-background/40 p-3">
              <Icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium leading-snug">{it.title}</div>
                {it.kind === 'note' && it.note && (
                  <p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{it.note}</p>
                )}
                {it.kind === 'link' && it.url && (
                  <a
                    href={it.url}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-0.5 flex items-center gap-1 truncate text-xs text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3 shrink-0" />
                    <span className="truncate">{it.url}</span>
                  </a>
                )}
                {it.kind === 'document' && (
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    In the Data Library{doc ? ` · ${doc.filetype}` : ''} — searchable by Ask IRIS
                  </div>
                )}
              </div>
              {it.kind === 'document' && doc && !doc.id.startsWith('lit-') && !doc.id.startsWith('demo-brief-') && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Download"
                  onClick={() => downloadOriginal(doc).catch((e) => toast.error(e.message))}
                >
                  <FileText className="h-4 w-4" />
                </Button>
              )}
              {canEdit && (
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Remove from shelf"
                  onClick={async () => {
                    await removeShelfItem(it.id);
                    await load();
                    onChanged();
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          );
        })}
      </div>

      {canEdit && (
        <Tabs defaultValue="document">
          <TabsList>
            <TabsTrigger value="document">
              <FileText className="mr-1 h-4 w-4" /> Document
            </TabsTrigger>
            <TabsTrigger value="link">
              <Link2 className="mr-1 h-4 w-4" /> Link
            </TabsTrigger>
            <TabsTrigger value="note">
              <StickyNote className="mr-1 h-4 w-4" /> Note
            </TabsTrigger>
          </TabsList>
          <TabsContent value="document" className="space-y-3 pt-2">
            <div className="flex flex-col gap-2 sm:flex-row">
              <Select value={docChoice} onValueChange={setDocChoice}>
                <SelectTrigger className="sm:flex-1">
                  <SelectValue placeholder="Choose from the Data Library" />
                </SelectTrigger>
                <SelectContent className="max-h-72">
                  {docs
                    .filter((d) => !onShelf.has(d.id))
                    .map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.title}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              <Button
                disabled={!docChoice}
                onClick={async () => {
                  const d = docById.get(docChoice);
                  if (!d) return;
                  await add({
                    shelf_id: shelf.id,
                    kind: 'document',
                    title: d.title,
                    document_id: d.id,
                    url: null,
                    note: null,
                    created_by_name: author,
                  });
                  setDocChoice('');
                }}
              >
                <Plus className="mr-1 h-4 w-4" /> Add
              </Button>
            </div>
            <input
              ref={fileRef}
              type="file"
              className="hidden"
              accept=".pdf,.docx,.txt,.md,.csv,.json,.html,.htm"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setUploading(true);
                try {
                  const doc = await ingestFile(file, { universityId: selectedUniversity?.id ?? null });
                  await add({
                    shelf_id: shelf.id,
                    kind: 'document',
                    title: doc.title,
                    document_id: doc.id,
                    url: null,
                    note: null,
                    created_by_name: author,
                  });
                  setDocs(await listDocuments());
                  toast.success(`${doc.title} added to the library and this shelf.`);
                } catch (err) {
                  toast.error(err instanceof Error ? err.message : 'Upload failed');
                } finally {
                  setUploading(false);
                  if (fileRef.current) fileRef.current.value = '';
                }
              }}
            />
            <Button variant="outline" disabled={uploading} onClick={() => fileRef.current?.click()}>
              {uploading ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Upload className="mr-1 h-4 w-4" />}
              Upload a new file
            </Button>
          </TabsContent>
          <TabsContent value="link" className="space-y-2 pt-2">
            <Input placeholder="Title" value={link.title} onChange={(e) => setLink({ ...link, title: e.target.value })} />
            <Input placeholder="https://…" value={link.url} onChange={(e) => setLink({ ...link, url: e.target.value })} />
            <Button
              disabled={!link.title.trim() || !/^https?:\/\//i.test(link.url.trim())}
              onClick={async () => {
                await add({
                  shelf_id: shelf.id,
                  kind: 'link',
                  title: link.title.trim(),
                  document_id: null,
                  url: link.url.trim(),
                  note: null,
                  created_by_name: author,
                });
                setLink({ title: '', url: '' });
              }}
            >
              <Plus className="mr-1 h-4 w-4" /> Add link
            </Button>
          </TabsContent>
          <TabsContent value="note" className="space-y-2 pt-2">
            <Input placeholder="Title" value={note.title} onChange={(e) => setNote({ ...note, title: e.target.value })} />
            <Textarea rows={3} placeholder="Write a note…" value={note.text} onChange={(e) => setNote({ ...note, text: e.target.value })} />
            <Button
              disabled={!note.title.trim()}
              onClick={async () => {
                await add({
                  shelf_id: shelf.id,
                  kind: 'note',
                  title: note.title.trim(),
                  document_id: null,
                  url: null,
                  note: note.text.trim() || null,
                  created_by_name: author,
                });
                setNote({ title: '', text: '' });
              }}
            >
              <Plus className="mr-1 h-4 w-4" /> Add note
            </Button>
          </TabsContent>
        </Tabs>
      )}

      {canEdit && (
        <div className="flex justify-between border-t pt-4">
          <Button variant="ghost" className="text-destructive" onClick={onDelete}>
            <Trash2 className="mr-1 h-4 w-4" /> Delete shelf
          </Button>
          <Button variant="outline" onClick={onEdit}>
            <Pencil className="mr-1 h-4 w-4" /> Edit shelf
          </Button>
        </div>
      )}
    </div>
  );
}

export function ShelvesPanel() {
  const { user, profile } = useAuth();
  const { isMaster } = useUniversity();
  const [shelves, setShelves] = useState<ShelfWithCount[]>([]);
  const [open, setOpen] = useState<ShelfWithCount | null>(null);
  const [form, setForm] = useState<{ mode: 'create' } | { mode: 'edit'; shelf: Shelf } | null>(null);
  const userId = user?.id ?? null;

  const refresh = async () => {
    await ensureStarterShelves();
    const list = await listShelves(userId);
    setShelves(list);
    setOpen((cur) => (cur ? list.find((s) => s.id === cur.id) ?? null : null));
  };
  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const canEdit = (s: Shelf) => s.owner_id === userId || isMaster;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Group documents, links and notes into shelves. Shared shelves are visible to everyone using IRIS
          on this device.
        </p>
        <Button onClick={() => setForm({ mode: 'create' })}>
          <Plus className="mr-1 h-4 w-4" /> New shelf
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {shelves.map((s) => {
          const c = shelfColor(s.color);
          return (
            <Card
              key={s.id}
              role="button"
              tabIndex={0}
              onClick={() => setOpen(s)}
              onKeyDown={(e) => e.key === 'Enter' && setOpen(s)}
              className={cn('cursor-pointer bg-gradient-to-br to-transparent transition hover:-translate-y-0.5', c.tint)}
            >
              <CardContent className="space-y-3 p-5">
                <div className="flex items-start justify-between gap-2">
                  <span className={cn('flex h-10 w-10 items-center justify-center rounded-2xl text-white', c.dot)}>
                    <BookMarked className="h-5 w-5" />
                  </span>
                  <Badge variant="outline" className="gap-1">
                    {s.is_shared ? <Users className="h-3 w-3" /> : <Lock className="h-3 w-3" />}
                    {s.is_shared ? 'Shared' : 'Private'}
                  </Badge>
                </div>
                <div>
                  <div className="font-semibold leading-snug">{s.name}</div>
                  {s.description && <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{s.description}</p>}
                </div>
                <div className="text-xs text-muted-foreground">
                  {s.count} item{s.count === 1 ? '' : 's'} · {s.owner_name ?? 'You'}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Dialog open={!!open} onOpenChange={(v) => !v && setOpen(null)}>
        <DialogContent className="max-w-2xl">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <span className={cn('h-3 w-3 rounded-full', shelfColor(open.color).dot)} />
                  {open.name}
                </DialogTitle>
                {open.description && <DialogDescription>{open.description}</DialogDescription>}
              </DialogHeader>
              <ShelfDetail
                shelf={open}
                canEdit={canEdit(open)}
                onChanged={refresh}
                onEdit={() => setForm({ mode: 'edit', shelf: open })}
                onDelete={async () => {
                  await deleteShelf(open.id);
                  setOpen(null);
                  toast.success('Shelf deleted');
                  refresh();
                }}
              />
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!form} onOpenChange={(v) => !v && setForm(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{form?.mode === 'edit' ? 'Edit shelf' : 'New shelf'}</DialogTitle>
          </DialogHeader>
          {form && (
            <ShelfForm
              initial={form.mode === 'edit' ? form.shelf : undefined}
              onCancel={() => setForm(null)}
              onSave={async (v) => {
                await saveShelf(
                  { ...v, id: form.mode === 'edit' ? form.shelf.id : undefined },
                  { id: userId ?? 'local', name: profile?.full_name ?? user?.email ?? null }
                );
                setForm(null);
                toast.success('Shelf saved');
                refresh();
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
