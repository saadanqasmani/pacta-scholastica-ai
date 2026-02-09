import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import {
  AlertTriangle,
  Search,
  GraduationCap,
  FileWarning,
  ShieldAlert,
  Clock,
  CheckCircle2,
  CircleDot,
  ArrowRight,
  MapPin,
  BookOpen,
  User,
  Hash,
  Building2,
  Flag,
} from 'lucide-react';

// Department codes
const DEPARTMENT_CODES: Record<string, { code: string; name: string }> = {
  'medicine': { code: '1100', name: 'Medicine (English)' },
  'medicine_tr': { code: '1101', name: 'Medicine (Turkish)' },
  'dentistry': { code: '1200', name: 'Dentistry' },
  'pharmacy': { code: '1300', name: 'Pharmacy' },
  'nursing': { code: '1400', name: 'Nursing' },
  'computer_eng': { code: '1500', name: 'Computer Engineering' },
  'electrical_eng': { code: '1501', name: 'Electrical Engineering' },
  'civil_eng': { code: '1502', name: 'Civil Engineering' },
  'mechanical_eng': { code: '1503', name: 'Mechanical Engineering' },
  'architecture': { code: '1600', name: 'Architecture' },
  'business_admin': { code: '1700', name: 'Business Administration' },
  'economics': { code: '1701', name: 'Economics' },
  'law': { code: '1800', name: 'Law' },
  'psychology': { code: '1900', name: 'Psychology' },
  'int_relations': { code: '2000', name: 'International Relations' },
};

type CaseCategory = 'credential_recognition' | 'academic_failure' | 'war_zone' | 'visa_issue' | 'other';
type CaseStatus = 'open' | 'in_progress' | 'pending_documents' | 'resolved' | 'escalated';
type StepStatus = 'completed' | 'in_progress' | 'pending' | 'blocked';

interface CaseStep {
  title: string;
  description: string;
  status: StepStatus;
  date?: string;
  notes?: string;
}

interface SpecialCase {
  id: string;
  studentName: string;
  studentId: string;
  department: string;
  departmentCode: string;
  enrollmentYear: number;
  country: string;
  category: CaseCategory;
  categoryLabel: string;
  status: CaseStatus;
  summary: string;
  details: string;
  steps: CaseStep[];
  createdAt: string;
  lastUpdated: string;
}

