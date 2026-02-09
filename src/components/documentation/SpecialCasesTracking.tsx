import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { AlertTriangle, Search, FileWarning, ShieldAlert, Clock, CheckCircle2, CircleDot, ArrowRight, MapPin, BookOpen, User, Hash, Building2, Flag } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

type CaseCategory = 'credential_recognition' | 'academic_failure' | 'war_zone' | 'visa_issue' | 'other';
type CaseStatus = 'open' | 'in_progress' | 'pending_documents' | 'resolved' | 'escalated';
type StepStatus = 'completed' | 'in_progress' | 'pending' | 'blocked';

interface CaseStep { title: string; description: string; status: StepStatus; date?: string; notes?: string; }
interface SpecialCase { id: string; studentName: string; studentId: string; department: string; departmentCode: string; enrollmentYear: number; country: string; category: CaseCategory; categoryLabelKey: string; status: CaseStatus; summary: string; details: string; steps: CaseStep[]; createdAt: string; lastUpdated: string; }

const SPECIAL_CASES: SpecialCase[] = [
  {
    id: 'sc-001', studentName: 'Aung Kyaw Min', studentId: '20241500001', department: 'Computer Engineering', departmentCode: '1500', enrollmentYear: 2024, country: 'Myanmar', category: 'credential_recognition', categoryLabelKey: 'specialCases.credentialRecognition', status: 'in_progress',
    summary: 'Myanmar student completed GED which is not recognized as formal high school completion in Turkey. Denklik (equivalency) process required.',
    details: 'The student obtained a GED (General Educational Development) certificate from Myanmar. Under Turkish YÖK regulations, GED is not accepted as an equivalent to a Turkish high school diploma (Lise Diploması). The student needs to go through the Denklik process at the İl Milli Eğitim Müdürlüğü. However, since GED is not a standard diploma, the case has been escalated to the central MEB office in Ankara for a special evaluation. The student may need to sit for additional proficiency exams or provide supplementary documentation proving completion of specific subject areas equivalent to the Turkish curriculum.',
    steps: [{ title: 'Collect original GED certificate & transcripts', description: 'Gather all original GED scores and any supplementary academic records from Myanmar.', status: 'completed', date: '2024-09-15', notes: 'All 4 subject scores received. Student passed with above-average marks.' }, { title: 'Apostille/Authentication of GED documents', description: 'Since Myanmar is not part of the Hague Convention, documents need consular authentication through the Myanmar Embassy and Turkish Consulate.', status: 'completed', date: '2024-10-02', notes: 'Authentication completed via Myanmar Embassy in Ankara.' }, { title: 'Turkish sworn translation (Noter tasdikli)', description: 'All documents must be translated by a sworn translator and notarized.', status: 'completed', date: '2024-10-10' }, { title: 'Apply to İl Milli Eğitim Müdürlüğü for Denklik', description: 'Submit denklik application. Since GED is non-standard, the local office may refer the case to MEB Ankara.', status: 'in_progress', date: '2024-10-20', notes: 'Application submitted. Local office forwarded to MEB central for evaluation. Waiting period: 4-8 weeks.' }, { title: 'MEB Central evaluation & possible exam requirement', description: 'MEB Ankara will evaluate whether GED meets Turkish standards. Student may be required to take supplementary exams in specific subjects.', status: 'pending' }, { title: 'Receive Denklik certificate', description: 'If approved, denklik certificate will be issued allowing formal enrollment.', status: 'pending' }, { title: 'Complete university enrollment with Denklik', description: 'Submit denklik to student affairs to finalize enrollment.', status: 'pending' }], createdAt: '2024-09-10', lastUpdated: '2024-10-20',
  },
];

const getCategoryIcon = (category: CaseCategory) => {
  switch (category) {
    case 'credential_recognition': return <FileWarning className="h-4 w-4" />;
    case 'academic_failure': return <BookOpen className="h-4 w-4" />;
    case 'war_zone': return <ShieldAlert className="h-4 w-4" />;
    default: return <AlertTriangle className="h-4 w-4" />;
  }
};

const getCategoryColor = (category: CaseCategory) => {
  switch (category) {
    case 'credential_recognition': return 'bg-amber-500/10 text-amber-700 border-amber-500/30';
    case 'academic_failure': return 'bg-orange-500/10 text-orange-700 border-orange-500/30';
    case 'war_zone': return 'bg-red-500/10 text-red-700 border-red-500/30';
    default: return 'bg-muted text-muted-foreground';
  }
};

