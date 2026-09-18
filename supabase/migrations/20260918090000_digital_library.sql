-- Digital Library: personal book shelves for study material, visible across the team

CREATE TABLE public.library_shelves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  university_id UUID REFERENCES public.universities(id) ON DELETE SET NULL,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  owner_name TEXT,
  owner_email TEXT,
  name TEXT NOT NULL,
  description TEXT,
  subject TEXT,
  color TEXT DEFAULT 'blue',
  is_shared BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.library_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  shelf_id UUID NOT NULL REFERENCES public.library_shelves(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_by_name TEXT,
  title TEXT NOT NULL,
  author TEXT,
  item_type TEXT NOT NULL DEFAULT 'book', -- book, pdf, article, note, link, video, slides
  description TEXT,
  external_url TEXT,
  file_path TEXT,
  file_name TEXT,
  file_size BIGINT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.library_shelves ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_items ENABLE ROW LEVEL SECURITY;

-- Shelves: everyone signed in can read a shared shelf, only the owner can change it
CREATE POLICY "Signed in users can view shared shelves"
  ON public.library_shelves FOR SELECT
  TO authenticated
  USING (is_shared OR owner_id = auth.uid());

CREATE POLICY "Users can create their own shelves"
  ON public.library_shelves FOR INSERT
  TO authenticated
  WITH CHECK (owner_id = auth.uid());

CREATE POLICY "Users can update their own shelves"
  ON public.library_shelves FOR UPDATE
  TO authenticated
  USING (owner_id = auth.uid());

CREATE POLICY "Users can delete their own shelves"
  ON public.library_shelves FOR DELETE
  TO authenticated
  USING (owner_id = auth.uid());

-- Items: readable whenever the shelf is readable, writable by the shelf owner
CREATE POLICY "Signed in users can view items on visible shelves"
  ON public.library_items FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.library_shelves s
    WHERE s.id = library_items.shelf_id
      AND (s.is_shared OR s.owner_id = auth.uid())
  ));

CREATE POLICY "Shelf owners can add items"
  ON public.library_items FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid() AND EXISTS (
    SELECT 1 FROM public.library_shelves s
    WHERE s.id = library_items.shelf_id AND s.owner_id = auth.uid()
  ));

CREATE POLICY "Shelf owners can update items"
  ON public.library_items FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.library_shelves s
    WHERE s.id = library_items.shelf_id AND s.owner_id = auth.uid()
  ));

CREATE POLICY "Shelf owners can delete items"
  ON public.library_items FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.library_shelves s
    WHERE s.id = library_items.shelf_id AND s.owner_id = auth.uid()
  ));

CREATE TRIGGER update_library_shelves_updated_at
  BEFORE UPDATE ON public.library_shelves
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_library_items_updated_at
  BEFORE UPDATE ON public.library_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_library_shelves_owner ON public.library_shelves(owner_id);
CREATE INDEX idx_library_shelves_university ON public.library_shelves(university_id);
CREATE INDEX idx_library_items_shelf ON public.library_items(shelf_id);

-- Storage bucket for uploaded study material
INSERT INTO storage.buckets (id, name, public)
VALUES ('library-materials', 'library-materials', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Authenticated users can view library materials"
ON storage.objects FOR SELECT
USING (bucket_id = 'library-materials' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can upload library materials"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'library-materials' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their own library materials"
ON storage.objects FOR UPDATE
USING (bucket_id = 'library-materials' AND auth.uid() = owner);

CREATE POLICY "Users can delete their own library materials"
ON storage.objects FOR DELETE
USING (bucket_id = 'library-materials' AND auth.uid() = owner);