// Sample special cases data
const SPECIAL_CASES: SpecialCase[] = [
  {
    id: 'sc-001',
    studentName: 'Aung Kyaw Min',
    studentId: '20241500001',
    department: 'Computer Engineering',
    departmentCode: '1500',
    enrollmentYear: 2024,
    country: 'Myanmar',
    category: 'credential_recognition',
    categoryLabel: 'GED Not Recognized',
    status: 'in_progress',
    summary: 'Myanmar student completed GED which is not recognized as formal high school completion in Turkey. Denklik (equivalency) process required.',
    details: 'The student obtained a GED (General Educational Development) certificate from Myanmar. Under Turkish YÖK regulations, GED is not accepted as an equivalent to a Turkish high school diploma (Lise Diploması). The student needs to go through the Denklik process at the İl Milli Eğitim Müdürlüğü. However, since GED is not a standard diploma, the case has been escalated to the central MEB office in Ankara for a special evaluation. The student may need to sit for additional proficiency exams or provide supplementary documentation proving completion of specific subject areas equivalent to the Turkish curriculum.',
    steps: [
      { title: 'Collect original GED certificate & transcripts', description: 'Gather all original GED scores and any supplementary academic records from Myanmar.', status: 'completed', date: '2024-09-15', notes: 'All 4 subject scores received. Student passed with above-average marks.' },
      { title: 'Apostille/Authentication of GED documents', description: 'Since Myanmar is not part of the Hague Convention, documents need consular authentication through the Myanmar Embassy and Turkish Consulate.', status: 'completed', date: '2024-10-02', notes: 'Authentication completed via Myanmar Embassy in Ankara.' },
      { title: 'Turkish sworn translation (Noter tasdikli)', description: 'All documents must be translated by a sworn translator and notarized.', status: 'completed', date: '2024-10-10' },
      { title: 'Apply to İl Milli Eğitim Müdürlüğü for Denklik', description: 'Submit denklik application. Since GED is non-standard, the local office may refer the case to MEB Ankara.', status: 'in_progress', date: '2024-10-20', notes: 'Application submitted. Local office forwarded to MEB central for evaluation. Waiting period: 4-8 weeks.' },
      { title: 'MEB Central evaluation & possible exam requirement', description: 'MEB Ankara will evaluate whether GED meets Turkish standards. Student may be required to take supplementary exams in specific subjects.', status: 'pending' },
      { title: 'Receive Denklik certificate', description: 'If approved, denklik certificate will be issued allowing formal enrollment.', status: 'pending' },
      { title: 'Complete university enrollment with Denklik', description: 'Submit denklik to student affairs to finalize enrollment.', status: 'pending' },
    ],
    createdAt: '2024-09-10',
    lastUpdated: '2024-10-20',
  },
  {
    id: 'sc-002',
    studentName: 'Thandar Oo',
    studentId: '20241100002',
    department: 'Medicine (English)',
    departmentCode: '1100',
    enrollmentYear: 2024,
    country: 'Myanmar',
    category: 'credential_recognition',
    categoryLabel: 'GED Not Recognized',
    status: 'pending_documents',
    summary: 'Myanmar student with GED applying for Medicine. Additional challenge: Medical programs require higher credential scrutiny from YÖK.',
    details: 'Similar GED recognition issue but compounded by the fact that medical programs have stricter entry requirements under YÖK. The student has strong GED scores but needs both Denklik and a YÖK letter confirming eligibility for medical enrollment. The student is currently attending Turkish language preparatory classes while the case is being processed.',
    steps: [
      { title: 'Collect original GED certificate & transcripts', description: 'Gather GED scores and supplementary records.', status: 'completed', date: '2024-09-20' },
      { title: 'Apostille/Authentication via Myanmar Embassy', description: 'Consular authentication required.', status: 'completed', date: '2024-10-08' },
      { title: 'Sworn translation & notarization', description: 'Turkish certified translation needed.', status: 'completed', date: '2024-10-15' },
      { title: 'Apply for Denklik at İl Milli Eğitim', description: 'Denklik application for GED.', status: 'in_progress', date: '2024-10-25', notes: 'Referred to MEB Ankara. Similar timeline as case sc-001.' },
      { title: 'Request YÖK eligibility letter for Medicine', description: 'Additional YÖK approval required specifically for medical faculty enrollment with GED-based credentials.', status: 'pending' },
      { title: 'Complete medical program enrollment', description: 'Finalize enrollment pending both Denklik and YÖK clearance.', status: 'pending' },
    ],
    createdAt: '2024-09-18',
    lastUpdated: '2024-10-25',
  },
  {
    id: 'sc-003',
    studentName: 'James Okonkwo',
    studentId: '20231700003',
    department: 'Business Administration',
    departmentCode: '1700',
    enrollmentYear: 2023,
    country: 'Nigeria',
    category: 'academic_failure',
    categoryLabel: 'Cambridge A-Level Failure',
    status: 'in_progress',
    summary: 'Cambridge A-Level student received 1 D and 1 E grade. Does not meet minimum requirements for continued enrollment. Requires academic remediation plan.',
    details: 'The student completed Cambridge International A-Levels but achieved only a D in Business Studies and E in Economics. Turkish universities typically require minimum C grades in A-Level subjects for the credential to be considered equivalent to a Turkish high school diploma with university eligibility. The Denklik office may reject the equivalency or issue a conditional denklik. The student needs to either: (1) Retake the A-Level exams in the next session (May/June or Oct/Nov), (2) Enroll in a foundation/preparatory year if the university offers one, or (3) Appeal through YÖK with supplementary evidence of academic capability.',
    steps: [
      { title: 'Academic evaluation by department', description: 'Department head reviews the case and determines if conditional enrollment is possible.', status: 'completed', date: '2023-11-05', notes: 'Department recommends student retake at least one subject to achieve minimum C grade.' },
      { title: 'Notify student of academic standing', description: 'Official letter sent to student explaining the situation and options.', status: 'completed', date: '2023-11-10' },
      { title: 'Register for Cambridge A-Level retake', description: 'Student must register for Oct/Nov or May/June exam session through British Council.', status: 'in_progress', date: '2024-01-15', notes: 'Student registered for May/June 2024 session. Retaking Business Studies.' },
      { title: 'Provide proof of exam registration', description: 'Student submits British Council registration confirmation to student affairs.', status: 'completed', date: '2024-02-01' },
      { title: 'Conditional enrollment status', description: 'Student allowed to attend classes conditionally pending retake results.', status: 'in_progress', notes: 'Student attending with conditional status. Must pass by end of academic year.' },
      { title: 'Receive retake results & update Denklik', description: 'Upon passing, update denklik application with new grades.', status: 'pending' },
      { title: 'Finalize full enrollment', description: 'Convert from conditional to full enrollment upon meeting requirements.', status: 'pending' },
    ],
    createdAt: '2023-10-28',
    lastUpdated: '2024-02-01',
  },
  {
    id: 'sc-004',
    studentName: 'Fatima Al-Rashid',
    studentId: '20241900004',
    department: 'Psychology',
    departmentCode: '1900',
    enrollmentYear: 2024,
    country: 'Syria',
    category: 'war_zone',
    categoryLabel: 'War Zone - Missing Documents',
    status: 'in_progress',
    summary: 'Syrian student cannot obtain original high school diploma or transcripts due to ongoing conflict. School records destroyed in Aleppo.',
    details: 'The student fled Syria in 2022 and her high school in Aleppo was destroyed during the conflict. She has no original diploma or transcripts. Under Turkish regulations for Syrian refugees, there are special provisions: (1) MEB can issue a Denklik based on a sworn statement (yemin beyanı) and any available partial records, (2) UNHCR documentation can be used as supplementary evidence, (3) The student may be asked to sit for a placement exam (seviye tespit sınavı) to verify academic level. The student currently has Temporary Protection Status (Geçici Koruma) in Turkey.',
    steps: [
      { title: 'Gather available partial documentation', description: 'Collect any photos of certificates, partial records, school ID cards, or any evidence of prior education.', status: 'completed', date: '2024-08-10', notes: 'Student has a photo of her 10th grade report card and a UNHCR education record.' },
      { title: 'Obtain sworn statement (Yemin Beyanı)', description: 'Student provides a notarized sworn statement about her educational history.', status: 'completed', date: '2024-08-20' },
      { title: 'UNHCR education verification letter', description: 'Request verification from UNHCR confirming the student\'s educational claims.', status: 'completed', date: '2024-09-05', notes: 'UNHCR provided verification letter confirming 11 years of education.' },
      { title: 'Apply for special Denklik under conflict provisions', description: 'Apply at İl Milli Eğitim with conflict zone documentation package.', status: 'in_progress', date: '2024-09-15', notes: 'Application submitted with UNHCR letter, sworn statement, and partial records. MEB processing under special provisions for Syrian nationals.' },
      { title: 'Placement exam (Seviye Tespit Sınavı) if required', description: 'MEB may require a placement exam to verify academic level.', status: 'pending' },
      { title: 'Receive Denklik & finalize enrollment', description: 'Complete enrollment process once Denklik is issued.', status: 'pending' },
    ],
    createdAt: '2024-08-05',
    lastUpdated: '2024-09-15',
  },
  {
    id: 'sc-005',
    studentName: 'Ahmad Hassan',
    studentId: '20231500005',
    department: 'Computer Engineering',
    departmentCode: '1500',
    enrollmentYear: 2023,
    country: 'Yemen',
    category: 'war_zone',
    categoryLabel: 'War Zone - Missing Documents',
    status: 'escalated',
    summary: 'Yemeni student has original diploma but it lacks apostille/authentication. Yemen embassies are non-functional in most countries, making authentication nearly impossible.',
    details: 'The student has his original high school diploma from Sana\'a but due to the Yemeni civil war, the embassy and consular services are barely functional. The diploma cannot be apostilled through normal channels. Options being explored: (1) Authentication through the Yemeni Embassy in Ankara (limited services), (2) Verification through the Yemeni Ministry of Education contacts (if reachable), (3) Alternative authentication through a third country where Yemen has functioning diplomatic presence (e.g., Oman, Jordan), (4) MEB special provisions similar to Syrian refugee process. This case has been escalated to YÖK for guidance.',
    steps: [
      { title: 'Attempt authentication via Yemeni Embassy Ankara', description: 'Contact Yemeni Embassy in Ankara for authentication services.', status: 'completed', date: '2023-10-01', notes: 'Embassy has limited staff. They acknowledged the diploma but cannot provide full authentication at this time.' },
      { title: 'Explore third-country authentication', description: 'Investigate whether Jordan or Oman Yemeni embassies can authenticate.', status: 'completed', date: '2023-11-15', notes: 'Jordan embassy can authenticate but requires physical presence. Student cannot travel due to visa restrictions.' },
      { title: 'Submit case to YÖK for special evaluation', description: 'Escalate to YÖK with all available documentation requesting waiver of full authentication.', status: 'in_progress', date: '2024-01-10', notes: 'YÖK acknowledged the case. Under review by international credentials committee.' },
      { title: 'Apply for MEB conflict zone provisions', description: 'Parallel application to MEB using war zone special provisions.', status: 'in_progress', date: '2024-02-01' },
      { title: 'Receive decision & finalize enrollment', description: 'Pending YÖK or MEB decision on credential acceptance.', status: 'pending' },
    ],
    createdAt: '2023-09-20',
    lastUpdated: '2024-02-01',
  },
  {
    id: 'sc-006',
    studentName: 'Omar Al-Bakri',
    studentId: '20241502006',
    department: 'Civil Engineering',
    departmentCode: '1502',
    enrollmentYear: 2024,
    country: 'Iraq',
    category: 'war_zone',
    categoryLabel: 'War Zone - Missing Transcripts',
    status: 'pending_documents',
    summary: 'Iraqi student from Mosul has diploma but transcripts were lost during ISIL occupation. School no longer exists.',
    details: 'The student graduated from a high school in Mosul that was destroyed during ISIL occupation (2014-2017). He managed to save his diploma but not the detailed transcripts. The Iraqi Ministry of Education has been rebuilding its records system but many pre-2017 Mosul school records are lost. Options: (1) Contact Iraqi MoE records department in Baghdad for any surviving digital records, (2) Obtain sworn statements from former teachers if they can be located, (3) Apply through the Iraqi Embassy in Ankara for a verification letter, (4) Use MEB special provisions for conflict-affected regions.',
    steps: [
      { title: 'Contact Iraqi MoE for surviving records', description: 'Request any available records from the Ministry of Education in Baghdad.', status: 'completed', date: '2024-07-20', notes: 'MoE confirmed partial digital records exist but retrieval takes 3-6 months.' },
      { title: 'Iraqi Embassy verification request', description: 'Request the Iraqi Embassy in Ankara to verify the diploma authenticity.', status: 'in_progress', date: '2024-08-10', notes: 'Embassy agreed to verify. Processing time: 6-8 weeks.' },
      { title: 'Sworn translation of available documents', description: 'Translate diploma and any partial records.', status: 'completed', date: '2024-08-25' },
      { title: 'Apply for Denklik with available documentation', description: 'Submit what is available and request special consideration.', status: 'pending' },
      { title: 'Finalize enrollment', description: 'Complete enrollment once Denklik is processed.', status: 'pending' },
    ],
    createdAt: '2024-07-15',
    lastUpdated: '2024-08-25',
  },
  {
    id: 'sc-007',
    studentName: 'Sarah Ibrahim',
    studentId: '20242000007',
    department: 'International Relations',
    departmentCode: '2000',
    enrollmentYear: 2024,
    country: 'Palestine',
    category: 'war_zone',
    categoryLabel: 'War Zone - Cannot Obtain Documents',
    status: 'escalated',
    summary: 'Palestinian student from Gaza. All educational institutions destroyed. Cannot contact any officials for document verification.',
    details: 'The student was in her final year of high school in Gaza when the current conflict began. She had completed all her coursework but had not yet received her formal diploma (Tawjihi). She evacuated to Egypt and then to Turkey. No educational institution in Gaza is currently operational to issue her certificate. Options being explored: (1) Palestinian Authority Ministry of Education (Ramallah) may have centralized records, (2) UNRWA education department may have records if she attended an UNRWA school, (3) Egyptian authorities may assist since she transited through Egypt, (4) Special YÖK provisions for active conflict zones, (5) Conditional enrollment pending future document availability.',
    steps: [
      { title: 'Contact Palestinian MoE (Ramallah) for records', description: 'Attempt to retrieve any centralized records from the PA Ministry of Education.', status: 'in_progress', date: '2024-03-01', notes: 'PA MoE confirmed they have partial records for Gaza schools but system is disrupted. Working on retrieval.' },
      { title: 'Contact UNRWA education department', description: 'Check if UNRWA has any educational records on file.', status: 'in_progress', date: '2024-03-10', notes: 'UNRWA confirmed the student attended their school. They are preparing a verification letter.' },
      { title: 'Obtain sworn statement & witness statements', description: 'Collect sworn declarations from the student and any available witnesses (former teachers, classmates).', status: 'completed', date: '2024-03-15' },
      { title: 'Escalate to YÖK for emergency provisions', description: 'Request YÖK emergency enrollment under active conflict provisions.', status: 'in_progress', date: '2024-03-20', notes: 'YÖK has been petitioned. Similar cases from Gaza are being reviewed collectively.' },
      { title: 'Conditional enrollment while case is processed', description: 'Request university to grant conditional enrollment pending document resolution.', status: 'pending' },
    ],
    createdAt: '2024-02-25',
    lastUpdated: '2024-03-20',
  },
  {
    id: 'sc-008',
    studentName: 'Priya Sharma',
    studentId: '20241200008',
    department: 'Dentistry',
    departmentCode: '1200',
    enrollmentYear: 2024,
    country: 'India',
    category: 'academic_failure',
    categoryLabel: 'Cambridge A-Level Insufficient Grades',
    status: 'in_progress',
    summary: 'Indian student with Cambridge A-Levels scored D in Biology and E in Chemistry. Cannot proceed with Dentistry enrollment without meeting minimum grade requirements.',
    details: 'The student completed Cambridge International A-Levels in India but received D in Biology and E in Chemistry. For dental programs, Turkish universities require evidence of strong science foundation. The Denklik office may issue only a general equivalency (not science-stream), which would prevent enrollment in Dentistry. The student has been advised to: (1) Retake the failed subjects in the next available Cambridge session, (2) Consider a foundation year if available, (3) Consider switching to a non-science program while retaking exams.',
    steps: [
      { title: 'Academic counseling session', description: 'Meet with academic advisor to discuss options.', status: 'completed', date: '2024-09-01', notes: 'Student insists on Dentistry. Will retake both Biology and Chemistry.' },
      { title: 'Register for Cambridge retake', description: 'Register for Oct/Nov 2024 session via British Council India.', status: 'completed', date: '2024-09-15', notes: 'Registered for both Biology and Chemistry retake.' },
      { title: 'Temporary enrollment in Turkish prep program', description: 'Student enrolled in Turkish language prep while waiting for retake results.', status: 'in_progress' },
      { title: 'Sit for A-Level retake examinations', description: 'Student takes Biology and Chemistry retake.', status: 'pending', notes: 'Scheduled for Oct 2024 session.' },
      { title: 'Receive results & reapply for Denklik', description: 'If grades improve to C or above, resubmit for science-stream Denklik.', status: 'pending' },
      { title: 'Finalize Dentistry enrollment', description: 'Complete enrollment upon satisfactory results.', status: 'pending' },
    ],
    createdAt: '2024-08-28',
    lastUpdated: '2024-09-15',
  },
  {
    id: 'sc-009',
    studentName: 'Mohammed Al-Sudani',
    studentId: '20241100009',
    department: 'Medicine (English)',
    departmentCode: '1100',
    enrollmentYear: 2024,
    country: 'Sudan',
    category: 'war_zone',
    categoryLabel: 'War Zone - Document Authentication Impossible',
    status: 'in_progress',
    summary: 'Sudanese student has diploma but cannot authenticate it. Sudanese embassies operating at minimal capacity due to civil war. No apostille services available.',
    details: 'The student graduated from high school in Khartoum before the April 2023 civil war. He has his original diploma and transcripts but the Sudanese Ministry of Foreign Affairs is non-operational for authentication/apostille services. The Sudanese Embassy in Ankara has limited capacity. The case is being handled through special war-zone provisions similar to the Yemeni and Syrian precedents.',
    steps: [
      { title: 'Attempt Sudanese Embassy authentication', description: 'Contact the Sudanese Embassy in Ankara.', status: 'completed', date: '2024-08-01', notes: 'Embassy confirmed limited services. Cannot fully authenticate but provided a letter confirming they recognize the school.' },
      { title: 'Collect supplementary evidence', description: 'Gather school website archives, any digital records, photos of school activities.', status: 'completed', date: '2024-08-15' },
      { title: 'Sworn translation & notarization', description: 'Translate all available documents.', status: 'completed', date: '2024-08-25' },
      { title: 'Apply to MEB under conflict provisions', description: 'Submit Denklik application with war-zone special consideration.', status: 'in_progress', date: '2024-09-01', notes: 'MEB reviewing. Similar cases being processed collectively for Sudanese nationals.' },
      { title: 'YÖK special eligibility for Medicine', description: 'Additional YÖK clearance needed for medical faculty.', status: 'pending' },
      { title: 'Finalize enrollment', description: 'Complete enrollment upon all clearances.', status: 'pending' },
    ],
    createdAt: '2024-07-25',
    lastUpdated: '2024-09-01',
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

const getStatusBadge = (status: CaseStatus) => {
  switch (status) {
    case 'open': return <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">Open</Badge>;
    case 'in_progress': return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">In Progress</Badge>;
    case 'pending_documents': return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30">Pending Documents</Badge>;
    case 'resolved': return <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30">Resolved</Badge>;
    case 'escalated': return <Badge variant="outline" className="bg-red-500/10 text-red-600 border-red-500/30">Escalated</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};

const getStepIcon = (status: StepStatus) => {
  switch (status) {
    case 'completed': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
    case 'in_progress': return <Clock className="h-4 w-4 text-primary animate-pulse" />;
    case 'pending': return <CircleDot className="h-4 w-4 text-muted-foreground" />;
    case 'blocked': return <AlertTriangle className="h-4 w-4 text-red-500" />;
  }
};

export function SpecialCasesTracking() {
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filteredCases = SPECIAL_CASES.filter(c => {
    const matchesSearch =
      c.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.studentId.includes(searchQuery) ||
      c.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.country.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || c.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getProgress = (steps: CaseStep[]) => {
    const completed = steps.filter(s => s.status === 'completed').length;
    return Math.round((completed / steps.length) * 100);
  };

  // Stats
  const totalCases = SPECIAL_CASES.length;
  const warZoneCases = SPECIAL_CASES.filter(c => c.category === 'war_zone').length;
  const credentialCases = SPECIAL_CASES.filter(c => c.category === 'credential_recognition').length;
  const academicCases = SPECIAL_CASES.filter(c => c.category === 'academic_failure').length;
  const escalatedCases = SPECIAL_CASES.filter(c => c.status === 'escalated').length;

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-foreground">{totalCases}</div>
            <p className="text-xs text-muted-foreground mt-1">Total Cases</p>
          </CardContent>
        </Card>
        <Card className="border-red-500/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{warZoneCases}</div>
            <p className="text-xs text-muted-foreground mt-1">War Zone Cases</p>
          </CardContent>
        </Card>
        <Card className="border-amber-500/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-amber-600">{credentialCases}</div>
            <p className="text-xs text-muted-foreground mt-1">Credential Issues</p>
          </CardContent>
        </Card>
        <Card className="border-orange-500/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{academicCases}</div>
            <p className="text-xs text-muted-foreground mt-1">Academic Failures</p>
          </CardContent>
        </Card>
        <Card className="border-red-500/20">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-red-600">{escalatedCases}</div>
            <p className="text-xs text-muted-foreground mt-1">Escalated to YÖK</p>
          </CardContent>
        </Card>
      </div>

      {/* Student ID Format Reference */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <Hash className="h-4 w-4 text-primary" />
            <span className="font-semibold text-sm">Student ID Format</span>
          </div>
          <div className="flex items-center gap-1 text-sm font-mono">
            <span className="bg-primary/10 text-primary px-2 py-1 rounded">2024</span>
            <span className="text-muted-foreground">Year</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground mx-1" />
            <span className="bg-accent/10 text-accent-foreground px-2 py-1 rounded">1500</span>
            <span className="text-muted-foreground">Department Code</span>
            <ArrowRight className="h-3 w-3 text-muted-foreground mx-1" />
            <span className="bg-secondary px-2 py-1 rounded">001</span>
            <span className="text-muted-foreground">Student Number</span>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, ID, department, or country..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="credential_recognition">Credential Recognition</SelectItem>
            <SelectItem value="academic_failure">Academic Failure</SelectItem>
            <SelectItem value="war_zone">War Zone</SelectItem>
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="open">Open</SelectItem>
            <SelectItem value="in_progress">In Progress</SelectItem>
            <SelectItem value="pending_documents">Pending Documents</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
            <SelectItem value="escalated">Escalated</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Case List */}
      <ScrollArea className="h-[800px] pr-2">
        <Accordion type="multiple" className="space-y-3">
          {filteredCases.map((caseItem) => (
            <AccordionItem key={caseItem.id} value={caseItem.id} className="border rounded-lg overflow-hidden">
              <AccordionTrigger className="px-5 py-4 hover:no-underline hover:bg-muted/30">
                <div className="flex items-start gap-4 text-left w-full pr-4">
                  {/* Avatar */}
                  <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                    {getCategoryIcon(caseItem.category)}
                  </div>

                  {/* Main Info */}
                  <div className="flex-1 min-w-0 space-y-1.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-foreground">{caseItem.studentName}</span>
                      <Badge variant="outline" className={getCategoryColor(caseItem.category)}>
                        {caseItem.categoryLabel}
                      </Badge>
                      {getStatusBadge(caseItem.status)}
                    </div>
                    <div className="flex items-center gap-3 text-sm text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Hash className="h-3 w-3" />
                        {caseItem.studentId}
                      </span>
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3 w-3" />
                        {caseItem.department}
                      </span>
                      <span className="flex items-center gap-1">
                        <Flag className="h-3 w-3" />
                        {caseItem.country}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-1">{caseItem.summary}</p>
                  </div>

                  {/* Progress */}
                  <div className="text-right shrink-0 hidden md:block">
                    <div className="flex items-center gap-2">
                      <Progress value={getProgress(caseItem.steps)} className="w-20 h-2" />
                      <span className="text-sm font-medium w-10 text-right">{getProgress(caseItem.steps)}%</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      {caseItem.steps.filter(s => s.status === 'completed').length}/{caseItem.steps.length} steps
                    </p>
                  </div>
                </div>
              </AccordionTrigger>

              <AccordionContent className="px-5 pb-5">
                <div className="space-y-5">
                  {/* Student Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-muted/30 rounded-lg">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Student</p>
                        <p className="font-medium">{caseItem.studentName}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Hash className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Student ID</p>
                        <p className="font-mono font-medium">{caseItem.studentId}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Department ({caseItem.departmentCode})</p>
                        <p className="font-medium">{caseItem.department}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-xs text-muted-foreground">Country</p>
                        <p className="font-medium">{caseItem.country}</p>
                      </div>
                    </div>
                  </div>

                  {/* Case Details */}
                  <div>
                    <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-primary" />
                      Case Details
                    </h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">{caseItem.details}</p>
                  </div>

                  <Separator />

                  {/* Progress Report - Timeline */}
                  <div>
                    <h4 className="font-semibold text-sm mb-4 flex items-center gap-2">
                      <Clock className="h-4 w-4 text-primary" />
                      Progress Report
                    </h4>
                    <div className="space-y-1">
                      {caseItem.steps.map((step, idx) => (
                        <div key={idx} className="flex gap-3">
                          {/* Timeline line */}
                          <div className="flex flex-col items-center">
                            <div className="mt-1">{getStepIcon(step.status)}</div>
                            {idx < caseItem.steps.length - 1 && (
                              <div className={`w-px flex-1 my-1 ${
                                step.status === 'completed' ? 'bg-green-500/40' : 'bg-border'
                              }`} />
                            )}
                          </div>
                          {/* Content */}
                          <div className="pb-5 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className={`font-medium text-sm ${
                                step.status === 'completed' ? 'text-foreground' :
                                step.status === 'in_progress' ? 'text-primary' :
                                'text-muted-foreground'
                              }`}>
                                {step.title}
                              </span>
                              {step.date && (
                                <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded">
                                  {step.date}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">{step.description}</p>
                            {step.notes && (
                              <div className="mt-2 p-2 bg-primary/5 border border-primary/10 rounded text-sm text-foreground">
                                <span className="font-medium">Note:</span> {step.notes}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Case metadata */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground pt-2 border-t">
                    <span>Case opened: {caseItem.createdAt}</span>
                    <span>Last updated: {caseItem.lastUpdated}</span>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {filteredCases.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <AlertTriangle className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No special cases match your filters</p>
          </div>
        )}
      </ScrollArea>

      {/* Department Codes Reference */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            Department Codes Reference
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2">
            {Object.entries(DEPARTMENT_CODES).map(([key, { code, name }]) => (
              <div key={key} className="flex items-center gap-2 text-sm p-2 bg-muted/30 rounded">
                <span className="font-mono text-primary font-bold">{code}</span>
                <span className="text-muted-foreground truncate">{name}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
