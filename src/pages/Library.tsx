import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useUniversity } from '@/contexts/UniversityContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { ShelfFormDialog } from '@/components/library/ShelfFormDialog';
import { ShelfDetailDialog } from '@/components/library/ShelfDetailDialog';
import { ShelfCard } from '@/components/library/ShelfCard';
import type { LibraryItem, LibraryShelf } from '@/components/library/types';
import { Library as LibraryIcon, Plus, Search, Users, BookMarked, RefreshCw } from 'lucide-react';

export default function Library() {
  const { user, profile } = useAuth();
  const { selectedUniversity } = useUniversity();
  const { t } = useLanguage();

  const [shelves, setShelves] = useState<LibraryShelf[]>([]);
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('my-shelves');
  const [formOpen, setFormOpen] = useState(false);
  const [editingShelf, setEditingShelf] = useState<LibraryShelf | null>(null);
  const [openShelfId, setOpenShelfId] = useState<string | null>(null);

  useEffect(() => { fetchLibrary(); }, [user?.id]);

  const fetchLibrary = async () => {
    setLoading(true);
    try {
      const { data: shelfData, error: shelfError } = await supabase
        .from('library_shelves')
        .select('*')
        .order('created_at', { ascending: false });
      if (shelfError) throw shelfError;

      const { data: itemData, error: itemError } = await supabase
        .from('library_items')
        .select('*')
        .order('created_at', { ascending: false });
      if (itemError) throw itemError;

      setShelves(shelfData || []);
      setItems(itemData || []);
    } catch (error) {
      console.error('Error loading library:', error);
      toast.error(t('library.loadError'));
    } finally {
      setLoading(false);
    }
  };

  const itemsByShelf = useMemo(() => {
    const map: Record<string, LibraryItem[]> = {};
    items.forEach((item) => {
      (map[item.shelf_id] ||= []).push(item);
    });
    return map;
  }, [items]);

  const matchesSearch = (shelf: LibraryShelf) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    const shelfText = [shelf.name, shelf.description, shelf.subject, shelf.owner_name, shelf.owner_email]
      .filter(Boolean).join(' ').toLowerCase();
    if (shelfText.includes(q)) return true;
    return (itemsByShelf[shelf.id] || []).some((item) =>
      [item.title, item.author, item.description, ...(item.tags || [])]
        .filter(Boolean).join(' ').toLowerCase().includes(q)
    );
  };

  const myShelves = shelves.filter((s) => s.owner_id === user?.id && matchesSearch(s));
  const sharedShelves = shelves.filter((s) => s.owner_id !== user?.id && matchesSearch(s));
  const allShelves = shelves.filter(matchesSearch);

  const openShelf = shelves.find((s) => s.id === openShelfId) || null;

  const handleCreate = () => { setEditingShelf(null); setFormOpen(true); };
  const handleEdit = (shelf: LibraryShelf) => { setEditingShelf(shelf); setFormOpen(true); };

  const handleDeleteShelf = async (shelf: LibraryShelf) => {
    const shelfItems = itemsByShelf[shelf.id] || [];
    const paths = shelfItems.map((i) => i.file_path).filter(Boolean) as string[];
    try {
      const { error } = await supabase.from('library_shelves').delete().eq('id', shelf.id);
      if (error) throw error;
      if (paths.length > 0) {
        await supabase.storage.from('library-materials').remove(paths);
      }
      toast.success(t('library.shelfDeleted'));
      if (openShelfId === shelf.id) setOpenShelfId(null);
      fetchLibrary();
    } catch (error) {
      console.error('Error deleting shelf:', error);
      toast.error(t('library.shelfDeleteError'));
    }
  };

  const renderShelves = (list: LibraryShelf[], emptyMessage: string) => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-16 text-muted-foreground">
          <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
          {t('library.loading')}
        </div>
      );
    }
    if (list.length === 0) {
      return (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
            <BookMarked className="h-12 w-12 mb-4 opacity-50" />
            <p>{emptyMessage}</p>
          </CardContent>
        </Card>
      );
    }
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {list.map((shelf) => (
          <ShelfCard
            key={shelf.id}
            shelf={shelf}
            itemCount={(itemsByShelf[shelf.id] || []).length}
            isOwner={shelf.owner_id === user?.id}
            onOpen={() => setOpenShelfId(shelf.id)}
            onEdit={() => handleEdit(shelf)}
            onDelete={() => handleDeleteShelf(shelf)}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <LibraryIcon className="h-6 w-6 text-primary" />
            {t('library.title')}
          </h1>
          <p className="text-muted-foreground">{t('library.subtitle')}</p>
        </div>
        <Button onClick={handleCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          {t('library.newShelf')}
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder={t('library.searchPlaceholder')}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-xl grid-cols-3">
          <TabsTrigger value="my-shelves" className="flex items-center gap-2">
            <BookMarked className="h-4 w-4" />
            {t('library.myShelves')}
            <Badge variant="secondary" className="ml-1">{myShelves.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="shared-shelves" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            {t('library.sharedShelves')}
            <Badge variant="secondary" className="ml-1">{sharedShelves.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="all-shelves" className="flex items-center gap-2">
            <LibraryIcon className="h-4 w-4" />
            {t('library.allShelves')}
            <Badge variant="secondary" className="ml-1">{allShelves.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-shelves">{renderShelves(myShelves, t('library.noOwnShelves'))}</TabsContent>
        <TabsContent value="shared-shelves">{renderShelves(sharedShelves, t('library.noSharedShelves'))}</TabsContent>
        <TabsContent value="all-shelves">{renderShelves(allShelves, t('library.noShelves'))}</TabsContent>
      </Tabs>

      <ShelfFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        shelf={editingShelf}
        userId={user?.id || null}
        ownerName={profile?.full_name || user?.email || null}
        ownerEmail={profile?.email || user?.email || null}
        universityId={selectedUniversity?.id || null}
        onSaved={fetchLibrary}
      />

      <ShelfDetailDialog
        shelf={openShelf}
        items={openShelf ? itemsByShelf[openShelf.id] || [] : []}
        isOwner={!!openShelf && openShelf.owner_id === user?.id}
        userId={user?.id || null}
        userName={profile?.full_name || user?.email || null}
        onOpenChange={(open) => { if (!open) setOpenShelfId(null); }}
        onChanged={fetchLibrary}
      />
    </div>
  );
}
