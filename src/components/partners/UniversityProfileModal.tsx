import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Building2,
  MapPin,
  Globe,
  Calendar,
  Award,
  BookOpen,
  Users,
  TrendingUp,
  GraduationCap,
  ExternalLink,
  Loader2,
  Star,
  Handshake,
  DollarSign,
  FileText,
} from 'lucide-react';
import { University, Faculty, Department, PartnerROI } from '@/types/database';
import { supabase } from '@/integrations/supabase/client';

interface UniversityProfileModalProps {
  university: University | null;
  isOpen: boolean;
  onClose: () => void;
  onInitiateMOU: (universityName: string) => void;
}

interface FacultyWithDepartments extends Faculty {
  departments: Department[];
}

export function UniversityProfileModal({
  university,
  isOpen,
  onClose,
  onInitiateMOU,
}: UniversityProfileModalProps) {
  const [faculties, setFaculties] = useState<FacultyWithDepartments[]>([]);
  const [partnerROI, setPartnerROI] = useState<PartnerROI[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (university && isOpen) {
      fetchUniversityDetails();
    }
  }, [university?.id, isOpen]);

  const fetchUniversityDetails = async () => {
    if (!university) return;
    
    setIsLoading(true);
    try {
      // Fetch faculties
      const { data: facultiesData, error: facultiesError } = await supabase
        .from('faculties')
        .select('*')
        .eq('university_id', university.id);

      if (facultiesError) throw facultiesError;

      // Fetch departments for each faculty
      const facultiesWithDepts: FacultyWithDepartments[] = [];
      for (const faculty of facultiesData || []) {
        const { data: deptData } = await supabase
          .from('departments')
          .select('*')
          .eq('faculty_id', faculty.id);
        
        facultiesWithDepts.push({
          ...faculty,
          departments: (deptData || []) as Department[],
        });
      }
      setFaculties(facultiesWithDepts);

      // Fetch partner ROI data (other universities' ROI from partnering with this university)
      const { data: roiData, error: roiError } = await supabase
        .from('partner_roi')
        .select('*')
        .eq('university_id', university.id);

      if (!roiError && roiData) {
        setPartnerROI(roiData as PartnerROI[]);
      }
    } catch (error) {
      console.error('Error fetching university details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!university) return null;

  // Calculate aggregate ROI stats
  const avgSatisfaction = partnerROI.length > 0
    ? partnerROI.reduce((sum, r) => sum + Number(r.satisfaction_score), 0) / partnerROI.length
    : 0;
  const totalExchanges = partnerROI.reduce((sum, r) => sum + r.student_exchange_count, 0);
  const totalPublications = partnerROI.reduce((sum, r) => sum + r.joint_publications, 0);
  const totalFunding = partnerROI.reduce((sum, r) => sum + Number(r.grant_funding_usd), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div>
              <span className="text-xl">{university.name}</span>
              {university.ranking && (
                <Badge variant="outline" className="ml-2">
                  #{university.ranking} World Ranking
                </Badge>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-180px)]">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-4 mb-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="academics">Academics</TabsTrigger>
              <TabsTrigger value="research">Research</TabsTrigger>
              <TabsTrigger value="roi">Partner ROI</TabsTrigger>
            </TabsList>

            {isLoading ? (
              <div className="flex h-64 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-4">
                  {/* Basic Info */}
                  <Card>
                    <CardContent className="pt-6">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <MapPin className="h-4 w-4 text-muted-foreground" />
                            <span>{university.country}, {university.region}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span>Founded {university.founded_year || 'N/A'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <Building2 className="h-4 w-4 text-muted-foreground" />
                            <span className="capitalize">{university.type} • {university.size} institution</span>
                          </div>
                          {university.website && (
                            <div className="flex items-center gap-2 text-sm">
                              <Globe className="h-4 w-4 text-muted-foreground" />
                              <a 
                                href={university.website} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-primary hover:underline flex items-center gap-1"
                              >
                                Visit Website <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          )}
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-sm">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span>{university.educational_union || 'Independent'}</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <TrendingUp className="h-4 w-4 text-muted-foreground" />
                            <span className="capitalize">{university.internationalization_maturity} internationalization</span>
                          </div>
                          <div className="flex items-center gap-2 text-sm">
                            <GraduationCap className="h-4 w-4 text-muted-foreground" />
                            <span>{faculties.length} Faculties</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Accreditations */}
                  {university.accreditations && university.accreditations.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Award className="h-4 w-4" />
                          Accreditations
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {university.accreditations.map((acc, idx) => (
                            <Badge key={idx} variant="secondary">{acc}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Research Strengths */}
                  {university.research_strengths && university.research_strengths.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Star className="h-4 w-4" />
                          Key Strengths
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2">
                          {university.research_strengths.map((strength, idx) => (
                            <Badge key={idx} variant="default">{strength}</Badge>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Academics Tab */}
                <TabsContent value="academics" className="space-y-4">
                  {faculties.length > 0 ? (
                    faculties.map((faculty) => (
                      <Card key={faculty.id}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-primary" />
                            {faculty.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {faculty.departments.length > 0 ? (
                            <div className="grid gap-2 sm:grid-cols-2">
                              {faculty.departments.map((dept) => (
                                <div
                                  key={dept.id}
                                  className="rounded-md border p-2 text-sm"
                                >
                                  {dept.name}
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              No departments registered yet
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <Card>
                      <CardContent className="flex h-32 items-center justify-center">
                        <p className="text-muted-foreground">
                          No faculties registered for this university
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Research Tab */}
                <TabsContent value="research" className="space-y-4">
                  {/* Journals */}
                  {university.journals && university.journals.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <BookOpen className="h-4 w-4" />
                          Publishing Journals
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {university.journals.map((journal, idx) => (
                            <div
                              key={idx}
                              className="flex items-center gap-2 rounded-md border p-3"
                            >
                              <FileText className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">{journal}</span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Research Areas */}
                  {university.research_strengths && university.research_strengths.length > 0 && (
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <TrendingUp className="h-4 w-4" />
                          Research Focus Areas
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {university.research_strengths.map((area, idx) => (
                            <div key={idx} className="space-y-1">
                              <div className="flex items-center justify-between text-sm">
                                <span>{area}</span>
                                <span className="text-muted-foreground">
                                  {Math.floor(Math.random() * 30 + 70)}% output
                                </span>
                              </div>
                              <Progress value={Math.floor(Math.random() * 30 + 70)} />
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                {/* Partner ROI Tab */}
                <TabsContent value="roi" className="space-y-4">
                  {/* ROI Summary */}
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                            <Star className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Avg. Satisfaction</p>
                            <p className="text-xl font-bold">{avgSatisfaction.toFixed(1)}/5</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                            <Users className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Total Exchanges</p>
                            <p className="text-xl font-bold">{totalExchanges}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                            <BookOpen className="h-5 w-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Joint Publications</p>
                            <p className="text-xl font-bold">{totalPublications}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardContent className="pt-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                            <DollarSign className="h-5 w-5 text-amber-600" />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Grant Funding</p>
                            <p className="text-xl font-bold">${(totalFunding / 1000).toFixed(0)}k</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Partner List */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Handshake className="h-4 w-4" />
                        Partnership Performance ({partnerROI.length} partners)
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {partnerROI.length > 0 ? (
                        <div className="space-y-3">
                          {partnerROI.slice(0, 5).map((roi) => (
                            <div
                              key={roi.id}
                              className="flex items-center justify-between rounded-md border p-3"
                            >
                              <div className="space-y-1">
                                <p className="text-sm font-medium">
                                  Partnership Year: {roi.partnership_year}
                                </p>
                                <div className="flex gap-4 text-xs text-muted-foreground">
                                  <span>{roi.student_exchange_count} exchanges</span>
                                  <span>{roi.research_collaborations} collabs</span>
                                  <span>{roi.joint_publications} publications</span>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="flex items-center gap-1">
                                  <Star className="h-4 w-4 text-amber-500" />
                                  <span className="font-medium">{Number(roi.satisfaction_score).toFixed(1)}</span>
                                </div>
                                <p className="text-xs text-muted-foreground">
                                  ${Number(roi.grant_funding_usd).toLocaleString()}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-center text-muted-foreground py-8">
                          No partnership ROI data available yet
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </>
            )}
          </Tabs>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button onClick={() => onInitiateMOU(university.name)}>
            <Handshake className="h-4 w-4 mr-2" />
            Initiate MOU
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
