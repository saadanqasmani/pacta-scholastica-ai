import { useState, useEffect } from 'react';
import { useUniversity } from '@/contexts/UniversityContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import {
  Beaker,
  Plus,
  Search,
  Users,
  DollarSign,
  BookOpen,
  Calendar,
  Loader2,
  Building2,
  TrendingUp,
} from 'lucide-react';

interface ResearchCollaboration {
  id: string;
  project_title: string;
  description: string | null;
  research_area: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
  funding_source: string | null;
  funding_amount: number | null;
  principal_investigator: string | null;
  partner_investigator: string | null;
  publications_count: number;
  partner_university_id: string;
  partner_university?: { name: string; country: string };
}

export function ResearchCollaborations() {
  const { selectedUniversity, universities } = useUniversity();
  const { toast } = useToast();
  
  const [collaborations, setCollaborations] = useState<ResearchCollaboration[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [newTitle, setNewTitle] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newArea, setNewArea] = useState('');
  const [newPartner, setNewPartner] = useState('');
  const [newFundingSource, setNewFundingSource] = useState('');
  const [newFundingAmount, setNewFundingAmount] = useState('');
  const [newPI, setNewPI] = useState('');
  const [newPartnerPI, setNewPartnerPI] = useState('');

  useEffect(() => {
    if (selectedUniversity) {
      fetchCollaborations();
    }
  }, [selectedUniversity]);

  const fetchCollaborations = async () => {
    if (!selectedUniversity) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('research_collaborations')
        .select('*')
        .eq('university_id', selectedUniversity.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const enriched = (data || []).map(collab => {
        const partner = universities.find(u => u.id === collab.partner_university_id);
        return {
          ...collab,
          partner_university: partner ? { name: partner.name, country: partner.country } : undefined,
        };
      });

      setCollaborations(enriched);
    } catch (error) {
      console.error('Error fetching collaborations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createCollaboration = async () => {
    if (!selectedUniversity || !newTitle || !newPartner) {
      toast({ variant: 'destructive', title: 'Please fill required fields' });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('research_collaborations')
        .insert({
          university_id: selectedUniversity.id,
          partner_university_id: newPartner,
          project_title: newTitle,
          description: newDescription || null,
          research_area: newArea || null,
          funding_source: newFundingSource || null,
          funding_amount: newFundingAmount ? parseFloat(newFundingAmount) : null,
          principal_investigator: newPI || null,
          partner_investigator: newPartnerPI || null,
          status: 'active',
          start_date: new Date().toISOString().split('T')[0],
        });

      if (error) throw error;

      toast({ title: 'Research collaboration created!' });
      setIsAddDialogOpen(false);
      resetForm();
      fetchCollaborations();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setNewTitle('');
    setNewDescription('');
    setNewArea('');
    setNewPartner('');
    setNewFundingSource('');
    setNewFundingAmount('');
    setNewPI('');
    setNewPartnerPI('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-600';
      case 'completed': return 'bg-blue-500/10 text-blue-600';
      case 'proposed': return 'bg-yellow-500/10 text-yellow-600';
      case 'suspended': return 'bg-red-500/10 text-red-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const filtered = collaborations.filter(c => {
    const matchesSearch = c.project_title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalFunding = collaborations.reduce((sum, c) => sum + (c.funding_amount || 0), 0);
  const totalPublications = collaborations.reduce((sum, c) => sum + c.publications_count, 0);

  if (isLoading) {
    return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Beaker className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{collaborations.length}</p>
                <p className="text-xs text-muted-foreground">Active Projects</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <DollarSign className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">${(totalFunding / 1000).toFixed(0)}k</p>
                <p className="text-xs text-muted-foreground">Total Funding</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <BookOpen className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{totalPublications}</p>
                <p className="text-xs text-muted-foreground">Publications</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <Building2 className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{new Set(collaborations.map(c => c.partner_university_id)).size}</p>
                <p className="text-xs text-muted-foreground">Partner Institutions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 w-[250px]"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="proposed">Proposed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> New Collaboration</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create Research Collaboration</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Project Title *</Label>
                <Input value={newTitle} onChange={e => setNewTitle(e.target.value)} placeholder="Joint Research on..." />
              </div>
              <div className="space-y-2">
                <Label>Partner University *</Label>
                <Select value={newPartner} onValueChange={setNewPartner}>
                  <SelectTrigger><SelectValue placeholder="Select partner..." /></SelectTrigger>
                  <SelectContent>
                    {universities.filter(u => u.id !== selectedUniversity?.id).map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Research Area</Label>
                <Input value={newArea} onChange={e => setNewArea(e.target.value)} placeholder="e.g., AI, Biotech..." />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea value={newDescription} onChange={e => setNewDescription(e.target.value)} rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Principal Investigator</Label>
                  <Input value={newPI} onChange={e => setNewPI(e.target.value)} placeholder="Dr. ..." />
                </div>
                <div className="space-y-2">
                  <Label>Partner PI</Label>
                  <Input value={newPartnerPI} onChange={e => setNewPartnerPI(e.target.value)} placeholder="Dr. ..." />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Funding Source</Label>
                  <Input value={newFundingSource} onChange={e => setNewFundingSource(e.target.value)} placeholder="e.g., Horizon Europe" />
                </div>
                <div className="space-y-2">
                  <Label>Amount (USD)</Label>
                  <Input type="number" value={newFundingAmount} onChange={e => setNewFundingAmount(e.target.value)} placeholder="50000" />
                </div>
              </div>
              <Button className="w-full" onClick={createCollaboration} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Create Collaboration
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Projects Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 ? (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Beaker className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No research collaborations found</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map(collab => (
            <Card key={collab.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <Badge className={getStatusColor(collab.status)}>{collab.status}</Badge>
                  {collab.research_area && (
                    <Badge variant="outline">{collab.research_area}</Badge>
                  )}
                </div>
                <CardTitle className="text-base mt-2">{collab.project_title}</CardTitle>
                {collab.partner_university && (
                  <CardDescription className="flex items-center gap-1">
                    <Building2 className="h-3 w-3" />
                    {collab.partner_university.name}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-3">
                {collab.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{collab.description}</p>
                )}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {collab.principal_investigator && (
                    <div>
                      <p className="text-muted-foreground">PI</p>
                      <p className="font-medium">{collab.principal_investigator}</p>
                    </div>
                  )}
                  {collab.funding_amount && (
                    <div>
                      <p className="text-muted-foreground">Funding</p>
                      <p className="font-medium">${collab.funding_amount.toLocaleString()}</p>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-4 pt-2 border-t text-xs">
                  <div className="flex items-center gap-1">
                    <BookOpen className="h-3 w-3 text-muted-foreground" />
                    {collab.publications_count} publications
                  </div>
                  {collab.start_date && (
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      {new Date(collab.start_date).getFullYear()}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
