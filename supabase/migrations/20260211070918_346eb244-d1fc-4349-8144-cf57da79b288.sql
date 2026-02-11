
-- Partnership interactions/meetings tracking table
CREATE TABLE public.partnership_interactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  university_id UUID NOT NULL REFERENCES public.universities(id),
  partner_university_id UUID NOT NULL REFERENCES public.universities(id),
  interaction_type TEXT NOT NULL DEFAULT 'meeting', -- meeting, call, email, conference, visit
  meeting_format TEXT DEFAULT 'in_person', -- in_person, online, hybrid
  title TEXT NOT NULL,
  description TEXT,
  contact_person_name TEXT,
  contact_person_title TEXT,
  contact_person_email TEXT,
  location TEXT,
  meeting_date TIMESTAMP WITH TIME ZONE,
  duration_minutes INTEGER,
  discussion_notes TEXT,
  outcomes TEXT,
  stage TEXT NOT NULL DEFAULT 'initial_contact', -- initial_contact, exploration, negotiation, agreement, implementation, review
  next_steps TEXT,
  waiting_for TEXT,
  goals TEXT,
  priority TEXT DEFAULT 'medium', -- low, medium, high, urgent
  status TEXT DEFAULT 'scheduled', -- scheduled, completed, cancelled, postponed
  follow_up_date TIMESTAMP WITH TIME ZONE,
  resources_needed TEXT,
  ai_analysis TEXT,
  ai_achievability_score NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partnership_interactions ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their university's interactions"
  ON public.partnership_interactions FOR SELECT
  USING (true);

CREATE POLICY "Users can insert interactions"
  ON public.partnership_interactions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update interactions"
  ON public.partnership_interactions FOR UPDATE
  USING (true);

CREATE POLICY "Users can delete interactions"
  ON public.partnership_interactions FOR DELETE
  USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_partnership_interactions_updated_at
  BEFORE UPDATE ON public.partnership_interactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for faster queries
CREATE INDEX idx_partnership_interactions_university ON public.partnership_interactions(university_id);
CREATE INDEX idx_partnership_interactions_partner ON public.partnership_interactions(partner_university_id);
CREATE INDEX idx_partnership_interactions_stage ON public.partnership_interactions(stage);
