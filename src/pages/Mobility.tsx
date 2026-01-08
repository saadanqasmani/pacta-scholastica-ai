import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plane,
  ArrowUpRight,
  ArrowDownLeft,
  Building2,
  GraduationCap,
  RefreshCw,
  Loader2,
  Filter,
  ClipboardList,
  FileText,
} from 'lucide-react';
import { useUniversity } from '@/contexts/UniversityContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { MobilityRecord, Department } from '@/types/database';
import { StudentMobilityTracking } from '@/components/mobility/StudentMobilityTracking';
import { LearningAgreementGenerator } from '@/components/mobility/LearningAgreementGenerator';

interface MobilityRecordWithDetails extends MobilityRecord {
  partner_name?: string;
  department_name?: string;
}

export default function Mobility() {
  const { selectedUniversity, universities, isLoading: universitiesLoading } = useUniversity();
  const { t } = useLanguage();

  const [records, setRecords] = useState<MobilityRecordWithDetails[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [programFilter, setProgramFilter] = useState<string>('all');
  const [directionFilter, setDirectionFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');

  // Fetch mobility records
  const fetchMobilityData = async () => {
    if (!selectedUniversity) return;

    setIsLoading(true);
    try {
      const { data: mobilityData, error } = await supabase
        .from('mobility_records')
        .select('*')
        .eq('university_id', selectedUniversity.id);

      if (error) throw error;

      // Fetch departments for this university's faculties
      const { data: facultiesData } = await supabase
        .from('faculties')
        .select('id')
        .eq('university_id', selectedUniversity.id);

      if (facultiesData && facultiesData.length > 0) {
        const facultyIds = facultiesData.map((f) => f.id);
        const { data: deptData } = await supabase
          .from('departments')
          .select('*')
          .in('faculty_id', facultyIds);

        if (deptData) setDepartments(deptData as Department[]);
      }

      // Enrich with partner and department names
      const enrichedRecords = (mobilityData || []).map((record) => {
        const partner = universities.find((u) => u.id === record.partner_university_id);
        const dept = departments.find((d) => d.id === record.department_id);
        return {
          ...record,
          partner_name: partner?.name || t('common.unknown'),
          department_name: dept?.name || t('common.unknown'),
        } as MobilityRecordWithDetails;
      });

      setRecords(enrichedRecords);
    } catch (error) {
      console.error('Error fetching mobility data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchMobilityData();
  }, [selectedUniversity?.id, universities]);

  // Get unique years from records
  const academicYears = [...new Set(records.map((r) => r.academic_year))].sort().reverse();

  // Apply filters
  const filteredRecords = records.filter((record) => {
    const matchesProgram = programFilter === 'all' || record.program_type === programFilter;
    const matchesDirection = directionFilter === 'all' || record.direction === directionFilter;
    const matchesYear = yearFilter === 'all' || record.academic_year === yearFilter;
    return matchesProgram && matchesDirection && matchesYear;
  });

  // Calculate statistics
  const stats = {
    totalIncoming: filteredRecords
      .filter((r) => r.direction === 'incoming')
      .reduce((sum, r) => sum + r.student_count, 0),
    totalOutgoing: filteredRecords
      .filter((r) => r.direction === 'outgoing')
      .reduce((sum, r) => sum + r.student_count, 0),
    erasmusCount: filteredRecords
      .filter((r) => r.program_type === 'erasmus')
      .reduce((sum, r) => sum + r.student_count, 0),
    bilateralCount: filteredRecords
      .filter((r) => r.program_type === 'bilateral')
      .reduce((sum, r) => sum + r.student_count, 0),
    exchangeCount: filteredRecords
      .filter((r) => r.program_type === 'exchange')
      .reduce((sum, r) => sum + r.student_count, 0),
    jointDegreeCount: filteredRecords
      .filter((r) => r.program_type === 'joint_degree')
      .reduce((sum, r) => sum + r.student_count, 0),
    activePrograms: filteredRecords.filter((r) => r.completion_status === 'ongoing').length,
    completedPrograms: filteredRecords.filter((r) => r.completion_status === 'completed').length,
    uniquePartners: new Set(filteredRecords.map((r) => r.partner_university_id)).size,
  };

  const getProgramBadgeVariant = (type: string) => {
    switch (type) {
      case 'erasmus':
        return 'default';
      case 'bilateral':
        return 'secondary';
      case 'exchange':
        return 'outline';
      case 'joint_degree':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ongoing':
        return 'default';
      case 'completed':
        return 'secondary';
      case 'cancelled':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  if (universitiesLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">{t('common.loading')}</div>
      </div>
    );
  }

  if (!selectedUniversity) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">{t('mobility.selectUniversityPrompt')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{t('mobility.title')}</h1>
        <p className="text-muted-foreground">{t('mobility.subtitle')}</p>
      </div>

      {/* Tabs Navigation */}
      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
          <TabsTrigger value="overview" className="gap-2">
            <Plane className="h-4 w-4" />
            <span className="hidden sm:inline">{t('mobility.overview')}</span>
          </TabsTrigger>
          <TabsTrigger value="applications" className="gap-2">
            <ClipboardList className="h-4 w-4" />
            <span className="hidden sm:inline">{t('mobility.studentApplications')}</span>
          </TabsTrigger>
          <TabsTrigger value="learning-agreements" className="gap-2">
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">{t('mobility.learningAgreements')}</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Context Card */}
          <Card className="border-l-4 border-l-primary">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Plane className="h-5 w-5 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">{t('mobility.dataFor')}</p>
                    <p className="font-semibold">{selectedUniversity.name}</p>
                  </div>
                </div>
                <Button variant="outline" size="sm" onClick={fetchMobilityData} disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  {t('common.refresh')}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Statistics Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                    <ArrowDownLeft className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('mobility.incomingStudents')}</p>
                    <p className="text-2xl font-bold">{stats.totalIncoming}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                    <ArrowUpRight className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('mobility.outgoingStudents')}</p>
                    <p className="text-2xl font-bold">{stats.totalOutgoing}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('mobility.partnerUniversities')}</p>
                    <p className="text-2xl font-bold">{stats.uniquePartners}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                    <GraduationCap className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{t('mobility.activePrograms')}</p>
                    <p className="text-2xl font-bold">{stats.activePrograms}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Program Type Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('mobility.programDistribution')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="rounded-lg border p-4 text-center">
                  <Badge variant="default" className="mb-2">
                    {t('mobility.program.erasmus')}
                  </Badge>
                  <p className="text-2xl font-bold">{stats.erasmusCount}</p>
                  <p className="text-xs text-muted-foreground">{t('common.students')}</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <Badge variant="secondary" className="mb-2">
                    {t('mobility.program.bilateral')}
                  </Badge>
                  <p className="text-2xl font-bold">{stats.bilateralCount}</p>
                  <p className="text-xs text-muted-foreground">{t('common.students')}</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <Badge variant="outline" className="mb-2">
                    {t('mobility.program.exchange')}
                  </Badge>
                  <p className="text-2xl font-bold">{stats.exchangeCount}</p>
                  <p className="text-xs text-muted-foreground">{t('common.students')}</p>
                </div>
                <div className="rounded-lg border p-4 text-center">
                  <Badge variant="destructive" className="mb-2">
                    {t('mobility.program.jointDegree')}
                  </Badge>
                  <p className="text-2xl font-bold">{stats.jointDegreeCount}</p>
                  <p className="text-xs text-muted-foreground">{t('common.students')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{t('mobility.filters')}</span>
            </div>
            <Select value={programFilter} onValueChange={setProgramFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder={t('mobility.programType')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('mobility.allPrograms')}</SelectItem>
                <SelectItem value="erasmus">{t('mobility.program.erasmus')}</SelectItem>
                <SelectItem value="bilateral">{t('mobility.program.bilateral')}</SelectItem>
                <SelectItem value="exchange">{t('mobility.program.exchange')}</SelectItem>
                <SelectItem value="joint_degree">{t('mobility.program.jointDegree')}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={directionFilter} onValueChange={setDirectionFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder={t('mobility.direction')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('mobility.allDirections')}</SelectItem>
                <SelectItem value="incoming">{t('mobility.incoming')}</SelectItem>
                <SelectItem value="outgoing">{t('mobility.outgoing')}</SelectItem>
              </SelectContent>
            </Select>

            <Select value={yearFilter} onValueChange={setYearFilter}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder={t('mobility.academicYear')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('mobility.allYears')}</SelectItem>
                {academicYears.map((year) => (
                  <SelectItem key={year} value={year}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Records Table */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>{t('mobility.recordsTitle')}</span>
                <Badge variant="outline">
                  {filteredRecords.length} {t('common.records')}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex h-32 items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredRecords.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('mobility.table.partnerUniversity')}</TableHead>
                        <TableHead>{t('mobility.table.program')}</TableHead>
                        <TableHead>{t('mobility.table.direction')}</TableHead>
                        <TableHead className="text-right">{t('mobility.table.students')}</TableHead>
                        <TableHead>{t('mobility.table.academicYear')}</TableHead>
                        <TableHead>{t('mobility.table.status')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRecords.map((record) => {
                        const partner = universities.find((u) => u.id === record.partner_university_id);
                        return (
                          <TableRow key={record.id}>
                            <TableCell>
                              <div>
                                <p className="font-medium">{partner?.name || t('common.unknown')}</p>
                                <p className="text-xs text-muted-foreground">{partner?.country || ''}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant={getProgramBadgeVariant(record.program_type)} className="capitalize">
                                {record.program_type.replace('_', ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {record.direction === 'incoming' ? (
                                  <ArrowDownLeft className="h-4 w-4 text-green-600" />
                                ) : (
                                  <ArrowUpRight className="h-4 w-4 text-blue-600" />
                                )}
                                <span className="capitalize">
                                  {record.direction === 'incoming'
                                    ? t('mobility.incoming')
                                    : t('mobility.outgoing')}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right font-medium">{record.student_count}</TableCell>
                            <TableCell>{record.academic_year}</TableCell>
                            <TableCell>
                              <Badge variant={getStatusBadgeVariant(record.completion_status)} className="capitalize">
                                {record.completion_status === 'ongoing'
                                  ? t('mobility.ongoing')
                                  : record.completion_status === 'completed'
                                    ? t('mobility.completed')
                                    : record.completion_status === 'cancelled'
                                      ? t('mobility.cancelled')
                                      : record.completion_status}
                              </Badge>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="flex h-32 flex-col items-center justify-center text-muted-foreground">
                  <Plane className="h-8 w-8 mb-2 opacity-50" />
                  <p>{t('mobility.noRecords')}</p>
                  <p className="text-sm">{t('mobility.noRecordsDesc')}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Student Applications Tab */}
        <TabsContent value="applications">
          <StudentMobilityTracking />
        </TabsContent>

        {/* Learning Agreements Tab */}
        <TabsContent value="learning-agreements">
          <LearningAgreementGenerator />
        </TabsContent>
      </Tabs>
    </div>
  );
}
