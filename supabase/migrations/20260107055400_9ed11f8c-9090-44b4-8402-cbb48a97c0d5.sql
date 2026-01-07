-- Create partner_requests table for incoming partnership requests
CREATE TABLE IF NOT EXISTS public.partner_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_university_id UUID NOT NULL REFERENCES public.universities(id),
  to_university_id UUID NOT NULL REFERENCES public.universities(id),
  request_type TEXT NOT NULL DEFAULT 'partnership',
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  priority TEXT NOT NULL DEFAULT 'normal',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  responded_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.partner_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to partner_requests" 
ON public.partner_requests FOR SELECT USING (true);

CREATE POLICY "Allow public insert to partner_requests" 
ON public.partner_requests FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to partner_requests" 
ON public.partner_requests FOR UPDATE USING (true);

-- Create partner_projects table for tracking ongoing projects
CREATE TABLE IF NOT EXISTS public.partner_projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  university_id UUID NOT NULL REFERENCES public.universities(id),
  partner_university_id UUID NOT NULL REFERENCES public.universities(id),
  project_name TEXT NOT NULL,
  project_type TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'planning',
  progress INTEGER NOT NULL DEFAULT 0,
  start_date DATE,
  end_date DATE,
  budget_usd NUMERIC(12,2),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to partner_projects" 
ON public.partner_projects FOR SELECT USING (true);

CREATE POLICY "Allow public insert to partner_projects" 
ON public.partner_projects FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to partner_projects" 
ON public.partner_projects FOR UPDATE USING (true);

-- Create partner_messages table for communication
CREATE TABLE IF NOT EXISTS public.partner_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_university_id UUID NOT NULL REFERENCES public.universities(id),
  to_university_id UUID NOT NULL REFERENCES public.universities(id),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  message_type TEXT NOT NULL DEFAULT 'general',
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.partner_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to partner_messages" 
ON public.partner_messages FOR SELECT USING (true);

CREATE POLICY "Allow public insert to partner_messages" 
ON public.partner_messages FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update to partner_messages" 
ON public.partner_messages FOR UPDATE USING (true);

-- Add trigger for partner_projects updated_at
CREATE TRIGGER update_partner_projects_updated_at
BEFORE UPDATE ON public.partner_projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();