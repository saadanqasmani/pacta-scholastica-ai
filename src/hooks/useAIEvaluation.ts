import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

type EvaluationType = 'health_index' | 'strengths_weaknesses' | 'department_roi' | 'partner_recommendations' | 'market_intelligence';

export function useAIEvaluation<T>(evaluationType: EvaluationType) {
  const [data, setData] = useState<T | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const { language } = useLanguage();

  const evaluate = useCallback(async (universityId: string) => {
    if (!universityId) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data: result, error: fnError } = await supabase.functions.invoke('ai-evaluate', {
        body: { university_id: universityId, evaluation_type: evaluationType, language },
      });

      if (fnError) {
        throw new Error(fnError.message);
      }

      if (result.error) {
        throw new Error(result.error);
      }

      setData(result.evaluation as T);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate evaluation';
      setError(message);
      toast({
        title: 'Evaluation Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }, [evaluationType, toast, language]);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
  }, []);

  return { data, isLoading, error, evaluate, reset };
}
