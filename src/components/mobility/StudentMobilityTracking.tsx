import { useState, useEffect, useRef } from 'react';
import { useUniversity } from '@/contexts/UniversityContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  FileText,
  Loader2,
  User,
  Calendar,
  Upload,
  Download,
  X,
  Plane,
  Home,
  Flag,
  Building2,
  CreditCard,
  Heart,
  FileCheck,
  BookOpen,
  MessageSquare,
  Camera,
  Briefcase,
  Phone,
  Mail,
  MapPin,
  AlertCircle,
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
  requires_document: boolean;
  document_url: string | null;
  document_name: string | null;
}

// Comprehensive mobility checklist with document requirements
const COMPREHENSIVE_TASKS = {
  before: [
    // Application Phase
    { task_name: 'Complete Online Application Form', description: 'Fill out and submit the official mobility application form through the university portal', requires_document: true, category: 'Application' },
    { task_name: 'Submit Academic Transcript', description: 'Request and submit official academic transcript from registrar office', requires_document: true, category: 'Application' },
    { task_name: 'Prepare CV/Resume', description: 'Create an up-to-date CV highlighting academic achievements and extracurricular activities', requires_document: true, category: 'Application' },
    { task_name: 'Write Motivation Letter', description: 'Compose a compelling motivation letter explaining your reasons for exchange and goals', requires_document: true, category: 'Application' },
    { task_name: 'Obtain Recommendation Letters', description: 'Request 2-3 recommendation letters from professors or academic advisors', requires_document: true, category: 'Application' },
    
    // Language & Academic
    { task_name: 'Language Proficiency Test', description: 'Take and submit TOEFL, IELTS, or equivalent language certification scores', requires_document: true, category: 'Academic' },
    { task_name: 'Submit Course Catalog Research', description: 'Research and document available courses at host university', requires_document: false, category: 'Academic' },
    { task_name: 'Draft Learning Agreement', description: 'Create initial Learning Agreement with proposed course selections', requires_document: true, category: 'Academic' },
    { task_name: 'Get Home Coordinator Approval', description: 'Obtain approval signature from home university academic coordinator', requires_document: true, category: 'Academic' },
    { task_name: 'Get Host Coordinator Approval', description: 'Obtain approval signature from host university academic coordinator', requires_document: true, category: 'Academic' },
    { task_name: 'Finalize Learning Agreement', description: 'Complete all three signatures on the Learning Agreement', requires_document: true, category: 'Academic' },
    
    // Visa & Legal
    { task_name: 'Request Acceptance Letter', description: 'Obtain official acceptance letter from host university', requires_document: true, category: 'Visa & Legal' },
    { task_name: 'Request Visa Support Letter', description: 'Get visa support letter from host university international office', requires_document: true, category: 'Visa & Legal' },
    { task_name: 'Gather Visa Requirements', description: 'Compile all required visa documents: passport, photos, bank statements, etc.', requires_document: false, category: 'Visa & Legal' },
    { task_name: 'Fill Visa Application Form', description: 'Complete the visa application form for the destination country', requires_document: true, category: 'Visa & Legal' },
    { task_name: 'Pay Visa Fee', description: 'Pay the visa application fee and keep receipt', requires_document: true, category: 'Visa & Legal' },
    { task_name: 'Schedule Embassy Appointment', description: 'Book visa interview appointment at embassy/consulate', requires_document: false, category: 'Visa & Legal' },
    { task_name: 'Attend Visa Interview', description: 'Attend visa interview at embassy/consulate', requires_document: false, category: 'Visa & Legal' },
    { task_name: 'Receive Visa Approval', description: 'Collect approved visa from embassy', requires_document: true, category: 'Visa & Legal' },
    
    // Financial
    { task_name: 'Submit Grant/Scholarship Application', description: 'Apply for Erasmus+ grant or other mobility scholarships', requires_document: true, category: 'Financial' },
    { task_name: 'Obtain Bank Statement', description: 'Get bank statement proving sufficient funds for mobility period', requires_document: true, category: 'Financial' },
    { task_name: 'Set Up International Banking', description: 'Open international bank account or enable international transactions', requires_document: false, category: 'Financial' },
    { task_name: 'Sign Grant Agreement', description: 'Sign the grant agreement with your home university', requires_document: true, category: 'Financial' },
    { task_name: 'Receive First Grant Installment', description: 'Confirm receipt of first grant payment (typically 70-80%)', requires_document: true, category: 'Financial' },
    
    // Health & Insurance
    { task_name: 'Get Medical Checkup', description: 'Complete required medical examination if needed', requires_document: true, category: 'Health' },
    { task_name: 'Obtain EHIC Card', description: 'Apply for European Health Insurance Card (for EU countries)', requires_document: true, category: 'Health' },
    { task_name: 'Purchase Travel Insurance', description: 'Buy comprehensive travel/health insurance for mobility period', requires_document: true, category: 'Health' },
    { task_name: 'Prepare Vaccination Records', description: 'Gather vaccination records and get any required vaccinations', requires_document: true, category: 'Health' },
    { task_name: 'Obtain Prescription Medications', description: 'Get sufficient prescription medications and doctor letters', requires_document: true, category: 'Health' },
    
    // Housing & Travel
    { task_name: 'Apply for Student Housing', description: 'Submit application for university dormitory or housing', requires_document: true, category: 'Housing & Travel' },
    { task_name: 'Receive Housing Confirmation', description: 'Get confirmation of accommodation assignment', requires_document: true, category: 'Housing & Travel' },
    { task_name: 'Research Alternative Housing', description: 'Find private housing options if needed (apartment, shared flat)', requires_document: false, category: 'Housing & Travel' },
    { task_name: 'Sign Housing Contract', description: 'Sign accommodation contract and pay deposit', requires_document: true, category: 'Housing & Travel' },
    { task_name: 'Book Flight/Transportation', description: 'Purchase flight tickets or arrange transportation to host country', requires_document: true, category: 'Housing & Travel' },
    { task_name: 'Arrange Airport Pickup', description: 'Organize transportation from airport to accommodation', requires_document: false, category: 'Housing & Travel' },
    
    // Pre-Departure
    { task_name: 'Attend Pre-Departure Orientation', description: 'Participate in mandatory pre-departure briefing session', requires_document: true, category: 'Pre-Departure' },
    { task_name: 'Complete Online Cultural Training', description: 'Finish any required online intercultural preparation modules', requires_document: true, category: 'Pre-Departure' },
    { task_name: 'Notify Home University of Departure', description: 'Inform registrar and relevant departments of your exchange dates', requires_document: false, category: 'Pre-Departure' },
    { task_name: 'Emergency Contact Information', description: 'Provide emergency contact details to both universities', requires_document: true, category: 'Pre-Departure' },
    { task_name: 'Copy Important Documents', description: 'Make digital and physical copies of passport, visa, insurance, etc.', requires_document: false, category: 'Pre-Departure' },
    { task_name: 'Download Essential Apps', description: 'Install host country apps: banking, transport, maps, translation', requires_document: false, category: 'Pre-Departure' },
  ],
  during: [
    // Arrival
    { task_name: 'Arrive at Host Country', description: 'Successfully arrive at destination', requires_document: false, category: 'Arrival' },
    { task_name: 'Check Into Accommodation', description: 'Complete accommodation check-in and receive keys', requires_document: true, category: 'Arrival' },
    { task_name: 'Register with Host International Office', description: 'Complete arrival registration at host university international office', requires_document: true, category: 'Arrival' },
    { task_name: 'Attend Welcome/Orientation Week', description: 'Participate in orientation activities and campus tours', requires_document: false, category: 'Arrival' },
    { task_name: 'Get Student ID Card', description: 'Obtain student identification card from host university', requires_document: true, category: 'Arrival' },
    { task_name: 'Open Local Bank Account', description: 'Open a bank account in host country if required', requires_document: true, category: 'Arrival' },
    { task_name: 'Get Local SIM Card/Phone Plan', description: 'Obtain local phone number and data plan', requires_document: false, category: 'Arrival' },
    { task_name: 'Register with Local Authorities', description: 'Complete any required registration with local police/municipality', requires_document: true, category: 'Arrival' },
    { task_name: 'Register at Embassy (if required)', description: 'Register with your home country embassy for emergencies', requires_document: false, category: 'Arrival' },
    
    // Academic During
    { task_name: 'Confirm Course Registration', description: 'Finalize enrollment in selected courses at host university', requires_document: true, category: 'Academic' },
    { task_name: 'Request Learning Agreement Changes', description: 'If needed, submit course changes to both coordinators', requires_document: true, category: 'Academic' },
    { task_name: 'Attend All Classes Regularly', description: 'Maintain regular attendance in all enrolled courses', requires_document: false, category: 'Academic' },
    { task_name: 'Submit Mid-Term Progress Report', description: 'Complete and submit mid-semester academic progress update', requires_document: true, category: 'Academic' },
    { task_name: 'Meet with Academic Advisor', description: 'Schedule meeting with host university academic advisor', requires_document: false, category: 'Academic' },
    { task_name: 'Complete Course Assignments', description: 'Submit all required coursework and assignments on time', requires_document: false, category: 'Academic' },
    { task_name: 'Take Mid-Term Exams', description: 'Complete all mid-term examinations', requires_document: false, category: 'Academic' },
    { task_name: 'Take Final Exams', description: 'Complete all final examinations', requires_document: false, category: 'Academic' },
    
    // Living Abroad
    { task_name: 'Set Up Routine', description: 'Establish daily routine for classes, study, and activities', requires_document: false, category: 'Living' },
    { task_name: 'Join Student Clubs/Activities', description: 'Participate in student organizations and extracurricular activities', requires_document: false, category: 'Living' },
    { task_name: 'Attend Cultural Events', description: 'Participate in local cultural and social events', requires_document: false, category: 'Living' },
    { task_name: 'Explore Host City/Region', description: 'Visit local attractions and nearby cities', requires_document: false, category: 'Living' },
    { task_name: 'Network with International Students', description: 'Build connections with other exchange students', requires_document: false, category: 'Living' },
    { task_name: 'Maintain Communication with Home', description: 'Stay in regular contact with family and home university', requires_document: false, category: 'Living' },
    
    // Administrative During
    { task_name: 'Monthly Expense Tracking', description: 'Track expenses and stay within budget', requires_document: false, category: 'Administrative' },
    { task_name: 'Renew Visa/Residence Permit', description: 'If required, apply for visa extension before expiry', requires_document: true, category: 'Administrative' },
    { task_name: 'Document Experience (Photos/Blog)', description: 'Take photos and document your exchange experience', requires_document: false, category: 'Administrative' },
  ],
  after: [
    // Departure
    { task_name: 'Give Housing Notice', description: 'Notify housing office of departure date and schedule checkout', requires_document: false, category: 'Departure' },
    { task_name: 'Housing Checkout & Deposit', description: 'Complete housing checkout and receive deposit refund', requires_document: true, category: 'Departure' },
    { task_name: 'Close Local Bank Account', description: 'Close bank account and transfer remaining funds', requires_document: true, category: 'Departure' },
    { task_name: 'Return Library Books', description: 'Return all borrowed library materials', requires_document: false, category: 'Departure' },
    { task_name: 'Return Student ID Card', description: 'Return student ID if required by host university', requires_document: false, category: 'Departure' },
    { task_name: 'Farewell to Friends & Contacts', description: 'Exchange contact information with new friends', requires_document: false, category: 'Departure' },
    { task_name: 'Book Return Transportation', description: 'Arrange flight/transport back home', requires_document: true, category: 'Departure' },
    
    // Academic After
    { task_name: 'Request Transcript of Records', description: 'Obtain official transcript from host university registrar', requires_document: true, category: 'Academic' },
    { task_name: 'Obtain Mobility Certificate', description: 'Get official certificate/confirmation of completed exchange', requires_document: true, category: 'Academic' },
    { task_name: 'Get Grade Conversion Document', description: 'Request grade conversion if needed for credit transfer', requires_document: true, category: 'Academic' },
    { task_name: 'Submit Credit Transfer Request', description: 'Apply for credit transfer at home university registrar', requires_document: true, category: 'Academic' },
    { task_name: 'Meet with Home Coordinator', description: 'Schedule meeting to discuss credit recognition', requires_document: false, category: 'Academic' },
    { task_name: 'Receive Credit Transfer Confirmation', description: 'Obtain official confirmation of transferred credits', requires_document: true, category: 'Academic' },
    
    // Reporting & Feedback
    { task_name: 'Complete EU Survey (Erasmus)', description: 'Fill out mandatory Erasmus+ participant survey', requires_document: true, category: 'Reporting' },
    { task_name: 'Write Final Report', description: 'Compose comprehensive final mobility experience report', requires_document: true, category: 'Reporting' },
    { task_name: 'Submit Expense Report', description: 'Provide final expense documentation for grant', requires_document: true, category: 'Reporting' },
    { task_name: 'Participate in Re-entry Session', description: 'Attend post-mobility debrief and re-integration session', requires_document: true, category: 'Reporting' },
    { task_name: 'Share Experience with Future Students', description: 'Present experience at info sessions for prospective exchange students', requires_document: false, category: 'Reporting' },
    
    // Financial Closure
    { task_name: 'Submit Final Grant Documents', description: 'Provide all required documents for final grant payment', requires_document: true, category: 'Financial' },
    { task_name: 'Receive Final Grant Installment', description: 'Confirm receipt of final grant payment (remaining 20-30%)', requires_document: true, category: 'Financial' },
    { task_name: 'Close Grant Agreement', description: 'Complete all grant agreement requirements and close file', requires_document: true, category: 'Financial' },
  ],
};

