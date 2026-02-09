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
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { SpecialCasesTracking } from '@/components/documentation/SpecialCasesTracking';
import { 
  FileText, GraduationCap, Globe, Clock, AlertCircle, Search, Sparkles, FileCheck, Stamp, Info, ChevronRight, Users, Filter, RefreshCw, BookOpen, Briefcase, PauseCircle, PlayCircle, ArrowLeftRight, Building2, ShieldAlert
} from 'lucide-react';

interface DocumentTemplate { id: string; stage_type: string; document_name: string; document_category: string; description: string | null; is_required: boolean; sort_order: number; }
interface CountryRule { id: string; country_code: string; country_name: string; education_system: string | null; document_name: string; specific_requirements: string | null; stamps_required: string[] | null; how_to_obtain: string | null; notes: string | null; }
interface StudentDocument { id: string; university_id: string; student_name: string; student_email: string | null; student_id_number: string | null; country_of_origin: string; education_system: string | null; stage: string; degree_level: string; status: string; notes: string | null; created_at: string; items?: StudentDocumentItem[]; }
interface StudentDocumentItem { id: string; student_document_id: string; document_name: string; document_category: string; status: string; document_url: string | null; stamps_verified: string[] | null; verification_notes: string | null; }
interface AIRequirements { documents: Array<{ name: string; category: string; description: string; isRequired: boolean; stampsRequired: string[]; howToObtain: string; timeline: string; notes: string; }>; commonIssues: string[]; generalAdvice: string; estimatedTotalTime: string; }

const STAGES = [
  { value: 'new_admission', labelKey: 'docs.stage.newAdmission', icon: GraduationCap },
  { value: 'enrolled', labelKey: 'docs.stage.enrolled', icon: BookOpen },
  { value: 'freeze', labelKey: 'docs.stage.freeze', icon: PauseCircle },
  { value: 'unfreeze', labelKey: 'docs.stage.unfreeze', icon: PlayCircle },
  { value: 'transfer_in', labelKey: 'docs.stage.transferIn', icon: ArrowLeftRight },
  { value: 'transfer_out', labelKey: 'docs.stage.transferOut', icon: ArrowLeftRight },
];

const DEGREE_LEVELS = [
  { value: 'bachelors', labelKey: 'docs.degree.bachelors', icon: GraduationCap },
  { value: 'masters', labelKey: 'docs.degree.masters', icon: Briefcase },
  { value: 'phd', labelKey: 'docs.degree.phd', icon: Building2 },
];

const EDUCATION_SYSTEMS = [
  { value: 'national', labelKey: 'docs.edu.national' },
  { value: 'cambridge', labelKey: 'docs.edu.cambridge' },
  { value: 'ib', labelKey: 'docs.edu.ib' },
  { value: 'american', labelKey: 'docs.edu.american' },
  { value: 'ged', labelKey: 'docs.edu.ged' },
  { value: 'cbse', labelKey: 'docs.edu.cbse' },
  { value: 'isc', labelKey: 'docs.edu.isc' },
  { value: 'waec', labelKey: 'docs.edu.waec' },
  { value: 'neco', labelKey: 'docs.edu.neco' },
  { value: 'other', labelKey: 'docs.edu.other' },
];

