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
    details: 'Student was admitted conditionally with a WAEC SSCE certificate showing a D7 in Mathematics. Turkish Denklik requires minimum credit (C6 or higher) in core subjects. Student must retake the Mathematics paper through WAEC and submit updated results for Denklik re-evaluation. Conditional enrollment allows the student to attend classes but cannot receive a final diploma until resolved.',
    steps: [{ title: 'Identify deficient subject', description: 'Review WAEC results against Denklik requirements.', status: 'completed', date: '2023-10-01', notes: 'Mathematics D7 identified as below minimum requirement.' }, { title: 'Register for WAEC re-sit examination', description: 'Register for the next available WAEC examination session for Mathematics.', status: 'completed', date: '2023-11-15', notes: 'Registered for May/June 2024 session via WAEC Nigeria.' }, { title: 'Sit for Mathematics re-examination', description: 'Take the WAEC Mathematics paper.', status: 'completed', date: '2024-06-10', notes: 'Exam completed. Results pending (typically 6-8 weeks).' }, { title: 'Receive and verify updated WAEC results', description: 'Obtain new results and verify through WAEC online portal.', status: 'in_progress', date: '2024-08-20', notes: 'Results released: B3 in Mathematics. Awaiting confirmation letter from WAEC.' }, { title: 'Re-authenticate documents with new results', description: 'Get updated WAEC certificate authenticated (Federal Ministry of Education, MOFA, Turkish Consulate).', status: 'pending' }, { title: 'Submit updated Denklik application', description: 'Resubmit Denklik application with corrected Mathematics grade.', status: 'pending' }, { title: 'Receive updated Denklik and lift conditional status', description: 'Upon approval, conditional enrollment status will be lifted.', status: 'pending' }], createdAt: '2023-09-20', lastUpdated: '2024-08-20',
  },
  {
    id: 'sc-005', studentName: 'Ali Reza Mohammadi', studentId: '20241300007', department: 'Dentistry', departmentCode: '1300', enrollmentYear: 2024, country: 'Iran', category: 'credential_recognition', categoryLabelKey: 'specialCases.credentialRecognition', status: 'in_progress',
    summary: 'Iranian student has pre-university diploma (Diplom-e Pish-Daneshgahi) which was phased out in Iran. Verification of educational equivalency needed.',
    details: 'Iran reformed its education system in 2019, replacing the 3+1 system (3 years secondary + 1 year pre-university) with a unified 3-year system. This student graduated under the old system with a Diplom-e Pish-Daneshgahi. While Iran is now a Hague Convention member, the old-format diploma requires additional verification steps to confirm it meets current standards.',
    steps: [{ title: 'Collect original diploma and transcripts', description: 'Gather Diplom-e Motevasseteh and Diplom-e Pish-Daneshgahi with all transcripts.', status: 'completed', date: '2024-09-01' }, { title: 'Apostille from Iranian Ministry of Justice', description: 'Since Iran joined the Hague Convention, get Apostille stamp.', status: 'completed', date: '2024-09-15', notes: 'Apostille obtained successfully.' }, { title: 'Sworn translation to Turkish', description: 'All documents translated by sworn translator in Turkey.', status: 'completed', date: '2024-09-25' }, { title: 'Apply for Denklik with old-system explanation', description: 'Submit Denklik application with cover letter explaining the old vs new Iranian education system.', status: 'in_progress', date: '2024-10-05', notes: 'MEB requested additional clarification on pre-university certificate validity.' }, { title: 'Provide supplementary verification from Iran', description: 'Obtain official letter from Iranian Ministry of Education confirming diploma validity under old system.', status: 'pending' }, { title: 'Receive Denklik approval', description: 'Await final Denklik decision.', status: 'pending' }], createdAt: '2024-08-25', lastUpdated: '2024-10-10',
  },
  {
    id: 'sc-006', studentName: 'Yusuf Ahmed Hassan', studentId: '20241900004', department: 'Civil Engineering', departmentCode: '1900', enrollmentYear: 2024, country: 'Yemen', category: 'war_zone', categoryLabelKey: 'specialCases.warZone', status: 'in_progress',
    summary: 'Yemeni student has Thanaweya Amma certificate but cannot obtain MOFA attestation due to ongoing conflict and divided government.',
    details: 'Yemen has two competing governments (Sanaa and Aden), making document authentication extremely difficult. The student graduated from a school in Sanaa-controlled territory. The MOFA in Sanaa is not internationally recognized, and the Aden-based government cannot verify Sanaa-issued documents. Alternative authentication path through Yemeni Embassy in Ankara is being pursued.',
    steps: [{ title: 'Verify original Thanaweya Amma certificate', description: 'Confirm authenticity of the certificate issued by Sanaa Ministry of Education.', status: 'completed', date: '2024-08-10', notes: 'Original certificate appears genuine with proper stamps from Sanaa MOE.' }, { title: 'Contact Yemeni Embassy in Ankara', description: 'Request alternative authentication through the embassy.', status: 'completed', date: '2024-08-25', notes: 'Embassy agreed to provide verification letter as alternative to MOFA.' }, { title: 'Obtain embassy verification letter', description: 'Receive official verification from Yemeni Embassy.', status: 'in_progress', date: '2024-09-15', notes: 'Letter in processing. Embassy estimates 3-4 weeks.' }, { title: 'Sworn translation', description: 'Translate all documents from Arabic to Turkish.', status: 'completed', date: '2024-09-05' }, { title: 'Submit Denklik with embassy verification', description: 'File Denklik application using embassy letter in lieu of standard MOFA attestation.', status: 'pending' }, { title: 'Receive Denklik and finalize enrollment', description: 'Complete the enrollment process.', status: 'pending' }], createdAt: '2024-08-01', lastUpdated: '2024-09-15',
  },
  {
    id: 'sc-007', studentName: 'Priya Sharma', studentId: '20231400009', department: 'Architecture', departmentCode: '1400', enrollmentYear: 2023, country: 'India', category: 'academic_failure', categoryLabelKey: 'specialCases.academicFailure', status: 'resolved',
    summary: 'Indian student with ISC certificate had apostille rejected due to incorrect MEA procedure. Documents re-processed successfully.',
    details: 'Student submitted ISC (Indian School Certificate) with apostille from MEA India. However, the apostille was rejected by Turkish authorities because it was obtained through an unauthorized agent and the apostille number could not be verified on the MEA portal. Student had to re-apply through the official MEA e-Apostille portal and obtain a fresh apostille.',
    steps: [{ title: 'Identify apostille verification failure', description: 'Turkish MEB reported apostille number not found in MEA database.', status: 'completed', date: '2023-11-01', notes: 'MEB rejection letter received citing unverifiable apostille.' }, { title: 'Re-apply through official MEA e-Apostille portal', description: 'Submit fresh apostille application through apostille.mea.gov.in.', status: 'completed', date: '2023-11-20', notes: 'Applied online. Documents sent to MEA Delhi.' }, { title: 'Receive new apostille', description: 'Collect newly apostilled documents from MEA.', status: 'completed', date: '2023-12-15', notes: 'New apostille received. Verification confirmed on MEA portal.' }, { title: 'Resubmit to MEB for Denklik', description: 'Submit updated documents with valid apostille.', status: 'completed', date: '2024-01-05' }, { title: 'Denklik approved', description: 'Denklik certificate issued.', status: 'completed', date: '2024-02-10', notes: 'Case resolved. Student fully enrolled.' }], createdAt: '2023-10-15', lastUpdated: '2024-02-10',
  },
  {
    id: 'sc-008', studentName: 'Mohammed Al-Rashidi', studentId: '20241100006', department: 'Business Administration', departmentCode: '1100', enrollmentYear: 2024, country: 'Iraq', category: 'credential_recognition', categoryLabelKey: 'specialCases.credentialRecognition', status: 'in_progress',
    summary: 'Iraqi student from Kurdistan Region (KRG) has preparatory certificate issued by KRG Ministry of Education. Authentication path differs from federal Iraqi documents.',
    details: 'The Kurdistan Region of Iraq (KRG) has its own Ministry of Education that issues separate educational certificates. While both federal Iraqi and KRG documents are accepted in Turkey, the authentication process differs. KRG documents go through KRG Ministry of Education and KRG Ministry of Foreign Affairs, not the federal Iraqi authorities. This creates confusion during the Denklik process.',
    steps: [{ title: 'Collect KRG preparatory certificate', description: 'Original certificate from KRG Ministry of Education.', status: 'completed', date: '2024-09-01' }, { title: 'KRG Ministry of Education verification', description: 'Verify through KRG MOE in Erbil.', status: 'completed', date: '2024-09-15', notes: 'Verified successfully through KRG MOE.' }, { title: 'KRG Ministry of Foreign Affairs attestation', description: 'Authenticate through KRG MOFA (not federal MOFA).', status: 'completed', date: '2024-09-28' }, { title: 'Turkish Consulate in Erbil attestation', description: 'Get attestation from Turkish Consulate in Erbil.', status: 'in_progress', date: '2024-10-10', notes: 'Appointment scheduled for next week.' }, { title: 'Sworn translation', description: 'Translate from Kurdish/Arabic to Turkish.', status: 'pending' }, { title: 'Submit Denklik application', description: 'File Denklik with explanation of KRG vs federal Iraqi system.', status: 'pending' }], createdAt: '2024-08-20', lastUpdated: '2024-10-10',
  },
  {
    id: 'sc-009', studentName: 'Chen Wei', studentId: '20242000008', department: 'Industrial Engineering', departmentCode: '2000', enrollmentYear: 2024, country: 'China', category: 'credential_recognition', categoryLabelKey: 'specialCases.credentialRecognition', status: 'pending_documents',
    summary: 'Chinese student Gaokao scores are insufficient for direct admission. Needs CHESICC verification and supplementary documentation for Denklik.',
    details: 'Student has a Gaozhong (senior high school) diploma and Gaokao scores. However, the Gaokao score is from a highly competitive province (Henan) and appears low relative to admission standards. CHESICC verification of the diploma is required, and the student must provide additional context about provincial scoring differences. The Denklik process for Chinese documents requires MOFA China attestation since China is not a Hague Convention member.',
    steps: [{ title: 'Obtain CHESICC verification report', description: 'Verify diploma through China Higher Education Student Information Center.', status: 'completed', date: '2024-09-10', notes: 'CHESICC report obtained confirming diploma authenticity.' }, { title: 'MOFA China attestation', description: 'Authenticate documents through Chinese Ministry of Foreign Affairs.', status: 'in_progress', date: '2024-09-25', notes: 'Documents submitted to MOFA Beijing office.' }, { title: 'Turkish Consulate attestation', description: 'Get attestation from Turkish Consulate in Beijing/Shanghai.', status: 'pending' }, { title: 'Sworn translation (Chinese to Turkish)', description: 'All documents require sworn translation.', status: 'pending' }, { title: 'Submit Denklik application', description: 'File application with supporting Gaokao context.', status: 'pending' }], createdAt: '2024-09-01', lastUpdated: '2024-09-25',
  },
  {
    id: 'sc-010', studentName: 'Amina Diallo', studentId: '20241700010', department: 'Psychology', departmentCode: '1700', enrollmentYear: 2024, country: 'Senegal', category: 'credential_recognition', categoryLabelKey: 'specialCases.credentialRecognition', status: 'open',
    summary: 'Senegalese Baccalaureat is in French. Requires full sworn translation chain and verification through Academie regionale.',
    details: 'Senegal follows the French education system. The Baccalaureat Senegalais is issued in French and requires sworn translation to Turkish. Since Senegal is not a Hague Convention member, full consular authentication chain is required (Ministry of Education Senegal > MOFA Senegal > Turkish Consulate in Dakar). The French-language grading system (0-20 scale) needs conversion for Turkish Denklik evaluation.',
    steps: [{ title: 'Collect original Baccalaureat and relevee de notes', description: 'Gather original diploma and detailed grade transcript (releve de notes).', status: 'completed', date: '2024-10-01' }, { title: 'Academie regionale verification', description: 'Verify documents through the regional education authority in Senegal.', status: 'pending' }, { title: 'Ministry of Education Senegal attestation', description: 'Get attestation from central Ministry of Education.', status: 'pending' }, { title: 'MOFA Senegal attestation', description: 'Authenticate through Ministry of Foreign Affairs.', status: 'pending' }, { title: 'Turkish Consulate in Dakar attestation', description: 'Final consular attestation.', status: 'pending' }, { title: 'Sworn translation (French to Turkish)', description: 'All documents translated by sworn translator and notarized.', status: 'pending' }, { title: 'Submit Denklik application', description: 'File Denklik with grade conversion documentation.', status: 'pending' }], createdAt: '2024-09-28', lastUpdated: '2024-10-01',
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
