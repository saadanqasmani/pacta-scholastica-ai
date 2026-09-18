import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { SHELF_COLORS, type LibraryShelf } from './types';
import { RefreshCw } from 'lucide-react';

interface ShelfFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shelf: LibraryShelf | null;
  userId: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  universityId: string | null;
  onSaved: () => void;
}

export function ShelfFormDialog({
  open, onOpenChange, shelf, userId, ownerName, ownerEmail, universityId, onSaved,
}: ShelfFormDialogProps) {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('blue');
  const [isShared, setIsShared] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(shelf?.name || '');
    setSubject(shelf?.subject || '');
    setDescription(shelf?.description || '');
    setColor(shelf?.color || 'blue');
    setIsShared(shelf ? shelf.is_shared : true);
  }, [open, shelf]);

  const handleSave = async () => {
    if (!name.trim()) { toast.error(t('library.nameRequired')); return; }
    if (!userId) { toast.error(t('library.signInRequired')); return; }

    setSaving(true);
    try {
      if (shelf) {
        const { error } = await supabase
          .from('library_shelves')
          .update({
            name: name.trim(),
            subject: subject.trim() || null,
            description: description.trim() || null,
            color,
            is_shared: isShared,
          })
          .eq('id', shelf.id);
        if (error) throw error;
        toast.success(t('library.shelfUpdated'));
      } else {
        const { error } = await supabase.from('library_shelves').insert({
          owner_id: userId,
          owner_name: ownerName,
          owner_email: ownerEmail,
          university_id: universityId,
          name: name.trim(),
          subject: subject.trim() || null,
          description: description.trim() || null,
          color,
          is_shared: isShared,
        });
        if (error) throw error;
        toast.success(t('library.shelfCreated'));
      }
      onOpenChange(false);
      onSaved();
    } catch (error) {
      console.error('Error saving shelf:', error);
      toast.error(t('library.shelfSaveError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{shelf ? t('library.editShelf') : t('library.newShelf')}</DialogTitle>
          <DialogDescription>{t('library.shelfFormDesc')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="shelf-name">{t('library.shelfName')} *</Label>
            <Input
              id="shelf-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t('library.shelfNamePlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shelf-subject">{t('library.subject')}</Label>
            <Input
              id="shelf-subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={t('library.subjectPlaceholder')}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="shelf-description">{t('library.description')}</Label>
            <Textarea
              id="shelf-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t('library.descriptionPlaceholder')}
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>{t('library.color')}</Label>
            <div className="flex flex-wrap gap-2">
              {SHELF_COLORS.map((c) => (
                <button
                  key={c.value}
                  type="button"
                  onClick={() => setColor(c.value)}
                  className={cn(
                    'h-8 w-8 rounded-full border-2 transition-all',
                    c.dot,
                    color === c.value ? 'border-foreground scale-110' : 'border-transparent'
                  )}
                  aria-label={c.value}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-3">
            <div className="space-y-0.5">
              <Label htmlFor="shelf-shared">{t('library.shareWithTeam')}</Label>
              <p className="text-xs text-muted-foreground">{t('library.shareWithTeamDesc')}</p>
            </div>
            <Switch id="shelf-shared" checked={isShared} onCheckedChange={setIsShared} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('library.cancel')}</Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving && <RefreshCw className="h-4 w-4 mr-2 animate-spin" />}
            {shelf ? t('library.saveChanges') : t('library.createShelf')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
