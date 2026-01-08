import { useState, useEffect } from 'react';
import { useUniversity } from '@/contexts/UniversityContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import {
  UserCheck,
  Plus,
  Search,
  Calendar,
  MapPin,
  Loader2,
  Briefcase,
  GraduationCap,
} from 'lucide-react';

interface FacultyExchange {
  id: string;
  faculty_name: string;
  faculty_email: string | null;
  department: string | null;
  exchange_type: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  purpose: string | null;
  outcomes: string | null;
  host_university_id: string;
  host_university?: { name: string; country: string };
}

export function FacultyExchangeManagement() {
  const { selectedUniversity, universities } = useUniversity();
  const { toast } = useToast();
  
  const [exchanges, setExchanges] = useState<FacultyExchange[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [newFacultyName, setNewFacultyName] = useState('');
  const [newFacultyEmail, setNewFacultyEmail] = useState('');
  const [newDepartment, setNewDepartment] = useState('');
  const [newHostUniversity, setNewHostUniversity] = useState('');
  const [newExchangeType, setNewExchangeType] = useState('teaching');
  const [newPurpose, setNewPurpose] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');

  useEffect(() => {
    if (selectedUniversity) {
      fetchExchanges();
    }
  }, [selectedUniversity]);

  const fetchExchanges = async () => {
    if (!selectedUniversity) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('faculty_exchanges')
        .select('*')
        .eq('university_id', selectedUniversity.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const enriched = (data || []).map(ex => {
        const host = universities.find(u => u.id === ex.host_university_id);
        return {
          ...ex,
          host_university: host ? { name: host.name, country: host.country } : undefined,
        };
      });

      setExchanges(enriched);
    } catch (error) {
      console.error('Error fetching exchanges:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createExchange = async () => {
    if (!selectedUniversity || !newFacultyName || !newHostUniversity) {
      toast({ variant: 'destructive', title: 'Please fill required fields' });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('faculty_exchanges')
        .insert({
          university_id: selectedUniversity.id,
          host_university_id: newHostUniversity,
          faculty_name: newFacultyName,
          faculty_email: newFacultyEmail || null,
          department: newDepartment || null,
          exchange_type: newExchangeType,
          purpose: newPurpose || null,
          start_date: newStartDate || null,
          end_date: newEndDate || null,
          status: 'pending',
        });

      if (error) throw error;

      toast({ title: 'Faculty exchange created!' });
      setIsAddDialogOpen(false);
      resetForm();
      fetchExchanges();
    } catch (error: any) {
      toast({ variant: 'destructive', title: 'Error', description: error.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setNewFacultyName('');
    setNewFacultyEmail('');
    setNewDepartment('');
    setNewHostUniversity('');
    setNewExchangeType('teaching');
    setNewPurpose('');
    setNewStartDate('');
    setNewEndDate('');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-500/10 text-yellow-600';
      case 'approved': return 'bg-green-500/10 text-green-600';
      case 'in-progress': return 'bg-blue-500/10 text-blue-600';
      case 'completed': return 'bg-purple-500/10 text-purple-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'teaching': return GraduationCap;
      case 'research': return Briefcase;
      default: return UserCheck;
    }
  };

  const filtered = exchanges.filter(ex => {
    const matchesSearch = ex.faculty_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || ex.exchange_type === typeFilter;
    return matchesSearch && matchesType;
  });

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
                <UserCheck className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{exchanges.length}</p>
                <p className="text-xs text-muted-foreground">Total Exchanges</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <GraduationCap className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{exchanges.filter(e => e.exchange_type === 'teaching').length}</p>
                <p className="text-xs text-muted-foreground">Teaching</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <Briefcase className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{exchanges.filter(e => e.exchange_type === 'research').length}</p>
                <p className="text-xs text-muted-foreground">Research</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <MapPin className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold">{new Set(exchanges.map(e => e.host_university_id)).size}</p>
                <p className="text-xs text-muted-foreground">Host Institutions</p>
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
              placeholder="Search faculty..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-9 w-[250px]"
            />
          </div>
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="teaching">Teaching</SelectItem>
              <SelectItem value="research">Research</SelectItem>
              <SelectItem value="sabbatical">Sabbatical</SelectItem>
              <SelectItem value="short-term">Short-term</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" /> New Exchange</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>Create Faculty Exchange</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Faculty Name *</Label>
                  <Input value={newFacultyName} onChange={e => setNewFacultyName(e.target.value)} placeholder="Dr. ..." />
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" value={newFacultyEmail} onChange={e => setNewFacultyEmail(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input value={newDepartment} onChange={e => setNewDepartment(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Exchange Type</Label>
                  <Select value={newExchangeType} onValueChange={setNewExchangeType}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="teaching">Teaching</SelectItem>
                      <SelectItem value="research">Research</SelectItem>
                      <SelectItem value="sabbatical">Sabbatical</SelectItem>
                      <SelectItem value="short-term">Short-term</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Host University *</Label>
                <Select value={newHostUniversity} onValueChange={setNewHostUniversity}>
                  <SelectTrigger><SelectValue placeholder="Select university..." /></SelectTrigger>
                  <SelectContent>
                    {universities.filter(u => u.id !== selectedUniversity?.id).map(u => (
                      <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Purpose</Label>
                <Textarea value={newPurpose} onChange={e => setNewPurpose(e.target.value)} rows={2} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input type="date" value={newStartDate} onChange={e => setNewStartDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input type="date" value={newEndDate} onChange={e => setNewEndDate(e.target.value)} />
                </div>
              </div>
              <Button className="w-full" onClick={createExchange} disabled={isSubmitting}>
                {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Create Exchange
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Exchanges Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.length === 0 ? (
          <Card className="md:col-span-2 lg:col-span-3">
            <CardContent className="flex flex-col items-center justify-center py-12">
              <UserCheck className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No faculty exchanges found</p>
            </CardContent>
          </Card>
        ) : (
          filtered.map(ex => {
            const TypeIcon = getTypeIcon(ex.exchange_type);
            return (
              <Card key={ex.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <Badge className={getStatusColor(ex.status)}>{ex.status}</Badge>
                    <Badge variant="outline" className="capitalize">{ex.exchange_type}</Badge>
                  </div>
                  <CardTitle className="text-base mt-2 flex items-center gap-2">
                    <TypeIcon className="h-4 w-4 text-primary" />
                    {ex.faculty_name}
                  </CardTitle>
                  {ex.department && (
                    <CardDescription>{ex.department}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {ex.host_university && (
                    <div className="flex items-center gap-2 text-sm">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{ex.host_university.name}</span>
                    </div>
                  )}
                  {ex.purpose && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{ex.purpose}</p>
                  )}
                  {(ex.start_date || ex.end_date) && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      {ex.start_date && new Date(ex.start_date).toLocaleDateString()}
                      {ex.end_date && ` - ${new Date(ex.end_date).toLocaleDateString()}`}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}
