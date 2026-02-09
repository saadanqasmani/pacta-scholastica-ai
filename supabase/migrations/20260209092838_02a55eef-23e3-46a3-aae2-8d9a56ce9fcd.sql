-- Add unique constraint for ai_evaluations upsert to work
ALTER TABLE public.ai_evaluations 
ADD CONSTRAINT ai_evaluations_university_id_evaluation_type_key 
UNIQUE (university_id, evaluation_type);