const COUNTRIES = [
  { code: 'PK', name: 'Pakistan' }, { code: 'IN', name: 'India' }, { code: 'BD', name: 'Bangladesh' }, { code: 'NG', name: 'Nigeria' },
  { code: 'MM', name: 'Myanmar' }, { code: 'AF', name: 'Afghanistan' }, { code: 'IR', name: 'Iran' }, { code: 'IQ', name: 'Iraq' },
  { code: 'SY', name: 'Syria' }, { code: 'EG', name: 'Egypt' }, { code: 'JO', name: 'Jordan' }, { code: 'SA', name: 'Saudi Arabia' },
  { code: 'AE', name: 'UAE' }, { code: 'KZ', name: 'Kazakhstan' }, { code: 'UZ', name: 'Uzbekistan' }, { code: 'TM', name: 'Turkmenistan' },
  { code: 'AZ', name: 'Azerbaijan' }, { code: 'GE', name: 'Georgia' }, { code: 'RU', name: 'Russia' }, { code: 'CN', name: 'China' },
  { code: 'ID', name: 'Indonesia' }, { code: 'MY', name: 'Malaysia' }, { code: 'KE', name: 'Kenya' }, { code: 'ET', name: 'Ethiopia' },
  { code: 'GH', name: 'Ghana' }, { code: 'CM', name: 'Cameroon' }, { code: 'SN', name: 'Senegal' }, { code: 'MA', name: 'Morocco' },
  { code: 'TN', name: 'Tunisia' }, { code: 'DZ', name: 'Algeria' }, { code: 'LY', name: 'Libya' }, { code: 'SD', name: 'Sudan' },
  { code: 'SO', name: 'Somalia' }, { code: 'YE', name: 'Yemen' }, { code: 'LB', name: 'Lebanon' }, { code: 'PS', name: 'Palestine' },
  { code: 'TR', name: 'Turkey (Citizen Abroad)' },
].sort((a, b) => a.name.localeCompare(b.name));

