import { useState, useEffect } from 'react';
import { useUniversity } from '@/contexts/UniversityContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { SpecialCasesTracking } from '@/components/documentation/SpecialCasesTracking';
import { 
  FileText, 
  GraduationCap, 
  Globe, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Search,
  Plus,
  Sparkles,
  FileCheck,
  Stamp,
  Info,
  ChevronRight,
  Users,
  Filter,
  Download,
  RefreshCw,
  BookOpen,
  Briefcase,
  Plane,
  PauseCircle,
  PlayCircle,
  ArrowLeftRight,
  Building2,
  ShieldAlert,
} from 'lucide-react';

// Types
interface DocumentTemplate {
  id: string;
  stage_type: string;
  document_name: string;
  document_category: string;
  description: string | null;
  is_required: boolean;
  sort_order: number;
}

interface CountryRule {
  id: string;
  country_code: string;
  country_name: string;
  education_system: string | null;
  document_name: string;
  specific_requirements: string | null;
  stamps_required: string[] | null;
  how_to_obtain: string | null;
  notes: string | null;
}

interface StudentDocument {
  id: string;
  university_id: string;
  student_name: string;
  student_email: string | null;
  student_id_number: string | null;
  country_of_origin: string;
  education_system: string | null;
  stage: string;
  degree_level: string;
  status: string;
  notes: string | null;
  created_at: string;
  items?: StudentDocumentItem[];
}

interface StudentDocumentItem {
  id: string;
  student_document_id: string;
  document_name: string;
  document_category: string;
  status: string;
  document_url: string | null;
  stamps_verified: string[] | null;
  verification_notes: string | null;
}

interface AIRequirements {
  documents: Array<{
    name: string;
    category: string;
    description: string;
    isRequired: boolean;
    stampsRequired: string[];
    howToObtain: string;
    timeline: string;
    notes: string;
  }>;
  commonIssues: string[];
  generalAdvice: string;
  estimatedTotalTime: string;
}

// Stage options
const STAGES = [
  { value: 'new_admission', label: 'New Admission', icon: GraduationCap },
  { value: 'enrolled', label: 'Enrolled Student', icon: BookOpen },
  { value: 'freeze', label: 'Freeze Registration', icon: PauseCircle },
  { value: 'unfreeze', label: 'Unfreeze Registration', icon: PlayCircle },
  { value: 'transfer_in', label: 'Transfer In (From Another University)', icon: ArrowLeftRight },
  { value: 'transfer_out', label: 'Transfer Out (To Another University)', icon: ArrowLeftRight },
];

const DEGREE_LEVELS = [
  { value: 'bachelors', label: 'Bachelor\'s Degree', icon: GraduationCap },
  { value: 'masters', label: 'Master\'s Degree', icon: Briefcase },
  { value: 'phd', label: 'PhD / Doctorate', icon: Building2 },
];

const EDUCATION_SYSTEMS = [
  { value: 'national', label: 'National Curriculum' },
  { value: 'cambridge', label: 'Cambridge (O-Levels/A-Levels)' },
  { value: 'ib', label: 'International Baccalaureate (IB)' },
  { value: 'american', label: 'American High School' },
  { value: 'ged', label: 'GED' },
  { value: 'cbse', label: 'CBSE (India)' },
  { value: 'isc', label: 'ISC (India)' },
  { value: 'waec', label: 'WAEC (West Africa)' },
  { value: 'neco', label: 'NECO (Nigeria)' },
  { value: 'other', label: 'Other' },
];

// Common countries list
const COUNTRIES = [
  { code: 'PK', name: 'Pakistan' },
  { code: 'IN', name: 'India' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'MM', name: 'Myanmar' },
  { code: 'AF', name: 'Afghanistan' },
  { code: 'IR', name: 'Iran' },
  { code: 'IQ', name: 'Iraq' },
  { code: 'SY', name: 'Syria' },
  { code: 'EG', name: 'Egypt' },
  { code: 'JO', name: 'Jordan' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'AE', name: 'UAE' },
  { code: 'KZ', name: 'Kazakhstan' },
  { code: 'UZ', name: 'Uzbekistan' },
  { code: 'TM', name: 'Turkmenistan' },
  { code: 'AZ', name: 'Azerbaijan' },
  { code: 'GE', name: 'Georgia' },
  { code: 'RU', name: 'Russia' },
  { code: 'CN', name: 'China' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'KE', name: 'Kenya' },
  { code: 'ET', name: 'Ethiopia' },
  { code: 'GH', name: 'Ghana' },
  { code: 'CM', name: 'Cameroon' },
  { code: 'SN', name: 'Senegal' },
  { code: 'MA', name: 'Morocco' },
  { code: 'TN', name: 'Tunisia' },
  { code: 'DZ', name: 'Algeria' },
  { code: 'LY', name: 'Libya' },
  { code: 'SD', name: 'Sudan' },
  { code: 'SO', name: 'Somalia' },
  { code: 'YE', name: 'Yemen' },
  { code: 'LB', name: 'Lebanon' },
  { code: 'PS', name: 'Palestine' },
  { code: 'TR', name: 'Turkey (Citizen Abroad)' },
].sort((a, b) => a.name.localeCompare(b.name));