export function StudentMobilityTracking() {
  const { selectedUniversity, universities } = useUniversity();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [applications, setApplications] = useState<StudentApplication[]>([]);
  const [selectedApplication, setSelectedApplication] = useState<StudentApplication | null>(null);
  const [tasks, setTasks] = useState<MobilityTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadingTaskId, setUploadingTaskId] = useState<string | null>(null);
  const [activePhase, setActivePhase] = useState('before');
  
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

      const enriched = (data || []).map((app) => {
        const host = universities.find(u => u.id === app.host_university_id);
        return {
          ...app,
          host_university: host ? { name: host.name, country: host.country } : undefined,
        };
      });

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

      // Create comprehensive tasks
      const allTasks: { 
        application_id: string; 
        task_name: string; 
        description: string; 
        phase: string; 
        sort_order: number;
        requires_document: boolean;
      }[] = [];
      let order = 0;
      
      for (const [phase, taskList] of Object.entries(COMPREHENSIVE_TASKS)) {
        for (const task of taskList) {
          allTasks.push({
            application_id: appData.id,
            task_name: task.task_name,
            description: task.description,
            phase,
            sort_order: order++,
            requires_document: task.requires_document,
          });
        }
      }

      const { error: tasksError } = await supabase
        .from('mobility_tasks')
        .insert(allTasks);

      if (tasksError) throw tasksError;

      toast({ title: 'Application created with comprehensive checklist!' });
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

  const handleFileUpload = async (taskId: string, file: File) => {
    setUploadingTaskId(taskId);
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task) return;

      const fileExt = file.name.split('.').pop();
      const fileName = `${selectedApplication?.id}/${taskId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('mobility-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('mobility-documents')
        .getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from('mobility_tasks')
        .update({
          document_url: fileName,
          document_name: file.name,
        })
        .eq('id', taskId);

      if (updateError) throw updateError;

      setTasks(tasks.map(t => 
        t.id === taskId 
          ? { ...t, document_url: fileName, document_name: file.name }
          : t
      ));

      toast({ title: 'Document uploaded successfully!' });
    } catch (error: any) {
      console.error('Error uploading document:', error);
      toast({ variant: 'destructive', title: 'Upload failed', description: error.message });
    } finally {
      setUploadingTaskId(null);
    }
  };

  const removeDocument = async (taskId: string) => {
    try {
      const task = tasks.find(t => t.id === taskId);
      if (!task?.document_url) return;

      await supabase.storage
        .from('mobility-documents')
        .remove([task.document_url]);

      const { error } = await supabase
        .from('mobility_tasks')
        .update({
          document_url: null,
          document_name: null,
        })
        .eq('id', taskId);

      if (error) throw error;

      setTasks(tasks.map(t => 
        t.id === taskId 
          ? { ...t, document_url: null, document_name: null }
          : t
      ));

      toast({ title: 'Document removed' });
    } catch (error) {
      console.error('Error removing document:', error);
    }
  };

  const downloadDocument = async (task: MobilityTask) => {
    if (!task.document_url) return;
    
    try {
      const { data, error } = await supabase.storage
        .from('mobility-documents')
        .download(task.document_url);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = task.document_name || 'document';
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading document:', error);
      toast({ variant: 'destructive', title: 'Download failed' });
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

  const getPhaseStats = (phase: string) => {
    const phaseTasks = tasks.filter(t => t.phase === phase);
    const completed = phaseTasks.filter(t => t.is_completed).length;
    const withDocs = phaseTasks.filter(t => t.requires_document);
    const docsUploaded = withDocs.filter(t => t.document_url).length;
    return { total: phaseTasks.length, completed, withDocs: withDocs.length, docsUploaded };
  };

  // Group tasks by category within a phase
  const getTasksByCategory = (phase: string) => {
    const phaseTasks = tasks.filter(t => t.phase === phase);
    const categories: { [key: string]: MobilityTask[] } = {};
    
    const phaseConfig = COMPREHENSIVE_TASKS[phase as keyof typeof COMPREHENSIVE_TASKS] || [];
    
    phaseTasks.forEach(task => {
      const configTask = phaseConfig.find(ct => ct.task_name === task.task_name);
      const category = configTask?.category || 'Other';
      if (!categories[category]) categories[category] = [];
      categories[category].push(task);
    });
    
    return categories;
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
      case 'accepted': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'rejected': return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'in_progress': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'completed': return 'bg-purple-500/10 text-purple-600 border-purple-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'Application': return <FileText className="h-4 w-4" />;
      case 'Academic': return <BookOpen className="h-4 w-4" />;
      case 'Visa & Legal': return <Flag className="h-4 w-4" />;
      case 'Financial': return <CreditCard className="h-4 w-4" />;
      case 'Health': return <Heart className="h-4 w-4" />;
      case 'Housing & Travel': return <Home className="h-4 w-4" />;
      case 'Pre-Departure': return <Plane className="h-4 w-4" />;
      case 'Arrival': return <MapPin className="h-4 w-4" />;
      case 'Living': return <Building2 className="h-4 w-4" />;
      case 'Administrative': return <Briefcase className="h-4 w-4" />;
      case 'Departure': return <Plane className="h-4 w-4" />;
      case 'Reporting': return <MessageSquare className="h-4 w-4" />;
      default: return <CheckCircle2 className="h-4 w-4" />;
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
          <p className="text-sm text-muted-foreground">Comprehensive checklist with document uploads for every mobility step</p>
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
                <SelectItem value="accepted">Accepted</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
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
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {app.host_university?.name || 'Unknown'}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {app.academic_year} • {app.semester}
                          </div>
                        </div>
                        <Badge className={getStatusColor(app.status)} variant="outline">
                          {app.status}
                        </Badge>
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
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <User className="h-5 w-5" />
                      {selectedApplication.student_name}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {selectedApplication.host_university?.name} • {selectedApplication.academic_year}
                    </CardDescription>
                  </div>
                  <Select value={selectedApplication.status} onValueChange={updateApplicationStatus}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="accepted">Accepted</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Overall Progress */}
                <div className="mt-4 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium">Overall Progress</span>
                    <span className="text-muted-foreground">{getCompletionPercentage()}%</span>
                  </div>
                  <Progress value={getCompletionPercentage()} className="h-2" />
                </div>

                {/* Phase Progress */}
                <div className="mt-4 grid grid-cols-3 gap-4">
                  {['before', 'during', 'after'].map(phase => {
                    const stats = getPhaseStats(phase);
                    const completion = getPhaseCompletion(phase);
                    return (
                      <div key={phase} className="rounded-lg border p-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium capitalize">{phase} Mobility</span>
                          <Badge variant="outline" className="text-xs">{completion}%</Badge>
                        </div>
                        <Progress value={completion} className="h-1.5" />
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{stats.completed}/{stats.total} tasks</span>
                          <span>{stats.docsUploaded}/{stats.withDocs} docs</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardHeader>
              
              <CardContent>
                {/* Phase Tabs */}
                <Tabs value={activePhase} onValueChange={setActivePhase}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="before" className="gap-2">
                      <Clock className="h-4 w-4" />
                      Before
                    </TabsTrigger>
                    <TabsTrigger value="during" className="gap-2">
                      <Plane className="h-4 w-4" />
                      During
                    </TabsTrigger>
                    <TabsTrigger value="after" className="gap-2">
                      <CheckCircle2 className="h-4 w-4" />
                      After
                    </TabsTrigger>
                  </TabsList>

                  {['before', 'during', 'after'].map(phase => (
                    <TabsContent key={phase} value={phase} className="mt-4">
                      <ScrollArea className="h-[400px] pr-4">
                        <Accordion type="multiple" className="space-y-2" defaultValue={Object.keys(getTasksByCategory(phase))}>
                          {Object.entries(getTasksByCategory(phase)).map(([category, categoryTasks]) => {
                            const completedCount = categoryTasks.filter(t => t.is_completed).length;
                            return (
                              <AccordionItem key={category} value={category} className="border rounded-lg px-4">
                                <AccordionTrigger className="py-3 hover:no-underline">
                                  <div className="flex items-center gap-3">
                                    {getCategoryIcon(category)}
                                    <span className="font-medium">{category}</span>
                                    <Badge variant="outline" className="ml-2">
                                      {completedCount}/{categoryTasks.length}
                                    </Badge>
                                  </div>
                                </AccordionTrigger>
                                <AccordionContent className="pb-4">
                                  <div className="space-y-3">
                                    {categoryTasks.map(task => (
                                      <div 
                                        key={task.id} 
                                        className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                                          task.is_completed ? 'bg-green-50/50 border-green-200' : 'bg-card hover:bg-accent/30'
                                        }`}
                                      >
                                        <Checkbox
                                          checked={task.is_completed}
                                          onCheckedChange={() => toggleTask(task)}
                                          className="mt-0.5"
                                        />
                                        <div className="flex-1 min-w-0 space-y-1">
                                          <div className="flex items-center gap-2">
                                            <span className={`text-sm font-medium ${task.is_completed ? 'line-through text-muted-foreground' : ''}`}>
                                              {task.task_name}
                                            </span>
                                            {task.requires_document && !task.document_url && (
                                              <Badge variant="outline" className="text-xs bg-amber-50 text-amber-700 border-amber-200">
                                                <Upload className="h-3 w-3 mr-1" />
                                                Doc Required
                                              </Badge>
                                            )}
                                          </div>
                                          <p className="text-xs text-muted-foreground">{task.description}</p>
                                          
                                          {/* Document Upload/View */}
                                          {task.requires_document && (
                                            <div className="mt-2 flex items-center gap-2">
                                              {task.document_url ? (
                                                <div className="flex items-center gap-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                                  <FileCheck className="h-3 w-3" />
                                                  <span className="truncate max-w-[150px]">{task.document_name}</span>
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-5 w-5 p-0"
                                                    onClick={(e) => { e.stopPropagation(); downloadDocument(task); }}
                                                  >
                                                    <Download className="h-3 w-3" />
                                                  </Button>
                                                  <Button
                                                    size="sm"
                                                    variant="ghost"
                                                    className="h-5 w-5 p-0 text-red-600 hover:text-red-700"
                                                    onClick={(e) => { e.stopPropagation(); removeDocument(task.id); }}
                                                  >
                                                    <X className="h-3 w-3" />
                                                  </Button>
                                                </div>
                                              ) : (
                                                <label className="cursor-pointer">
                                                  <input
                                                    type="file"
                                                    className="hidden"
                                                    onChange={(e) => {
                                                      const file = e.target.files?.[0];
                                                      if (file) handleFileUpload(task.id, file);
                                                    }}
                                                    disabled={uploadingTaskId === task.id}
                                                  />
                                                  <Button
                                                    size="sm"
                                                    variant="outline"
                                                    className="h-7 text-xs"
                                                    disabled={uploadingTaskId === task.id}
                                                    asChild
                                                  >
                                                    <span>
                                                      {uploadingTaskId === task.id ? (
                                                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                                      ) : (
                                                        <Upload className="h-3 w-3 mr-1" />
                                                      )}
                                                      Upload Document
                                                    </span>
                                                  </Button>
                                                </label>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                        {task.is_completed && (
                                          <CheckCircle2 className="h-5 w-5 text-green-600 flex-shrink-0" />
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                </AccordionContent>
                              </AccordionItem>
                            );
                          })}
                        </Accordion>
                      </ScrollArea>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Select a Student Application</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  Choose a student from the list to view their comprehensive mobility checklist with document uploads
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
