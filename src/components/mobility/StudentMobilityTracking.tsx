import { useState, useEffect } from 'react';
import { useUniversity } from '@/contexts/UniversityContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  Plus,
  Search,
  ChevronRight,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  User,
  Calendar,
  MapPin,
  GraduationCap,
} from 'lucide-react';

interface StudentApplication {
  id: string;
  student_name: string;
  student_email: string;
  student_id_number: string | null;
  program_type: string;
  academic_year: string;
  semester: string;
  status: string;
  application_date: string;
  start_date: string | null;
  end_date: string | null;
  notes: string | null;
  host_university_id: string;
  host_university?: { name: string; country: string };
}

interface MobilityTask {
  id: string;
  application_id: string;
  task_name: string;
  description: string | null;
  phase: string;
  is_completed: boolean;
  due_date: string | null;
  completed_at: string | null;
  sort_order: number;
}

const DEFAULT_TASKS = {
  before: [
    { task_name: 'Submit application documents', description: 'Complete and submit all required application forms' },
    { task_name: 'Language proficiency test', description: 'Provide proof of language competency' },
    { task_name: 'Learning Agreement draft', description: 'Create initial Learning Agreement with course selections' },
    { task_name: 'Visa application', description: 'Apply for student visa if required' },
    { task_name: 'Health insurance', description: 'Obtain valid health insurance for mobility period' },
    { task_name: 'Accommodation arrangements', description: 'Secure housing at host university' },
  ],
  during: [
    { task_name: 'Arrival registration', description: 'Register arrival at host university international office' },
    { task_name: 'Course enrollment confirmation', description: 'Confirm enrollment in selected courses' },
    { task_name: 'Mid-term progress report', description: 'Submit mid-term academic progress report' },
    { task_name: 'Learning Agreement changes', description: 'Document any course changes if applicable' },
  ],
  after: [
    { task_name: 'Transcript of Records', description: 'Obtain official transcript from host university' },
    { task_name: 'Completion certificate', description: 'Get mobility completion certificate' },
    { task_name: 'Credit transfer request', description: 'Submit credit transfer application to home university' },
    { task_name: 'Experience report', description: 'Write and submit mobility experience report' },
    { task_name: 'Survey completion', description: 'Complete post-mobility satisfaction survey' },
  ],
};

