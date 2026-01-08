import { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, DollarSign } from 'lucide-react';
import { useAIEvaluation } from '@/hooks/useAIEvaluation';
import { DepartmentROI } from '@/types/database';
import { useUniversity } from '@/contexts/UniversityContext';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface DepartmentROIResponse {
  departments: DepartmentROI[];
}

const categoryStyles: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  scale: { label: 'SCALE', variant: 'default' },
  correct: { label: 'CORRECT', variant: 'secondary' },
  pause: { label: 'PAUSE', variant: 'outline' },
  exit: { label: 'EXIT', variant: 'destructive' },
};

export function DepartmentROICard() {
  const { selectedUniversity } = useUniversity();
  const { data, isLoading, evaluate } = useAIEvaluation<DepartmentROIResponse>('department_roi');

  useEffect(() => {
    // Re-generate when the selected university changes.
    if (selectedUniversity?.id) {
      evaluate(selectedUniversity.id);
    }
  }, [selectedUniversity?.id, evaluate]);


  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-primary';
    if (score >= 50) return 'text-foreground';
    return 'text-destructive';
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-primary" />
          <CardTitle className="text-lg">Department ROI Analysis</CardTitle>
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
              <span className="text-sm text-muted-foreground">Calculating ROI metrics...</span>
            </div>
          </div>
        ) : data?.departments ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-center">Recruitment ROI</TableHead>
                  <TableHead className="text-center">Cost/Outcome</TableHead>
                  <TableHead className="text-center">Market Fit</TableHead>
                  <TableHead className="text-center">Brand</TableHead>
                  <TableHead className="text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data.departments.map((dept, index) => {
                  const category = categoryStyles[dept.category] || categoryStyles.correct;
                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{dept.department_name}</p>
                          <p className="text-xs text-muted-foreground">{dept.faculty_name}</p>
                        </div>
                      </TableCell>
                      <TableCell className={`text-center font-medium ${getScoreColor(dept.international_recruitment_roi)}`}>
                        {dept.international_recruitment_roi}
                      </TableCell>
                      <TableCell className={`text-center font-medium ${getScoreColor(dept.cost_outcome_ratio)}`}>
                        {dept.cost_outcome_ratio}
                      </TableCell>
                      <TableCell className={`text-center font-medium ${getScoreColor(dept.market_program_fit)}`}>
                        {dept.market_program_fit}
                      </TableCell>
                      <TableCell className={`text-center font-medium ${getScoreColor(dept.brand_contribution)}`}>
                        {dept.brand_contribution}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={category.variant}>{category.label}</Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span className="font-medium">Legend:</span>
              {Object.entries(categoryStyles).map(([key, { label, variant }]) => (
                <Badge key={key} variant={variant} className="text-xs">
                  {label}
                </Badge>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex h-48 items-center justify-center">
            <Button onClick={() => selectedUniversity && evaluate(selectedUniversity.id)}>
              Calculate Department ROI
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
