import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { FileText, Building2, ArrowLeftRight, Sparkles, Loader2, Save, Plus, RefreshCw, CheckCircle, Globe, Search, Trash2, MoreHorizontal } from 'lucide-react';
import { useUniversity } from '@/contexts/UniversityContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { MOU, MOUClause, University } from '@/types/database';
import { ClauseEditor } from '@/components/mou/ClauseEditor';
import { StatusWorkflow, StatusTimeline } from '@/components/mou/StatusWorkflow';
import { useToast } from '@/hooks/use-toast';

const COOPERATION_SCOPES = [
  { id: 'student_exchange', labelKey: 'mou.scope.studentExchange' },
  { id: 'faculty_exchange', labelKey: 'mou.scope.facultyExchange' },
  { id: 'joint_research', labelKey: 'mou.scope.jointResearch' },
  { id: 'joint_degree', labelKey: 'mou.scope.jointDegree' },
  { id: 'summer_school', labelKey: 'mou.scope.summerSchool' },
  { id: 'conferences', labelKey: 'mou.scope.conferences' },
  { id: 'publications', labelKey: 'mou.scope.publications' },
  { id: 'resource_sharing', labelKey: 'mou.scope.resourceSharing' },
];

interface SuggestedClause {
  title: string;
  content: string;
  category: string;
  priority: string;
}

