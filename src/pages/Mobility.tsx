import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Users, 
  Building2,
  GraduationCap,
  RefreshCw,
  Loader2,
  Filter
} from 'lucide-react';
import { useUniversity } from '@/contexts/UniversityContext';
import { supabase } from '@/integrations/supabase/client';
import { MobilityRecord, University, Department } from '@/types/database';

interface MobilityRecordWithDetails extends MobilityRecord {
  partner_name?: string;
  department_name?: string;
}

export default function Mobility() {
  const { selectedUniversity, universities, isLoading: universitiesLoading } = useUniversity();
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
        const facultyIds = facultiesData.map(f => f.id);
        const { data: deptData } = await supabase
          .from('departments')
          .select('*')
          .in('faculty_id', facultyIds);
        
        if (deptData) setDepartments(deptData as Department[]);
      }

      // Enrich with partner and department names
      const enrichedRecords = (mobilityData || []).map(record => {
        const partner = universities.find(u => u.id === record.partner_university_id);
        const dept = departments.find(d => d.id === record.department_id);
        return {
          ...record,
          partner_name: partner?.name || 'Unknown Partner',
          department_name: dept?.name || 'Unknown Department',
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
  const academicYears = [...new Set(records.map(r => r.academic_year))].sort().reverse();

  // Apply filters
  const filteredRecords = records.filter(record => {
    const matchesProgram = programFilter === 'all' || record.program_type === programFilter;
    const matchesDirection = directionFilter === 'all' || record.direction === directionFilter;
    const matchesYear = yearFilter === 'all' || record.academic_year === yearFilter;
    return matchesProgram && matchesDirection && matchesYear;
  });

  // Calculate statistics
  const stats = {
    totalIncoming: filteredRecords.filter(r => r.direction === 'incoming').reduce((sum, r) => sum + r.student_count, 0),
    totalOutgoing: filteredRecords.filter(r => r.direction === 'outgoing').reduce((sum, r) => sum + r.student_count, 0),
    erasmusCount: filteredRecords.filter(r => r.program_type === 'erasmus').reduce((sum, r) => sum + r.student_count, 0),
    bilateralCount: filteredRecords.filter(r => r.program_type === 'bilateral').reduce((sum, r) => sum + r.student_count, 0),
    exchangeCount: filteredRecords.filter(r => r.program_type === 'exchange').reduce((sum, r) => sum + r.student_count, 0),
    jointDegreeCount: filteredRecords.filter(r => r.program_type === 'joint_degree').reduce((sum, r) => sum + r.student_count, 0),
    activePrograms: filteredRecords.filter(r => r.completion_status === 'ongoing').length,
    completedPrograms: filteredRecords.filter(r => r.completion_status === 'completed').length,
    uniquePartners: new Set(filteredRecords.map(r => r.partner_university_id)).size,
  };

  const getProgramBadgeVariant = (type: string) => {
    switch (type) {
      case 'erasmus': return 'default';
      case 'bilateral': return 'secondary';
      case 'exchange': return 'outline';
      case 'joint_degree': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'ongoing': return 'default';
      case 'completed': return 'secondary';
      case 'cancelled': return 'destructive';
      default: return 'outline';
    }
  };

  if (universitiesLoading) {
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
        <h1 className="text-3xl font-semibold tracking-tight">Mobility Tracking</h1>
        <p className="text-muted-foreground">
          Track Erasmus and international exchange programs with incoming/outgoing student flows
        </p>
      </div>

      {/* Context Card */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Plane className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Mobility data for</p>
                <p className="font-semibold">{selectedUniversity.name}</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchMobilityData}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
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
                <p className="text-sm text-muted-foreground">Incoming Students</p>
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
                <p className="text-sm text-muted-foreground">Outgoing Students</p>
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
                <p className="text-sm text-muted-foreground">Partner Universities</p>
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
                <p className="text-sm text-muted-foreground">Active Programs</p>
                <p className="text-2xl font-bold">{stats.activePrograms}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Program Type Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Program Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <div className="rounded-lg border p-4 text-center">
              <Badge variant="default" className="mb-2">Erasmus+</Badge>
              <p className="text-2xl font-bold">{stats.erasmusCount}</p>
              <p className="text-xs text-muted-foreground">students</p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <Badge variant="secondary" className="mb-2">Bilateral</Badge>
              <p className="text-2xl font-bold">{stats.bilateralCount}</p>
              <p className="text-xs text-muted-foreground">students</p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <Badge variant="outline" className="mb-2">Exchange</Badge>
              <p className="text-2xl font-bold">{stats.exchangeCount}</p>
              <p className="text-xs text-muted-foreground">students</p>
            </div>
            <div className="rounded-lg border p-4 text-center">
              <Badge variant="destructive" className="mb-2">Joint Degree</Badge>
              <p className="text-2xl font-bold">{stats.jointDegreeCount}</p>
              <p className="text-xs text-muted-foreground">students</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filters:</span>
        </div>
        <Select value={programFilter} onValueChange={setProgramFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Program" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Programs</SelectItem>
            <SelectItem value="erasmus">Erasmus+</SelectItem>
            <SelectItem value="bilateral">Bilateral</SelectItem>
            <SelectItem value="exchange">Exchange</SelectItem>
            <SelectItem value="joint_degree">Joint Degree</SelectItem>
          </SelectContent>
        </Select>

        <Select value={directionFilter} onValueChange={setDirectionFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Direction" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Directions</SelectItem>
            <SelectItem value="incoming">Incoming</SelectItem>
            <SelectItem value="outgoing">Outgoing</SelectItem>
          </SelectContent>
        </Select>

        <Select value={yearFilter} onValueChange={setYearFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Year" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Years</SelectItem>
            {academicYears.map(year => (
              <SelectItem key={year} value={year}>{year}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Records Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Mobility Records</span>
            <Badge variant="outline">{filteredRecords.length} records</Badge>
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
                    <TableHead>Partner University</TableHead>
                    <TableHead>Program</TableHead>
                    <TableHead>Direction</TableHead>
                    <TableHead className="text-right">Students</TableHead>
                    <TableHead>Academic Year</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => {
                    const partner = universities.find(u => u.id === record.partner_university_id);
                    return (
                      <TableRow key={record.id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{partner?.name || 'Unknown'}</p>
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
                            <span className="capitalize">{record.direction}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {record.student_count}
                        </TableCell>
                        <TableCell>{record.academic_year}</TableCell>
                        <TableCell>
                          <Badge variant={getStatusBadgeVariant(record.completion_status)} className="capitalize">
                            {record.completion_status}
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
              <p>No mobility records found</p>
              <p className="text-sm">Mobility data will appear here once programs are active</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
