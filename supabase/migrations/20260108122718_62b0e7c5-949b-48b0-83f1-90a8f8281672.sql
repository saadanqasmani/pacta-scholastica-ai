-- Add document support to mobility_tasks
ALTER TABLE public.mobility_tasks 
ADD COLUMN document_url text,
ADD COLUMN document_name text,
ADD COLUMN requires_document boolean DEFAULT false;

-- Create storage bucket for mobility documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('mobility-documents', 'mobility-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for mobility documents
CREATE POLICY "Authenticated users can upload mobility documents"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'mobility-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view mobility documents"
ON storage.objects FOR SELECT
USING (bucket_id = 'mobility-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update mobility documents"
ON storage.objects FOR UPDATE
USING (bucket_id = 'mobility-documents' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete mobility documents"
ON storage.objects FOR DELETE
USING (bucket_id = 'mobility-documents' AND auth.role() = 'authenticated');