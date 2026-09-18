import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { ITEM_TYPES, formatFileSize, getShelfColor, type LibraryItem, type LibraryShelf } from './types';
import {
  BookMarked, Plus, Trash2, ExternalLink, Download, FileText, Link as LinkIcon,
  StickyNote, Video, Presentation, BookOpen, RefreshCw, Upload, X, User,
} from 'lucide-react';

interface ShelfDetailDialogProps {
  shelf: LibraryShelf | null;
  items: LibraryItem[];
  isOwner: boolean;
  userId: string | null;
  userName: string | null;
  onOpenChange: (open: boolean) => void;
  onChanged: () => void;
}

const MAX_FILE_SIZE = 50 * 1024 * 1024;

const getItemIcon = (type: string) => {
  switch (type) {
    case 'pdf': return <FileText className="h-4 w-4" />;
    case 'article': return <FileText className="h-4 w-4" />;
    case 'slides': return <Presentation className="h-4 w-4" />;
    case 'video': return <Video className="h-4 w-4" />;
    case 'link': return <LinkIcon className="h-4 w-4" />;
    case 'note': return <StickyNote className="h-4 w-4" />;
    default: return <BookOpen className="h-4 w-4" />;
  }
};

export function ShelfDetailDialog({
  shelf, items, isOwner, userId, userName, onOpenChange, onChanged,
}: ShelfDetailDialogProps) {
  const { t } = useLanguage();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [itemType, setItemType] = useState('book');
  const [description, setDescription] = useState('');
  const [externalUrl, setExternalUrl] = useState('');
  const [tags, setTags] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!shelf) resetForm();
  }, [shelf]);

  const resetForm = () => {
    setShowForm(false);
    setTitle(''); setAuthor(''); setItemType('book');
    setDescription(''); setExternalUrl(''); setTags(''); setFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0] || null;
    if (selected && selected.size > MAX_FILE_SIZE) {
      toast.error(t('library.fileTooLarge'));
      e.target.value = '';
      return;
    }
    setFile(selected);
    if (selected && !title.trim()) setTitle(selected.name.replace(/\.[^.]+$/, ''));
  };

  const handleAddItem = async () => {
    if (!shelf || !userId) return;
    if (!title.trim()) { toast.error(t('library.titleRequired')); return; }

    setSaving(true);
    let uploadedPath: string | null = null;
    try {
      if (file) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${userId}/${shelf.id}/${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage
          .from('library-materials')
          .upload(path, file);
        if (uploadError) throw uploadError;
        uploadedPath = path;
      }

      const { error } = await supabase.from('library_items').insert({
        shelf_id: shelf.id,
        created_by: userId,
        created_by_name: userName,
        title: title.trim(),
        author: author.trim() || null,
        item_type: itemType,
        description: description.trim() || null,
        external_url: externalUrl.trim() || null,
        file_path: uploadedPath,
        file_name: file?.name || null,
        file_size: file?.size ?? null,
        tags: tags.trim() ? tags.split(',').map((tag) => tag.trim()).filter(Boolean) : null,
      });
      if (error) throw error;

      toast.success(t('library.itemAdded'));
      resetForm();
      onChanged();
    } catch (error) {
      console.error('Error adding item:', error);
      if (uploadedPath) {
        await supabase.storage.from('library-materials').remove([uploadedPath]);
      }
      toast.error(t('library.itemAddError'));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteItem = async (item: LibraryItem) => {
    try {
      const { error } = await supabase.from('library_items').delete().eq('id', item.id);
      if (error) throw error;
      if (item.file_path) {
        await supabase.storage.from('library-materials').remove([item.file_path]);
      }
      toast.success(t('library.itemDeleted'));
      onChanged();
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error(t('library.itemDeleteError'));
    }
  };

  const handleOpenFile = async (item: LibraryItem) => {
    if (!item.file_path) return;
    try {
      const { data, error } = await supabase.storage
        .from('library-materials')
        .createSignedUrl(item.file_path, 3600);
      if (error) throw error;
      window.open(data.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      console.error('Error opening file:', error);
      toast.error(t('library.fileOpenError'));
    }
  };

  if (!shelf) return null;
  const color = getShelfColor(shelf.color);

  return (
    <Dialog open={!!shelf} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className={`flex h-8 w-8 items-center justify-center rounded-md border ${color.className}`}>
              <BookMarked className="h-4 w-4" />
            </span>
            {shelf.name}
          </DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-2">
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {isOwner ? t('library.you') : shelf.owner_name || shelf.owner_email || t('library.teamMember')}
            </span>
            {shelf.subject && <Badge variant="secondary" className="text-xs">{shelf.subject}</Badge>}
            <span>{items.length} {items.length === 1 ? t('library.item') : t('library.items')}</span>
          </DialogDescription>
        </DialogHeader>

        {shelf.description && <p className="text-sm text-muted-foreground">{shelf.description}</p>}

        {isOwner && (
          <div>
            {showForm ? (
              <div className="space-y-3 rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium text-sm">{t('library.addMaterial')}</h4>
                  <Button variant="ghost" size="icon" onClick={resetForm}><X className="h-4 w-4" /></Button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="item-title">{t('library.materialTitle')} *</Label>
                    <Input id="item-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder={t('library.materialTitlePlaceholder')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="item-author">{t('library.author')}</Label>
                    <Input id="item-author" value={author} onChange={(e) => setAuthor(e.target.value)} placeholder={t('library.authorPlaceholder')} />
                  </div>
                  <div className="space-y-2">
                    <Label>{t('library.materialType')}</Label>
                    <Select value={itemType} onValueChange={setItemType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {ITEM_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>{t(type.labelKey)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="item-tags">{t('library.tags')}</Label>
                    <Input id="item-tags" value={tags} onChange={(e) => setTags(e.target.value)} placeholder={t('library.tagsPlaceholder')} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item-url">{t('library.link')}</Label>
                  <Input id="item-url" value={externalUrl} onChange={(e) => setExternalUrl(e.target.value)} placeholder="https://" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item-file">{t('library.uploadFile')}</Label>
                  <Input id="item-file" type="file" ref={fileInputRef} onChange={handleFileChange} />
                  {file && <p className="text-xs text-muted-foreground">{file.name} ({formatFileSize(file.size)})</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item-notes">{t('library.notes')}</Label>
                  <Textarea id="item-notes" value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder={t('library.notesPlaceholder')} />
                </div>
                <Button onClick={handleAddItem} disabled={saving} className="w-full gap-2">
                  {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                  {t('library.addToShelf')}
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={() => setShowForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                {t('library.addMaterial')}
              </Button>
            )}
          </div>
        )}

        <Separator />

        <ScrollArea className="max-h-[45vh] pr-4">
          {items.length === 0 ? (
            <div className="py-10 text-center text-muted-foreground text-sm">{t('library.emptyShelf')}</div>
          ) : (
            <div className="space-y-2">
              {items.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-3 rounded-lg border p-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <span className="mt-0.5 text-primary">{getItemIcon(item.item_type)}</span>
                    <div className="min-w-0 space-y-1">
                      <p className="font-medium text-sm truncate">{item.title}</p>
                      {item.author && <p className="text-xs text-muted-foreground">{item.author}</p>}
                      {item.description && <p className="text-xs text-muted-foreground">{item.description}</p>}
                      <div className="flex flex-wrap items-center gap-1">
                        <Badge variant="outline" className="text-xs">
                          {t(ITEM_TYPES.find((type) => type.value === item.item_type)?.labelKey || 'library.type.book')}
                        </Badge>
                        {item.file_size && <span className="text-xs text-muted-foreground">{formatFileSize(item.file_size)}</span>}
                        {(item.tags || []).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    {item.external_url && (
                      <Button variant="ghost" size="icon" asChild title={t('library.openLink')}>
                        <a href={item.external_url} target="_blank" rel="noopener noreferrer">
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </Button>
                    )}
                    {item.file_path && (
                      <Button variant="ghost" size="icon" onClick={() => handleOpenFile(item)} title={t('library.openFile')}>
                        <Download className="h-4 w-4" />
                      </Button>
                    )}
                    {isOwner && (
                      <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteItem(item)} title={t('library.deleteItem')}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
