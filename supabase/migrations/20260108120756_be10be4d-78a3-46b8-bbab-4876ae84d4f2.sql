-- ============================================
-- COURSES TABLE - For Learning Agreement matching
-- ============================================
CREATE TABLE public.courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  course_code TEXT NOT NULL,
  course_name TEXT NOT NULL,
  description TEXT,
  credits NUMERIC NOT NULL DEFAULT 3,
  ects_credits NUMERIC,
  department TEXT,
  level TEXT DEFAULT 'undergraduate', -- undergraduate, graduate, doctoral
  language TEXT DEFAULT 'English',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to courses" 
ON public.courses FOR SELECT USING (true);

CREATE POLICY "Authenticated users can insert courses" 
ON public.courses FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE INDEX idx_courses_university ON public.courses(university_id);

-- ============================================
-- STUDENT MOBILITY APPLICATIONS
-- ============================================
CREATE TABLE public.student_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  university_id UUID NOT NULL REFERENCES public.universities(id),
  host_university_id UUID NOT NULL REFERENCES public.universities(id),
  student_name TEXT NOT NULL,
  student_email TEXT NOT NULL,
  student_id_number TEXT,
  program_type TEXT NOT NULL, -- erasmus, bilateral, summer, etc.
  academic_year TEXT NOT NULL,
  semester TEXT NOT NULL, -- fall, spring, full-year
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected, in-progress, completed
  application_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  start_date DATE,
  end_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.student_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to student_applications" 
ON public.student_applications FOR SELECT USING (true);

CREATE POLICY "Authenticated insert student_applications" 
ON public.student_applications FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated update student_applications" 
ON public.student_applications FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE TRIGGER update_student_applications_updated_at
BEFORE UPDATE ON public.student_applications
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- MOBILITY TASKS (Before, During, After)
-- ============================================
CREATE TABLE public.mobility_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.student_applications(id) ON DELETE CASCADE,
  task_name TEXT NOT NULL,
  description TEXT,
  phase TEXT NOT NULL, -- before, during, after
  is_completed BOOLEAN NOT NULL DEFAULT false,
  due_date DATE,
  completed_at TIMESTAMP WITH TIME ZONE,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mobility_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to mobility_tasks" 
ON public.mobility_tasks FOR SELECT USING (true);

CREATE POLICY "Authenticated insert mobility_tasks" 
ON public.mobility_tasks FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated update mobility_tasks" 
ON public.mobility_tasks FOR UPDATE 
USING (auth.role() = 'authenticated');

-- ============================================
-- LEARNING AGREEMENTS
-- ============================================
CREATE TABLE public.learning_agreements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id UUID NOT NULL REFERENCES public.student_applications(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft', -- draft, pending_approval, approved, rejected
  transcript_data JSONB, -- parsed transcript courses
  home_courses JSONB, -- selected home courses
  host_courses JSONB, -- matched host courses
  course_mappings JSONB, -- array of {home_course_id, host_course_id, match_score}
  total_home_credits NUMERIC,
  total_host_credits NUMERIC,
  total_ects NUMERIC,
  notes TEXT,
  approved_by TEXT,
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.learning_agreements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to learning_agreements" 
ON public.learning_agreements FOR SELECT USING (true);

CREATE POLICY "Authenticated insert learning_agreements" 
ON public.learning_agreements FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated update learning_agreements" 
ON public.learning_agreements FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE TRIGGER update_learning_agreements_updated_at
BEFORE UPDATE ON public.learning_agreements
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- RESEARCH COLLABORATIONS
-- ============================================
CREATE TABLE public.research_collaborations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  university_id UUID NOT NULL REFERENCES public.universities(id),
  partner_university_id UUID NOT NULL REFERENCES public.universities(id),
  project_title TEXT NOT NULL,
  description TEXT,
  research_area TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- proposed, active, completed, suspended
  start_date DATE,
  end_date DATE,
  funding_source TEXT,
  funding_amount NUMERIC,
  principal_investigator TEXT,
  partner_investigator TEXT,
  publications_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.research_collaborations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to research_collaborations" 
ON public.research_collaborations FOR SELECT USING (true);

CREATE POLICY "Authenticated insert research_collaborations" 
ON public.research_collaborations FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated update research_collaborations" 
ON public.research_collaborations FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE TRIGGER update_research_collaborations_updated_at
BEFORE UPDATE ON public.research_collaborations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- FACULTY EXCHANGES
-- ============================================
CREATE TABLE public.faculty_exchanges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  university_id UUID NOT NULL REFERENCES public.universities(id),
  host_university_id UUID NOT NULL REFERENCES public.universities(id),
  faculty_name TEXT NOT NULL,
  faculty_email TEXT,
  department TEXT,
  exchange_type TEXT NOT NULL, -- teaching, research, sabbatical, short-term
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, in-progress, completed
  start_date DATE,
  end_date DATE,
  purpose TEXT,
  outcomes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.faculty_exchanges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access to faculty_exchanges" 
ON public.faculty_exchanges FOR SELECT USING (true);

CREATE POLICY "Authenticated insert faculty_exchanges" 
ON public.faculty_exchanges FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated update faculty_exchanges" 
ON public.faculty_exchanges FOR UPDATE 
USING (auth.role() = 'authenticated');

CREATE TRIGGER update_faculty_exchanges_updated_at
BEFORE UPDATE ON public.faculty_exchanges
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();