export function SpecialCasesTracking() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredCases = SPECIAL_CASES.filter(c => {
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

  const totalCases = SPECIAL_CASES.length;
  const warZoneCases = SPECIAL_CASES.filter(c => c.category === 'war_zone').length;
  const credentialCases = SPECIAL_CASES.filter(c => c.category === 'credential_recognition').length;
  const academicCases = SPECIAL_CASES.filter(c => c.category === 'academic_failure').length;
  const escalatedCases = SPECIAL_CASES.filter(c => c.status === 'escalated').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-foreground">{totalCases}</div><p className="text-xs text-muted-foreground mt-1">{t('specialCases.activeCases')}</p></CardContent></Card>
        <Card className="border-red-500/20"><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-red-600">{warZoneCases}</div><p className="text-xs text-muted-foreground mt-1">{t('specialCases.warZone')}</p></CardContent></Card>
        <Card className="border-amber-500/20"><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-amber-600">{credentialCases}</div><p className="text-xs text-muted-foreground mt-1">{t('specialCases.credentialRecognition')}</p></CardContent></Card>
        <Card className="border-orange-500/20"><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-orange-600">{academicCases}</div><p className="text-xs text-muted-foreground mt-1">{t('specialCases.academicFailure')}</p></CardContent></Card>
        <Card className="border-red-500/20"><CardContent className="p-4 text-center"><div className="text-2xl font-bold text-red-600">{escalatedCases}</div><p className="text-xs text-muted-foreground mt-1">{t('specialCases.escalated')}</p></CardContent></Card>
      </div>

      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input placeholder={t('specialCases.searchPlaceholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" /></div></div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}><SelectTrigger className="w-[200px]"><SelectValue placeholder={t('common.type')} /></SelectTrigger><SelectContent><SelectItem value="all">{t('specialCases.allCategories')}</SelectItem><SelectItem value="credential_recognition">{t('specialCases.credentialRecognition')}</SelectItem><SelectItem value="academic_failure">{t('specialCases.academicFailure')}</SelectItem><SelectItem value="war_zone">{t('specialCases.warZone')}</SelectItem></SelectContent></Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}><SelectTrigger className="w-[180px]"><SelectValue placeholder={t('common.status')} /></SelectTrigger><SelectContent><SelectItem value="all">{t('specialCases.allStatuses')}</SelectItem><SelectItem value="open">{t('specialCases.open')}</SelectItem><SelectItem value="in_progress">{t('specialCases.inProgress')}</SelectItem><SelectItem value="pending_documents">{t('specialCases.pendingDocuments')}</SelectItem><SelectItem value="resolved">{t('specialCases.resolved')}</SelectItem><SelectItem value="escalated">{t('specialCases.escalated')}</SelectItem></SelectContent></Select>
      </div>

      <ScrollArea className="h-[800px] pr-2">
        <Accordion type="multiple" className="space-y-3">
          {filteredCases.length > 0 ? filteredCases.map((caseItem) => (
            <AccordionItem key={caseItem.id} value={caseItem.id} className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/30">
                <div className="flex items-start gap-4 text-left w-full pr-4">
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">{getCategoryIcon(caseItem.category)}</div>
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap"><span className="font-semibold text-foreground">{caseItem.studentName}</span><Badge variant="outline" className={getCategoryColor(caseItem.category)}>{t(caseItem.categoryLabelKey)}</Badge>{getStatusBadge(caseItem.status)}</div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap"><span className="flex items-center gap-1"><Hash className="h-3 w-3" />{caseItem.studentId}</span><span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{caseItem.department}</span><span className="flex items-center gap-1"><Flag className="h-3 w-3" />{caseItem.country}</span></div>
                    <p className="text-sm text-muted-foreground line-clamp-1">{caseItem.summary}</p>
                  </div>
                  <div className="text-right shrink-0 hidden md:block"><div className="flex items-center gap-2"><Progress value={getProgress(caseItem.steps)} className="w-20 h-2" /><span className="text-sm font-medium w-10 text-right">{getProgress(caseItem.steps)}%</span></div></div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="px-5 pb-5">
                <div className="space-y-5">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2 text-sm"><User className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">{t('docs.studentName')}</p><p className="font-medium">{caseItem.studentName}</p></div></div>
                    <div className="flex items-center gap-2 text-sm"><Hash className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">{t('docs.studentId')}</p><p className="font-mono font-medium">{caseItem.studentId}</p></div></div>
                    <div className="flex items-center gap-2 text-sm"><Building2 className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">{t('specialCases.department')}</p><p className="font-medium">{caseItem.department}</p></div></div>
                    <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">{t('recruitment.country')}</p><p className="font-medium">{caseItem.country}</p></div></div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-2"><FileWarning className="h-4 w-4 text-primary" />{t('specialCases.caseDetails')}</h4>
                    <div className="bg-muted/30 p-4 rounded-lg space-y-3"><div className="space-y-1"><span className="text-xs font-medium text-muted-foreground uppercase">{t('specialCases.issue')}</span><p className="text-sm">{caseItem.summary}</p></div><div className="space-y-1"><span className="text-xs font-medium text-muted-foreground uppercase">{t('specialCases.requiredAction')}</span><p className="text-sm text-muted-foreground">{caseItem.details}</p></div></div>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold flex items-center gap-2 mb-3"><Clock className="h-4 w-4 text-primary" />{t('specialCases.progressTimeline')}</h4>
                    <div className="relative pl-4 border-l border-border space-y-6">
                      {caseItem.steps.map((step, idx) => (
                        <div key={idx} className="relative">
                          <div className={`absolute -left-[21px] top-1 h-3 w-3 rounded-full border-2 bg-background ${step.status === 'completed' ? 'border-green-500 bg-green-500' : step.status === 'in_progress' ? 'border-primary animate-pulse' : 'border-muted-foreground'}`} />
                          <div className="space-y-1"><div className="flex items-center justify-between"><span className={`text-sm font-medium ${step.status === 'completed' ? 'text-foreground' : step.status === 'in_progress' ? 'text-primary' : 'text-muted-foreground'}`}>{step.title}</span>{step.date && <span className="text-xs text-muted-foreground">{step.date}</span>}</div><p className="text-xs text-muted-foreground">{step.description}</p>{step.notes && <div className="mt-1 text-xs bg-muted/50 p-2 rounded border border-border/50 text-muted-foreground"><span className="font-medium mr-1">Note:</span>{step.notes}</div>}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          )) : <div className="text-center py-12 text-muted-foreground">{t('specialCases.noCasesFound')}</div>}
        </Accordion>
      </ScrollArea>
    </div>
  );
}
