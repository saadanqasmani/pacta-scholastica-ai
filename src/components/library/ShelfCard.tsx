import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useLanguage } from '@/contexts/LanguageContext';
import { cn } from '@/lib/utils';
import { getShelfColor, type LibraryShelf } from './types';
import { BookMarked, Pencil, Trash2, User, Lock } from 'lucide-react';

interface ShelfCardProps {
  shelf: LibraryShelf;
  itemCount: number;
  isOwner: boolean;
  onOpen: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function ShelfCard({ shelf, itemCount, isOwner, onOpen, onEdit, onDelete }: ShelfCardProps) {
  const { t } = useLanguage();
  const color = getShelfColor(shelf.color);

  return (
    <Card className="flex flex-col transition-colors hover:border-primary/40">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-start gap-3 min-w-0">
            <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-md border', color.className)}>
              <BookMarked className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <CardTitle className="text-base truncate">{shelf.name}</CardTitle>
              <CardDescription className="flex items-center gap-1 text-xs">
                <User className="h-3 w-3" />
                {isOwner ? t('library.you') : shelf.owner_name || shelf.owner_email || t('library.teamMember')}
              </CardDescription>
            </div>
          </div>
          {!shelf.is_shared && (
            <Badge variant="outline" className="gap-1 text-xs shrink-0">
              <Lock className="h-3 w-3" />
              {t('library.private')}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col justify-between gap-4">
        <div className="space-y-2">
          {shelf.subject && <Badge variant="secondary" className="text-xs">{shelf.subject}</Badge>}
          {shelf.description && (
            <p className="text-sm text-muted-foreground line-clamp-3">{shelf.description}</p>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm text-muted-foreground">
            {itemCount} {itemCount === 1 ? t('library.item') : t('library.items')}
          </span>
          <div className="flex items-center gap-1">
            {isOwner && (
              <>
                <Button variant="ghost" size="icon" onClick={onEdit} title={t('library.editShelf')}>
                  <Pencil className="h-4 w-4" />
                </Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-destructive" title={t('library.deleteShelf')}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>{t('library.deleteShelfTitle')}</AlertDialogTitle>
                      <AlertDialogDescription>
                        {t('library.deleteShelfConfirm')} "{shelf.name}"
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>{t('library.cancel')}</AlertDialogCancel>
                      <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                        {t('library.delete')}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </>
            )}
            <Button variant="outline" size="sm" onClick={onOpen}>{t('library.open')}</Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