export default function Documentation() {
  const { selectedUniversity } = useUniversity();
  const { t } = useLanguage();
  
  const [activeTab, setActiveTab] = useState('requirements');
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [countryRules, setCountryRules] = useState<CountryRule[]>([]);
  const [studentDocuments, setStudentDocuments] = useState<StudentDocument[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedStage, setSelectedStage] = useState('');
  const [selectedDegree, setSelectedDegree] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedEducation, setSelectedEducation] = useState('');
  const [aiRequirements, setAiRequirements] = useState<AIRequirements | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => { fetchData(); }, [selectedUniversity]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { data: templatesData } = await supabase.from('document_requirement_templates').select('*').order('sort_order');
      const { data: rulesData } = await supabase.from('country_document_rules').select('*').order('country_name');
      if (selectedUniversity) {
        const { data: studentsData } = await supabase.from('student_documents').select('*, student_document_items(*)').eq('university_id', selectedUniversity.id).order('created_at', { ascending: false });
        setStudentDocuments(studentsData?.map(s => ({ ...s, items: s.student_document_items || [] })) || []);
      }
      setTemplates(templatesData || []); setCountryRules(rulesData || []);
    } catch (error) { console.error('Error fetching data:', error); toast.error('Failed to load document data'); } finally { setLoading(false); }
  };

  const getAIRequirements = async () => {
    if (!selectedCountry || !selectedStage || !selectedDegree) { toast.error('Please select country, stage, and degree level'); return; }
    setAiLoading(true);
    try {
      const countryName = COUNTRIES.find(c => c.code === selectedCountry)?.name || selectedCountry;
      const educationLabel = EDUCATION_SYSTEMS.find(e => e.value === selectedEducation)?.labelKey ? t(EDUCATION_SYSTEMS.find(e => e.value === selectedEducation)!.labelKey) : selectedEducation;
      const { data, error } = await supabase.functions.invoke('document-requirements', { body: { country: countryName, educationSystem: educationLabel, stage: selectedStage, degreeLevel: selectedDegree } });
      if (error) throw error;
      setAiRequirements(data); toast.success('Requirements generated successfully');
    } catch (error) { console.error('Error getting AI requirements:', error); toast.error('Failed to generate requirements'); } finally { setAiLoading(false); }
  };

  const getTemplatesForSelection = () => templates.filter(t => t.stage_type === selectedStage || t.stage_type === selectedDegree);
  const getCountryRulesForSelection = () => countryRules.filter(r => r.country_code === selectedCountry || r.country_code === 'ALL');

  if (!selectedUniversity) {
    return (
      <div className="container py-8">
        <Card><CardContent className="flex items-center justify-center py-16"><div className="text-center text-muted-foreground"><FileText className="h-12 w-12 mx-auto mb-4 opacity-50" /><p>{t('docs.selectUniversity')}</p></div></CardContent></Card>
      </div>
    );
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-foreground">{t('docs.title')}</h1><p className="text-muted-foreground">{t('docs.subtitle')}</p></div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full max-w-3xl grid-cols-4">
          <TabsTrigger value="requirements" className="flex items-center gap-2"><FileCheck className="h-4 w-4" />{t('docs.requirementsChecker')}</TabsTrigger>
          <TabsTrigger value="country-rules" className="flex items-center gap-2"><Globe className="h-4 w-4" />{t('docs.countryRules')}</TabsTrigger>
          <TabsTrigger value="tracking" className="flex items-center gap-2"><Users className="h-4 w-4" />{t('docs.studentTracking')}</TabsTrigger>
          <TabsTrigger value="special-cases" className="flex items-center gap-2"><ShieldAlert className="h-4 w-4" />{t('docs.specialCases')}</TabsTrigger>
        </TabsList>

        <TabsContent value="requirements" className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <Card className="lg:col-span-1">
              <CardHeader><CardTitle className="flex items-center gap-2"><Filter className="h-5 w-5" />{t('docs.selectStudentProfile')}</CardTitle><CardDescription>{t('docs.selectStudentDesc')}</CardDescription></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2"><Label>{t('docs.studentStage')} *</Label><Select value={selectedStage} onValueChange={setSelectedStage}><SelectTrigger><SelectValue placeholder={t('docs.selectStage')} /></SelectTrigger><SelectContent>{STAGES.map(stage => (<SelectItem key={stage.value} value={stage.value}><div className="flex items-center gap-2"><stage.icon className="h-4 w-4" />{t(stage.labelKey)}</div></SelectItem>))}</SelectContent></Select></div>
                <div className="space-y-2"><Label>{t('docs.degreeLevel')} *</Label><Select value={selectedDegree} onValueChange={setSelectedDegree}><SelectTrigger><SelectValue placeholder={t('docs.selectDegree')} /></SelectTrigger><SelectContent>{DEGREE_LEVELS.map(degree => (<SelectItem key={degree.value} value={degree.value}><div className="flex items-center gap-2"><degree.icon className="h-4 w-4" />{t(degree.labelKey)}</div></SelectItem>))}</SelectContent></Select></div>
                <div className="space-y-2"><Label>{t('docs.countryOfOrigin')} *</Label><Select value={selectedCountry} onValueChange={setSelectedCountry}><SelectTrigger><SelectValue placeholder={t('docs.selectCountry')} /></SelectTrigger><SelectContent><ScrollArea className="h-64">{COUNTRIES.map(country => (<SelectItem key={country.code} value={country.code}>{country.name}</SelectItem>))}</ScrollArea></SelectContent></Select></div>
                <div className="space-y-2"><Label>{t('docs.educationSystem')}</Label><Select value={selectedEducation} onValueChange={setSelectedEducation}><SelectTrigger><SelectValue placeholder={t('docs.selectEducation')} /></SelectTrigger><SelectContent>{EDUCATION_SYSTEMS.map(edu => (<SelectItem key={edu.value} value={edu.value}>{t(edu.labelKey)}</SelectItem>))}</SelectContent></Select></div>
                <Separator />
                <Button onClick={getAIRequirements} className="w-full" disabled={aiLoading || !selectedStage || !selectedDegree || !selectedCountry}>{aiLoading ? <><RefreshCw className="h-4 w-4 mr-2 animate-spin" />Generating...</> : <><Sparkles className="h-4 w-4 mr-2" />{t('docs.getAIReqs')}</>}</Button>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />{t('docs.requiredDocuments')}</CardTitle>
                <CardDescription>{selectedStage && selectedDegree ? `Documents` : 'Select a student profile to see requirements'}</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px] pr-4">
                  {selectedStage && selectedDegree && (
                    <div className="space-y-4 mb-6">
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Standard Requirements</h3>
                      {getTemplatesForSelection().length > 0 ? (
                        <Accordion type="multiple" className="space-y-2">
                          {getTemplatesForSelection().map((template) => (
                            <AccordionItem key={template.id} value={template.id} className="border rounded-lg px-4">
                              <AccordionTrigger className="hover:no-underline"><div className="flex items-center gap-3"><FileCheck className="h-4 w-4 text-primary" /><span>{template.document_name}</span>{template.is_required && <Badge variant="outline" className="text-xs">{t('docs.required')}</Badge>}</div></AccordionTrigger>
                              <AccordionContent className="pb-4"><div className="space-y-2 text-sm"><p className="text-muted-foreground">{template.description}</p><Badge variant="secondary">{template.document_category}</Badge></div></AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      ) : <p className="text-sm text-muted-foreground">No templates found.</p>}
                    </div>
                  )}

                  {selectedCountry && (
                    <div className="space-y-4 mb-6">
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2"><Globe className="h-4 w-4" />{t('docs.specificRequirements')} ({COUNTRIES.find(c => c.code === selectedCountry)?.name})</h3>
                      {getCountryRulesForSelection().length > 0 ? (
                        <Accordion type="multiple" className="space-y-2">
                          {getCountryRulesForSelection().map((rule) => (
                            <AccordionItem key={rule.id} value={rule.id} className="border rounded-lg px-4">
                              <AccordionTrigger className="hover:no-underline"><div className="flex items-center gap-3"><Stamp className="h-4 w-4 text-accent" /><span>{rule.document_name}</span></div></AccordionTrigger>
                              <AccordionContent className="pb-4 space-y-3">
                                {rule.specific_requirements && <div><p className="font-medium text-sm">{t('docs.specificRequirements')}:</p><p className="text-sm text-muted-foreground">{rule.specific_requirements}</p></div>}
                                {rule.stamps_required && <div><p className="font-medium text-sm">{t('docs.stamps')}:</p><div className="flex flex-wrap gap-1 mt-1">{rule.stamps_required.map((stamp, idx) => (<Badge key={idx} variant="outline" className="text-xs bg-accent/10"><Stamp className="h-3 w-3 mr-1" />{stamp}</Badge>))}</div></div>}
                                {rule.how_to_obtain && <div><p className="font-medium text-sm">{t('docs.howToObtain')}:</p><p className="text-sm text-muted-foreground whitespace-pre-wrap">{rule.how_to_obtain}</p></div>}
                                {rule.notes && <div className="flex items-start gap-2 p-2 bg-accent/10 rounded-md"><Info className="h-4 w-4 text-accent shrink-0 mt-0.5" /><p className="text-sm">{rule.notes}</p></div>}
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      ) : <p className="text-sm text-muted-foreground">{t('docs.noRulesFound')}</p>}
                    </div>
                  )}

                  {aiRequirements && (
                    <div className="space-y-4">
                      <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2"><Sparkles className="h-4 w-4 text-primary" />AI-Assisted Requirements</h3>
                      {aiRequirements.generalAdvice && <Card className="bg-primary/5 border-primary/20"><CardContent className="p-4"><p className="text-sm">{aiRequirements.generalAdvice}</p>{aiRequirements.estimatedTotalTime && <p className="text-sm mt-2 font-medium"><Clock className="h-4 w-4 inline mr-1" />{t('docs.estimatedTime')}: {aiRequirements.estimatedTotalTime}</p>}</CardContent></Card>}
                      {aiRequirements.documents.length > 0 && (
                        <Accordion type="multiple" className="space-y-2">
                          {aiRequirements.documents.map((doc, idx) => (
                            <AccordionItem key={idx} value={`ai-${idx}`} className="border rounded-lg px-4 border-primary/20">
                              <AccordionTrigger className="hover:no-underline"><div className="flex items-center gap-3"><FileText className="h-4 w-4 text-primary" /><span>{doc.name}</span>{doc.isRequired && <Badge className="text-xs bg-primary">{t('docs.required')}</Badge>}</div></AccordionTrigger>
                              <AccordionContent className="pb-4 space-y-3"><p className="text-sm text-muted-foreground">{doc.description}</p>{doc.stampsRequired.length > 0 && <div><p className="font-medium text-sm">{t('docs.stamps')}:</p><div className="flex flex-wrap gap-1 mt-1">{doc.stampsRequired.map((stamp, i) => (<Badge key={i} variant="outline" className="text-xs bg-accent/10"><Stamp className="h-3 w-3 mr-1" />{stamp}</Badge>))}</div></div>}{doc.howToObtain && <div><p className="font-medium text-sm">{t('docs.howToObtain')}:</p><p className="text-sm text-muted-foreground whitespace-pre-wrap">{doc.howToObtain}</p></div>}{doc.timeline && <div className="flex items-center gap-2 text-sm"><Clock className="h-4 w-4" /><span>{t('docs.timeline')}: {doc.timeline}</span></div>}{doc.notes && <div className="flex items-start gap-2 p-2 bg-accent/10 rounded-md"><AlertCircle className="h-4 w-4 text-accent shrink-0 mt-0.5" /><p className="text-sm">{doc.notes}</p></div>}</AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      )}
                      {aiRequirements.commonIssues.length > 0 && (
                        <Card className="bg-destructive/5 border-destructive/20"><CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><AlertCircle className="h-4 w-4 text-destructive" />{t('docs.commonIssues')}</CardTitle></CardHeader><CardContent><ul className="text-sm space-y-1">{aiRequirements.commonIssues.map((issue, idx) => (<li key={idx} className="flex items-start gap-2"><ChevronRight className="h-4 w-4 shrink-0 mt-0.5" />{issue}</li>))}</ul></CardContent></Card>
                      )}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="country-rules" className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" />{t('docs.countrySpecificRules')}</CardTitle><CardDescription>{t('docs.countryRulesDesc')}</CardDescription></CardHeader>
            <CardContent>
              <div className="mb-4"><Input placeholder={t('docs.searchCountries')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="max-w-md" /></div>
              <ScrollArea className="h-[600px]">
                <div className="space-y-4">
                  {COUNTRIES.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()) || countryRules.some(r => r.country_code === c.code && r.document_name.toLowerCase().includes(searchQuery.toLowerCase()))).map(country => {
                    const rules = countryRules.filter(r => r.country_code === country.code);
                    if (rules.length === 0) return null;
                    return (
                      <Card key={country.code} className="border-l-4 border-l-primary">
                        <CardHeader className="py-3"><CardTitle className="text-lg flex items-center gap-2"><Globe className="h-4 w-4" />{country.name}</CardTitle></CardHeader>
                        <CardContent className="pt-0">
                          <div className="space-y-3">
                            {rules.map(rule => (
                              <div key={rule.id} className="p-3 bg-muted/50 rounded-lg space-y-2">
                                <div className="flex items-center justify-between"><span className="font-medium">{rule.document_name}</span>{rule.education_system && <Badge variant="outline">{rule.education_system}</Badge>}</div>
                                {rule.specific_requirements && <p className="text-sm text-muted-foreground">{rule.specific_requirements}</p>}
                                {rule.stamps_required && <div className="flex flex-wrap gap-1">{rule.stamps_required.map((stamp, idx) => (<Badge key={idx} variant="secondary" className="text-xs">{stamp}</Badge>))}</div>}
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tracking" className="space-y-6">
          <Card>
            <CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />{t('docs.studentDocTracking')}</CardTitle><CardDescription>{t('docs.trackingDesc')}</CardDescription></CardHeader>
            <CardContent><div className="text-center py-12 text-muted-foreground">{t('docs.noStudentsFound')}</div></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="special-cases" className="space-y-6">
          <SpecialCasesTracking />
        </TabsContent>
      </Tabs>
    </div>
  );
}
