-- Create profiles table for user authentication data
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'university_user',
  university_id UUID REFERENCES public.universities(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- Create university_profiles table for extended university details
CREATE TABLE public.university_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  university_id UUID NOT NULL REFERENCES public.universities(id) ON DELETE CASCADE,
  
  -- Contact Information
  contact_person_name TEXT,
  contact_person_email TEXT,
  contact_person_phone TEXT,
  
  -- International Office Managers (up to 5)
  io_manager_1_name TEXT NOT NULL,
  io_manager_1_email TEXT,
  io_manager_1_phone TEXT,
  io_manager_2_name TEXT,
  io_manager_2_email TEXT,
  io_manager_2_phone TEXT,
  io_manager_3_name TEXT,
  io_manager_3_email TEXT,
  io_manager_3_phone TEXT,
  io_manager_4_name TEXT,
  io_manager_4_email TEXT,
  io_manager_4_phone TEXT,
  io_manager_5_name TEXT,
  io_manager_5_email TEXT,
  io_manager_5_phone TEXT,
  
  -- Institutional & Accreditation (Section A)
  languages_of_instruction TEXT[],
  degree_recognition TEXT,
  
  -- Partnership Eligibility (Section B)
  erasmus_eligibility TEXT[],
  horizon_europe_eligible BOOLEAN DEFAULT false,
  memberships TEXT[],
  collaboration_channels TEXT[],
  
  -- Academic & Research (Section C)
  discipline_focus_areas TEXT[],
  research_specializations TEXT[],
  publication_metrics TEXT,
  joint_degrees TEXT[],
  international_research_projects TEXT[],
  
  -- Mobility & Exchange (Section D)
  exchange_programs TEXT[],
  faculty_exchange_policies TEXT,
  credit_transfer_system TEXT,
  visa_housing_assistance BOOLEAN DEFAULT false,
  internship_frameworks TEXT[],
  
  -- Administrative Readiness (Section E)
  has_dedicated_io BOOLEAN DEFAULT true,
  digital_management_systems TEXT[],
  data_reporting_standards TEXT[],
  has_grant_management BOOLEAN DEFAULT false,
  has_english_speaking_staff BOOLEAN DEFAULT false,
  
  -- Reputation & Engagement (Section F)
  global_summit_participation TEXT[],
  alumni_footprint TEXT,
  student_satisfaction_score NUMERIC,
  social_media_presence TEXT,
  soft_power_alignment TEXT[],
  
  -- Collaboration Preferences (Section G)
  collaboration_interests TEXT[],
  
  -- Strategic Alignment (Section H)
  sdg_alignment TEXT[],
  regional_development_goals TEXT,
  cultural_diplomacy_focus TEXT,
  target_regions TEXT[],
  
  -- Photos
  university_photos TEXT[],
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  UNIQUE(university_id)
);

-- Enable RLS
ALTER TABLE public.university_profiles ENABLE ROW LEVEL SECURITY;

-- University profiles policies - public read for partner discovery
CREATE POLICY "Allow public read access to university_profiles" 
ON public.university_profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their university profile" 
ON public.university_profiles FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.university_id = university_profiles.university_id
  )
);

CREATE POLICY "Users can update their university profile" 
ON public.university_profiles FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() 
    AND profiles.university_id = university_profiles.university_id
  )
);

-- Create storage bucket for university photos
INSERT INTO storage.buckets (id, name, public) 
VALUES ('university-photos', 'university-photos', true);

-- Storage policies for university photos
CREATE POLICY "University photos are publicly accessible" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'university-photos');

CREATE POLICY "Authenticated users can upload university photos" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'university-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can update their university photos" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'university-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete their university photos" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'university-photos' AND auth.role() = 'authenticated');

-- Add INSERT policy for universities table so new users can create their university
CREATE POLICY "Authenticated users can create universities" 
ON public.universities FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Trigger to update updated_at
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_university_profiles_updated_at
BEFORE UPDATE ON public.university_profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', '')
  );
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();