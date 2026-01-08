import { useState, useEffect } from 'react';
import { useUniversity } from '@/contexts/UniversityContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import {
  FileText,
  Upload,
  Loader2,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  BookOpen,
  GraduationCap,
  AlertCircle,
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

interface ParsedCourse {
  courseCode: string;
  courseName: string;
  credits: number;
  grade?: string;
  department?: string;
}

interface CourseMatch {
  homeCourseCode: string;
  homeCourseName: string;
  homeCredits: number;
  hostCourseId?: string;
  hostCourseCode?: string;
  hostCourseName?: string;
  hostCredits?: number;
  matchScore: number;
  matchReason?: string;
  selected?: boolean;
}

interface StudentApplication {
  id: string;
  student_name: string;
  host_university_id: string;
}

export function LearningAgreementGenerator() {
  const { selectedUniversity, universities } = useUniversity();
  const { toast } = useToast();

  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [selectedApplicationId, setSelectedApplicationId] = useState('');
  const [hostUniversityId, setHostUniversityId] = useState('');
  const [hostCourses, setHostCourses] = useState<Course[]>([]);
  const [transcriptText, setTranscriptText] = useState('');
  const [isParsingTranscript, setIsParsingTranscript] = useState(false);
  const [parsedCourses, setParsedCourses] = useState<ParsedCourse[]>([]);
  const [courseMatches, setCourseMatches] = useState<CourseMatch[]>([]);
  const [step, setStep] = useState<'upload' | 'review' | 'finalize'>('upload');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (selectedUniversity) {
      fetchApplications();
    }
  }, [selectedUniversity]);

  useEffect(() => {
    if (hostUniversityId) {
      fetchHostCourses();
    }
  }, [hostUniversityId]);

  const fetchApplications = async () => {
    if (!selectedUniversity) return;
    try {
      const { data, error } = await supabase
        .from('student_applications')
        .select('id, student_name, host_university_id')
        .eq('university_id', selectedUniversity.id)
        .in('status', ['approved', 'in-progress']);

      if (error) throw error;
      setApplications(data || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };

  const fetchHostCourses = async () => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('university_id', hostUniversityId)
        .order('department', { ascending: true });

      if (error) throw error;
      setHostCourses(data || []);
    } catch (error) {
      console.error('Error fetching host courses:', error);
    }
  };

  const handleApplicationSelect = (appId: string) => {
    setSelectedApplicationId(appId);
    const app = applications.find(a => a.id === appId);
    if (app) {
      setHostUniversityId(app.host_university_id);
    }
  };

  const parseTranscript = async () => {
    if (!transcriptText.trim() || hostCourses.length === 0) {
      toast({ variant: 'destructive', title: 'Please enter transcript text and select an application' });
      return;
    }

    setIsParsingTranscript(true);
    try {
      const response = await supabase.functions.invoke('parse-transcript', {
        body: {
          transcriptText,
          hostUniversityCourses: hostCourses.map(c => ({
            id: c.id,
            code: c.course_code,
            name: c.course_name,
            description: c.description,
            credits: c.credits,
            ects: c.ects_credits,
            department: c.department,
          })),
        },
      });

      if (response.error) throw response.error;

      const data = response.data;
      if (data.error) throw new Error(data.error);

      setParsedCourses(data.parsedCourses || []);
      setCourseMatches((data.courseMatches || []).map((m: CourseMatch) => ({ ...m, selected: m.matchScore >= 70 })));
      setStep('review');
      toast({ title: 'Transcript parsed successfully!' });
    } catch (error: any) {
      console.error('Error parsing transcript:', error);
      toast({ variant: 'destructive', title: 'Error parsing transcript', description: error.message });
    } finally {
      setIsParsingTranscript(false);
    }
  };

  const toggleCourseSelection = (index: number) => {
    setCourseMatches(courseMatches.map((m, i) => 
      i === index ? { ...m, selected: !m.selected } : m
    ));
  };

  const getSelectedCredits = () => {
    const selected = courseMatches.filter(m => m.selected);
    return {
      home: selected.reduce((sum, m) => sum + m.homeCredits, 0),
      host: selected.reduce((sum, m) => sum + (m.hostCredits || 0), 0),
    };
  };

  const saveLearningAgreement = async () => {
    if (!selectedApplicationId) {
      toast({ variant: 'destructive', title: 'Please select a student application' });
      return;
    }

    setIsSaving(true);
    try {
      const selectedMatches = courseMatches.filter(m => m.selected);
      const credits = getSelectedCredits();

      const { error } = await supabase
        .from('learning_agreements')
        .insert([{
          application_id: selectedApplicationId,
          status: 'draft',
          transcript_data: parsedCourses as any,
          home_courses: selectedMatches.map(m => ({ code: m.homeCourseCode, name: m.homeCourseName, credits: m.homeCredits })) as any,
          host_courses: selectedMatches.map(m => ({ id: m.hostCourseId, code: m.hostCourseCode, name: m.hostCourseName, credits: m.hostCredits })) as any,
          course_mappings: selectedMatches.map(m => ({
            home_course: m.homeCourseCode,
            host_course_id: m.hostCourseId,
            match_score: m.matchScore,
          })) as any,
          total_home_credits: credits.home,
          total_host_credits: credits.host,
        }]);

      if (error) throw error;

      toast({ title: 'Learning Agreement saved!' });
      setStep('finalize');
    } catch (error: any) {
      console.error('Error saving learning agreement:', error);
      toast({ variant: 'destructive', title: 'Error saving', description: error.message });
    } finally {
      setIsSaving(false);
    }
  };

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-500/10';
    if (score >= 60) return 'text-yellow-600 bg-yellow-500/10';
    return 'text-red-600 bg-red-500/10';
  };

  const hostUniversity = universities.find(u => u.id === hostUniversityId);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          AI Learning Agreement Generator
        </h2>
        <p className="text-sm text-muted-foreground">Upload transcript, match courses automatically, generate Learning Agreement</p>
      </div>

      {/* Progress Steps */}
      <div className="flex items-center gap-4">
        {['Upload Transcript', 'Review Matches', 'Finalize Agreement'].map((label, i) => {
          const stepName = ['upload', 'review', 'finalize'][i];
          const isActive = step === stepName;
          const isPast = ['upload', 'review', 'finalize'].indexOf(step) > i;
          return (
            <div key={label} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
                isActive ? 'bg-primary text-primary-foreground' : isPast ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground'
              }`}>
                {isPast ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              <span className={`text-sm ${isActive ? 'font-medium' : 'text-muted-foreground'}`}>{label}</span>
              {i < 2 && <ArrowRight className="h-4 w-4 text-muted-foreground" />}
            </div>
          );
        })}
      </div>

      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Select Student</CardTitle>
              <CardDescription>Choose the student application for this Learning Agreement</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Student Application</Label>
                <Select value={selectedApplicationId} onValueChange={handleApplicationSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a student..." />
                  </SelectTrigger>
                  <SelectContent>
                    {applications.map(app => (
                      <SelectItem key={app.id} value={app.id}>{app.student_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {hostUniversity && (
                <div className="rounded-lg border p-3 bg-muted/30">
                  <p className="text-sm font-medium">Host University</p>
                  <p className="text-sm text-muted-foreground">{hostUniversity.name}, {hostUniversity.country}</p>
                  <p className="text-xs text-muted-foreground mt-1">{hostCourses.length} courses available</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Transcript Input
              </CardTitle>
              <CardDescription>Paste the student's transcript text for AI parsing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Paste transcript content here...&#10;&#10;Example:&#10;COMP201 - Data Structures (3 credits) - A&#10;MATH201 - Linear Algebra (4 credits) - B+&#10;ECON101 - Principles of Economics (3 credits) - A-"
                value={transcriptText}
                onChange={e => setTranscriptText(e.target.value)}
                rows={10}
                className="font-mono text-sm"
              />
              <Button
                onClick={parseTranscript}
                disabled={isParsingTranscript || !transcriptText.trim() || !selectedApplicationId}
                className="w-full"
              >
                {isParsingTranscript ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Parsing with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Parse & Match Courses
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Review */}
      {step === 'review' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium">Course Matches</h3>
              <p className="text-sm text-muted-foreground">Select which courses to include in the Learning Agreement</p>
            </div>
            <div className="flex gap-4 text-sm">
              <span>Home Credits: <strong>{getSelectedCredits().home}</strong></span>
              <span>Host Credits: <strong>{getSelectedCredits().host}</strong></span>
            </div>
          </div>

          <ScrollArea className="h-[500px]">
            <div className="space-y-3 pr-4">
              {courseMatches.map((match, index) => (
                <Card key={index} className={`transition-colors ${match.selected ? 'ring-2 ring-primary' : ''}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <Checkbox
                        checked={match.selected}
                        onCheckedChange={() => toggleCourseSelection(index)}
                        className="mt-1"
                      />
                      <div className="flex-1 grid gap-4 sm:grid-cols-2">
                        {/* Home Course */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <BookOpen className="h-4 w-4 text-blue-600" />
                            <span className="text-xs text-muted-foreground">Home University</span>
                          </div>
                          <p className="font-medium">{match.homeCourseCode}</p>
                          <p className="text-sm">{match.homeCourseName}</p>
                          <Badge variant="secondary">{match.homeCredits} credits</Badge>
                        </div>
                        
                        {/* Host Course */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <GraduationCap className="h-4 w-4 text-purple-600" />
                            <span className="text-xs text-muted-foreground">Host University</span>
                          </div>
                          {match.hostCourseCode ? (
                            <>
                              <p className="font-medium">{match.hostCourseCode}</p>
                              <p className="text-sm">{match.hostCourseName}</p>
                              <Badge variant="secondary">{match.hostCredits} credits</Badge>
                            </>
                          ) : (
                            <p className="text-sm text-muted-foreground italic">No match found</p>
                          )}
                        </div>
                      </div>
                      
                      {/* Match Score */}
                      <div className="text-center">
                        <div className={`rounded-lg px-3 py-2 ${getMatchScoreColor(match.matchScore)}`}>
                          <p className="text-xl font-bold">{match.matchScore}%</p>
                          <p className="text-xs">match</p>
                        </div>
                      </div>
                    </div>
                    {match.matchReason && (
                      <p className="mt-3 text-xs text-muted-foreground border-t pt-2">{match.matchReason}</p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => setStep('upload')}>
              Back
            </Button>
            <Button onClick={saveLearningAgreement} disabled={isSaving || courseMatches.filter(m => m.selected).length === 0}>
              {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
              Save Learning Agreement
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Finalize */}
      {step === 'finalize' && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <CheckCircle2 className="h-16 w-16 text-green-600 mb-4" />
            <h3 className="text-xl font-semibold">Learning Agreement Created!</h3>
            <p className="text-muted-foreground mt-2 max-w-md">
              The Learning Agreement has been saved as a draft. The student and staff can now review and submit it for approval.
            </p>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" onClick={() => {
                setStep('upload');
                setTranscriptText('');
                setParsedCourses([]);
                setCourseMatches([]);
                setSelectedApplicationId('');
              }}>
                Create Another
              </Button>
              <Button>
                <FileText className="mr-2 h-4 w-4" />
                View Agreement
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