export default function MOUManagement() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { selectedUniversity, universities } = useUniversity();
  const { t, language } = useLanguage();
  const { toast } = useToast();

  const partnerId = searchParams.get('partner');
  const mouId = searchParams.get('mou');

  const [partner, setPartner] = useState<University | null>(null);
  const [mou, setMou] = useState<MOU | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingClauses, setIsGeneratingClauses] = useState(false);
  const [suggestedClauses, setSuggestedClauses] = useState<SuggestedClause[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{ open: boolean; status: string } | null>(null);

  const [cooperationScope, setCooperationScope] = useState<string[]>([]);
  const [clauses, setClauses] = useState<MOUClause[]>([]);
  const [status, setStatus] = useState<MOU['status']>('draft');

  useEffect(() => {
    if (partnerId) {
      const foundPartner = universities.find(u => u.id === partnerId);
      if (foundPartner) setPartner(foundPartner);
    }
    loadOrCreateMOU();
  }, [partnerId, mouId, universities, selectedUniversity?.id]);

  const loadOrCreateMOU = async () => {
    if (!selectedUniversity) return;
    setIsLoading(true);
    try {
      if (mouId) {
        const { data, error } = await supabase.from('mous').select('*').eq('id', mouId).single();
        if (error) throw error;
        if (data) {
          setMou(data as unknown as MOU);
          setCooperationScope(data.cooperation_scope || []);
          setClauses((data.clauses as unknown as MOUClause[]) || []);
          setStatus(data.status as MOU['status']);
          const pId = data.initiator_university_id === selectedUniversity.id ? data.partner_university_id : data.initiator_university_id;
          const foundPartner = universities.find(u => u.id === pId);
          if (foundPartner) setPartner(foundPartner);
        }
      } else if (partnerId) {
        const { data: existingMOU } = await supabase.from('mous').select('*').or(`and(initiator_university_id.eq.${selectedUniversity.id},partner_university_id.eq.${partnerId}),and(initiator_university_id.eq.${partnerId},partner_university_id.eq.${selectedUniversity.id})`).not('status', 'eq', 'rejected').maybeSingle();
        if (existingMOU) {
          setMou(existingMOU as unknown as MOU);
          setCooperationScope(existingMOU.cooperation_scope || []);
          setClauses((existingMOU.clauses as unknown as MOUClause[]) || []);
          setStatus(existingMOU.status as MOU['status']);
        }
      }
    } catch (error) {
      console.error('Error loading MOU:', error);
      toast({ title: t('common.error'), description: 'Failed to load MOU data', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedUniversity || !partner) return;
    setIsSaving(true);
    try {
      const mouData = {
        initiator_university_id: selectedUniversity.id,
        partner_university_id: partner.id,
        status,
        cooperation_scope: cooperationScope,
        clauses: JSON.parse(JSON.stringify(clauses)),
      };
      if (mou?.id) {
        const { error } = await supabase.from('mous').update(mouData).eq('id', mou.id);
        if (error) throw error;
        await supabase.from('mou_history').insert({ mou_id: mou.id, actor_university_id: selectedUniversity.id, action: 'updated', changes: { status, clauses_count: clauses.length } });
        toast({ title: t('mou.saved'), description: t('mou.savedDesc') });
      } else {
        const { data, error } = await supabase.from('mous').insert(mouData).select().single();
        if (error) throw error;
        setMou(data as unknown as MOU);
        await supabase.from('mou_history').insert({ mou_id: data.id, actor_university_id: selectedUniversity.id, action: 'created', changes: null });
        toast({ title: t('mou.created'), description: t('mou.createdDesc') });
      }
    } catch (error) {
      console.error('Error saving MOU:', error);
      toast({ title: t('mou.error'), description: t('mou.errorDesc'), variant: 'destructive' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleStatusChange = async (newStatus: MOU['status']) => {
    if (newStatus === 'accepted' || newStatus === 'rejected') {
      setConfirmDialog({ open: true, status: newStatus });
      return;
    }
    await updateStatus(newStatus);
  };

  const updateStatus = async (newStatus: MOU['status']) => {
    setStatus(newStatus);
    if (mou?.id && selectedUniversity) {
      try {
        await supabase.from('mous').update({ status: newStatus }).eq('id', mou.id);
        await supabase.from('mou_history').insert({ mou_id: mou.id, actor_university_id: selectedUniversity.id, action: `status_changed_to_${newStatus}`, changes: { from: status, to: newStatus } });
        toast({ title: t('mou.statusUpdated'), description: `MOU status changed to ${newStatus}` });
      } catch (error) {
        console.error('Error updating status:', error);
      }
    }
    setConfirmDialog(null);
  };

  const generateAISuggestions = async () => {
    if (!selectedUniversity || !partner) return;
    setIsGeneratingClauses(true);
    setSuggestedClauses([]);
    try {
      const { data, error } = await supabase.functions.invoke('mou-suggest', {
        body: { cooperation_scope: cooperationScope, initiator_name: selectedUniversity.name, partner_name: partner.name, existing_clauses: clauses, language },
      });
      if (error) throw error;
      if (data?.clauses) {
        setSuggestedClauses(data.clauses);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast({ title: t('common.error'), description: 'Failed to generate AI suggestions', variant: 'destructive' });
    } finally {
      setIsGeneratingClauses(false);
    }
  };

  const addSuggestedClause = (suggestion: SuggestedClause) => {
    const newClause: MOUClause = { id: crypto.randomUUID(), title: suggestion.title, content: suggestion.content, proposed_by: selectedUniversity?.id || 'ai' };
    setClauses([...clauses, newClause]);
    setSuggestedClauses(suggestedClauses.filter(s => s.title !== suggestion.title));
    toast({ title: t('common.success'), description: `Clause "${suggestion.title}" added` });
  };

  const isInitiator = mou ? mou.initiator_university_id === selectedUniversity?.id : true;
  const isEditable = status === 'draft' || (status === 'counter_proposed' && isInitiator) || (status === 'revised' && !isInitiator);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const availablePartners = universities.filter(u => u.id !== selectedUniversity?.id);

  if (!partner) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">{t('mou.title')}</h1>
          <p className="text-muted-foreground">{t('mou.subtitle')}</p>
        </div>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" />{t('mou.selectPartner')}</CardTitle>
            <CardDescription>{t('mou.selectPartnerDesc')}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value="" onValueChange={(value) => {
              const selectedPartner = universities.find(u => u.id === value);
              if (selectedPartner) {
                setPartner(selectedPartner);
                navigate(`/mou?partner=${value}`);
              }
            }}>
              <SelectTrigger className="w-full max-w-md"><SelectValue placeholder={t('mou.selectPartnerPlaceholder')} /></SelectTrigger>
              <SelectContent className="bg-background border shadow-lg z-50 max-h-[300px]">
                {availablePartners.map((uni) => (
                  <SelectItem key={uni.id} value={uni.id}><div className="flex items-center gap-2"><span>{uni.name}</span><span className="text-muted-foreground text-xs">({uni.country})</span></div></SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="text-sm text-muted-foreground">
              {t('mou.browsePartnersText')} <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/partners')}>{t('mou.partnerDiscovery')}</Button> {t('mou.pageToFindMatch')}
            </div>
          </CardContent>
        </Card>
        <ExistingMOUsList universityId={selectedUniversity?.id} universities={universities} onSelectMOU={(mouId) => navigate(`/mou?mou=${mouId}`)} />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{t('mou.title')}</h1>
        <p className="text-muted-foreground">{t('mou.subtitle')}</p>
      </div>
      <Card className="border-l-4 border-l-primary">
        <CardContent className="py-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10"><Building2 className="h-6 w-6 text-primary" /></div>
                <div><p className="text-sm text-muted-foreground">{t('mou.initiator')}</p><p className="font-semibold">{selectedUniversity?.name}</p></div>
              </div>
              <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary"><Building2 className="h-6 w-6 text-muted-foreground" /></div>
                <div><p className="text-sm text-muted-foreground">{t('mou.partner')}</p><p className="font-semibold">{partner.name}</p></div>
              </div>
            </div>
            <StatusWorkflow currentStatus={status} onStatusChange={handleStatusChange} isInitiator={isInitiator} disabled={!mou?.id} />
          </div>
          <Separator className="my-4" />
          <StatusTimeline currentStatus={status} />
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-lg">{t('mou.cooperationScope')}</CardTitle></CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {COOPERATION_SCOPES.map((scope) => (
              <div key={scope.id} className="flex items-center space-x-2">
                <Checkbox id={scope.id} checked={cooperationScope.includes(scope.id)} onCheckedChange={(checked) => { if (checked) setCooperationScope([...cooperationScope, scope.id]); else setCooperationScope(cooperationScope.filter(s => s !== scope.id)); }} disabled={!isEditable} />
                <label htmlFor={scope.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{t(scope.labelKey)}</label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2"><Sparkles className="h-5 w-5 text-primary" />{t('mou.aiClauseRecommendations')}</CardTitle>
            <Button variant="outline" size="sm" onClick={generateAISuggestions} disabled={isGeneratingClauses || cooperationScope.length === 0}>
              {isGeneratingClauses ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />}{t('mou.generateSuggestions')}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {cooperationScope.length === 0 ? <p className="text-sm text-muted-foreground">{t('mou.selectScopeFirst')}</p> : suggestedClauses.length > 0 ? (
            <div className="space-y-3">
              {suggestedClauses.map((suggestion, idx) => (
                <div key={idx} className="flex items-start justify-between gap-4 rounded-lg border p-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{suggestion.title}</h4>
                      <Badge variant={suggestion.priority === 'essential' ? 'default' : 'secondary'} className="text-xs">{suggestion.priority}</Badge>
                      <Badge variant="outline" className="text-xs">{suggestion.category}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{suggestion.content}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => addSuggestedClause(suggestion)} disabled={!isEditable}><Plus className="h-4 w-4 mr-1" />{t('common.add')}</Button>
                </div>
              ))}
            </div>
          ) : isGeneratingClauses ? <div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div> : <p className="text-sm text-muted-foreground">Click "{t('mou.generateSuggestions')}" to get AI recommendations</p>}
        </CardContent>
      </Card>
      <ClauseEditor clauses={clauses} onClausesChange={setClauses} isEditable={isEditable} currentUniversityId={selectedUniversity?.id} />
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate('/partners')}>{t('common.cancel')}</Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}{t('mou.save')}
        </Button>
      </div>
      <AlertDialog open={confirmDialog?.open} onOpenChange={() => setConfirmDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmDialog?.status === 'accepted' ? t('partnerships.accept') : t('partnerships.reject')}?</AlertDialogTitle>
            <AlertDialogDescription>{confirmDialog?.status === 'accepted' ? 'This will finalize the MOU and make it active.' : 'This will reject the MOU proposal.'}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={() => updateStatus(confirmDialog?.status as MOU['status'])} className={confirmDialog?.status === 'rejected' ? 'bg-destructive text-destructive-foreground' : ''}>{t('common.confirm')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function ExistingMOUsList({ universityId, universities, onSelectMOU }: { universityId?: string; universities: University[]; onSelectMOU: (mouId: string) => void; }) {
  const [mous, setMous] = useState<MOU[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedMouIds, setSelectedMouIds] = useState<string[]>([]);
  const [bulkStatusDialog, setBulkStatusDialog] = useState(false);
  const [bulkDeleteDialog, setBulkDeleteDialog] = useState(false);
  const [bulkNewStatus, setBulkNewStatus] = useState<string>('');
  const [isBulkUpdating, setIsBulkUpdating] = useState(false);
  const { toast } = useToast();
  const { t } = useLanguage();

  useEffect(() => {
    if (!universityId) return;
    const fetchMOUs = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase.from('mous').select('*').or(`initiator_university_id.eq.${universityId},partner_university_id.eq.${universityId}`).order('updated_at', { ascending: false });
        if (error) throw error;
        setMous((data || []) as unknown as MOU[]);
      } catch (error) { console.error('Error fetching MOUs:', error); } finally { setIsLoading(false); }
    };
    fetchMOUs();
  }, [universityId]);

  const getPartnerName = (mou: MOU) => {
    const partnerId = mou.initiator_university_id === universityId ? mou.partner_university_id : mou.initiator_university_id;
    return universities.find(u => u.id === partnerId)?.name || 'Unknown Partner';
  };

  const getPartnerCountry = (mou: MOU) => {
    const partnerId = mou.initiator_university_id === universityId ? mou.partner_university_id : mou.initiator_university_id;
    return universities.find(u => u.id === partnerId)?.country || '';
  };

  const filteredMous = mous.filter(mou => {
    const matchesSearch = searchQuery === '' || getPartnerName(mou).toLowerCase().includes(searchQuery.toLowerCase()) || getPartnerCountry(mou).toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || mou.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleSelectMou = (mouId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedMouIds(prev => prev.includes(mouId) ? prev.filter(id => id !== mouId) : [...prev, mouId]);
  };

  const toggleSelectAll = () => {
    setSelectedMouIds(selectedMouIds.length === filteredMous.length ? [] : filteredMous.map(m => m.id));
  };

  const handleBulkStatusUpdate = async () => {
    if (!bulkNewStatus || selectedMouIds.length === 0 || !universityId) return;
    setIsBulkUpdating(true);
    try {
      const { error } = await supabase.from('mous').update({ status: bulkNewStatus }).in('id', selectedMouIds);
      if (error) throw error;
      await supabase.from('mou_history').insert(selectedMouIds.map(mouId => ({ mou_id: mouId, actor_university_id: universityId, action: `bulk_status_changed_to_${bulkNewStatus}`, changes: { to: bulkNewStatus } })));
      setMous(prev => prev.map(mou => selectedMouIds.includes(mou.id) ? { ...mou, status: bulkNewStatus as MOU['status'] } : mou));
      toast({ title: t('mou.statusUpdated'), description: `Updated ${selectedMouIds.length} MOUs` });
      setSelectedMouIds([]); setBulkStatusDialog(false); setBulkNewStatus('');
    } catch (error) { console.error('Error updating MOUs:', error); toast({ title: t('mou.error'), variant: 'destructive' }); } finally { setIsBulkUpdating(false); }
  };

  const handleBulkDelete = async () => {
    if (selectedMouIds.length === 0) return;
    setIsBulkUpdating(true);
    try {
      await supabase.from('mou_history').delete().in('mou_id', selectedMouIds);
      const { error } = await supabase.from('mous').delete().in('id', selectedMouIds);
      if (error) throw error;
      setMous(prev => prev.filter(mou => !selectedMouIds.includes(mou.id)));
      toast({ title: t('common.success'), description: `Deleted ${selectedMouIds.length} MOUs` });
      setSelectedMouIds([]); setBulkDeleteDialog(false);
    } catch (error) { console.error('Error deleting MOUs:', error); toast({ title: t('mou.error'), variant: 'destructive' }); } finally { setIsBulkUpdating(false); }
  };

  if (isLoading) return <Card><CardContent className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></CardContent></Card>;
  if (mous.length === 0) return null;

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />{t('mou.existingMOUs')}<Badge variant="outline" className="ml-2">{mous.length}</Badge></CardTitle>
          <CardDescription>View and manage existing MOUs</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedMouIds.length > 0 && (
            <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20 animate-fade-in">
              <div className="flex items-center gap-2"><Checkbox checked={selectedMouIds.length === filteredMous.length} onCheckedChange={toggleSelectAll} /><span className="text-sm font-medium">{selectedMouIds.length} selected</span></div>
              <div className="flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => setBulkStatusDialog(true)}><MoreHorizontal className="h-4 w-4 mr-1" />Update Status</Button>
                <Button size="sm" variant="destructive" onClick={() => setBulkDeleteDialog(true)}><Trash2 className="h-4 w-4 mr-1" />{t('common.delete')}</Button>
              </div>
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input type="text" placeholder={t('common.search')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary" />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40"><SelectValue placeholder={t('mou.status')} /></SelectTrigger>
              <SelectContent className="bg-background border shadow-lg z-50">
                <SelectItem value="all">{t('specialCases.allStatuses')}</SelectItem>
                {[...new Set(mous.map(m => m.status))].map(status => (<SelectItem key={status} value={status} className="capitalize">{status.replace('_', ' ')}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            {filteredMous.length > 0 ? filteredMous.map((mou) => (
              <div key={mou.id} className={`flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors ${selectedMouIds.includes(mou.id) ? 'bg-primary/5 border-primary/30' : ''}`} onClick={() => onSelectMOU(mou.id)}>
                <div className="flex items-center gap-3">
                  <Checkbox checked={selectedMouIds.includes(mou.id)} onCheckedChange={() => {}} onClick={(e) => toggleSelectMou(mou.id, e)} />
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  <div><p className="font-medium">{getPartnerName(mou)}</p><p className="text-xs text-muted-foreground">{getPartnerCountry(mou)}</p></div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={['accepted'].includes(mou.status) ? 'default' : 'secondary'} className="capitalize">{mou.status.replace('_', ' ')}</Badge>
                  <CheckCircle className={`h-4 w-4 ${mou.status === 'accepted' ? 'text-green-600' : 'text-muted-foreground/30'}`} />
                </div>
              </div>
            )) : <div className="text-center py-8 text-muted-foreground"><FileText className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>{t('mou.noExistingMOUs')}</p></div>}
          </div>
        </CardContent>
      </Card>
      <AlertDialog open={bulkStatusDialog} onOpenChange={setBulkStatusDialog}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Update Status</AlertDialogTitle><AlertDialogDescription>Select new status.</AlertDialogDescription></AlertDialogHeader>
          <div className="py-4">
            <Select value={bulkNewStatus} onValueChange={setBulkNewStatus}>
              <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
              <SelectContent className="bg-background border shadow-lg z-50">
                {['draft', 'pending', 'accepted', 'rejected'].map(status => (<SelectItem key={status} value={status} className="capitalize">{status}</SelectItem>))}
              </SelectContent>
            </Select>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkUpdating}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkStatusUpdate} disabled={!bulkNewStatus || isBulkUpdating}>Update</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={bulkDeleteDialog} onOpenChange={setBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete MOUs?</AlertDialogTitle><AlertDialogDescription>Cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBulkUpdating}>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} disabled={isBulkUpdating} className="bg-destructive text-destructive-foreground">{t('common.delete')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
