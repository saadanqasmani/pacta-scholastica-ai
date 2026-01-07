import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { 
  FileText, 
  Building2, 
  ArrowLeftRight, 
  Sparkles, 
  Loader2, 
  Save,
  Plus,
  RefreshCw,
  CheckCircle,
  Globe
} from 'lucide-react';
import { useUniversity } from '@/contexts/UniversityContext';
import { supabase } from '@/integrations/supabase/client';
import { MOU, MOUClause, University } from '@/types/database';
import { ClauseEditor } from '@/components/mou/ClauseEditor';
import { StatusWorkflow, StatusTimeline } from '@/components/mou/StatusWorkflow';
import { useToast } from '@/hooks/use-toast';

const COOPERATION_SCOPES = [
  { id: 'student_exchange', label: 'Student Exchange' },
  { id: 'faculty_exchange', label: 'Faculty Exchange' },
  { id: 'joint_research', label: 'Joint Research' },
  { id: 'joint_degree', label: 'Joint Degree Programs' },
  { id: 'summer_school', label: 'Summer Schools' },
  { id: 'conferences', label: 'Joint Conferences' },
  { id: 'publications', label: 'Joint Publications' },
  { id: 'resource_sharing', label: 'Resource Sharing' },
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

  // Form state
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
        // Load existing MOU
        const { data, error } = await supabase
          .from('mous')
          .select('*')
          .eq('id', mouId)
          .single();

        if (error) throw error;
        if (data) {
          setMou(data as unknown as MOU);
          setCooperationScope(data.cooperation_scope || []);
          setClauses((data.clauses as unknown as MOUClause[]) || []);
          setStatus(data.status as MOU['status']);
          
          // Find partner
          const pId = data.initiator_university_id === selectedUniversity.id 
            ? data.partner_university_id 
            : data.initiator_university_id;
          const foundPartner = universities.find(u => u.id === pId);
          if (foundPartner) setPartner(foundPartner);
        }
      } else if (partnerId) {
        // Check for existing MOU with this partner
        const { data: existingMOU } = await supabase
          .from('mous')
          .select('*')
          .or(`and(initiator_university_id.eq.${selectedUniversity.id},partner_university_id.eq.${partnerId}),and(initiator_university_id.eq.${partnerId},partner_university_id.eq.${selectedUniversity.id})`)
          .not('status', 'eq', 'rejected')
          .maybeSingle();

        if (existingMOU) {
          setMou(existingMOU as unknown as MOU);
          setCooperationScope(existingMOU.cooperation_scope || []);
          setClauses((existingMOU.clauses as unknown as MOUClause[]) || []);
          setStatus(existingMOU.status as MOU['status']);
        }
      }
    } catch (error) {
      console.error('Error loading MOU:', error);
      toast({
        title: 'Error',
        description: 'Failed to load MOU data',
        variant: 'destructive',
      });
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
        // Update existing
        const { error } = await supabase
          .from('mous')
          .update(mouData)
          .eq('id', mou.id);

        if (error) throw error;
        
        // Log to history
        await supabase.from('mou_history').insert({
          mou_id: mou.id,
          actor_university_id: selectedUniversity.id,
          action: 'updated',
          changes: { status, clauses_count: clauses.length },
        });

        toast({ title: 'Saved', description: 'MOU updated successfully' });
      } else {
        // Create new
        const { data, error } = await supabase
          .from('mous')
          .insert(mouData)
          .select()
          .single();

        if (error) throw error;
        setMou(data as unknown as MOU);
        
        // Log creation
        await supabase.from('mou_history').insert({
          mou_id: data.id,
          actor_university_id: selectedUniversity.id,
          action: 'created',
          changes: null,
        });

        toast({ title: 'Created', description: 'MOU created successfully' });
      }
    } catch (error) {
      console.error('Error saving MOU:', error);
      toast({
        title: 'Error',
        description: 'Failed to save MOU',
        variant: 'destructive',
      });
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
        await supabase
          .from('mous')
          .update({ status: newStatus })
          .eq('id', mou.id);

        await supabase.from('mou_history').insert({
          mou_id: mou.id,
          actor_university_id: selectedUniversity.id,
          action: `status_changed_to_${newStatus}`,
          changes: { from: status, to: newStatus },
        });

        toast({ 
          title: 'Status Updated', 
          description: `MOU status changed to ${newStatus}` 
        });
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
        body: {
          cooperation_scope: cooperationScope,
          initiator_name: selectedUniversity.name,
          partner_name: partner.name,
          existing_clauses: clauses,
        },
      });

      if (error) throw error;
      if (data?.clauses) {
        setSuggestedClauses(data.clauses);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error generating suggestions:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate AI suggestions',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingClauses(false);
    }
  };

  const addSuggestedClause = (suggestion: SuggestedClause) => {
    const newClause: MOUClause = {
      id: crypto.randomUUID(),
      title: suggestion.title,
      content: suggestion.content,
      proposed_by: selectedUniversity?.id || 'ai',
    };
    setClauses([...clauses, newClause]);
    setSuggestedClauses(suggestedClauses.filter(s => s.title !== suggestion.title));
    toast({ title: 'Added', description: `Clause "${suggestion.title}" added` });
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

  // Available partners (exclude self)
  const availablePartners = universities.filter(u => u.id !== selectedUniversity?.id);

  if (!partner) {
    return (
      <div className="space-y-6 animate-fade-in">
        {/* Page Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">MOU Management</h1>
          <p className="text-muted-foreground">
            Draft, negotiate, and finalize memorandums of understanding
          </p>
        </div>

        {/* Partner Selection Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Select a Partner University
            </CardTitle>
            <CardDescription>
              Choose a partner university to create or manage an MOU
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select
              value=""
              onValueChange={(value) => {
                const selectedPartner = universities.find(u => u.id === value);
                if (selectedPartner) {
                  setPartner(selectedPartner);
                  navigate(`/mou?partner=${value}`);
                }
              }}
            >
              <SelectTrigger className="w-full max-w-md">
                <SelectValue placeholder="Select a partner university..." />
              </SelectTrigger>
              <SelectContent className="bg-background border shadow-lg z-50 max-h-[300px]">
                {availablePartners.map((uni) => (
                  <SelectItem key={uni.id} value={uni.id}>
                    <div className="flex items-center gap-2">
                      <span>{uni.name}</span>
                      <span className="text-muted-foreground text-xs">({uni.country})</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="text-sm text-muted-foreground">
              Or browse partners on the{' '}
              <Button variant="link" className="p-0 h-auto" onClick={() => navigate('/partners')}>
                Partner Discovery
              </Button>{' '}
              page to find the right match.
            </div>
          </CardContent>
        </Card>

        {/* Existing MOUs Section */}
        <ExistingMOUsList 
          universityId={selectedUniversity?.id} 
          universities={universities}
          onSelectMOU={(mouId) => navigate(`/mou?mou=${mouId}`)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">MOU Management</h1>
        <p className="text-muted-foreground">
          Draft, negotiate, and finalize memorandums of understanding
        </p>
      </div>

      {/* Partnership Header */}
      <Card className="border-l-4 border-l-primary">
        <CardContent className="py-6">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Initiator</p>
                  <p className="font-semibold">{selectedUniversity?.name}</p>
                </div>
              </div>
              <ArrowLeftRight className="h-5 w-5 text-muted-foreground" />
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary">
                  <Building2 className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Partner</p>
                  <p className="font-semibold">{partner.name}</p>
                </div>
              </div>
            </div>
            <StatusWorkflow
              currentStatus={status}
              onStatusChange={handleStatusChange}
              isInitiator={isInitiator}
              disabled={!mou?.id}
            />
          </div>
          <Separator className="my-4" />
          <StatusTimeline currentStatus={status} />
        </CardContent>
      </Card>

      {/* Cooperation Scope */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Cooperation Scope</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
            {COOPERATION_SCOPES.map((scope) => (
              <div key={scope.id} className="flex items-center space-x-2">
                <Checkbox
                  id={scope.id}
                  checked={cooperationScope.includes(scope.id)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setCooperationScope([...cooperationScope, scope.id]);
                    } else {
                      setCooperationScope(cooperationScope.filter(s => s !== scope.id));
                    }
                  }}
                  disabled={!isEditable}
                />
                <label
                  htmlFor={scope.id}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {scope.label}
                </label>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Suggestions */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              AI Clause Recommendations
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={generateAISuggestions}
              disabled={isGeneratingClauses || cooperationScope.length === 0}
            >
              {isGeneratingClauses ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Generate Suggestions
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {cooperationScope.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Select cooperation scope areas above to generate AI recommendations
            </p>
          ) : suggestedClauses.length > 0 ? (
            <div className="space-y-3">
              {suggestedClauses.map((suggestion, idx) => (
                <div 
                  key={idx}
                  className="flex items-start justify-between gap-4 rounded-lg border p-4"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium">{suggestion.title}</h4>
                      <Badge variant={suggestion.priority === 'essential' ? 'default' : 'secondary'} className="text-xs">
                        {suggestion.priority}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {suggestion.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{suggestion.content}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => addSuggestedClause(suggestion)}
                    disabled={!isEditable}
                  >
                    <Plus className="h-4 w-4 mr-1" />
                    Add
                  </Button>
                </div>
              ))}
            </div>
          ) : isGeneratingClauses ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Click "Generate Suggestions" to get AI-powered clause recommendations
            </p>
          )}
        </CardContent>
      </Card>

      {/* Clause Editor */}
      <ClauseEditor
        clauses={clauses}
        onClausesChange={setClauses}
        isEditable={isEditable}
        currentUniversityId={selectedUniversity?.id}
      />

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => navigate('/partners')}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Save className="h-4 w-4 mr-2" />
          )}
          Save MOU
        </Button>
      </div>

      {/* Confirmation Dialog */}
      <AlertDialog 
        open={confirmDialog?.open} 
        onOpenChange={() => setConfirmDialog(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog?.status === 'accepted' ? 'Accept Agreement?' : 'Reject Agreement?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog?.status === 'accepted' 
                ? 'This will finalize the MOU and make it active. Both parties will be bound by the terms.'
                : 'This will reject the MOU proposal. The initiator can create a new draft if needed.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => updateStatus(confirmDialog?.status as MOU['status'])}
              className={confirmDialog?.status === 'rejected' ? 'bg-destructive text-destructive-foreground' : ''}
            >
              {confirmDialog?.status === 'accepted' ? 'Accept' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// Component to show existing MOUs
function ExistingMOUsList({ 
  universityId, 
  universities,
  onSelectMOU 
}: { 
  universityId?: string; 
  universities: University[];
  onSelectMOU: (mouId: string) => void;
}) {
  const [mous, setMous] = useState<MOU[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!universityId) return;

    const fetchMOUs = async () => {
      setIsLoading(true);
      try {
        const { data, error } = await supabase
          .from('mous')
          .select('*')
          .or(`initiator_university_id.eq.${universityId},partner_university_id.eq.${universityId}`)
          .order('updated_at', { ascending: false });

        if (error) throw error;
        setMous((data || []) as unknown as MOU[]);
      } catch (error) {
        console.error('Error fetching MOUs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMOUs();
  }, [universityId]);

  const getPartnerName = (mou: MOU) => {
    const partnerId = mou.initiator_university_id === universityId 
      ? mou.partner_university_id 
      : mou.initiator_university_id;
    const partner = universities.find(u => u.id === partnerId);
    return partner?.name || 'Unknown Partner';
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'outline' | 'destructive'> = {
      draft: 'secondary',
      pending: 'outline',
      pending_review: 'outline',
      pending_approval: 'outline',
      counter_proposed: 'outline',
      revised: 'outline',
      accepted: 'default',
      rejected: 'destructive',
    };
    return variants[status] || 'secondary';
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (mous.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Existing MOUs
        </CardTitle>
        <CardDescription>
          View and manage your existing memorandums of understanding
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {mous.map((mou) => (
            <div
              key={mou.id}
              className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 cursor-pointer transition-colors"
              onClick={() => onSelectMOU(mou.id)}
            >
              <div className="flex items-center gap-3">
                <Building2 className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium">{getPartnerName(mou)}</p>
                  <p className="text-xs text-muted-foreground">
                    {mou.cooperation_scope?.length || 0} cooperation areas
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={getStatusBadge(mou.status)} className="capitalize">
                  {mou.status.replace('_', ' ')}
                </Badge>
                <CheckCircle className={`h-4 w-4 ${mou.status === 'accepted' ? 'text-green-600' : 'text-muted-foreground/30'}`} />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
