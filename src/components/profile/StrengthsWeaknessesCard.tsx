import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { useAIEvaluation } from '@/hooks/useAIEvaluation';
import { StrengthsWeaknesses, DepartmentAnalysis } from '@/types/database';
import { useUniversity } from '@/contexts/UniversityContext';

const actionLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  scale: { label: 'Scale', variant: 'default' },
  none: { label: 'Maintain', variant: 'secondary' },
  structural_reform: { label: 'Reform Required', variant: 'destructive' },
  strategic_partnership: { label: 'Partner Needed', variant: 'outline' },
  capacity_adjustment: { label: 'Adjust Capacity', variant: 'outline' },
};

export function StrengthsWeaknessesCard() {
  const { selectedUniversity } = useUniversity();
  const { data, isLoading, evaluate } = useAIEvaluation<StrengthsWeaknesses>('strengths_weaknesses');

  useEffect(() => {
    if (selectedUniversity?.id && !data && !isLoading) {
      evaluate(selectedUniversity.id);
    }
  }, [selectedUniversity?.id]);

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
            <span className={`text-lg font-bold ${type === 'strength' ? 'text-primary' : 'text-destructive'}`}>
              {dept.score}
            </span>
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
        <CardTitle className="text-lg">Strengths & Weaknesses Analysis</CardTitle>
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
              <span className="text-sm text-muted-foreground">Analyzing departments...</span>
            </div>
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* Strengths */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-primary" />
                <h4 className="font-medium">Strengths</h4>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {data.strengths.map((dept) => renderDepartment(dept, 'strength'))}
              </div>
            </div>

            {/* Weaknesses */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingDown className="h-4 w-4 text-destructive" />
                <h4 className="font-medium">Weaknesses</h4>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                {data.weaknesses.map((dept) => renderDepartment(dept, 'weakness'))}
              </div>
            </div>

            {/* Recommendations */}
            <div className="rounded-lg bg-secondary/50 p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <h4 className="font-medium">Strategic Recommendations</h4>
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
              Analyze Departments
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
