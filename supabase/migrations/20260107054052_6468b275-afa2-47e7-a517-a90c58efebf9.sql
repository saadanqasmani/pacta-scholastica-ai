-- Add new fields to universities table for detailed profiles
ALTER TABLE public.universities 
ADD COLUMN IF NOT EXISTS ranking INTEGER,
ADD COLUMN IF NOT EXISTS educational_union TEXT,
ADD COLUMN IF NOT EXISTS journals TEXT[],
ADD COLUMN IF NOT EXISTS research_strengths TEXT[],
ADD COLUMN IF NOT EXISTS accreditations TEXT[],
ADD COLUMN IF NOT EXISTS founded_year INTEGER,
ADD COLUMN IF NOT EXISTS website TEXT;

-- Update existing universities with sample data
UPDATE public.universities SET
  ranking = CASE 
    WHEN name = 'Koç University' THEN 501
    WHEN name = 'Boğaziçi University' THEN 701
    WHEN name = 'Middle East Technical University' THEN 601
    WHEN name = 'Bilkent University' THEN 801
    WHEN name = 'Sabancı University' THEN 701
    WHEN name = 'Technical University of Munich' THEN 50
    WHEN name = 'ETH Zurich' THEN 8
    WHEN name = 'University of Oxford' THEN 1
    WHEN name = 'MIT' THEN 2
    WHEN name = 'Stanford University' THEN 3
    WHEN name = 'University of Tokyo' THEN 28
    WHEN name = 'National University of Singapore' THEN 11
    WHEN name = 'Peking University' THEN 17
    WHEN name = 'University of Melbourne' THEN 13
    WHEN name = 'University of Toronto' THEN 21
    ELSE floor(random() * 500 + 200)::integer
  END,
  educational_union = CASE 
    WHEN region IN ('Western Europe', 'Eastern Europe', 'Northern Europe', 'Southern Europe') THEN 'European University Association (EUA)'
    WHEN region = 'North America' THEN 'Association of American Universities (AAU)'
    WHEN region IN ('East Asia', 'Southeast Asia', 'South Asia') THEN 'Association of Pacific Rim Universities (APRU)'
    WHEN region = 'Middle East' THEN 'Federation of Arab Universities (FAU)'
    WHEN region = 'Oceania' THEN 'Universities Australia'
    WHEN region = 'South America' THEN 'Asociación de Universidades Grupo Montevideo'
    WHEN region = 'Africa' THEN 'Association of African Universities (AAU)'
    ELSE 'International Association of Universities (IAU)'
  END,
  journals = CASE
    WHEN type = 'public' THEN ARRAY['Nature', 'Science', 'PLOS ONE', 'IEEE Transactions']
    ELSE ARRAY['Cell', 'The Lancet', 'Journal of Finance', 'Academy of Management Review']
  END,
  research_strengths = CASE
    WHEN name LIKE '%Technical%' OR name LIKE '%Technology%' OR name LIKE '%MIT%' OR name LIKE '%ETH%' THEN ARRAY['Engineering', 'Computer Science', 'Physics', 'Mathematics']
    WHEN name LIKE '%Business%' OR name LIKE '%Economics%' THEN ARRAY['Economics', 'Business Administration', 'Finance', 'Management']
    WHEN name LIKE '%Medical%' OR name LIKE '%Medicine%' THEN ARRAY['Medicine', 'Life Sciences', 'Biotechnology', 'Public Health']
    ELSE ARRAY['Social Sciences', 'Humanities', 'Natural Sciences', 'Engineering']
  END,
  accreditations = CASE
    WHEN region IN ('Western Europe', 'Eastern Europe', 'Northern Europe', 'Southern Europe') THEN ARRAY['EQUIS', 'AMBA', 'AACSB', 'EUR-ACE']
    WHEN region = 'North America' THEN ARRAY['AACSB', 'ABET', 'SACSCOC', 'HLC']
    ELSE ARRAY['AACSB', 'EQUIS', 'AMBA']
  END,
  founded_year = CASE
    WHEN name = 'University of Oxford' THEN 1096
    WHEN name = 'MIT' THEN 1861
    WHEN name = 'Stanford University' THEN 1885
    WHEN name = 'ETH Zurich' THEN 1855
    WHEN name = 'University of Tokyo' THEN 1877
    WHEN name = 'Koç University' THEN 1993
    WHEN name = 'Boğaziçi University' THEN 1863
    WHEN name = 'Bilkent University' THEN 1984
    WHEN name = 'Sabancı University' THEN 1994
    ELSE floor(random() * 150 + 1850)::integer
  END,
  website = CASE
    WHEN name = 'Koç University' THEN 'https://www.ku.edu.tr'
    WHEN name = 'University of Oxford' THEN 'https://www.ox.ac.uk'
    WHEN name = 'MIT' THEN 'https://www.mit.edu'
    ELSE 'https://www.' || lower(replace(replace(name, ' ', ''), 'University', 'uni')) || '.edu'
  END;

-- Create a partner_roi table to track ROI from partnerships
CREATE TABLE IF NOT EXISTS public.partner_roi (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  university_id UUID NOT NULL REFERENCES public.universities(id),
  partner_university_id UUID NOT NULL REFERENCES public.universities(id),
  partnership_year INTEGER NOT NULL,
  student_exchange_count INTEGER DEFAULT 0,
  research_collaborations INTEGER DEFAULT 0,
  joint_publications INTEGER DEFAULT 0,
  grant_funding_usd NUMERIC(12,2) DEFAULT 0,
  satisfaction_score NUMERIC(3,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partner_roi ENABLE ROW LEVEL SECURITY;

-- Create read policy for partner_roi
CREATE POLICY "Allow public read access to partner_roi" 
ON public.partner_roi 
FOR SELECT 
USING (true);

-- Seed some sample partner ROI data
INSERT INTO public.partner_roi (university_id, partner_university_id, partnership_year, student_exchange_count, research_collaborations, joint_publications, grant_funding_usd, satisfaction_score)
SELECT 
  u1.id,
  u2.id,
  2023,
  floor(random() * 50 + 5)::integer,
  floor(random() * 10 + 1)::integer,
  floor(random() * 20 + 2)::integer,
  floor(random() * 500000 + 50000)::numeric,
  (random() * 2 + 3)::numeric(3,2)
FROM public.universities u1
CROSS JOIN public.universities u2
WHERE u1.id != u2.id
AND random() < 0.1
LIMIT 100;