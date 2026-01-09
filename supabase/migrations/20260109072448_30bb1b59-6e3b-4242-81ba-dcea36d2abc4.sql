-- Make application_id nullable since we're generating LAs without applications
ALTER TABLE public.learning_agreements ALTER COLUMN application_id DROP NOT NULL;