export default function Documentation() {
  const { selectedUniversity } = useUniversity();
  const { t } = useLanguage();
  
  // State
  const [activeTab, setActiveTab] = useState('requirements');
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [countryRules, setCountryRules] = useState<CountryRule[]>([]);
  const [studentDocuments, setStudentDocuments] = useState<StudentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Requirement checker state
  const [selectedStage, setSelectedStage] = useState('');
  const [selectedDegree, setSelectedDegree] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedEducation, setSelectedEducation] = useState('');
  const [aiRequirements, setAiRequirements] = useState<AIRequirements | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  
  // Student tracking state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showNewStudentDialog, setShowNewStudentDialog] = useState(false);
  const [newStudent, setNewStudent] = useState({
    student_name: '',
    student_email: '',
    student_id_number: '',
    country_of_origin: '',
    education_system: '',
    stage: '',
    degree_level: '',
  });

  // Fetch data
  useEffect(() => {
    fetchData();
  }, [selectedUniversity]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch templates
      const { data: templatesData } = await supabase
        .from('document_requirement_templates')
        .select('*')
        .order('sort_order');
      
      // Fetch country rules
      const { data: rulesData } = await supabase
        .from('country_document_rules')
        .select('*')
        .order('country_name');
      
      // Fetch student documents if university selected
      if (selectedUniversity) {
        const { data: studentsData } = await supabase
          .from('student_documents')
          .select('*, student_document_items(*)')
          .eq('university_id', selectedUniversity.id)
          .order('created_at', { ascending: false });
        
        setStudentDocuments(studentsData?.map(s => ({
          ...s,
          items: s.student_document_items || []
        })) || []);
      }
      
      setTemplates(templatesData || []);
      setCountryRules(rulesData || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load document data');
    } finally {
      setLoading(false);
    }
  };

  // Get AI requirements
  const getAIRequirements = async () => {
    if (!selectedCountry || !selectedStage || !selectedDegree) {
      toast.error('Please select country, stage, and degree level');
      return;
    }
    
    setAiLoading(true);
    try {
      const countryName = COUNTRIES.find(c => c.code === selectedCountry)?.name || selectedCountry;
      const educationLabel = EDUCATION_SYSTEMS.find(e => e.value === selectedEducation)?.label || selectedEducation;
      
      const { data, error } = await supabase.functions.invoke('document-requirements', {
        body: {
          country: countryName,
          educationSystem: educationLabel,
          stage: selectedStage,
          degreeLevel: selectedDegree,
        },
      });
      
      if (error) throw error;
      setAiRequirements(data);
      toast.success('Requirements generated successfully');
    } catch (error) {
      console.error('Error getting AI requirements:', error);
      toast.error('Failed to generate requirements');
    } finally {
      setAiLoading(false);
    }
  };

  // Create new student document tracking
  const createStudentDocument = async () => {
    if (!selectedUniversity || !newStudent.student_name || !newStudent.country_of_origin || !newStudent.stage || !newStudent.degree_level) {
      toast.error('Please fill all required fields');
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('student_documents')
        .insert({
          university_id: selectedUniversity.id,
          ...newStudent,
        })
        .select()
        .single();
      
      if (error) throw error;
      
      // Create document items based on templates
      const relevantTemplates = templates.filter(t => 
        t.stage_type === newStudent.stage || t.stage_type === newStudent.degree_level
      );
      
      if (relevantTemplates.length > 0) {
        const items = relevantTemplates.map(t => ({
          student_document_id: data.id,
          document_name: t.document_name,
          document_category: t.document_category,
          status: 'pending',
        }));
        
        await supabase.from('student_document_items').insert(items);
      }
      
      toast.success('Student document tracking created');
      setShowNewStudentDialog(false);
      setNewStudent({
        student_name: '',
        student_email: '',
        student_id_number: '',
        country_of_origin: '',
        education_system: '',
        stage: '',
        degree_level: '',
      });
      fetchData();
    } catch (error) {
      console.error('Error creating student document:', error);
      toast.error('Failed to create student document');
    }
  };

  // Get templates for selected stage
  const getTemplatesForSelection = () => {
    return templates.filter(t => 
      t.stage_type === selectedStage || t.stage_type === selectedDegree
    );
  };

  // Get country rules for selected country
  const getCountryRulesForSelection = () => {
    return countryRules.filter(r => 
      r.country_code === selectedCountry || r.country_code === 'ALL'
    );
  };

  // Filter students
  const filteredStudents = studentDocuments.filter(s => {
    const matchesSearch = s.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.student_email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.student_id_number?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'complete': return 'bg-green-500 text-white';
      case 'in_progress': return 'bg-blue-500 text-white';
      case 'issues': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  // Calculate document progress
  const getDocumentProgress = (items: StudentDocumentItem[]) => {
    if (!items.length) return 0;
    const verified = items.filter(i => i.status === 'verified').length;
    return Math.round((verified / items.length) * 100);
  };

  if (!selectedUniversity) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="flex items-center justify-center py-16">
            <div className="text-center text-muted-foreground">
              <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Please select a university to view documentation management.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Student Documentation Management</h1>
          <p className="text-muted-foreground">
            Complete document requirements, country-specific rules, and student tracking
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-3xl grid-cols-4">
          <TabsTrigger value="requirements" className="flex items-center gap-2">
            <FileCheck className="h-4 w-4" />
            Requirements Checker
          </TabsTrigger>
          <TabsTrigger value="country-rules" className="flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Country Rules
          </TabsTrigger>
          <TabsTrigger value="tracking" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Student Tracking
          </TabsTrigger>
          <TabsTrigger value="special-cases" className="flex items-center gap-2">
            <ShieldAlert className="h-4 w-4" />
            Special Cases
          </TabsTrigger>
        </TabsList>

        {/* Requirements Checker Tab */}
        <TabsContent value="requirements" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Selection Panel */}
            <Card className="lg:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Select Student Profile
                </CardTitle>
                <CardDescription>
                  Choose the student's situation to see required documents
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Student Stage *</Label>
                  <Select value={selectedStage} onValueChange={setSelectedStage}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage..." />
                    </SelectTrigger>
                    <SelectContent>
                      {STAGES.map(stage => (
                        <SelectItem key={stage.value} value={stage.value}>
                          <div className="flex items-center gap-2">
                            <stage.icon className="h-4 w-4" />
                            {stage.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Degree Level *</Label>
                  <Select value={selectedDegree} onValueChange={setSelectedDegree}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select degree..." />
                    </SelectTrigger>
                    <SelectContent>
                      {DEGREE_LEVELS.map(degree => (
                        <SelectItem key={degree.value} value={degree.value}>
                          <div className="flex items-center gap-2">
                            <degree.icon className="h-4 w-4" />
                            {degree.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Country of Origin *</Label>
                  <Select value={selectedCountry} onValueChange={setSelectedCountry}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select country..." />
                    </SelectTrigger>
                    <SelectContent>
                      <ScrollArea className="h-64">
                        {COUNTRIES.map(country => (
                          <SelectItem key={country.code} value={country.code}>
                            {country.name}
                          </SelectItem>
                        ))}
                      </ScrollArea>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Education System</Label>
                  <Select value={selectedEducation} onValueChange={setSelectedEducation}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select system..." />
                    </SelectTrigger>
                    <SelectContent>
                      {EDUCATION_SYSTEMS.map(edu => (
                        <SelectItem key={edu.value} value={edu.value}>
                          {edu.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <Button 
                  onClick={getAIRequirements} 
                  className="w-full"
                  disabled={aiLoading || !selectedStage || !selectedDegree || !selectedCountry}
                >
                  {aiLoading ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Get AI-Powered Requirements
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Results Panel */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Required Documents
                </CardTitle>
                <CardDescription>
                  {selectedStage && selectedDegree ? (
                    `Documents for ${STAGES.find(s => s.value === selectedStage)?.label} - ${DEGREE_LEVELS.find(d => d.value === selectedDegree)?.label}`
                  ) : (
                    'Select a student profile to see requirements'
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  {/* Base Templates */}
                  {selectedStage && selectedDegree && (
                    <div className="space-y-4 mb-6">
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                        Standard Requirements
                      </h3>
                      {getTemplatesForSelection().length > 0 ? (
                        <Accordion type="multiple" className="space-y-2">
                          {getTemplatesForSelection().map((template) => (
                            <AccordionItem key={template.id} value={template.id} className="border rounded-lg px-4">
                              <AccordionTrigger className="hover:no-underline">
                                <div className="flex items-center gap-3">
                                  <FileCheck className="h-4 w-4 text-primary" />
                                  <span>{template.document_name}</span>
                                  {template.is_required && (
                                    <Badge variant="outline" className="text-xs">Required</Badge>
                                  )}
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="pb-4">
                                <div className="space-y-2 text-sm">
                                  <p className="text-muted-foreground">{template.description}</p>
                                  <Badge variant="secondary">{template.document_category}</Badge>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      ) : (
                        <p className="text-sm text-muted-foreground">No templates found for this selection.</p>
                      )}
                    </div>
                  )}

                  {/* Country-Specific Rules */}
                  {selectedCountry && (
                    <div className="space-y-4 mb-6">
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                        <Globe className="h-4 w-4" />
                        Country-Specific Requirements ({COUNTRIES.find(c => c.code === selectedCountry)?.name})
                      </h3>
                      {getCountryRulesForSelection().length > 0 ? (
                        <Accordion type="multiple" className="space-y-2">
                          {getCountryRulesForSelection().map((rule) => (
                            <AccordionItem key={rule.id} value={rule.id} className="border rounded-lg px-4">
                              <AccordionTrigger className="hover:no-underline">
                                <div className="flex items-center gap-3">
                                  <Stamp className="h-4 w-4 text-accent" />
                                  <span>{rule.document_name}</span>
                                  {rule.education_system && (
                                    <Badge variant="secondary" className="text-xs">{rule.education_system}</Badge>
                                  )}
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="pb-4 space-y-3">
                                {rule.specific_requirements && (
                                  <div>
                                    <p className="font-medium text-sm">Requirements:</p>
                                    <p className="text-sm text-muted-foreground">{rule.specific_requirements}</p>
                                  </div>
                                )}
                                {rule.stamps_required && rule.stamps_required.length > 0 && (
                                  <div>
                                    <p className="font-medium text-sm">Required Stamps:</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {rule.stamps_required.map((stamp, idx) => (
                                        <Badge key={idx} variant="outline" className="text-xs bg-accent/10">
                                          <Stamp className="h-3 w-3 mr-1" />
                                          {stamp}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                {rule.how_to_obtain && (
                                  <div>
                                    <p className="font-medium text-sm">How to Obtain:</p>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{rule.how_to_obtain}</p>
                                  </div>
                                )}
                                {rule.notes && (
                                  <div className="flex items-start gap-2 p-2 bg-accent/10 rounded-md">
                                    <Info className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                                    <p className="text-sm">{rule.notes}</p>
                                  </div>
                                )}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      ) : (
                        <p className="text-sm text-muted-foreground">No specific rules found for this country.</p>
                      )}
                    </div>
                  )}

                  {/* AI-Generated Requirements */}
                  {aiRequirements && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        AI-Assisted Requirements
                      </h3>

                      {aiRequirements.generalAdvice && (
                        <Card className="bg-primary/5 border-primary/20">
                          <CardContent className="p-4">
                            <p className="text-sm">{aiRequirements.generalAdvice}</p>
                            {aiRequirements.estimatedTotalTime && (
                              <p className="text-sm mt-2 font-medium">
                                <Clock className="h-4 w-4 inline mr-1" />
                                Estimated time: {aiRequirements.estimatedTotalTime}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      )}

                      {aiRequirements.documents.length > 0 && (
                        <Accordion type="multiple" className="space-y-2">
                          {aiRequirements.documents.map((doc, idx) => (
                            <AccordionItem key={idx} value={`ai-${idx}`} className="border rounded-lg px-4 border-primary/20">
                              <AccordionTrigger className="hover:no-underline">
                                <div className="flex items-center gap-3">
                                  <FileText className="h-4 w-4 text-primary" />
                                  <span>{doc.name}</span>
                                  {doc.isRequired && (
                                    <Badge className="text-xs bg-primary">Required</Badge>
                                  )}
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="pb-4 space-y-3">
                                <p className="text-sm text-muted-foreground">{doc.description}</p>
                                
                                {doc.stampsRequired.length > 0 && (
                                  <div>
                                    <p className="font-medium text-sm">Required Stamps:</p>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {doc.stampsRequired.map((stamp, i) => (
                                        <Badge key={i} variant="outline" className="text-xs bg-accent/10">
                                          <Stamp className="h-3 w-3 mr-1" />
                                          {stamp}
                                        </Badge>
                                      ))}
                                    </div>
                                  </div>
                                )}
                                
                                {doc.howToObtain && (
                                  <div>
                                    <p className="font-medium text-sm">How to Obtain:</p>
                                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">{doc.howToObtain}</p>
                                  </div>
                                )}
                                
                                {doc.timeline && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Clock className="h-4 w-4" />
                                    <span>Timeline: {doc.timeline}</span>
                                  </div>
                                )}
                                
                                {doc.notes && (
                                  <div className="flex items-start gap-2 p-2 bg-accent/10 rounded-md">
                                    <AlertCircle className="h-4 w-4 text-accent shrink-0 mt-0.5" />
                                    <p className="text-sm">{doc.notes}</p>
                                  </div>
                                )}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      )}

                      {aiRequirements.commonIssues.length > 0 && (
                        <Card className="bg-destructive/5 border-destructive/20">
                          <CardHeader className="pb-2">
                            <CardTitle className="text-sm flex items-center gap-2">
                              <AlertCircle className="h-4 w-4 text-destructive" />
                              Common Issues to Avoid
                            </CardTitle>
                          </CardHeader>
                          <CardContent>
                            <ul className="text-sm space-y-1">
                              {aiRequirements.commonIssues.map((issue, idx) => (
                                <li key={idx} className="flex items-start gap-2">
                                  <ChevronRight className="h-4 w-4 shrink-0 mt-0.5" />
                                  {issue}
                                </li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      )}
                    </div>
                  )}

                  {!selectedStage && !selectedDegree && (
                    <div className="flex items-center justify-center h-64 text-muted-foreground">
                      <div className="text-center">
                        <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>Select a student profile to see document requirements</p>
                      </div>
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Country Rules Tab */}
        <TabsContent value="country-rules" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                Country-Specific Document Rules
              </CardTitle>
              <CardDescription>
                Reference guide for document requirements by country and education system
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Input
                  placeholder="Search countries or documents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-md"
                />
              </div>
              
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {COUNTRIES.filter(c => 
                    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    countryRules.some(r => 
                      r.country_code === c.code && 
                      r.document_name.toLowerCase().includes(searchQuery.toLowerCase())
                    )
                  ).map(country => {
                    const rules = countryRules.filter(r => r.country_code === country.code);
                    if (rules.length === 0) return null;
                    
                    return (
                      <Card key={country.code} className="border-l-4 border-l-primary">
                        <CardHeader className="py-3">
                          <CardTitle className="text-lg flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            {country.name}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            {rules.map(rule => (
                              <div key={rule.id} className="p-3 bg-muted/50 rounded-lg space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{rule.document_name}</span>
                                  {rule.education_system && (
                                    <Badge variant="outline">{rule.education_system}</Badge>
                                  )}
                                </div>
                                {rule.specific_requirements && (
                                  <p className="text-sm text-muted-foreground">{rule.specific_requirements}</p>
                                )}
                                {rule.stamps_required && rule.stamps_required.length > 0 && (
                                  <div className="flex flex-wrap gap-1">
                                    {rule.stamps_required.map((stamp, idx) => (
                                      <Badge key={idx} variant="secondary" className="text-xs">
                                        {stamp}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}

                  {/* General rules for all countries */}
                  <Card className="border-l-4 border-l-accent">
                    <CardHeader className="py-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Info className="h-4 w-4" />
                        General Requirements (All Countries)
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <div className="space-y-3">
                        {countryRules.filter(r => r.country_code === 'ALL').map(rule => (
                          <div key={rule.id} className="p-3 bg-accent/10 rounded-lg space-y-2">
                            <span className="font-medium">{rule.document_name}</span>
                            {rule.specific_requirements && (
                              <p className="text-sm text-muted-foreground">{rule.specific_requirements}</p>
                            )}
                            {rule.how_to_obtain && (
                              <p className="text-sm whitespace-pre-wrap">{rule.how_to_obtain}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Student Tracking Tab */}
        <TabsContent value="tracking" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Student Document Tracking
                  </CardTitle>
                  <CardDescription>
                    Track document status for individual students
                  </CardDescription>
                </div>
                <Dialog open={showNewStudentDialog} onOpenChange={setShowNewStudentDialog}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Add Student
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Add New Student for Document Tracking</DialogTitle>
                      <DialogDescription>
                        Create a document checklist for a new student
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Student Name *</Label>
                          <Input
                            value={newStudent.student_name}
                            onChange={(e) => setNewStudent({ ...newStudent, student_name: e.target.value })}
                            placeholder="Full name"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Email</Label>
                          <Input
                            value={newStudent.student_email}
                            onChange={(e) => setNewStudent({ ...newStudent, student_email: e.target.value })}
                            placeholder="Email address"
                            type="email"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Student ID</Label>
                          <Input
                            value={newStudent.student_id_number}
                            onChange={(e) => setNewStudent({ ...newStudent, student_id_number: e.target.value })}
                            placeholder="Student number"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Country of Origin *</Label>
                          <Select 
                            value={newStudent.country_of_origin} 
                            onValueChange={(v) => setNewStudent({ ...newStudent, country_of_origin: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              <ScrollArea className="h-48">
                                {COUNTRIES.map(c => (
                                  <SelectItem key={c.code} value={c.code}>{c.name}</SelectItem>
                                ))}
                              </ScrollArea>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Education System</Label>
                        <Select 
                          value={newStudent.education_system} 
                          onValueChange={(v) => setNewStudent({ ...newStudent, education_system: v })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select system..." />
                          </SelectTrigger>
                          <SelectContent>
                            {EDUCATION_SYSTEMS.map(e => (
                              <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Stage *</Label>
                          <Select 
                            value={newStudent.stage} 
                            onValueChange={(v) => setNewStudent({ ...newStudent, stage: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              {STAGES.map(s => (
                                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Degree Level *</Label>
                          <Select 
                            value={newStudent.degree_level} 
                            onValueChange={(v) => setNewStudent({ ...newStudent, degree_level: v })}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select..." />
                            </SelectTrigger>
                            <SelectContent>
                              {DEGREE_LEVELS.map(d => (
                                <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <Button onClick={createStudentDocument} className="w-full">
                        Create Document Checklist
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              {/* Filters */}
              <div className="flex gap-4 mb-6">
                <div className="flex-1">
                  <Input
                    placeholder="Search students..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-md"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="complete">Complete</SelectItem>
                    <SelectItem value="issues">Has Issues</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Student List */}
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : filteredStudents.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No students found</p>
                  <p className="text-sm">Add a student to start tracking their documents</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredStudents.map(student => (
                    <Card key={student.id} className="hover:shadow-md transition-shadow">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                              <GraduationCap className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold">{student.student_name}</h3>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{COUNTRIES.find(c => c.code === student.country_of_origin)?.name}</span>
                                <span>•</span>
                                <span>{STAGES.find(s => s.value === student.stage)?.label}</span>
                                <span>•</span>
                                <span>{DEGREE_LEVELS.find(d => d.value === student.degree_level)?.label}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <div className="flex items-center gap-2 mb-1">
                                <Progress value={getDocumentProgress(student.items || [])} className="w-24 h-2" />
                                <span className="text-sm font-medium">{getDocumentProgress(student.items || [])}%</span>
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {student.items?.filter(i => i.status === 'verified').length || 0} / {student.items?.length || 0} documents verified
                              </p>
                            </div>
                            <Badge className={getStatusColor(student.status)}>
                              {student.status.replace('_', ' ')}
                            </Badge>
                          </div>
                        </div>
                        
                        {student.items && student.items.length > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {student.items.slice(0, 8).map(item => (
                                <div 
                                  key={item.id} 
                                  className={`p-2 rounded text-xs flex items-center gap-2 ${
                                    item.status === 'verified' ? 'bg-green-500/10 text-green-600' :
                                    item.status === 'uploaded' ? 'bg-blue-500/10 text-blue-600' :
                                    item.status === 'rejected' ? 'bg-red-500/10 text-red-600' :
                                    'bg-muted text-muted-foreground'
                                  }`}
                                >
                                  {item.status === 'verified' ? <CheckCircle2 className="h-3 w-3" /> :
                                   item.status === 'rejected' ? <AlertCircle className="h-3 w-3" /> :
                                   <Clock className="h-3 w-3" />}
                                  <span className="truncate">{item.document_name}</span>
                                </div>
                              ))}
                              {student.items.length > 8 && (
                                <div className="p-2 rounded text-xs bg-muted text-muted-foreground flex items-center justify-center">
                                  +{student.items.length - 8} more
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Special Cases Tab */}
        <TabsContent value="special-cases" className="space-y-6">
          <SpecialCasesTracking />
        </TabsContent>
      </Tabs>
    </div>
  );
}
