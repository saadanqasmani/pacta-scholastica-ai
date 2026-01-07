-- Universities table
CREATE TABLE public.universities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  region TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('public', 'private')),
  size TEXT NOT NULL CHECK (size IN ('small', 'medium', 'large')),
  internationalization_maturity TEXT NOT NULL CHECK (internationalization_maturity IN ('low', 'medium', 'high')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Faculties table
CREATE TABLE public.faculties (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Departments table
CREATE TABLE public.departments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  faculty_id UUID NOT NULL REFERENCES public.faculties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- MOUs table
CREATE TABLE public.mous (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  initiator_university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  partner_university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'revised', 'counter_proposed', 'accepted', 'rejected')),
  cooperation_scope TEXT[] NOT NULL DEFAULT '{}',
  clauses JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- MOU history for audit trail
CREATE TABLE public.mou_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mou_id UUID NOT NULL REFERENCES public.mous(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  actor_university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  changes JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Mobility records table
CREATE TABLE public.mobility_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  partner_university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  department_id UUID NOT NULL REFERENCES public.departments(id) ON DELETE CASCADE,
  program_type TEXT NOT NULL CHECK (program_type IN ('erasmus', 'bilateral', 'exchange', 'joint_degree')),
  direction TEXT NOT NULL CHECK (direction IN ('incoming', 'outgoing')),
  student_count INTEGER NOT NULL DEFAULT 0,
  academic_year TEXT NOT NULL,
  completion_status TEXT NOT NULL DEFAULT 'ongoing' CHECK (completion_status IN ('ongoing', 'completed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- AI evaluations cache
CREATE TABLE public.ai_evaluations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  evaluation_type TEXT NOT NULL,
  evaluation_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '1 hour')
);

-- Create indexes for performance
CREATE INDEX idx_faculties_university ON public.faculties(university_id);
CREATE INDEX idx_departments_faculty ON public.departments(faculty_id);
CREATE INDEX idx_mous_initiator ON public.mous(initiator_university_id);
CREATE INDEX idx_mous_partner ON public.mous(partner_university_id);
CREATE INDEX idx_mobility_university ON public.mobility_records(university_id);
CREATE INDEX idx_mobility_partner ON public.mobility_records(partner_university_id);
CREATE INDEX idx_ai_evaluations_university ON public.ai_evaluations(university_id);

-- Enable RLS on all tables (public read for demo purposes)
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faculties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mous ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mou_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mobility_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_evaluations ENABLE ROW LEVEL SECURITY;

-- Public read policies for demo
CREATE POLICY "Allow public read access to universities" ON public.universities FOR SELECT USING (true);
CREATE POLICY "Allow public read access to faculties" ON public.faculties FOR SELECT USING (true);
CREATE POLICY "Allow public read access to departments" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Allow public read access to mous" ON public.mous FOR SELECT USING (true);
CREATE POLICY "Allow public read access to mou_history" ON public.mou_history FOR SELECT USING (true);
CREATE POLICY "Allow public read access to mobility_records" ON public.mobility_records FOR SELECT USING (true);
CREATE POLICY "Allow public read access to ai_evaluations" ON public.ai_evaluations FOR SELECT USING (true);

-- Public write policies for demo (no auth required for POC)
CREATE POLICY "Allow public insert to mous" ON public.mous FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to mous" ON public.mous FOR UPDATE USING (true);
CREATE POLICY "Allow public insert to mou_history" ON public.mou_history FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert to mobility_records" ON public.mobility_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public insert to ai_evaluations" ON public.ai_evaluations FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update to ai_evaluations" ON public.ai_evaluations FOR UPDATE USING (true);
CREATE POLICY "Allow public delete to ai_evaluations" ON public.ai_evaluations FOR DELETE USING (true);

-- Updated at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to tables with updated_at
CREATE TRIGGER update_universities_updated_at
  BEFORE UPDATE ON public.universities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_mous_updated_at
  BEFORE UPDATE ON public.mous
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();