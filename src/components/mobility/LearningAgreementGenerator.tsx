import { useState, useEffect } from 'react';
import { useUniversity } from '@/contexts/UniversityContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  FileText,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  BookOpen,
  GraduationCap,
  Plus,
  X,
  Download,
  Building2,
  User,
  Calendar,
  Search,
  Info,
  Eye,
} from 'lucide-react';

interface Course {
  id: string;
  course_code: string;
  course_name: string;
  description: string | null;
  credits: number;
  ects_credits: number | null;
  department: string | null;
}

interface Faculty {
  id: string;
  name: string;
  university_id: string;
}

interface Department {
  id: string;
  name: string;
  faculty_id: string;
}

interface SelectedHomeCourse {
  id: string;
  code: string;
  name: string;
  credits: number;
  ects: number | null;
  department: string | null;
  description: string | null;
}

interface CourseMatch {
  homeCourse: SelectedHomeCourse;
  hostCourseId?: string;
  hostCourseCode?: string;
  hostCourseName?: string;
  hostCredits?: number;
  hostEcts?: number | null;
  matchScore: number;
  matchReason?: string;
  selected: boolean;
}

type Step = 'info' | 'courses' | 'matching' | 'generate';

export function LearningAgreementGenerator() {
  const { selectedUniversity, universities } = useUniversity();
  const { toast } = useToast();

  // Step 1: Student Info
  const [studentName, setStudentName] = useState('');
  const [studentEmail, setStudentEmail] = useState('');
  const [studentId, setStudentId] = useState('');
  const [hostUniversityId, setHostUniversityId] = useState('');
  
  // Faculty & Department
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedFacultyId, setSelectedFacultyId] = useState('');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState('');
  const [semester, setSemester] = useState('');
  
  // Step 2: Course Selection
  const [homeCourses, setHomeCourses] = useState<Course[]>([]);
  const [selectedHomeCourses, setSelectedHomeCourses] = useState<SelectedHomeCourse[]>([]);
  const [hostCourses, setHostCourses] = useState<Course[]>([]);
  const [courseSearchQuery, setCourseSearchQuery] = useState('');
  const [viewingCourse, setViewingCourse] = useState<Course | null>(null);
  
  // Step 3: AI Matching
  const [courseMatches, setCourseMatches] = useState<CourseMatch[]>([]);
  const [isMatching, setIsMatching] = useState(false);
  
  // Step 4: Generate
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAgreement, setGeneratedAgreement] = useState<any>(null);
  
  const [step, setStep] = useState<Step>('info');

  // Fetch faculties for selected university
  useEffect(() => {
    if (selectedUniversity) {
      fetchFaculties();
    }
  }, [selectedUniversity]);

  // Fetch departments when faculty changes
  useEffect(() => {
    if (selectedFacultyId) {
      fetchDepartments();
    } else {
      setDepartments([]);
      setSelectedDepartmentId('');
    }
  }, [selectedFacultyId]);

  // Fetch home courses when department changes
  useEffect(() => {
    if (selectedUniversity) {
      fetchHomeCourses();
    }
  }, [selectedUniversity, selectedDepartmentId]);

  // Fetch host courses when host university changes
  useEffect(() => {
    if (hostUniversityId) {
      fetchHostCourses();
    }
  }, [hostUniversityId]);

  const fetchFaculties = async () => {
    if (!selectedUniversity) return;
    const { data, error } = await supabase
      .from('faculties')
      .select('id, name, university_id')
      .eq('university_id', selectedUniversity.id)
      .order('name');
    if (!error && data) setFaculties(data);
  };

  const fetchDepartments = async () => {
    const { data, error } = await supabase
      .from('departments')
      .select('id, name, faculty_id')
      .eq('faculty_id', selectedFacultyId)
      .order('name');
    if (!error && data) setDepartments(data);
  };

  const fetchHomeCourses = async () => {
    if (!selectedUniversity) return;
    
    // Always fetch all courses for the university - department filter is optional
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('university_id', selectedUniversity.id)
      .order('department', { ascending: true })
      .order('course_code', { ascending: true });
    
    if (!error && data) {
      // If department is selected, filter client-side but keep all courses accessible
      if (selectedDepartmentId) {
        const dept = departments.find(d => d.id === selectedDepartmentId);
        if (dept) {
          const filtered = data.filter(c => c.department === dept.name);
          setHomeCourses(filtered.length > 0 ? filtered : data);
        } else {
          setHomeCourses(data);
        }
      } else {
        setHomeCourses(data);
      }
    }
  };

  const fetchHostCourses = async () => {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('university_id', hostUniversityId)
      .order('department', { ascending: true });
    if (!error && data) setHostCourses(data);
  };

  const addHomeCourse = (course: Course) => {
    if (selectedHomeCourses.find(c => c.id === course.id)) {
      toast({ variant: 'destructive', title: 'Course already added' });
      return;
    }
    setSelectedHomeCourses([...selectedHomeCourses, {
      id: course.id,
      code: course.course_code,
      name: course.course_name,
      credits: course.credits,
      ects: course.ects_credits,
      department: course.department,
      description: course.description,
    }]);
  };

  const removeHomeCourse = (courseId: string) => {
    setSelectedHomeCourses(selectedHomeCourses.filter(c => c.id !== courseId));
  };

  const runAIMatching = async () => {
    if (selectedHomeCourses.length === 0 || hostCourses.length === 0) {
      toast({ variant: 'destructive', title: 'Please select courses and host university' });
      return;
    }

    setIsMatching(true);
    try {
      const response = await supabase.functions.invoke('parse-transcript', {
        body: {
          transcriptText: selectedHomeCourses.map(c => 
            `${c.code} - ${c.name} (${c.credits} credits, Department: ${c.department || 'Unknown'})\nDescription: ${c.description || 'No description available'}`
          ).join('\n\n'),
          hostUniversityCourses: hostCourses.map(c => ({
            id: c.id,
            code: c.course_code,
            name: c.course_name,
            description: c.description || 'No description available',
            credits: c.credits,
            ects: c.ects_credits,
            department: c.department,
          })),
        },
      });

      if (response.error) throw response.error;
      
      const data = response.data;
      if (data.error) throw new Error(data.error);

      // Map the AI results to our format
      const matches: CourseMatch[] = selectedHomeCourses.map(homeCourse => {
        const aiMatch = (data.courseMatches || []).find(
          (m: any) => m.homeCourseCode === homeCourse.code
        );
        
        const hostCourse = aiMatch?.hostCourseId 
          ? hostCourses.find(c => c.id === aiMatch.hostCourseId)
          : null;

        return {
          homeCourse,
          hostCourseId: aiMatch?.hostCourseId,
          hostCourseCode: aiMatch?.hostCourseCode || hostCourse?.course_code,
          hostCourseName: aiMatch?.hostCourseName || hostCourse?.course_name,
          hostCredits: aiMatch?.hostCredits || hostCourse?.credits,
          hostEcts: hostCourse?.ects_credits,
          matchScore: aiMatch?.matchScore || 0,
          matchReason: aiMatch?.matchReason,
          selected: (aiMatch?.matchScore || 0) >= 50,
        };
      });

      setCourseMatches(matches);
      setStep('matching');
      toast({ title: 'AI matching complete!', description: `${matches.length} courses analyzed` });
    } catch (error: any) {
      console.error('Error matching courses:', error);
      toast({ variant: 'destructive', title: 'Error matching courses', description: error.message });
    } finally {
      setIsMatching(false);
    }
  };

  const updateHostCourseSelection = (index: number, hostCourseId: string) => {
    const hostCourse = hostCourses.find(c => c.id === hostCourseId);
    if (!hostCourse) return;

    setCourseMatches(courseMatches.map((m, i) => 
      i === index ? {
        ...m,
        hostCourseId: hostCourse.id,
        hostCourseCode: hostCourse.course_code,
        hostCourseName: hostCourse.course_name,
        hostCredits: hostCourse.credits,
        hostEcts: hostCourse.ects_credits,
        matchScore: 100, // Manual selection = 100% match
        selected: true,
      } : m
    ));
  };

  const toggleMatchSelection = (index: number) => {
    setCourseMatches(courseMatches.map((m, i) => 
      i === index ? { ...m, selected: !m.selected } : m
    ));
  };

  const getSelectedTotals = () => {
    const selected = courseMatches.filter(m => m.selected && m.hostCourseId);
    return {
      homeCredits: selected.reduce((sum, m) => sum + m.homeCourse.credits, 0),
      homeEcts: selected.reduce((sum, m) => sum + (m.homeCourse.ects || 0), 0),
      hostCredits: selected.reduce((sum, m) => sum + (m.hostCredits || 0), 0),
      hostEcts: selected.reduce((sum, m) => sum + (m.hostEcts || 0), 0),
    };
  };

  const generateLearningAgreement = async () => {
    const selectedMatches = courseMatches.filter(m => m.selected && m.hostCourseId);
    if (selectedMatches.length === 0) {
      toast({ variant: 'destructive', title: 'Please select at least one course mapping' });
      return;
    }

    setIsGenerating(true);
    try {
      const totals = getSelectedTotals();
      const hostUniversity = universities.find(u => u.id === hostUniversityId);
      const faculty = faculties.find(f => f.id === selectedFacultyId);
      const department = departments.find(d => d.id === selectedDepartmentId);

      const agreement = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        status: 'draft',
        student: {
          name: studentName,
          email: studentEmail,
          studentId: studentId,
        },
        homeUniversity: {
          id: selectedUniversity?.id,
          name: selectedUniversity?.name,
          country: selectedUniversity?.country,
          faculty: faculty?.name,
          department: department?.name,
        },
        hostUniversity: {
          id: hostUniversityId,
          name: hostUniversity?.name,
          country: hostUniversity?.country,
        },
        academicPeriod: {
          semester,
          academicYear: '2025-2026',
        },
        courseMappings: selectedMatches.map(m => ({
          homeCourse: {
            code: m.homeCourse.code,
            name: m.homeCourse.name,
            credits: m.homeCourse.credits,
            ects: m.homeCourse.ects,
          },
          hostCourse: {
            id: m.hostCourseId,
            code: m.hostCourseCode,
            name: m.hostCourseName,
            credits: m.hostCredits,
            ects: m.hostEcts,
          },
          matchScore: m.matchScore,
        })),
        totals,
      };

      // Save to database
      const { error } = await supabase
        .from('learning_agreements')
        .insert([{
          application_id: null, // We're not using application anymore
          status: 'draft',
          home_courses: selectedMatches.map(m => ({
            code: m.homeCourse.code,
            name: m.homeCourse.name,
            credits: m.homeCourse.credits,
            ects: m.homeCourse.ects,
          })) as any,
          host_courses: selectedMatches.map(m => ({
            id: m.hostCourseId,
            code: m.hostCourseCode,
            name: m.hostCourseName,
            credits: m.hostCredits,
            ects: m.hostEcts,
          })) as any,
          course_mappings: selectedMatches.map(m => ({
            home_course: m.homeCourse.code,
            host_course_id: m.hostCourseId,
            host_course_code: m.hostCourseCode,
            match_score: m.matchScore,
          })) as any,
          total_home_credits: totals.homeCredits,
          total_host_credits: totals.hostCredits,
          total_ects: totals.hostEcts,
          notes: JSON.stringify({
            student: agreement.student,
            homeUniversity: agreement.homeUniversity,
            hostUniversity: agreement.hostUniversity,
            academicPeriod: agreement.academicPeriod,
          }),
        }]);

      if (error) throw error;

      setGeneratedAgreement(agreement);
      setStep('generate');
      toast({ title: 'Learning Agreement generated successfully!' });
    } catch (error: any) {
      console.error('Error generating agreement:', error);
      toast({ variant: 'destructive', title: 'Error generating agreement', description: error.message });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadAgreement = () => {
    if (!generatedAgreement) return;
    
    const content = generatePrintableAgreement();
    const blob = new Blob([content], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Learning_Agreement_${studentName.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const generatePrintableAgreement = () => {
    if (!generatedAgreement) return '';
    
    const { student, homeUniversity, hostUniversity, academicPeriod, courseMappings, totals } = generatedAgreement;
    
    return `
<!DOCTYPE html>
<html>
<head>
  <title>Learning Agreement - ${student.name}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 900px; margin: 0 auto; padding: 40px; }
    h1 { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; }
    .header-info { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
    .info-box { border: 1px solid #ccc; padding: 15px; border-radius: 5px; }
    .info-box h3 { margin-top: 0; color: #333; }
    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
    th, td { border: 1px solid #000; padding: 8px; text-align: left; }
    th { background: #f5f5f5; }
    .totals { font-weight: bold; background: #e8e8e8; }
    .signatures { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 30px; margin-top: 50px; }
    .signature-box { border-top: 1px solid #000; padding-top: 10px; text-align: center; }
    .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
  </style>
</head>
<body>
  <h1>LEARNING AGREEMENT</h1>
  <p style="text-align: center; color: #666;">Student Mobility for Studies</p>
  
  <div class="header-info">
    <div class="info-box">
      <h3>Student Information</h3>
      <p><strong>Name:</strong> ${student.name}</p>
      <p><strong>Email:</strong> ${student.email}</p>
      <p><strong>Student ID:</strong> ${student.studentId}</p>
    </div>
    <div class="info-box">
      <h3>Academic Period</h3>
      <p><strong>Semester:</strong> ${academicPeriod.semester}</p>
      <p><strong>Academic Year:</strong> ${academicPeriod.academicYear}</p>
    </div>
  </div>
  
  <div class="header-info">
    <div class="info-box">
      <h3>Sending Institution (Home)</h3>
      <p><strong>University:</strong> ${homeUniversity.name}</p>
      <p><strong>Country:</strong> ${homeUniversity.country}</p>
      <p><strong>Faculty:</strong> ${homeUniversity.faculty || 'N/A'}</p>
      <p><strong>Department:</strong> ${homeUniversity.department || 'N/A'}</p>
    </div>
    <div class="info-box">
      <h3>Receiving Institution (Host)</h3>
      <p><strong>University:</strong> ${hostUniversity.name}</p>
      <p><strong>Country:</strong> ${hostUniversity.country}</p>
    </div>
  </div>
  
  <h2>Course Mapping Table</h2>
  <table>
    <thead>
      <tr>
        <th colspan="3" style="background: #dbeafe; text-align: center;">Home University Courses</th>
        <th colspan="3" style="background: #dcfce7; text-align: center;">Host University Courses</th>
      </tr>
      <tr>
        <th>Code</th>
        <th>Course Name</th>
        <th>Credits/ECTS</th>
        <th>Code</th>
        <th>Course Name</th>
        <th>Credits/ECTS</th>
      </tr>
    </thead>
    <tbody>
      ${courseMappings.map((m: any) => `
        <tr>
          <td>${m.homeCourse.code}</td>
          <td>${m.homeCourse.name}</td>
          <td>${m.homeCourse.credits} / ${m.homeCourse.ects || 'N/A'} ECTS</td>
          <td>${m.hostCourse.code}</td>
          <td>${m.hostCourse.name}</td>
          <td>${m.hostCourse.credits} / ${m.hostCourse.ects || 'N/A'} ECTS</td>
        </tr>
      `).join('')}
      <tr class="totals">
        <td colspan="2">Total</td>
        <td>${totals.homeCredits} / ${totals.homeEcts} ECTS</td>
        <td colspan="2">Total</td>
        <td>${totals.hostCredits} / ${totals.hostEcts} ECTS</td>
      </tr>
    </tbody>
  </table>
  
  <div class="signatures">
    <div class="signature-box">
      <p>Student Signature</p>
      <p>Date: ___________</p>
    </div>
    <div class="signature-box">
      <p>Home University Coordinator</p>
      <p>Date: ___________</p>
    </div>
    <div class="signature-box">
      <p>Host University Coordinator</p>
      <p>Date: ___________</p>
    </div>
  </div>
  
  <div class="footer">
    <p>Generated on ${new Date().toLocaleDateString()} | Document ID: ${generatedAgreement.id}</p>
  </div>
</body>
</html>
    `;
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-500/10';
    if (score >= 50) return 'text-yellow-600 bg-yellow-500/10';
    return 'text-red-600 bg-red-500/10';
  };

  const hostUniversity = universities.find(u => u.id === hostUniversityId);

  const canProceedToStep2 = studentName && studentEmail && hostUniversityId && selectedFacultyId && semester;
  const canProceedToStep3 = selectedHomeCourses.length > 0;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          Learning Agreement Generator
        </h2>
        <p className="text-sm text-muted-foreground">
          Create a complete Learning Agreement with AI-powered course matching
        </p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-2 flex-wrap">
        {[
          { key: 'info', label: 'Student Info' },
          { key: 'courses', label: 'Select Courses' },
          { key: 'matching', label: 'AI Matching' },
          { key: 'generate', label: 'Generate LA' },
        ].map((s, i) => {
          const steps: Step[] = ['info', 'courses', 'matching', 'generate'];
          const isActive = step === s.key;
          const isPast = steps.indexOf(step) > i;
          return (
            <div key={s.key} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                isActive ? 'bg-primary text-primary-foreground' : isPast ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground'
              }`}>
                {isPast ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-sm hidden sm:inline ${isActive ? 'font-medium' : 'text-muted-foreground'}`}>
                {s.label}
              </span>
              {i < 3 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
            </div>
          );
        })}
      </div>

      {/* Step 1: Student Info */}
      {step === 'info' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="h-4 w-4" />
                Student Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Full Name *</Label>
                <Input
                  value={studentName}
                  onChange={e => setStudentName(e.target.value)}
                  placeholder="Enter student's full name"
                />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={studentEmail}
                  onChange={e => setStudentEmail(e.target.value)}
                  placeholder="student@university.edu"
                />
              </div>
              <div className="space-y-2">
                <Label>Student ID</Label>
                <Input
                  value={studentId}
                  onChange={e => setStudentId(e.target.value)}
                  placeholder="e.g., 2021001234"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Academic Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Faculty *</Label>
                <Select value={selectedFacultyId} onValueChange={setSelectedFacultyId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select faculty..." />
                  </SelectTrigger>
                  <SelectContent>
                    {faculties.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Department</Label>
                <Select 
                  value={selectedDepartmentId} 
                  onValueChange={setSelectedDepartmentId}
                  disabled={!selectedFacultyId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select department..." />
                  </SelectTrigger>
                  <SelectContent>
                    {departments.map(d => (
                      <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Semester *</Label>
                <Select value={semester} onValueChange={setSemester}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fall">Fall Semester</SelectItem>
                    <SelectItem value="Spring">Spring Semester</SelectItem>
                    <SelectItem value="Full Year">Full Academic Year</SelectItem>
                    <SelectItem value="Summer">Summer Term</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                Host University *
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={hostUniversityId} onValueChange={setHostUniversityId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select host university..." />
                </SelectTrigger>
                <SelectContent>
                  {universities
                    .filter(u => u.id !== selectedUniversity?.id)
                    .map(u => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} ({u.country})
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
              {hostUniversity && (
                <div className="mt-3 rounded-lg border p-3 bg-muted/30">
                  <p className="text-sm font-medium">{hostUniversity.name}</p>
                  <p className="text-xs text-muted-foreground">{hostUniversity.country} • {hostCourses.length} courses available</p>
                </div>
              )}
            </CardContent>
          </Card>

          <div className="lg:col-span-2">
            <Button 
              onClick={() => setStep('courses')} 
              disabled={!canProceedToStep2}
              className="w-full sm:w-auto"
            >
              Continue to Course Selection
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Course Selection */}
      {step === 'courses' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="h-4 w-4" />
                Available Home Courses ({homeCourses.length})
              </CardTitle>
              <CardDescription>
                Select courses you would normally take at {selectedUniversity?.name} but will now take at the host university
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Search Bar */}
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search courses by name or code..."
                  value={courseSearchQuery}
                  onChange={(e) => setCourseSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <ScrollArea className="h-[350px] pr-4">
                <div className="space-y-2">
                  {homeCourses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                      <BookOpen className="h-10 w-10 mb-3 opacity-40" />
                      <p className="text-sm font-medium">No courses available</p>
                      <p className="text-xs text-center mt-1 max-w-[250px]">
                        Courses haven't been registered for {selectedUniversity?.name} yet. 
                        Please contact your administrator.
                      </p>
                    </div>
                  ) : (
                    homeCourses
                      .filter(c => 
                        !courseSearchQuery || 
                        c.course_code.toLowerCase().includes(courseSearchQuery.toLowerCase()) ||
                        c.course_name.toLowerCase().includes(courseSearchQuery.toLowerCase()) ||
                        (c.department?.toLowerCase() || '').includes(courseSearchQuery.toLowerCase())
                      )
                      .map(course => (
                        <div
                          key={course.id}
                          className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm">{course.course_code}</p>
                              {course.department && (
                                <Badge variant="secondary" className="text-[10px]">{course.department}</Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">{course.course_name}</p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">{course.credits} cr</Badge>
                              {course.ects_credits && (
                                <Badge variant="outline" className="text-xs">{course.ects_credits} ECTS</Badge>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setViewingCourse(course)}
                              title="View course details"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => addHomeCourse(course)}
                              disabled={selectedHomeCourses.some(c => c.id === course.id)}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Selected Courses ({selectedHomeCourses.length})
              </CardTitle>
              <CardDescription>
                These courses will be matched with host university offerings
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-4">
                {selectedHomeCourses.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <BookOpen className="h-8 w-8 mb-2 opacity-50" />
                    <p className="text-sm">No courses selected yet</p>
                    <p className="text-xs">Click + to add courses from the list</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {selectedHomeCourses.map(course => (
                      <div
                        key={course.id}
                        className="flex items-center justify-between p-3 rounded-lg border bg-primary/5"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm">{course.code}</p>
                          <p className="text-sm text-muted-foreground truncate">{course.name}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">{course.credits} cr</Badge>
                            {course.ects && (
                              <Badge variant="secondary" className="text-xs">{course.ects} ECTS</Badge>
                            )}
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => removeHomeCourse(course.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              
              <Separator className="my-4" />
              
              <div className="flex items-center justify-between text-sm">
                <span>Total Credits:</span>
                <span className="font-medium">
                  {selectedHomeCourses.reduce((sum, c) => sum + c.credits, 0)} credits / {' '}
                  {selectedHomeCourses.reduce((sum, c) => sum + (c.ects || 0), 0)} ECTS
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="lg:col-span-2 flex gap-3">
            <Button variant="outline" onClick={() => setStep('info')}>
              Back
            </Button>
            <Button 
              onClick={runAIMatching} 
              disabled={!canProceedToStep3 || isMatching}
            >
              {isMatching ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  AI Matching...
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Find Matching Courses at Host University
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: AI Matching Results */}
      {step === 'matching' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-medium">Course Matching Results</h3>
              <p className="text-sm text-muted-foreground">
                Review AI suggestions and manually adjust if needed
              </p>
            </div>
            <div className="flex flex-wrap gap-4 text-sm">
              <span>Home: <strong>{getSelectedTotals().homeCredits} cr / {getSelectedTotals().homeEcts} ECTS</strong></span>
              <span>Host: <strong>{getSelectedTotals().hostCredits} cr / {getSelectedTotals().hostEcts} ECTS</strong></span>
            </div>
          </div>

          <ScrollArea className="h-[500px]">
            <div className="space-y-4 pr-4">
              {courseMatches.map((match, index) => (
                <Card key={index} className={`transition-colors ${match.selected ? 'ring-2 ring-primary' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={match.selected}
                        onCheckedChange={() => toggleMatchSelection(index)}
                        className="mt-1"
                      />
                      <div className="flex-1 grid gap-4 md:grid-cols-2">
                        {/* Home Course */}
                        <div className="space-y-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-blue-600" />
                            <span className="text-xs font-medium text-blue-600">HOME UNIVERSITY</span>
                          </div>
                          <p className="font-medium">{match.homeCourse.code}</p>
                          <p className="text-sm text-muted-foreground">{match.homeCourse.name}</p>
                          <div className="flex gap-2">
                            <Badge variant="secondary">{match.homeCourse.credits} credits</Badge>
                            {match.homeCourse.ects && (
                              <Badge variant="secondary">{match.homeCourse.ects} ECTS</Badge>
                            )}
                          </div>
                        </div>
                        
                        {/* Host Course */}
                        <div className="space-y-2 p-3 rounded-lg bg-green-500/5 border border-green-500/20">
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-green-600" />
                            <span className="text-xs font-medium text-green-600">HOST UNIVERSITY</span>
                          </div>
                          
                          <Select 
                            value={match.hostCourseId || ''} 
                            onValueChange={(value) => updateHostCourseSelection(index, value)}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select matching course..." />
                            </SelectTrigger>
                            <SelectContent>
                              {hostCourses.map(c => (
                                <SelectItem key={c.id} value={c.id}>
                                  {c.course_code} - {c.course_name} ({c.credits} cr)
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          
                          {match.hostCourseId && (
                            <div className="flex gap-2">
                              <Badge variant="secondary">{match.hostCredits} credits</Badge>
                              {match.hostEcts && (
                                <Badge variant="secondary">{match.hostEcts} ECTS</Badge>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Match Score */}
                      <div className="text-center shrink-0">
                        <div className={`rounded-lg px-3 py-2 ${getMatchScoreColor(match.matchScore)}`}>
                          <p className="text-xl font-bold">{match.matchScore}%</p>
                          <p className="text-xs">match</p>
                        </div>
                      </div>
                    </div>
                    {match.matchReason && (
                      <p className="mt-3 text-xs text-muted-foreground border-t pt-2 ml-8">
                        {match.matchReason}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep('courses')}>
              Back
            </Button>
            <Button 
              onClick={generateLearningAgreement} 
              disabled={isGenerating || courseMatches.filter(m => m.selected && m.hostCourseId).length === 0}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-4 w-4" />
                  Generate Learning Agreement
                </>
              )}
            </Button>
          </div>
        </div>
      )}

      {/* Step 4: Generated Agreement */}
      {step === 'generate' && generatedAgreement && (
        <Card>
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
            </div>
            <CardTitle className="text-xl">Learning Agreement Generated!</CardTitle>
            <CardDescription>
              Your Learning Agreement has been created and saved as a draft
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Summary */}
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg border bg-muted/30">
                <p className="text-xs text-muted-foreground mb-1">Student</p>
                <p className="font-medium">{generatedAgreement.student.name}</p>
                <p className="text-sm text-muted-foreground">{generatedAgreement.student.email}</p>
              </div>
              <div className="p-4 rounded-lg border bg-blue-500/5">
                <p className="text-xs text-blue-600 mb-1">Home University</p>
                <p className="font-medium">{generatedAgreement.homeUniversity.name}</p>
                <p className="text-sm text-muted-foreground">{generatedAgreement.homeUniversity.faculty}</p>
              </div>
              <div className="p-4 rounded-lg border bg-green-500/5">
                <p className="text-xs text-green-600 mb-1">Host University</p>
                <p className="font-medium">{generatedAgreement.hostUniversity.name}</p>
                <p className="text-sm text-muted-foreground">{generatedAgreement.hostUniversity.country}</p>
              </div>
            </div>

            {/* Course Mappings Table */}
            <div className="rounded-lg border overflow-hidden">
              <div className="grid grid-cols-2 bg-muted/50">
                <div className="p-3 border-r font-medium text-sm text-center">Home Courses</div>
                <div className="p-3 font-medium text-sm text-center">Host Courses</div>
              </div>
              {generatedAgreement.courseMappings.map((m: any, i: number) => (
                <div key={i} className="grid grid-cols-2 border-t">
                  <div className="p-3 border-r">
                    <p className="font-medium text-sm">{m.homeCourse.code}</p>
                    <p className="text-xs text-muted-foreground">{m.homeCourse.name}</p>
                    <p className="text-xs mt-1">{m.homeCourse.credits} cr / {m.homeCourse.ects || 'N/A'} ECTS</p>
                  </div>
                  <div className="p-3">
                    <p className="font-medium text-sm">{m.hostCourse.code}</p>
                    <p className="text-xs text-muted-foreground">{m.hostCourse.name}</p>
                    <p className="text-xs mt-1">{m.hostCourse.credits} cr / {m.hostCourse.ects || 'N/A'} ECTS</p>
                  </div>
                </div>
              ))}
              <div className="grid grid-cols-2 border-t bg-muted/50 font-medium">
                <div className="p-3 border-r text-sm">
                  Total: {generatedAgreement.totals.homeCredits} credits / {generatedAgreement.totals.homeEcts} ECTS
                </div>
                <div className="p-3 text-sm">
                  Total: {generatedAgreement.totals.hostCredits} credits / {generatedAgreement.totals.hostEcts} ECTS
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button variant="outline" onClick={() => {
                setStep('info');
                setStudentName('');
                setStudentEmail('');
                setStudentId('');
                setSelectedHomeCourses([]);
                setCourseMatches([]);
                setGeneratedAgreement(null);
              }}>
                Create Another
              </Button>
              <Button onClick={downloadAgreement}>
                <Download className="mr-2 h-4 w-4" />
                Download Learning Agreement
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Course Details Dialog */}
      <Dialog open={!!viewingCourse} onOpenChange={(open) => !open && setViewingCourse(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              {viewingCourse?.course_code} - {viewingCourse?.course_name}
            </DialogTitle>
            <DialogDescription>
              Course details and content description
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {viewingCourse?.department && (
                <Badge variant="secondary">{viewingCourse.department}</Badge>
              )}
              <Badge variant="outline">{viewingCourse?.credits} Credits</Badge>
              {viewingCourse?.ects_credits && (
                <Badge variant="outline">{viewingCourse.ects_credits} ECTS</Badge>
              )}
            </div>
            
            <div className="space-y-2">
              <h4 className="font-medium text-sm flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Course Description
              </h4>
              <div className="bg-muted/50 rounded-lg p-4 text-sm">
                {viewingCourse?.description || 'No description available for this course.'}
              </div>
            </div>
            
            <div className="flex gap-2 pt-2">
              <Button
                className="flex-1"
                onClick={() => {
                  if (viewingCourse) {
                    addHomeCourse(viewingCourse);
                    setViewingCourse(null);
                  }
                }}
                disabled={selectedHomeCourses.some(c => c.id === viewingCourse?.id)}
              >
                <Plus className="mr-2 h-4 w-4" />
                {selectedHomeCourses.some(c => c.id === viewingCourse?.id) ? 'Already Added' : 'Add to Selection'}
              </Button>
              <Button variant="outline" onClick={() => setViewingCourse(null)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
