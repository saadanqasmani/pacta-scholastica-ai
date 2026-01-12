-- Student Documentation Management System Tables

-- Document requirement templates table
CREATE TABLE public.document_requirement_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  stage_type text NOT NULL, -- 'new_admission', 'enrolled', 'freeze', 'unfreeze', 'transfer_in', 'transfer_out', 'bachelors', 'masters', 'phd'
  document_name text NOT NULL,
  document_category text NOT NULL, -- 'academic', 'legal', 'identity', 'financial', 'other'
  description text,
  is_required boolean DEFAULT true,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Country-specific document requirements
CREATE TABLE public.country_document_rules (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  country_code text NOT NULL,
  country_name text NOT NULL,
  education_system text, -- 'cambridge', 'american', 'ib', 'national', etc.
  document_name text NOT NULL,
  specific_requirements text, -- e.g., "O-levels and A-levels with minimum 2 D's"
  stamps_required text[], -- e.g., ["MOFA", "Turkish Consulate", "Apostille"]
  how_to_obtain text,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Student document tracking
CREATE TABLE public.student_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  university_id uuid NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  student_name text NOT NULL,
  student_email text,
  student_id_number text,
  country_of_origin text NOT NULL,
  education_system text,
  stage text NOT NULL, -- 'new_admission', 'enrolled', etc.
  degree_level text NOT NULL, -- 'bachelors', 'masters', 'phd'
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'in_progress', 'complete', 'issues'
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Individual document submissions
CREATE TABLE public.student_document_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_document_id uuid NOT NULL REFERENCES public.student_documents(id) ON DELETE CASCADE,
  document_name text NOT NULL,
  document_category text NOT NULL,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'uploaded', 'verified', 'rejected'
  document_url text,
  stamps_verified text[],
  verification_notes text,
  verified_at timestamp with time zone,
  verified_by text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_requirement_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.country_document_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_document_items ENABLE ROW LEVEL SECURITY;

-- RLS Policies for document_requirement_templates (public read)
CREATE POLICY "Public read access to document_requirement_templates"
ON public.document_requirement_templates FOR SELECT
USING (true);

CREATE POLICY "Authenticated insert document_requirement_templates"
ON public.document_requirement_templates FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated update document_requirement_templates"
ON public.document_requirement_templates FOR UPDATE
USING (auth.role() = 'authenticated');

-- RLS Policies for country_document_rules (public read)
CREATE POLICY "Public read access to country_document_rules"
ON public.country_document_rules FOR SELECT
USING (true);

CREATE POLICY "Authenticated insert country_document_rules"
ON public.country_document_rules FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated update country_document_rules"
ON public.country_document_rules FOR UPDATE
USING (auth.role() = 'authenticated');

-- RLS Policies for student_documents
CREATE POLICY "Public read access to student_documents"
ON public.student_documents FOR SELECT
USING (true);

CREATE POLICY "Authenticated insert student_documents"
ON public.student_documents FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated update student_documents"
ON public.student_documents FOR UPDATE
USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated delete student_documents"
ON public.student_documents FOR DELETE
USING (auth.role() = 'authenticated');

-- RLS Policies for student_document_items
CREATE POLICY "Public read access to student_document_items"
ON public.student_document_items FOR SELECT
USING (true);

CREATE POLICY "Authenticated insert student_document_items"
ON public.student_document_items FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated update student_document_items"
ON public.student_document_items FOR UPDATE
USING (auth.role() = 'authenticated');

-- Triggers for updated_at
CREATE TRIGGER update_student_documents_updated_at
BEFORE UPDATE ON public.student_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_student_document_items_updated_at
BEFORE UPDATE ON public.student_document_items
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default document requirement templates
INSERT INTO public.document_requirement_templates (stage_type, document_name, document_category, description, is_required, sort_order) VALUES
-- New Admission Documents
('new_admission', 'High School Diploma', 'academic', 'Original high school graduation certificate', true, 1),
('new_admission', 'High School Transcript', 'academic', 'Official transcript showing all grades', true, 2),
('new_admission', 'Passport', 'identity', 'Valid passport with at least 1 year validity', true, 3),
('new_admission', 'Passport Photos', 'identity', '6 biometric passport photos (50x60mm)', true, 4),
('new_admission', 'Denklik (Equivalency)', 'legal', 'Turkish Ministry of Education equivalency certificate', true, 5),
('new_admission', 'Student Visa', 'legal', 'Turkish student visa (if applicable)', true, 6),
('new_admission', 'İkamet (Residence Permit)', 'legal', 'Turkish residence permit application', true, 7),
('new_admission', 'Health Insurance', 'legal', 'Valid health insurance for Turkey', true, 8),

-- Masters Additional Documents
('masters', 'Bachelor''s Degree', 'academic', 'Original bachelor''s degree certificate', true, 1),
('masters', 'Bachelor''s Transcript', 'academic', 'Official bachelor''s transcript', true, 2),
('masters', 'Letter of Recommendation', 'academic', 'Academic reference letters (2-3)', false, 3),
('masters', 'Statement of Purpose', 'academic', 'Personal statement/motivation letter', true, 4),
('masters', 'CV/Resume', 'academic', 'Academic CV with publications if any', true, 5),
('masters', 'Language Proficiency', 'academic', 'TOEFL/IELTS/YDS score (if English program)', false, 6),

-- PhD Additional Documents
('phd', 'Master''s Degree', 'academic', 'Original master''s degree certificate', true, 1),
('phd', 'Master''s Transcript', 'academic', 'Official master''s transcript', true, 2),
('phd', 'Master''s Thesis', 'academic', 'Copy of master''s thesis', true, 3),
('phd', 'Research Proposal', 'academic', 'Detailed research proposal', true, 4),
('phd', 'Publications', 'academic', 'List of academic publications', false, 5),

-- Transfer Documents
('transfer_in', 'Previous University Transcript', 'academic', 'Official transcript from previous university', true, 1),
('transfer_in', 'Transfer Certificate', 'academic', 'Letter of good standing from previous university', true, 2),
('transfer_in', 'Course Descriptions', 'academic', 'Detailed syllabi for credit transfer evaluation', true, 3),

-- Freeze/Unfreeze Documents
('freeze', 'Freeze Request Form', 'academic', 'Official university freeze request form', true, 1),
('freeze', 'Supporting Documents', 'other', 'Medical reports, military service notice, etc.', false, 2),
('unfreeze', 'Unfreeze Request Form', 'academic', 'Official university unfreeze request form', true, 1),
('unfreeze', 'Updated İkamet', 'legal', 'Renewed residence permit if expired', true, 2),

-- Enrolled Student Documents
('enrolled', 'Updated Passport', 'identity', 'Renewed passport if previous expired', false, 1),
('enrolled', 'İkamet Renewal', 'legal', 'Annual residence permit renewal', true, 2),
('enrolled', 'Health Insurance Renewal', 'legal', 'Annual health insurance renewal', true, 3),

-- Special Documents
('new_admission', 'Mavi Kart', 'identity', 'Blue Card for Turkish citizens living abroad', false, 10),
('new_admission', 'Entry Exit Stamp', 'identity', 'For Turkish citizens who completed high school abroad', false, 11);

-- Insert common country-specific rules
INSERT INTO public.country_document_rules (country_code, country_name, education_system, document_name, specific_requirements, stamps_required, how_to_obtain, notes) VALUES
-- Pakistan
('PK', 'Pakistan', 'Cambridge', 'O-Levels Certificate', 'Cambridge O-Levels with at least 5 subjects passed', ARRAY['IBCC Equivalence', 'MOFA Pakistan', 'Turkish Consulate'], 'Apply through IBCC for equivalence, then apostille from MOFA', 'Must have attestation from IBCC Islamabad'),
('PK', 'Pakistan', 'Cambridge', 'A-Levels Certificate', 'Minimum 2 D''s in A-Level subjects required for university admission', ARRAY['IBCC Equivalence', 'MOFA Pakistan', 'Turkish Consulate'], 'Submit to IBCC for equivalence certificate', 'IBCC equivalence converts to Pakistani board percentage'),
('PK', 'Pakistan', 'National', 'Matric Certificate', 'SSC/Matric with minimum 60% marks', ARRAY['IBCC Equivalence', 'MOFA Pakistan', 'Turkish Consulate'], 'Get verified from issuing board, then IBCC', NULL),
('PK', 'Pakistan', 'National', 'Intermediate Certificate', 'HSSC/Intermediate with minimum 60% marks', ARRAY['IBCC Equivalence', 'MOFA Pakistan', 'Turkish Consulate'], 'Get verified from issuing board, then IBCC', NULL),

-- Myanmar
('MM', 'Myanmar', 'GED', 'GED Certificate', 'GED alone is NOT sufficient - 12th grade completion required', ARRAY['Ministry of Education Myanmar', 'Turkish Consulate'], 'Must also submit Grade 12 examination results', 'GED is considered incomplete high school in Turkey'),
('MM', 'Myanmar', 'National', '12th Grade Certificate', 'Basic Education High School Examination pass certificate', ARRAY['Ministry of Education Myanmar', 'Turkish Consulate'], 'Verify through local education office', NULL),

-- India
('IN', 'India', 'CBSE', 'Class 12 Certificate', 'CBSE Board 12th class certificate with minimum 50%', ARRAY['Apostille from MEA India', 'Turkish Consulate'], 'Apply for apostille through MEA portal', 'MEA apostille is mandatory'),
('IN', 'India', 'ISC', 'ISC Certificate', 'ISC 12th class certificate with minimum 50%', ARRAY['Apostille from MEA India', 'Turkish Consulate'], 'Apply for apostille through MEA portal', NULL),
('IN', 'India', 'State Board', 'State Board Certificate', 'State Board 12th class certificate with minimum 50%', ARRAY['HRD Attestation', 'Apostille from MEA India', 'Turkish Consulate'], 'First get HRD attestation from state, then MEA apostille', 'Some state boards require additional verification'),

-- Bangladesh
('BD', 'Bangladesh', 'National', 'HSC Certificate', 'Higher Secondary Certificate with GPA 3.0+', ARRAY['Secondary & Higher Education Board', 'MOFA Bangladesh', 'Turkish Consulate'], 'Verify through education board, then MOFA attestation', NULL),
('BD', 'Bangladesh', 'Cambridge', 'A-Level Certificate', 'Cambridge A-Levels with minimum 2 passes', ARRAY['British Council Bangladesh', 'MOFA Bangladesh', 'Turkish Consulate'], 'Verify through British Council', NULL),

-- Nigeria
('NG', 'Nigeria', 'WAEC', 'WAEC Certificate', 'WASSCE with credits in at least 5 subjects including English and Math', ARRAY['Federal Ministry of Education', 'MOFA Nigeria', 'Turkish Consulate'], 'Get confirmation letter from WAEC office', 'Must include scratch card verification'),
('NG', 'Nigeria', 'NECO', 'NECO Certificate', 'NECO SSCE with credits in at least 5 subjects', ARRAY['Federal Ministry of Education', 'MOFA Nigeria', 'Turkish Consulate'], 'Verify through NECO office', NULL),

-- General Documents for All Countries
('ALL', 'All Countries', 'General', 'İkamet Application', 'Residence permit application at Immigration Office', ARRAY[]::text[], '1. Get address registration from muhtar 2. Health insurance 3. Apply online at e-ikamet.goc.gov.tr 4. Appointment at İl Göç İdaresi', 'Required documents: Passport, photos, health insurance, proof of address, tuition receipt'),
('ALL', 'All Countries', 'General', 'Denklik Application', 'Turkish Ministry of Education equivalency', ARRAY[]::text[], '1. Apply online at turkiye.gov.tr 2. Submit documents to Provincial Directorate of National Education 3. Wait for evaluation (2-8 weeks)', 'Required: Original diploma, transcript, passport copy, photos'),
('ALL', 'All Countries', 'General', 'Health Insurance', 'Valid health insurance for residence permit', ARRAY[]::text[], 'Options: 1. SGK (social security) 2. Private insurance (must be approved by Immigration) 3. University health center coverage', 'Insurance must cover entire stay period');