export function StudentMobilityTracking() {
  const { selectedUniversity, universities } = useUniversity();
  const { toast } = useToast();
  
  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<StudentApplication | null>(null);
  const [tasks, setTasks] = useState<MobilityTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // New application form
  const [newStudentName, setNewStudentName] = useState('');
  const [newStudentEmail, setNewStudentEmail] = useState('');
  const [newStudentId, setNewStudentId] = useState('');
  const [newHostUniversity, setNewHostUniversity] = useState('');
  const [newProgramType, setNewProgramType] = useState('erasmus');
  const [newAcademicYear, setNewAcademicYear] = useState('2025-2026');
  const [newSemester, setNewSemester] = useState('fall');

  useEffect(() => {
    if (selectedUniversity) {
      fetchApplications();
    }
  }, [selectedUniversity]);

  useEffect(() => {
    if (selectedApplication) {
      fetchTasks(selectedApplication.id);
    }
  }, [selectedApplication?.id]);

  const fetchApplications = async () => {
    if (!selectedUniversity) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('student_applications')
        .select('*')
        .eq('university_id', selectedUniversity.id)
        .order('application_date', { ascending: false });

      if (error) throw error;

      // Enrich with host university info
      const enriched = await Promise.all((data || []).map(async (app) => {
        const host = universities.find(u => u.id === app.host_university_id);
        return {
          ...app,
          host_university: host ? { name: host.name, country: host.country } : undefined,
        };
      }));

      setApplications(enriched);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchTasks = async (applicationId: string) => {
    try {
      const { data, error } = await supabase
        .from('mobility_tasks')
        .select('*')
        .eq('application_id', applicationId)
        .order('sort_order');

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const createApplication = async () => {
    if (!selectedUniversity || !newStudentName || !newStudentEmail || !newHostUniversity) {
      toast({ variant: 'destructive', title: 'Please fill in all required fields' });
      return;
    }

    setIsSubmitting(true);
    try {
      // Create the application
      const { data: appData, error: appError } = await supabase
        .from('student_applications')
        .insert({
          university_id: selectedUniversity.id,
          host_university_id: newHostUniversity,
          student_name: newStudentName,
          student_email: newStudentEmail,
          student_id_number: newStudentId || null,
          program_type: newProgramType,
          academic_year: newAcademicYear,
          semester: newSemester,
          status: 'pending',
        })
        .select()
        .single();

      if (appError) throw appError;

      // Create default tasks
      const allTasks: { application_id: string; task_name: string; description: string; phase: string; sort_order: number }[] = [];
      let order = 0;
      
      for (const [phase, taskList] of Object.entries(DEFAULT_TASKS)) {
        for (const task of taskList) {
          allTasks.push({
            application_id: appData.id,
            task_name: task.task_name,
            description: task.description,
            phase,
            sort_order: order++,
          });
        }
      }

      const { error: tasksError } = await supabase
        .from('mobility_tasks')
        .insert(allTasks);

      if (tasksError) throw tasksError;

      toast({ title: 'Application created successfully!' });
      setIsAddDialogOpen(false);
      resetForm();
      fetchApplications();
    } catch (error: any) {
      console.error('Error creating application:', error);
      toast({ variant: 'destructive', title: 'Error creating application', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const toggleTask = async (task: MobilityTask) => {
    try {
      const { error } = await supabase
        .from('mobility_tasks')
        .update({
          is_completed: !task.is_completed,
          completed_at: !task.is_completed ? new Date().toISOString() : null,
        })
        .eq('id', task.id);

      if (error) throw error;
      
      setTasks(tasks.map(t => 
        t.id === task.id 
          ? { ...t, is_completed: !t.is_completed, completed_at: !t.is_completed ? new Date().toISOString() : null }
          : t
      ));
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const updateApplicationStatus = async (status: string) => {
    if (!selectedApplication) return;
    try {
      const { error } = await supabase
        .from('student_applications')
        .update({ status })
        .eq('id', selectedApplication.id);

      if (error) throw error;
      
      setSelectedApplication({ ...selectedApplication, status });
      setApplications(applications.map(a => a.id === selectedApplication.id ? { ...a, status } : a));
      toast({ title: `Status updated to ${status}` });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const resetForm = () => {
    setNewStudentName('');
    setNewStudentEmail('');
    setNewStudentId('');
    setNewHostUniversity('');
    setNewProgramType('erasmus');
    setNewAcademicYear('2025-2026');
    setNewSemester('fall');
  };

  const getCompletionPercentage = () => {
    if (tasks.length === 0) return 0;
    const completed = tasks.filter(t => t.is_completed).length;
    return Math.round((completed / tasks.length) * 100);
  };

  const getPhaseCompletion = (phase: string) => {
    const phaseTasks = tasks.filter(t => t.phase === phase);
    if (phaseTasks.length === 0) return 0;
    const completed = phaseTasks.filter(t => t.is_completed).length;
    return Math.round((completed / phaseTasks.length) * 100);
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = app.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         app.student_email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'approved': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'rejected': return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'in-progress': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'completed': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Student Mobility Tracking</h2>
          <p className="text-sm text-muted-foreground">Track individual student mobility applications and tasks</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" /> New Application
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Create Student Application</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Student Name *</Label>
                <Input value={newStudentName} onChange={e => setNewStudentName(e.target.value)} placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <Label>Email *</Label>
                <Input type="email" value={newStudentEmail} onChange={e => setNewStudentEmail(e.target.value)} placeholder="student@email.com" />
              </div>
              <div className="space-y-2">
                <Label>Student ID</Label>
                <Input value={newStudentId} onChange={e => setNewStudentId(e.target.value)} placeholder="2024123456" />
              </div>
              <div className="space-y-2">
                <Label>Host University *</Label>
                <Select value={newHostUniversity} onValueChange={setNewHostUniversity}>
                  <SelectTrigger><SelectValue placeholder="Select university" /></SelectTrigger>
                  <SelectContent>
                    {universities.filter(u => u.id !== selectedUniversity?.id).map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Program Type</Label>
                  <Select value={newProgramType} onValueChange={setNewProgramType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="erasmus">Erasmus+</SelectItem>
                      <SelectItem value="bilateral">Bilateral</SelectItem>
                      <SelectItem value="summer">Summer School</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Semester</Label>
                  <Select value={newSemester} onValueChange={setNewSemester}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fall">Fall</SelectItem>
                      <SelectItem value="spring">Spring</SelectItem>
                      <SelectItem value="full-year">Full Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Academic Year</Label>
                <Input value={newAcademicYear} onChange={e => setNewAcademicYear(e.target.value)} placeholder="2025-2026" />
              </div>
              <Button className="w-full" onClick={createApplication} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Create Application
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Applications List */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="in-progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <ScrollArea className="h-[600px]">
            <div className="space-y-2 pr-4">
              {filteredApplications.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-8 text-center">
                    <Users className="h-10 w-10 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">No applications found</p>
                  </CardContent>
                </Card>
              ) : (
                filteredApplications.map(app => (
                  <Card
                    key={app.id}
                    className={`cursor-pointer transition-colors hover:bg-accent/50 ${selectedApplication?.id === app.id ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => setSelectedApplication(app)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{app.student_name}</span>
                          </div>
                          <p className="text-xs text-muted-foreground">{app.student_email}</p>
                          {app.host_university && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {app.host_university.name}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          <Badge variant="outline" className={getStatusColor(app.status)}>
                            {app.status}
                          </Badge>
                          <span className="text-xs text-muted-foreground">{app.program_type}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Application Details */}
        <div className="lg:col-span-2">
          {selectedApplication ? (
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <GraduationCap className="h-5 w-5 text-primary" />
                      {selectedApplication.student_name}
                    </CardTitle>
                    <CardDescription>{selectedApplication.student_email}</CardDescription>
                  </div>
                  <Select value={selectedApplication.status} onValueChange={updateApplicationStatus}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="in-progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Overall Progress */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Overall Progress</span>
                    <span className="text-muted-foreground">{getCompletionPercentage()}%</span>
                  </div>
                  <Progress value={getCompletionPercentage()} className="h-3" />
                </div>

                {/* Phase Progress */}
                <div className="grid gap-4 sm:grid-cols-3">
                  {['before', 'during', 'after'].map(phase => (
                    <div key={phase} className="space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="capitalize font-medium">{phase} Mobility</span>
                        <span className="text-muted-foreground">{getPhaseCompletion(phase)}%</span>
                      </div>
                      <Progress value={getPhaseCompletion(phase)} className="h-2" />
                    </div>
                  ))}
                </div>

                {/* Tasks by Phase */}
                <Tabs defaultValue="before" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="before" className="text-xs">Before ({tasks.filter(t => t.phase === 'before' && t.is_completed).length}/{tasks.filter(t => t.phase === 'before').length})</TabsTrigger>
                    <TabsTrigger value="during" className="text-xs">During ({tasks.filter(t => t.phase === 'during' && t.is_completed).length}/{tasks.filter(t => t.phase === 'during').length})</TabsTrigger>
                    <TabsTrigger value="after" className="text-xs">After ({tasks.filter(t => t.phase === 'after' && t.is_completed).length}/{tasks.filter(t => t.phase === 'after').length})</TabsTrigger>
                  </TabsList>
                  
                  {['before', 'during', 'after'].map(phase => (
                    <TabsContent key={phase} value={phase} className="space-y-2 mt-4">
                      {tasks.filter(t => t.phase === phase).map(task => (
                        <div
                          key={task.id}
                          className={`flex items-start gap-3 rounded-lg border p-3 transition-colors ${task.is_completed ? 'bg-green-500/5 border-green-500/20' : ''}`}
                        >
                          <Checkbox
                            checked={task.is_completed}
                            onCheckedChange={() => toggleTask(task)}
                          />
                          <div className="flex-1 space-y-1">
                            <p className={`text-sm font-medium ${task.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                              {task.task_name}
                            </p>
                            {task.description && (
                              <p className="text-xs text-muted-foreground">{task.description}</p>
                            )}
                          </div>
                          {task.is_completed ? (
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          ) : (
                            <Clock className="h-4 w-4 text-muted-foreground" />
                          )}
                        </div>
                      ))}
                    </TabsContent>
                  ))}
                </Tabs>

                {/* Application Info */}
                <div className="grid gap-4 sm:grid-cols-2 pt-4 border-t">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Host University</p>
                    <p className="text-sm font-medium">{selectedApplication.host_university?.name || 'N/A'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Program</p>
                    <p className="text-sm font-medium capitalize">{selectedApplication.program_type} • {selectedApplication.semester}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Academic Year</p>
                    <p className="text-sm font-medium">{selectedApplication.academic_year}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground">Application Date</p>
                    <p className="text-sm font-medium">{new Date(selectedApplication.application_date).toLocaleDateString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="font-medium">Select an Application</h3>
                <p className="text-sm text-muted-foreground mt-1">Choose a student application to view details and track tasks</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
