import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Building2, Calendar, Clock, MapPin, User, Mail, Phone, Video, Globe, Plus,
  Sparkles, Loader2, ChevronRight, Target, AlertTriangle, CheckCircle2,
  Users, DollarSign, Briefcase, ArrowRight, MessageSquare, FileText
} from 'lucide-react';
import { useUniversity } from '@/contexts/UniversityContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { University } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

interface Interaction {
  id: string;
  university_id: string;
  partner_university_id: string;
  interaction_type: string;
  meeting_format: string;
  title: string;
  description: string | null;
  contact_person_name: string | null;
  contact_person_title: string | null;
  contact_person_email: string | null;
  location: string | null;
  meeting_date: string | null;
  duration_minutes: number | null;
  discussion_notes: string | null;
  outcomes: string | null;
  stage: string;
  next_steps: string | null;
  waiting_for: string | null;
  goals: string | null;
  priority: string;
  status: string;
  follow_up_date: string | null;
  resources_needed: string | null;
  ai_analysis: string | null;
  ai_achievability_score: number | null;
  created_at: string;
  updated_at: string;
}

interface AIAnalysis {
  achievability_score: number;
  achievability_reasoning: string;
  strengths: string[];
  risks: string[];
  recommended_next_steps: string[];
  resources_needed: {
    personnel: string[];
    budget_items: string[];
    infrastructure: string[];
    timeline: string;
  };
  meeting_suggestions: {
    title: string;
    format: string;
    purpose: string;
    suggested_attendees: string;
    priority: string;
  }[];
  overall_assessment: string;
}

interface PartnerGroup {
  partner: University;
  interactions: Interaction[];
  latestStage: string;
  upcomingMeetings: number;
  completedMeetings: number;
}

const STAGES = [
  { value: 'initial_contact', label: 'Initial Contact', color: 'bg-slate-500/10 text-slate-600' },
  { value: 'exploration', label: 'Exploration', color: 'bg-blue-500/10 text-blue-600' },
  { value: 'negotiation', label: 'Negotiation', color: 'bg-amber-500/10 text-amber-600' },
  { value: 'agreement', label: 'Agreement', color: 'bg-green-500/10 text-green-600' },
  { value: 'implementation', label: 'Implementation', color: 'bg-purple-500/10 text-purple-600' },
  { value: 'review', label: 'Review', color: 'bg-pink-500/10 text-pink-600' },
];

const INTERACTION_TYPES = [
  { value: 'meeting', label: 'Meeting', icon: Users },
  { value: 'call', label: 'Call', icon: Phone },
  { value: 'email', label: 'Email', icon: Mail },
  { value: 'conference', label: 'Conference', icon: Globe },
  { value: 'visit', label: 'Campus Visit', icon: Building2 },
];

