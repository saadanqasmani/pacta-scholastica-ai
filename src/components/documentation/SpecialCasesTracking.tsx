import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { 
  AlertTriangle, Search, FileWarning, ShieldAlert, Clock, CheckCircle2, 
  CircleDot, MapPin, BookOpen, User, Hash, Building2, Flag, Plus, 
  Sparkles, RefreshCw, AlertCircle, Lightbulb, Timer, TriangleAlert
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

type CaseCategory = 'credential_recognition' | 'academic_failure' | 'war_zone' | 'visa_issue' | 'other';
type CaseStatus = 'open' | 'in_progress' | 'pending_documents' | 'resolved' | 'escalated';
type StepStatus = 'completed' | 'in_progress' | 'pending' | 'blocked';

interface CaseStep { title: string; description: string; status: StepStatus; date?: string; notes?: string; estimatedDuration?: string; }
interface SpecialCase { id: string; studentName: string; studentId: string; department: string; departmentCode: string; enrollmentYear: number; country: string; category: CaseCategory; categoryLabelKey: string; status: CaseStatus; summary: string; details: string; steps: CaseStep[]; createdAt: string; lastUpdated: string; riskLevel?: string; estimatedResolutionTime?: string; recommendations?: string[]; isAIGenerated?: boolean; }

interface AIResult {
  category: CaseCategory;
  status: CaseStatus;
  summary: string;
  details: string;
  steps: Array<{ title: string; description: string; status: StepStatus; estimatedDuration?: string; notes?: string; }>;
  riskLevel: string;
  estimatedResolutionTime: string;
  recommendations: string[];
}

const HARDCODED_CASES: SpecialCase[] = [
  {
    id: 'sc-001', studentName: 'Aung Kyaw Min', studentId: '20241500001', department: 'Computer Engineering', departmentCode: '1500', enrollmentYear: 2024, country: 'Myanmar', category: 'credential_recognition', categoryLabelKey: 'specialCases.credentialRecognition', status: 'in_progress',
    summary: 'Myanmar student completed GED which is not recognized as formal high school completion in Turkey. Denklik (equivalency) process required.',
    details: 'The student obtained a GED (General Educational Development) certificate from Myanmar. Under Turkish YOK regulations, GED is not accepted as an equivalent to a Turkish high school diploma (Lise Diplomasi). The student needs to go through the Denklik process at the Il Milli Egitim Mudurlugu. However, since GED is not a standard diploma, the case has been escalated to the central MEB office in Ankara for a special evaluation.',
    steps: [{ title: 'Collect original GED certificate & transcripts', description: 'Gather all original GED scores and any supplementary academic records from Myanmar.', status: 'completed', date: '2024-09-15', notes: 'All 4 subject scores received. Student passed with above-average marks.' }, { title: 'Apostille/Authentication of GED documents', description: 'Since Myanmar is not part of the Hague Convention, documents need consular authentication through the Myanmar Embassy and Turkish Consulate.', status: 'completed', date: '2024-10-02', notes: 'Authentication completed via Myanmar Embassy in Ankara.' }, { title: 'Turkish sworn translation (Noter tasdikli)', description: 'All documents must be translated by a sworn translator and notarized.', status: 'completed', date: '2024-10-10' }, { title: 'Apply to Il Milli Egitim Mudurlugu for Denklik', description: 'Submit denklik application. Since GED is non-standard, the local office may refer the case to MEB Ankara.', status: 'in_progress', date: '2024-10-20', notes: 'Application submitted. Local office forwarded to MEB central for evaluation. Waiting period: 4-8 weeks.' }, { title: 'MEB Central evaluation & possible exam requirement', description: 'MEB Ankara will evaluate whether GED meets Turkish standards. Student may be required to take supplementary exams in specific subjects.', status: 'pending' }, { title: 'Receive Denklik certificate', description: 'If approved, denklik certificate will be issued allowing formal enrollment.', status: 'pending' }, { title: 'Complete university enrollment with Denklik', description: 'Submit denklik to student affairs to finalize enrollment.', status: 'pending' }], createdAt: '2024-09-10', lastUpdated: '2024-10-20',
  },
  {
    id: 'sc-002', studentName: 'Ahmad Al-Hassan', studentId: '20241200003', department: 'Medicine', departmentCode: '1200', enrollmentYear: 2024, country: 'Syria', category: 'war_zone', categoryLabelKey: 'specialCases.warZone', status: 'in_progress',
    summary: 'Syrian TP holder lost original Baccalaureat certificate due to conflict. Needs alternative documentation for Denklik.',
    details: 'Student fled Syria in 2018 and has been living in Turkey under Temporary Protection (TP) status. Original Baccalaureat certificate was lost during displacement. Student has a Temporary Protection ID (Gecici Koruma Kimlik Belgesi) and partial school records obtained from the Syrian Interim Government. YOK has special provisions for TP holders but requires verification of educational background through alternative means.',
    steps: [{ title: 'Verify TP registration status', description: 'Confirm valid Temporary Protection registration at Il Goc Idaresi.', status: 'completed', date: '2024-08-20', notes: 'TP ID valid. Registered in Istanbul since 2018.' }, { title: 'Obtain Syrian Interim Government verification', description: 'Request educational background verification from Syrian Interim Government education directorate.', status: 'completed', date: '2024-09-05', notes: 'Verification letter received confirming Baccalaureat completion in 2017.' }, { title: 'UNHCR educational attestation', description: 'Request UNHCR attestation for educational documents lost due to conflict.', status: 'completed', date: '2024-09-20', notes: 'UNHCR provided supporting documentation.' }, { title: 'Apply for special Denklik under TP provisions', description: 'Submit denklik application under YOK special provisions for Temporary Protection holders.', status: 'in_progress', date: '2024-10-01', notes: 'Application filed at Istanbul Il Milli Egitim. Awaiting evaluation.' }, { title: 'Turkish language proficiency verification', description: 'Student must demonstrate Turkish language proficiency (TOMER certificate).', status: 'in_progress', date: '2024-10-15', notes: 'Enrolled in TOMER C1 course.' }, { title: 'Receive Denklik and complete enrollment', description: 'Upon Denklik approval, finalize enrollment in Medicine program.', status: 'pending' }], createdAt: '2024-08-15', lastUpdated: '2024-10-15',
  },
  {
    id: 'sc-003', studentName: 'Fatima Abdi', studentId: '20241800002', department: 'International Relations', departmentCode: '1800', enrollmentYear: 2024, country: 'Somalia', category: 'war_zone', categoryLabelKey: 'specialCases.warZone', status: 'escalated',
    summary: 'Somali student has no formal secondary school documentation due to prolonged civil conflict. Requires sworn affidavit and YOK special evaluation.',
    details: 'Student completed secondary education in Mogadishu but the school was destroyed during conflict and no records survive. The Somali Ministry of Education cannot verify the records. Under YOK special provisions, a combination of sworn affidavits, UNHCR refugee status documentation, and a placement exam may be used as alternatives.',
    steps: [{ title: 'Gather sworn affidavits', description: 'Obtain sworn affidavits from 2+ witnesses who can attest to educational completion.', status: 'completed', date: '2024-07-10', notes: '3 affidavits obtained from former teachers now in Turkey.' }, { title: 'UNHCR refugee status confirmation', description: 'Get official UNHCR confirmation of refugee status and educational history.', status: 'completed', date: '2024-07-25' }, { title: 'Submit to YOK for special evaluation', description: 'File application with YOK for special evaluation under conflict-zone provisions.', status: 'in_progress', date: '2024-08-15', notes: 'YOK acknowledged receipt. Case referred to special evaluation committee.' }, { title: 'Placement examination', description: 'Student may need to sit for a YOK-administered placement exam to verify academic readiness.', status: 'pending' }, { title: 'YOK decision and Denklik issuance', description: 'Await YOK committee decision on educational equivalency.', status: 'pending' }, { title: 'Complete enrollment', description: 'Finalize enrollment upon receiving special Denklik certificate.', status: 'pending' }], createdAt: '2024-07-01', lastUpdated: '2024-09-30',
  },
  {
    id: 'sc-004', studentName: 'James Okonkwo', studentId: '20231600005', department: 'Electrical Engineering', departmentCode: '1600', enrollmentYear: 2023, country: 'Nigeria', category: 'academic_failure', categoryLabelKey: 'specialCases.academicFailure', status: 'pending_documents',
    summary: 'Nigerian student with WAEC certificate missing credit in Mathematics. Needs to retake and resubmit for Denklik update.',
    details: 'Student was admitted conditionally with a WAEC SSCE certificate showing a D7 in Mathematics. Turkish Denklik requires minimum credit (C6 or higher) in core subjects. Student must retake the Mathematics paper through WAEC and submit updated results for Denklik re-evaluation.',
    steps: [{ title: 'Identify deficient subject', description: 'Review WAEC results against Denklik requirements.', status: 'completed', date: '2023-10-01', notes: 'Mathematics D7 identified as below minimum requirement.' }, { title: 'Register for WAEC re-sit', description: 'Register for the next available WAEC examination session.', status: 'completed', date: '2023-11-15' }, { title: 'Sit for Mathematics re-examination', description: 'Take the WAEC Mathematics paper.', status: 'completed', date: '2024-06-10', notes: 'Exam completed. Results pending.' }, { title: 'Receive and verify updated WAEC results', description: 'Obtain new results and verify.', status: 'in_progress', date: '2024-08-20', notes: 'Results released: B3 in Mathematics. Awaiting confirmation letter.' }, { title: 'Re-authenticate documents', description: 'Get updated certificate authenticated.', status: 'pending' }, { title: 'Submit updated Denklik application', description: 'Resubmit with corrected grade.', status: 'pending' }, { title: 'Receive updated Denklik', description: 'Conditional enrollment status will be lifted.', status: 'pending' }], createdAt: '2023-09-20', lastUpdated: '2024-08-20',
  },
  {
    id: 'sc-005', studentName: 'Ali Reza Mohammadi', studentId: '20241300007', department: 'Dentistry', departmentCode: '1300', enrollmentYear: 2024, country: 'Iran', category: 'credential_recognition', categoryLabelKey: 'specialCases.credentialRecognition', status: 'in_progress',
    summary: 'Iranian student has pre-university diploma (Diplom-e Pish-Daneshgahi) which was phased out. Verification needed.',
    details: 'Iran reformed its education system in 2019, replacing the 3+1 system with a unified 3-year system. This student graduated under the old system. The old-format diploma requires additional verification.',
    steps: [{ title: 'Collect original diploma and transcripts', description: 'Gather all documents.', status: 'completed', date: '2024-09-01' }, { title: 'Apostille from Iranian Ministry of Justice', description: 'Get Apostille stamp.', status: 'completed', date: '2024-09-15' }, { title: 'Sworn translation to Turkish', description: 'Translate by sworn translator.', status: 'completed', date: '2024-09-25' }, { title: 'Apply for Denklik with old-system explanation', description: 'Submit with cover letter explaining old vs new system.', status: 'in_progress', date: '2024-10-05', notes: 'MEB requested additional clarification.' }, { title: 'Provide supplementary verification from Iran', description: 'Obtain official letter from Iranian MOE.', status: 'pending' }, { title: 'Receive Denklik approval', description: 'Await final decision.', status: 'pending' }], createdAt: '2024-08-25', lastUpdated: '2024-10-10',
  },
];

const CATEGORY_LABEL_MAP: Record<CaseCategory, string> = {
  credential_recognition: 'specialCases.credentialRecognition',
  academic_failure: 'specialCases.academicFailure',
  war_zone: 'specialCases.warZone',
  visa_issue: 'specialCases.visaIssue',
  other: 'specialCases.other',
};

const COUNTRIES = [
  'Afghanistan', 'Algeria', 'Azerbaijan', 'Bangladesh', 'Cameroon', 'China', 'Egypt', 'Ethiopia',
  'Georgia', 'Ghana', 'India', 'Indonesia', 'Iran', 'Iraq', 'Jordan', 'Kazakhstan', 'Kenya',
  'Lebanon', 'Libya', 'Malaysia', 'Morocco', 'Myanmar', 'Nigeria', 'Pakistan', 'Palestine',
  'Russia', 'Saudi Arabia', 'Senegal', 'Somalia', 'Sudan', 'Syria', 'Tunisia', 'Turkey',
  'Turkmenistan', 'UAE', 'Uzbekistan', 'Yemen',
].sort();

const DEPARTMENTS = [
  'Medicine', 'Dentistry', 'Pharmacy', 'Engineering', 'Computer Engineering', 'Electrical Engineering',
  'Civil Engineering', 'Architecture', 'Business Administration', 'International Relations',
  'Psychology', 'Law', 'Nursing', 'Industrial Engineering',
];

const getCategoryIcon = (category: CaseCategory) => {
  switch (category) {
    case 'credential_recognition': return <FileWarning className="h-4 w-4" />;
    case 'academic_failure': return <BookOpen className="h-4 w-4" />;
    case 'war_zone': return <ShieldAlert className="h-4 w-4" />;
    case 'visa_issue': return <AlertTriangle className="h-4 w-4" />;
    default: return <AlertTriangle className="h-4 w-4" />;
  }
};

const getCategoryColor = (category: CaseCategory) => {
  switch (category) {
    case 'credential_recognition': return 'bg-amber-500/10 text-amber-700 border-amber-500/30';
    case 'academic_failure': return 'bg-orange-500/10 text-orange-700 border-orange-500/30';
    case 'war_zone': return 'bg-red-500/10 text-red-700 border-red-500/30';
    case 'visa_issue': return 'bg-purple-500/10 text-purple-700 border-purple-500/30';
    default: return 'bg-muted text-muted-foreground';
  }
};

const getRiskColor = (risk: string) => {
  switch (risk) {
    case 'high': return 'bg-red-500/10 text-red-700 border-red-500/30';
    case 'medium': return 'bg-amber-500/10 text-amber-700 border-amber-500/30';
    case 'low': return 'bg-green-500/10 text-green-700 border-green-500/30';
    default: return 'bg-muted text-muted-foreground';
  }
};

export function SpecialCasesTracking() {
  const { t, language } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [createdCases, setCreatedCases] = useState<SpecialCase[]>([]);

  // Form state
  const [formName, setFormName] = useState('');
  const [formStudentId, setFormStudentId] = useState('');
  const [formDepartment, setFormDepartment] = useState('');
  const [formCountry, setFormCountry] = useState('');
  const [formEducation, setFormEducation] = useState('');
  const [formDegree, setFormDegree] = useState('');
  const [formSituation, setFormSituation] = useState('');

  const allCases = [...HARDCODED_CASES, ...createdCases];

  const filteredCases = allCases.filter(c => {
    const matchesSearch = c.studentName.toLowerCase().includes(searchQuery.toLowerCase()) || c.studentId.includes(searchQuery) || c.department.toLowerCase().includes(searchQuery.toLowerCase()) || c.country.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getProgress = (steps: CaseStep[]) => {
    const completed = steps.filter(s => s.status === 'completed').length;
    return Math.round((completed / steps.length) * 100);
  };

  const getStatusBadge = (status: CaseStatus) => {
    switch (status) {
      case 'open': return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">{t('specialCases.open')}</Badge>;
      case 'in_progress': return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">{t('specialCases.inProgress')}</Badge>;
      case 'pending_documents': return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">{t('specialCases.pendingDocuments')}</Badge>;
      case 'resolved': return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">{t('specialCases.resolved')}</Badge>;
      case 'escalated': return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">{t('specialCases.escalated')}</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const handleAnalyze = async () => {
    if (!formName || !formStudentId || !formDepartment || !formCountry || !formSituation) {
      toast.error('Please fill in all required fields');
      return;
    }
    setAiLoading(true);
    setAiResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('special-case-analyze', {
        body: {
          studentName: formName,
          studentId: formStudentId,
          department: formDepartment,
          country: formCountry,
          educationSystem: formEducation,
          degreeLevel: formDegree,
          situation: formSituation,
          language,
        },
      });
      if (error) throw error;
      setAiResult(data as AIResult);
      toast.success('AI analysis complete');
    } catch (error) {
      console.error('Error analyzing case:', error);
      toast.error('Failed to analyze case');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSaveCase = () => {
    if (!aiResult) return;
    const today = new Date().toISOString().split('T')[0];
    const newCase: SpecialCase = {
      id: `sc-ai-${Date.now()}`,
      studentName: formName,
      studentId: formStudentId,
      department: formDepartment,
      departmentCode: '',
      enrollmentYear: new Date().getFullYear(),
      country: formCountry,
      category: aiResult.category,
      categoryLabelKey: CATEGORY_LABEL_MAP[aiResult.category] || 'specialCases.other',
      status: aiResult.status,
      summary: aiResult.summary,
      details: aiResult.details,
      steps: aiResult.steps.map(s => ({ ...s, status: s.status as StepStatus })),
      createdAt: today,
      lastUpdated: today,
      riskLevel: aiResult.riskLevel,
      estimatedResolutionTime: aiResult.estimatedResolutionTime,
      recommendations: aiResult.recommendations,
      isAIGenerated: true,
    };
    setCreatedCases(prev => [newCase, ...prev]);
    setDialogOpen(false);
    resetForm();
    toast.success('Case created successfully');
  };

  const resetForm = () => {
    setFormName(''); setFormStudentId(''); setFormDepartment(''); setFormCountry('');
    setFormEducation(''); setFormDegree(''); setFormSituation(''); setAiResult(null);
  };

  const totalCases = allCases.length;
  const warZoneCases = allCases.filter(c => c.category === 'war_zone').length;
  const credentialCases = allCases.filter(c => c.category === 'credential_recognition').length;
  const academicCases = allCases.filter(c => c.category === 'academic_failure').length;
  const escalatedCases = allCases.filter(c => c.status === 'escalated').length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-foreground">{totalCases}</div><p className="text-xs text-muted-foreground mt-1">{t('specialCases.activeCases')}</p></CardContent></Card>
        <Card className="border-red-500/20"><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-red-600">{warZoneCases}</div><p className="text-xs text-muted-foreground mt-1">{t('specialCases.warZone')}</p></CardContent></Card>
        <Card className="border-amber-500/20"><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-amber-600">{credentialCases}</div><p className="text-xs text-muted-foreground mt-1">{t('specialCases.credentialRecognition')}</p></CardContent></Card>
        <Card className="border-orange-500/20"><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-orange-600">{academicCases}</div><p className="text-xs text-muted-foreground mt-1">{t('specialCases.academicFailure')}</p></CardContent></Card>
        <Card className="border-red-500/20"><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-red-600">{escalatedCases}</div><p className="text-xs text-muted-foreground mt-1">{t('specialCases.escalated')}</p></CardContent></Card>
      </div>

      {/* Filters + Create button */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder={t('specialCases.searchPlaceholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
          </div>
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]"><SelectValue placeholder={t('common.type')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('specialCases.allCategories')}</SelectItem>
            <SelectItem value="credential_recognition">{t('specialCases.credentialRecognition')}</SelectItem>
            <SelectItem value="academic_failure">{t('specialCases.academicFailure')}</SelectItem>
            <SelectItem value="war_zone">{t('specialCases.warZone')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]"><SelectValue placeholder={t('common.status')} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('specialCases.allStatuses')}</SelectItem>
            <SelectItem value="open">{t('specialCases.open')}</SelectItem>
            <SelectItem value="in_progress">{t('specialCases.inProgress')}</SelectItem>
            <SelectItem value="pending_documents">{t('specialCases.pendingDocuments')}</SelectItem>
            <SelectItem value="resolved">{t('specialCases.resolved')}</SelectItem>
            <SelectItem value="escalated">{t('specialCases.escalated')}</SelectItem>
          </SelectContent>
        </Select>

        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="h-4 w-4" />Create New Case</Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />Create Special Case with AI Analysis</DialogTitle>
              <DialogDescription>Enter the student's details and describe the situation. AI will analyze and generate case details with a progress timeline.</DialogDescription>
            </DialogHeader>

            <div className="grid gap-6 mt-4">
              {/* Student Details Form */}
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Student Name *</Label>
                  <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. Ahmad Hassan" />
                </div>
                <div className="space-y-2">
                  <Label>Student ID *</Label>
                  <Input value={formStudentId} onChange={(e) => setFormStudentId(e.target.value)} placeholder="e.g. 20241500001" />
                </div>
                <div className="space-y-2">
                  <Label>Department *</Label>
                  <Select value={formDepartment} onValueChange={setFormDepartment}>
                    <SelectTrigger><SelectValue placeholder="Select department" /></SelectTrigger>
                    <SelectContent>{DEPARTMENTS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Country of Origin *</Label>
                  <Select value={formCountry} onValueChange={setFormCountry}>
                    <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                    <SelectContent><ScrollArea className="h-64">{COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</ScrollArea></SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Education System</Label>
                  <Select value={formEducation} onValueChange={setFormEducation}>
                    <SelectTrigger><SelectValue placeholder="Select education system" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="national">National System</SelectItem>
                      <SelectItem value="cambridge">Cambridge (A-Levels)</SelectItem>
                      <SelectItem value="ib">International Baccalaureate</SelectItem>
                      <SelectItem value="american">American System</SelectItem>
                      <SelectItem value="ged">GED</SelectItem>
                      <SelectItem value="waec">WAEC</SelectItem>
                      <SelectItem value="french">French Baccalaureat</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Degree Level</Label>
                  <Select value={formDegree} onValueChange={setFormDegree}>
                    <SelectTrigger><SelectValue placeholder="Select degree" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="bachelors">Bachelor's</SelectItem>
                      <SelectItem value="masters">Master's</SelectItem>
                      <SelectItem value="phd">PhD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Describe the Situation *</Label>
                <Textarea 
                  value={formSituation} 
                  onChange={(e) => setFormSituation(e.target.value)} 
                  placeholder="Describe the student's situation in detail. For example: 'Student from Syria lost their original Baccalaureat certificate during the conflict. They have a Temporary Protection ID and partial school records from the Syrian Interim Government...'"
                  className="min-h-[120px]"
                />
              </div>

              <Button 
                onClick={handleAnalyze} 
                disabled={aiLoading || !formName || !formStudentId || !formDepartment || !formCountry || !formSituation}
                className="w-full gap-2"
                size="lg"
              >
                {aiLoading ? <><RefreshCw className="h-4 w-4 animate-spin" />Analyzing with AI...</> : <><Sparkles className="h-4 w-4" />Analyze with AI</>}
              </Button>

              {/* AI Result */}
              {aiResult && (
                <div className="space-y-5 border-t pt-5">
                  <h3 className="font-semibold text-lg flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />AI Analysis Result</h3>

                  {/* Meta badges */}
                  <div className="flex flex-wrap gap-3">
                    <Badge variant="outline" className={getCategoryColor(aiResult.category)}>
                      {getCategoryIcon(aiResult.category)}
                      <span className="ml-1 capitalize">{aiResult.category.replace('_', ' ')}</span>
                    </Badge>
                    <Badge variant="outline" className={getRiskColor(aiResult.riskLevel)}>
                      <TriangleAlert className="h-3 w-3 mr-1" />
                      Risk: {aiResult.riskLevel}
                    </Badge>
                    <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                      <Timer className="h-3 w-3 mr-1" />
                      {aiResult.estimatedResolutionTime}
                    </Badge>
                  </div>

                  {/* Summary & Details */}
                  <Card>
                    <CardContent className="p-4 space-y-3">
                      <div>
                        <span className="text-xs font-medium text-muted-foreground uppercase">Summary</span>
                        <p className="text-sm mt-1">{aiResult.summary}</p>
                      </div>
                      <Separator />
                      <div>
                        <span className="text-xs font-medium text-muted-foreground uppercase">Detailed Analysis</span>
                        <p className="text-sm mt-1 text-muted-foreground whitespace-pre-wrap">{aiResult.details}</p>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Timeline */}
                  <div>
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-3">
                      <Clock className="h-4 w-4 text-primary" />Progress Timeline ({aiResult.steps.length} steps)
                    </h4>
                    <div className="relative pl-4 border-l border-border space-y-4">
                      {aiResult.steps.map((step, idx) => (
                        <div key={idx} className="relative">
                          <div className={`absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 bg-background ${
                            step.status === 'completed' ? 'border-green-500 bg-green-500' : 
                            step.status === 'in_progress' ? 'border-primary animate-pulse' : 
                            step.status === 'blocked' ? 'border-red-500' : 'border-muted-foreground'
                          }`} />
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{step.title}</span>
                              {step.estimatedDuration && (
                                <Badge variant="outline" className="text-xs">
                                  <Timer className="h-3 w-3 mr-1" />{step.estimatedDuration}
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">{step.description}</p>
                            {step.notes && (
                              <div className="mt-1 text-xs bg-muted/50 p-2 rounded border border-border/50 text-muted-foreground">
                                <span className="font-medium mr-1">Note:</span>{step.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations */}
                  {aiResult.recommendations && aiResult.recommendations.length > 0 && (
                    <Card className="bg-primary/5 border-primary/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-primary" />Recommendations
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="text-sm space-y-1.5">
                          {aiResult.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                              <span>{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  <Button onClick={handleSaveCase} className="w-full gap-2" size="lg" variant="default">
                    <Plus className="h-4 w-4" />Save Case
                  </Button>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Cases list */}
      <ScrollArea className="h-[800px] pr-2">
        <Accordion type="multiple" className="space-y-3">
          {filteredCases.length > 0 ? filteredCases.map((caseItem) => (
            <AccordionItem key={caseItem.id} value={caseItem.id} className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/30">
                <div className="flex items-start gap-4 text-left w-full pr-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">{getCategoryIcon(caseItem.category)}</div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground">{caseItem.studentName}</span>
                      <Badge variant="outline" className={getCategoryColor(caseItem.category)}>{t(caseItem.categoryLabelKey)}</Badge>
                      {getStatusBadge(caseItem.status)}
                      {caseItem.isAIGenerated && <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-xs"><Sparkles className="h-3 w-3 mr-1" />AI Generated</Badge>}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><Hash className="h-3 w-3" />{caseItem.studentId}</span>
                      <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{caseItem.department}</span>
                      <span className="flex items-center gap-1"><Flag className="h-3 w-3" />{caseItem.country}</span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">{caseItem.summary}</p>
                  </div>
                  <div className="text-right shrink-0 hidden md:block">
                    <div className="flex items-center gap-2">
                      <Progress value={getProgress(caseItem.steps)} className="w-20 h-2" />
                      <span className="text-sm font-medium w-10 text-right">{getProgress(caseItem.steps)}%</span>
                    </div>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5">
                <div className="space-y-5">
                  {/* Student info grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2 text-sm"><User className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">{t('docs.studentName')}</p><p className="font-medium">{caseItem.studentName}</p></div></div>
                    <div className="flex items-center gap-2 text-sm"><Hash className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">{t('docs.studentId')}</p><p className="font-mono font-medium">{caseItem.studentId}</p></div></div>
                    <div className="flex items-center gap-2 text-sm"><Building2 className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">{t('specialCases.department')}</p><p className="font-medium">{caseItem.department}</p></div></div>
                    <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">{t('recruitment.country')}</p><p className="font-medium">{caseItem.country}</p></div></div>
                  </div>

                  {/* Risk & Resolution for AI cases */}
                  {caseItem.riskLevel && (
                    <div className="flex flex-wrap gap-3">
                      <Badge variant="outline" className={getRiskColor(caseItem.riskLevel)}>
                        <TriangleAlert className="h-3 w-3 mr-1" />Risk: {caseItem.riskLevel}
                      </Badge>
                      {caseItem.estimatedResolutionTime && (
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                          <Timer className="h-3 w-3 mr-1" />{caseItem.estimatedResolutionTime}
                        </Badge>
                      )}
                    </div>
                  )}

                  {/* Case details */}
                  <div>
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-2"><FileWarning className="h-4 w-4 text-primary" />{t('specialCases.caseDetails')}</h4>
                    <div className="bg-muted/30 p-4 rounded-lg space-y-3">
                      <div className="space-y-1"><span className="text-xs font-medium text-muted-foreground uppercase">{t('specialCases.issue')}</span><p className="text-sm">{caseItem.summary}</p></div>
                      <div className="space-y-1"><span className="text-xs font-medium text-muted-foreground uppercase">{t('specialCases.requiredAction')}</span><p className="text-sm text-muted-foreground whitespace-pre-wrap">{caseItem.details}</p></div>
                    </div>
                  </div>

                  {/* Timeline */}
                  <div>
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-3"><Clock className="h-4 w-4 text-primary" />{t('specialCases.progressTimeline')}</h4>
                    <div className="relative pl-4 border-l border-border space-y-6">
                      {caseItem.steps.map((step, idx) => (
                        <div key={idx} className="relative">
                          <div className={`absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 bg-background ${step.status === 'completed' ? 'border-green-500 bg-green-500' : step.status === 'in_progress' ? 'border-primary animate-pulse' : step.status === 'blocked' ? 'border-red-500' : 'border-muted-foreground'}`} />
                          <div className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className={`text-sm font-medium ${step.status === 'completed' ? 'text-foreground' : step.status === 'in_progress' ? 'text-primary' : 'text-muted-foreground'}`}>{step.title}</span>
                              <div className="flex items-center gap-2">
                                {step.estimatedDuration && <Badge variant="outline" className="text-xs"><Timer className="h-3 w-3 mr-1" />{step.estimatedDuration}</Badge>}
                                {step.date && <span className="text-xs text-muted-foreground">{step.date}</span>}
                              </div>
                            </div>
                            <p className="text-xs text-muted-foreground">{step.description}</p>
                            {step.notes && <div className="mt-1 text-xs bg-muted/50 p-2 rounded border border-border/50 text-muted-foreground"><span className="font-medium mr-1">Note:</span>{step.notes}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Recommendations for AI cases */}
                  {caseItem.recommendations && caseItem.recommendations.length > 0 && (
                    <Card className="bg-primary/5 border-primary/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2"><Lightbulb className="h-4 w-4 text-primary" />Recommendations</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="text-sm space-y-1.5">
                          {caseItem.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary shrink-0 mt-0.5" /><span>{rec}</span></li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          )) : <div className="text-center py-12 text-muted-foreground">{t('specialCases.noCasesFound')}</div>}
        </Accordion>
      </ScrollArea>
    </div>
  );
}
