import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Loader2, RefreshCw, Activity } from 'lucide-react';
import { useAIEvaluation } from '@/hooks/useAIEvaluation';
import { InstitutionalHealthIndex } from '@/types/database';
import { useUniversity } from '@/contexts/UniversityContext';

export function HealthIndexCard() {
  const { selectedUniversity } = useUniversity();
  const { data, isLoading, evaluate } = useAIEvaluation<InstitutionalHealthIndex>('health_index');

  useEffect(() => {
    if (selectedUniversity?.id && !data && !isLoading) {
      evaluate(selectedUniversity.id);
    }
  }, [selectedUniversity?.id]);

  const metrics = data ? [
    { label: 'Recruitment Efficiency', value: data.recruitment_efficiency },
    { label: 'Offer-to-Enrollment Quality', value: data.offer_to_enrollment_quality },
    { label: 'Retention Stability', value: data.retention_stability },
    { label: 'Internationalization Impact', value: data.internationalization_impact },
    { label: 'Mobility Participation', value: data.mobility_participation },
    { label: 'Partner Performance', value: data.partner_performance },
  ] : [];

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-primary';
    if (score >= 50) return 'text-warning';
    return 'text-destructive';
  };

  const getProgressColor = (score: number) => {
    if (score >= 75) return 'bg-primary';
    if (score >= 50) return 'bg-warning';
    return 'bg-destructive';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Institutional Health Index</CardTitle>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => selectedUniversity && evaluate(selectedUniversity.id)}
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <RefreshCw className="h-4 w-4" />
          )}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Generating AI analysis...</span>
            </div>
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Overall Score */}
            <div className="flex items-center justify-between rounded-lg bg-secondary p-4">
              <div>
                <p className="text-sm text-muted-foreground">Overall Score</p>
                <p className="text-xs text-muted-foreground mt-1">Diagnostic assessment, not ranking</p>
              </div>
              <div className={`text-4xl font-bold ${getScoreColor(data.overall_score)}`}>
                {data.overall_score}
              </div>
            </div>

            {/* Metrics */}
            <div className="space-y-4">
              {metrics.map((metric) => (
                <div key={metric.label} className="space-y-1">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{metric.label}</span>
                    <span className={`font-medium ${getScoreColor(metric.value)}`}>
                      {metric.value}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-secondary">
                    <div
                      className={`h-2 rounded-full transition-all ${getProgressColor(metric.value)}`}
                      style={{ width: `${metric.value}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Summary */}
            <div className="rounded-lg border border-border bg-muted/30 p-4">
              <p className="text-sm font-medium mb-1">Executive Summary</p>
              <p className="text-sm text-muted-foreground">{data.summary}</p>
            </div>
          </div>
        ) : (
          <div className="flex h-48 items-center justify-center">
            <Button onClick={() => selectedUniversity && evaluate(selectedUniversity.id)}>
              Generate Health Index
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
