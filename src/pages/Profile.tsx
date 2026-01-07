import { useUniversity } from '@/contexts/UniversityContext';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, MapPin, Users, GraduationCap } from 'lucide-react';
import { HealthIndexCard } from '@/components/profile/HealthIndexCard';
import { StrengthsWeaknessesCard } from '@/components/profile/StrengthsWeaknessesCard';
import { DepartmentROICard } from '@/components/profile/DepartmentROICard';

export default function Profile() {
  const { selectedUniversity, isLoading } = useUniversity();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!selectedUniversity) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">Please select a university from the header.</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">University Profile</h1>
        <p className="text-muted-foreground">
          AI-generated institutional analysis and strategic intelligence
        </p>
      </div>

      {/* University Info Card */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="py-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-8 w-8 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl font-semibold">{selectedUniversity.name}</h2>
                <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-4 w-4" />
                    {selectedUniversity.country}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    <span className="capitalize">{selectedUniversity.size} institution</span>
                  </span>
                  <span className="flex items-center gap-1">
                    <GraduationCap className="h-4 w-4" />
                    <span className="capitalize">{selectedUniversity.type}</span>
                  </span>
                </div>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="capitalize">
                {selectedUniversity.region}
              </Badge>
              <Badge 
                variant={selectedUniversity.internationalization_maturity === 'high' ? 'default' : 'secondary'}
                className="capitalize"
              >
                {selectedUniversity.internationalization_maturity} internationalization
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Health Index */}
      <HealthIndexCard />

      {/* Strengths & Weaknesses */}
      <StrengthsWeaknessesCard />

      {/* Department ROI */}
      <DepartmentROICard />
    </div>
  );
}