export function ActivePartnerships() {
  const { selectedUniversity, universities } = useUniversity();
  const { t, language } = useLanguage();
  const { toast } = useToast();

  const [interactions, setInteractions] = useState<Interaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPartner, setSelectedPartner] = useState<PartnerGroup | null>(null);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('all');

  const [newInteraction, setNewInteraction] = useState({
    partner_university_id: '',
    interaction_type: 'meeting',
    meeting_format: 'in_person',
    title: '',
    description: '',
    contact_person_name: '',
    contact_person_title: '',
    contact_person_email: '',
    location: '',
    meeting_date: '',
    duration_minutes: 60,
    discussion_notes: '',
    outcomes: '',
    stage: 'initial_contact',
    next_steps: '',
    waiting_for: '',
    goals: '',
    priority: 'medium',
    status: 'scheduled',
  });

  useEffect(() => {
    if (selectedUniversity) fetchInteractions();
  }, [selectedUniversity?.id]);

  const fetchInteractions = async () => {
    if (!selectedUniversity) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('partnership_interactions')
        .select('*')
        .eq('university_id', selectedUniversity.id)
        .order('meeting_date', { ascending: false });
      if (error) throw error;
      setInteractions((data || []) as Interaction[]);
    } catch (err) {
      console.error('Error fetching interactions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const partnerGroups: PartnerGroup[] = (() => {
    const groups = new Map<string, Interaction[]>();
    interactions.forEach(i => {
      const list = groups.get(i.partner_university_id) || [];
      list.push(i);
      groups.set(i.partner_university_id, list);
    });
    return Array.from(groups.entries())
      .map(([partnerId, ints]) => {
        const partner = universities.find(u => u.id === partnerId);
        if (!partner) return null;
        const sorted = [...ints].sort((a, b) => new Date(b.meeting_date || b.created_at).getTime() - new Date(a.meeting_date || a.created_at).getTime());
        return {
          partner,
          interactions: sorted,
          latestStage: sorted[0]?.stage || 'initial_contact',
          upcomingMeetings: ints.filter(i => i.status === 'scheduled').length,
          completedMeetings: ints.filter(i => i.status === 'completed').length,
        };
      })
      .filter(Boolean) as PartnerGroup[];
  })();

  const filteredGroups = partnerGroups.filter(g => {
    const matchesSearch = g.partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.partner.country.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStage = stageFilter === 'all' || g.latestStage === stageFilter;
    return matchesSearch && matchesStage;
  });

  const handleAddInteraction = async () => {
    if (!selectedUniversity || !newInteraction.partner_university_id || !newInteraction.title) return;
    try {
      const { error } = await supabase.from('partnership_interactions').insert({
        university_id: selectedUniversity.id,
        ...newInteraction,
        meeting_date: newInteraction.meeting_date || null,
        duration_minutes: newInteraction.duration_minutes || null,
      });
      if (error) throw error;
      toast({ title: 'Interaction Added', description: 'Partnership interaction recorded successfully' });
      setShowAddDialog(false);
      setNewInteraction({
        partner_university_id: '', interaction_type: 'meeting', meeting_format: 'in_person',
        title: '', description: '', contact_person_name: '', contact_person_title: '',
        contact_person_email: '', location: '', meeting_date: '', duration_minutes: 60,
        discussion_notes: '', outcomes: '', stage: 'initial_contact', next_steps: '',
        waiting_for: '', goals: '', priority: 'medium', status: 'scheduled',
      });
      fetchInteractions();
    } catch (err) {
      console.error('Error adding interaction:', err);
      toast({ title: 'Error', description: 'Failed to add interaction', variant: 'destructive' });
    }
  };

  const runAIAnalysis = async (group: PartnerGroup) => {
    if (!selectedUniversity) return;
    setIsAnalyzing(true);
    setAiAnalysis(null);
    try {
      const { data: projects } = await supabase
        .from('partner_projects')
        .select('*')
        .eq('university_id', selectedUniversity.id)
        .eq('partner_university_id', group.partner.id);
      const { data: mous } = await supabase
        .from('mous')
        .select('status')
        .or(`and(initiator_university_id.eq.${selectedUniversity.id},partner_university_id.eq.${group.partner.id}),and(initiator_university_id.eq.${group.partner.id},partner_university_id.eq.${selectedUniversity.id})`);

      const { data, error } = await supabase.functions.invoke('partnership-analysis', {
        body: {
          university: selectedUniversity,
          partner: group.partner,
          interactions: group.interactions,
          projects: projects || [],
          mou_status: mous?.[0]?.status || null,
          language,
        },
      });
      if (error) throw error;
      setAiAnalysis(data as AIAnalysis);
    } catch (err) {
      console.error('Error running AI analysis:', err);
      toast({ title: 'Analysis Error', description: 'Failed to generate AI analysis', variant: 'destructive' });
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getStageInfo = (stage: string) => STAGES.find(s => s.value === stage) || STAGES[0];
  const getStageProgress = (stage: string) => {
    const idx = STAGES.findIndex(s => s.value === stage);
    return ((idx + 1) / STAGES.length) * 100;
  };

  if (isLoading) {
    return <div className="flex h-48 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  // Detail view for a selected partner
  if (selectedPartner) {
    const stageInfo = getStageInfo(selectedPartner.latestStage);
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => { setSelectedPartner(null); setAiAnalysis(null); }}>
            ← Back
          </Button>
          <h2 className="text-xl font-semibold">{selectedPartner.partner.name}</h2>
          <Badge className={stageInfo.color}>{stageInfo.label}</Badge>
        </div>

        {/* Stage Pipeline */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              {STAGES.map((stage, idx) => {
                const isCurrent = stage.value === selectedPartner.latestStage;
                const isPast = STAGES.findIndex(s => s.value === selectedPartner.latestStage) >= idx;
                return (
                  <div key={stage.value} className="flex items-center flex-1">
                    <div className={`flex flex-col items-center flex-1 ${isCurrent ? 'scale-110' : ''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${isPast ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                        {idx + 1}
                      </div>
                      <span className={`text-xs mt-1 text-center ${isCurrent ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                        {stage.label}
                      </span>
                    </div>
                    {idx < STAGES.length - 1 && (
                      <div className={`h-0.5 flex-1 mx-1 ${isPast ? 'bg-primary' : 'bg-muted'}`} />
                    )}
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Contact & Goals */}
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" />Contact Information</CardTitle></CardHeader>
            <CardContent>
              {selectedPartner.interactions[0]?.contact_person_name ? (
                <div className="space-y-2">
                  <p className="font-medium">{selectedPartner.interactions[0].contact_person_name}</p>
                  <p className="text-sm text-muted-foreground">{selectedPartner.interactions[0].contact_person_title}</p>
                  {selectedPartner.interactions[0].contact_person_email && (
                    <p className="text-sm flex items-center gap-1"><Mail className="h-3 w-3" />{selectedPartner.interactions[0].contact_person_email}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No contact recorded yet</p>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Target className="h-4 w-4" />Partnership Goals</CardTitle></CardHeader>
            <CardContent>
              {selectedPartner.interactions.find(i => i.goals) ? (
                <div className="space-y-2">
                  {[...new Set(selectedPartner.interactions.filter(i => i.goals).map(i => i.goals!))].map((goal, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <p className="text-sm">{goal}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No goals defined yet</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Waiting For & Next Steps */}
        <div className="grid gap-4 md:grid-cols-2">
          {selectedPartner.interactions.some(i => i.waiting_for) && (
            <Card className="border-amber-300">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-4 w-4 text-amber-600" />Waiting For</CardTitle></CardHeader>
              <CardContent>
                {selectedPartner.interactions.filter(i => i.waiting_for).slice(0, 3).map((i, idx) => (
                  <div key={idx} className="flex items-start gap-2 mb-2">
                    <AlertTriangle className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" />
                    <p className="text-sm">{i.waiting_for}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {selectedPartner.interactions.some(i => i.next_steps) && (
            <Card className="border-blue-300">
              <CardHeader><CardTitle className="text-base flex items-center gap-2"><ArrowRight className="h-4 w-4 text-blue-600" />Next Steps</CardTitle></CardHeader>
              <CardContent>
                {selectedPartner.interactions.filter(i => i.next_steps).slice(0, 3).map((i, idx) => (
                  <div key={idx} className="flex items-start gap-2 mb-2">
                    <ChevronRight className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                    <p className="text-sm">{i.next_steps}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        {/* AI Analysis */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />AI Partnership Analysis</CardTitle>
              <Button onClick={() => runAIAnalysis(selectedPartner)} disabled={isAnalyzing}>
                {isAnalyzing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                {aiAnalysis ? 'Refresh Analysis' : 'Generate Analysis'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isAnalyzing ? (
              <div className="flex flex-col items-center py-8"><Loader2 className="h-10 w-10 animate-spin text-primary mb-3" /><p className="text-muted-foreground">Analyzing partnership potential...</p></div>
            ) : aiAnalysis ? (
              <div className="space-y-6">
                {/* Achievability Score */}
                <div className="rounded-lg border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">Achievability Score</h4>
                    <span className={`text-2xl font-bold ${aiAnalysis.achievability_score >= 70 ? 'text-green-600' : aiAnalysis.achievability_score >= 40 ? 'text-amber-600' : 'text-red-600'}`}>
                      {aiAnalysis.achievability_score}/100
                    </span>
                  </div>
                  <Progress value={aiAnalysis.achievability_score} className="mb-2" />
                  <p className="text-sm text-muted-foreground">{aiAnalysis.achievability_reasoning}</p>
                </div>

                <p className="text-sm bg-primary/5 rounded-lg p-4 border border-primary/20">{aiAnalysis.overall_assessment}</p>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="rounded-lg bg-green-500/5 p-4">
                    <h4 className="font-medium text-green-700 mb-2">Strengths</h4>
                    <ul className="space-y-1">{aiAnalysis.strengths.map((s, i) => <li key={i} className="text-sm flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />{s}</li>)}</ul>
                  </div>
                  <div className="rounded-lg bg-red-500/5 p-4">
                    <h4 className="font-medium text-red-700 mb-2">Risks</h4>
                    <ul className="space-y-1">{aiAnalysis.risks.map((r, i) => <li key={i} className="text-sm flex items-start gap-2"><AlertTriangle className="h-4 w-4 text-red-500 mt-0.5 shrink-0" />{r}</li>)}</ul>
                  </div>
                </div>

                {/* Resources Needed */}
                <div className="rounded-lg border p-4">
                  <h4 className="font-medium mb-3 flex items-center gap-2"><Briefcase className="h-4 w-4" />Resources Needed</h4>
                  <div className="grid gap-3 md:grid-cols-3">
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Personnel</p>
                      <ul className="space-y-1">{aiAnalysis.resources_needed.personnel.map((p, i) => <li key={i} className="text-sm">• {p}</li>)}</ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Budget Items</p>
                      <ul className="space-y-1">{aiAnalysis.resources_needed.budget_items.map((b, i) => <li key={i} className="text-sm">• {b}</li>)}</ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-muted-foreground mb-1">Infrastructure</p>
                      <ul className="space-y-1">{aiAnalysis.resources_needed.infrastructure.map((inf, i) => <li key={i} className="text-sm">• {inf}</li>)}</ul>
                    </div>
                  </div>
                  <p className="text-sm mt-3"><span className="font-medium">Timeline:</span> {aiAnalysis.resources_needed.timeline}</p>
                </div>

                {/* Suggested Meetings */}
                {aiAnalysis.meeting_suggestions.length > 0 && (
                  <div className="rounded-lg border p-4">
                    <h4 className="font-medium mb-3 flex items-center gap-2"><Calendar className="h-4 w-4" />Suggested Meetings</h4>
                    <div className="space-y-3">
                      {aiAnalysis.meeting_suggestions.map((ms, i) => (
                        <div key={i} className="flex items-start justify-between rounded-md bg-muted/50 p-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="font-medium text-sm">{ms.title}</p>
                              <Badge variant="outline" className="text-xs">{ms.format}</Badge>
                              <Badge className={ms.priority === 'high' ? 'bg-red-500/10 text-red-600' : ms.priority === 'medium' ? 'bg-amber-500/10 text-amber-600' : 'bg-green-500/10 text-green-600'}>{ms.priority}</Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">{ms.purpose}</p>
                            <p className="text-xs text-muted-foreground mt-1">Attendees: {ms.suggested_attendees}</p>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => {
                            setNewInteraction(prev => ({
                              ...prev,
                              partner_university_id: selectedPartner.partner.id,
                              title: ms.title,
                              description: ms.purpose,
                              meeting_format: ms.format === 'in_person' ? 'in_person' : ms.format,
                              priority: ms.priority,
                            }));
                            setShowAddDialog(true);
                          }}>
                            <Plus className="h-3 w-3 mr-1" />Schedule
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Next Steps */}
                <div className="rounded-lg bg-blue-500/5 p-4">
                  <h4 className="font-medium text-blue-700 mb-2">Recommended Next Steps</h4>
                  <ol className="space-y-1 list-decimal list-inside">{aiAnalysis.recommended_next_steps.map((s, i) => <li key={i} className="text-sm">{s}</li>)}</ol>
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <Sparkles className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">Generate AI analysis to assess achievability, resources needed, and get meeting suggestions</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Interaction Timeline */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" />Interaction Timeline</CardTitle>
              <Button size="sm" onClick={() => {
                setNewInteraction(prev => ({ ...prev, partner_university_id: selectedPartner.partner.id }));
                setShowAddDialog(true);
              }}>
                <Plus className="h-4 w-4 mr-1" />Add Interaction
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />
              <div className="space-y-6">
                {selectedPartner.interactions.map((interaction, idx) => {
                  const typeInfo = INTERACTION_TYPES.find(t => t.value === interaction.interaction_type) || INTERACTION_TYPES[0];
                  const IconComp = typeInfo.icon;
                  return (
                    <div key={interaction.id} className="relative pl-10">
                      <div className={`absolute left-2 w-5 h-5 rounded-full flex items-center justify-center ${interaction.status === 'scheduled' ? 'bg-blue-500' : interaction.status === 'completed' ? 'bg-green-500' : 'bg-muted'}`}>
                        <IconComp className="h-3 w-3 text-white" />
                      </div>
                      <Card className={interaction.status === 'scheduled' ? 'border-blue-300' : ''}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <h4 className="font-medium">{interaction.title}</h4>
                                <Badge variant="outline" className="text-xs capitalize">{interaction.interaction_type}</Badge>
                                <Badge className={getStageInfo(interaction.stage).color}>{getStageInfo(interaction.stage).label}</Badge>
                                {interaction.status === 'scheduled' && <Badge className="bg-blue-500/10 text-blue-600">Upcoming</Badge>}
                              </div>
                              {interaction.meeting_date && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                                  <Calendar className="h-3 w-3" />{new Date(interaction.meeting_date).toLocaleDateString()} 
                                  {interaction.duration_minutes && ` · ${interaction.duration_minutes}min`}
                                  {interaction.location && <><MapPin className="h-3 w-3 ml-2" />{interaction.location}</>}
                                </p>
                              )}
                              {interaction.contact_person_name && (
                                <p className="text-sm text-muted-foreground flex items-center gap-1 mb-2">
                                  <User className="h-3 w-3" />{interaction.contact_person_name}
                                  {interaction.contact_person_title && ` — ${interaction.contact_person_title}`}
                                </p>
                              )}
                              {interaction.discussion_notes && <p className="text-sm mb-2">{interaction.discussion_notes}</p>}
                              {interaction.outcomes && (
                                <div className="rounded-md bg-green-500/5 p-2 mb-2">
                                  <p className="text-xs font-medium text-green-600">Outcomes</p>
                                  <p className="text-sm">{interaction.outcomes}</p>
                                </div>
                              )}
                              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                                {interaction.next_steps && <span className="flex items-center gap-1"><ArrowRight className="h-3 w-3" />Next: {interaction.next_steps}</span>}
                                {interaction.waiting_for && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Waiting: {interaction.waiting_for}</span>}
                              </div>
                            </div>
                            <div className="flex items-center gap-1">
                              {interaction.meeting_format === 'online' && <Video className="h-4 w-4 text-muted-foreground" />}
                              {interaction.meeting_format === 'in_person' && <MapPin className="h-4 w-4 text-muted-foreground" />}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Add Interaction Dialog */}
        {renderAddDialog()}
      </div>
    );
  }

  // Partner list view
  function renderAddDialog() {
    return (
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Add Partnership Interaction</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {!selectedPartner && (
              <div className="space-y-1">
                <label className="text-sm font-medium">Partner University</label>
                <Select value={newInteraction.partner_university_id} onValueChange={v => setNewInteraction(p => ({ ...p, partner_university_id: v }))}>
                  <SelectTrigger><SelectValue placeholder="Select partner..." /></SelectTrigger>
                  <SelectContent>
                    {universities.filter(u => u.id !== selectedUniversity?.id).map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Title *</label>
                <Input value={newInteraction.title} onChange={e => setNewInteraction(p => ({ ...p, title: e.target.value }))} placeholder="e.g., Initial Partnership Discussion" />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Type</label>
                <Select value={newInteraction.interaction_type} onValueChange={v => setNewInteraction(p => ({ ...p, interaction_type: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {INTERACTION_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Format</label>
                <Select value={newInteraction.meeting_format} onValueChange={v => setNewInteraction(p => ({ ...p, meeting_format: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="in_person">In Person</SelectItem>
                    <SelectItem value="online">Online</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Stage</label>
                <Select value={newInteraction.stage} onValueChange={v => setNewInteraction(p => ({ ...p, stage: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STAGES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Priority</label>
                <Select value={newInteraction.priority} onValueChange={v => setNewInteraction(p => ({ ...p, priority: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Date & Time</label>
                <Input type="datetime-local" value={newInteraction.meeting_date} onChange={e => setNewInteraction(p => ({ ...p, meeting_date: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Location</label>
                <Input value={newInteraction.location} onChange={e => setNewInteraction(p => ({ ...p, location: e.target.value }))} placeholder="e.g., Zoom, Campus Room 301" />
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-1">
                <label className="text-sm font-medium">Contact Name</label>
                <Input value={newInteraction.contact_person_name} onChange={e => setNewInteraction(p => ({ ...p, contact_person_name: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Contact Title</label>
                <Input value={newInteraction.contact_person_title} onChange={e => setNewInteraction(p => ({ ...p, contact_person_title: e.target.value }))} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Contact Email</label>
                <Input value={newInteraction.contact_person_email} onChange={e => setNewInteraction(p => ({ ...p, contact_person_email: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Discussion Notes</label>
              <Textarea value={newInteraction.discussion_notes} onChange={e => setNewInteraction(p => ({ ...p, discussion_notes: e.target.value }))} rows={3} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Outcomes</label>
              <Textarea value={newInteraction.outcomes} onChange={e => setNewInteraction(p => ({ ...p, outcomes: e.target.value }))} rows={2} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <label className="text-sm font-medium">Next Steps</label>
                <Textarea value={newInteraction.next_steps} onChange={e => setNewInteraction(p => ({ ...p, next_steps: e.target.value }))} rows={2} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium">Waiting For</label>
                <Textarea value={newInteraction.waiting_for} onChange={e => setNewInteraction(p => ({ ...p, waiting_for: e.target.value }))} rows={2} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Goals</label>
              <Textarea value={newInteraction.goals} onChange={e => setNewInteraction(p => ({ ...p, goals: e.target.value }))} rows={2} placeholder="What do you hope to achieve with this partnership?" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium">Status</label>
              <Select value={newInteraction.status} onValueChange={v => setNewInteraction(p => ({ ...p, status: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                  <SelectItem value="postponed">Postponed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Cancel</Button>
            <Button onClick={handleAddInteraction} disabled={!newInteraction.title || (!selectedPartner && !newInteraction.partner_university_id)}>
              Add Interaction
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10"><Building2 className="h-5 w-5 text-primary" /></div><div><p className="text-sm text-muted-foreground">Active Partners</p><p className="text-2xl font-bold">{partnerGroups.length}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10"><Calendar className="h-5 w-5 text-blue-600" /></div><div><p className="text-sm text-muted-foreground">Upcoming Meetings</p><p className="text-2xl font-bold">{interactions.filter(i => i.status === 'scheduled').length}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10"><CheckCircle2 className="h-5 w-5 text-green-600" /></div><div><p className="text-sm text-muted-foreground">Completed Interactions</p><p className="text-2xl font-bold">{interactions.filter(i => i.status === 'completed').length}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10"><Target className="h-5 w-5 text-amber-600" /></div><div><p className="text-sm text-muted-foreground">In Negotiation</p><p className="text-2xl font-bold">{partnerGroups.filter(g => g.latestStage === 'negotiation').length}</p></div></div></CardContent></Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Input placeholder="Search partners..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="max-w-xs" />
        <Select value={stageFilter} onValueChange={setStageFilter}>
          <SelectTrigger className="w-48"><SelectValue placeholder="Filter by stage" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Stages</SelectItem>
            {STAGES.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button onClick={() => setShowAddDialog(true)} className="ml-auto"><Plus className="h-4 w-4 mr-1" />New Interaction</Button>
      </div>

      {/* Partner Cards */}
      {filteredGroups.length > 0 ? (
        <div className="grid gap-4">
          {filteredGroups.map(group => {
            const stageInfo = getStageInfo(group.latestStage);
            const latestInteraction = group.interactions[0];
            return (
              <Card key={group.partner.id} className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50" onClick={() => setSelectedPartner(group)}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary">
                        <Building2 className="h-6 w-6 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{group.partner.name}</h3>
                          <Badge className={stageInfo.color}>{stageInfo.label}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          <MapPin className="h-3 w-3" />{group.partner.country}
                        </p>
                        {latestInteraction && (
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            {latestInteraction.contact_person_name && (
                              <span className="flex items-center gap-1"><User className="h-3 w-3" />{latestInteraction.contact_person_name}</span>
                            )}
                            {latestInteraction.meeting_date && (
                              <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />Last: {new Date(latestInteraction.meeting_date).toLocaleDateString()}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm">
                        <p><span className="font-medium">{group.completedMeetings}</span> <span className="text-muted-foreground">completed</span></p>
                        {group.upcomingMeetings > 0 && <p className="text-blue-600">{group.upcomingMeetings} upcoming</p>}
                      </div>
                      <div className="w-24">
                        <Progress value={getStageProgress(group.latestStage)} className="h-2" />
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground mb-4">No active partnerships yet</p>
            <Button onClick={() => setShowAddDialog(true)}><Plus className="h-4 w-4 mr-1" />Record First Interaction</Button>
          </CardContent>
        </Card>
      )}

      {renderAddDialog()}
    </div>
  );
}
