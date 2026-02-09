import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { useAIEvaluation } from '@/hooks/useAIEvaluation';
import { StrengthsWeaknesses, DepartmentAnalysis } from '@/types/database';
import { useUniversity } from '@/contexts/UniversityContext';
import { useLanguage } from '@/contexts/LanguageContext';

export function StrengthsWeaknessesCard() {
  const { selectedUniversity } = useUniversity();
  const { t } = useLanguage();
  const { data, isLoading, evaluate } = useAIEvaluation<StrengthsWeaknesses>('strengths_weaknesses');

  const actionLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    scale: { label: t('profile.scale'), variant: 'default' },
    none: { label: t('profile.maintain'), variant: 'secondary' },
    structural_reform: { label: t('profile.reformRequired'), variant: 'destructive' },
    strategic_partnership: { label: t('profile.partnerNeeded'), variant: 'outline' },
    capacity_adjustment: { label: t('profile.adjustCapacity'), variant: 'outline' },
  };

  useEffect(() => {
    if (selectedUniversity?.id) evaluate(selectedUniversity.id);
  }, [selectedUniversity?.id, evaluate]);

  const renderDepartment = (dept: DepartmentAnalysis, type: 'strength' | 'weakness') => {
    const action = actionLabels[dept.action_required || 'none'];
    return (
      <div key={`${dept.faculty_name}-${dept.department_name}`} className="rounded-lg border border-border p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <p className="font-medium">{dept.department_name}</p>
            <p className="text-xs text-muted-foreground">{dept.faculty_name}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-lg font-bold ${type === 'strength' ? 'text-primary' : 'text-destructive'}`}>{dept.score}</span>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mb-3">{dept.analysis}</p>
        <Badge variant={action.variant}>{action.label}</Badge>
      </div>
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{t('profile.strengthsAndWeaknesses')}</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => selectedUniversity && evaluate(selectedUniversity.id)} disabled={isLoading}>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">{t('profile.aiGenerating')}</span>
            </div>
          </div>
        ) : data ? (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h4 className="font-medium">{t('profile.topStrengths')}</h4>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {data.strengths.map((dept) => renderDepartment(dept, 'strength'))}
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="h-4 w-4 text-destructive" />
                <h4 className="font-medium">{t('profile.areasForImprovement')}</h4>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {data.weaknesses.map((dept) => renderDepartment(dept, 'weakness'))}
              </div>
            </div>
            <div className="rounded-lg bg-secondary/50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <h4 className="font-medium">{t('profile.recommendations')}</h4>
              </div>
              <ul className="space-y-2">
                {data.recommendations.map((rec, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm">
                    <span className="font-bold text-primary">{index + 1}.</span>
                    <span className="text-muted-foreground">{rec}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ) : (
          <div className="flex h-48 items-center justify-center">
            <Button onClick={() => selectedUniversity && evaluate(selectedUniversity.id)}>
              {t('profile.generateAnalysis')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
