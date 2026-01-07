import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
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
  Handshake, 
  Building2, 
  Sparkles, 
  Loader2, 
  RefreshCw,
  MessageSquare,
  FolderKanban,
  Inbox,
  Send,
  Check,
  X,
  Clock,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Mail,
  Calendar,
  DollarSign
} from 'lucide-react';
import { useUniversity } from '@/contexts/UniversityContext';
import { supabase } from '@/integrations/supabase/client';
import { PartnerRequest, PartnerProject, PartnerMessage, University, PartnerROI } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

interface PartnerWithData {
  university: University;
  projects: PartnerProject[];
  roi: PartnerROI[];
  messages: PartnerMessage[];
  mou_status?: string;
}

interface AIRecommendation {
  partner_name: string;
  action: 'expand' | 'maintain' | 'restructure' | 'pause';
  priority: 'high' | 'medium' | 'low';
  recommendation: string;
  next_steps: string;
  opportunity?: string;
  risk?: string;
}

export default function PartnershipManagement() {
  const { selectedUniversity, universities } = useUniversity();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [partners, setPartners] = useState<PartnerWithData[]>([]);
  const [requests, setRequests] = useState<PartnerRequest[]>([]);
  const [allProjects, setAllProjects] = useState<PartnerProject[]>([]);
  const [allMessages, setAllMessages] = useState<PartnerMessage[]>([]);
  
  // AI Recommendations
  const [aiRecommendations, setAiRecommendations] = useState<AIRecommendation[]>([]);
  const [overallStrategy, setOverallStrategy] = useState('');
  const [isGeneratingAI, setIsGeneratingAI] = useState(false);

  // Message Dialog
  const [messageDialog, setMessageDialog] = useState<{ open: boolean; partnerId?: string; partnerName?: string }>({ open: false });
  const [newMessage, setNewMessage] = useState({ subject: '', message: '', type: 'general' });
  const [isSending, setIsSending] = useState(false);

  // Request Dialog
  const [requestDialog, setRequestDialog] = useState<{ open: boolean; request?: PartnerRequest; action?: 'accept' | 'reject' }>({ open: false });

  useEffect(() => {
    if (selectedUniversity) {
      fetchAllData();
    }
  }, [selectedUniversity?.id]);

  const fetchAllData = async () => {
    if (!selectedUniversity) return;
    setIsLoading(true);

    try {
      // Fetch projects
      const { data: projectsData } = await supabase
        .from('partner_projects')
        .select('*')
        .eq('university_id', selectedUniversity.id);
      
      setAllProjects((projectsData || []) as PartnerProject[]);

      // Fetch messages
      const { data: messagesData } = await supabase
        .from('partner_messages')
        .select('*')
        .or(`from_university_id.eq.${selectedUniversity.id},to_university_id.eq.${selectedUniversity.id}`)
        .order('created_at', { ascending: false });
      
      setAllMessages((messagesData || []) as PartnerMessage[]);

      // Fetch incoming requests
      const { data: requestsData } = await supabase
        .from('partner_requests')
        .select('*')
        .eq('to_university_id', selectedUniversity.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
      
      setRequests((requestsData || []) as PartnerRequest[]);

      // Fetch partner ROI
      const { data: roiData } = await supabase
        .from('partner_roi')
        .select('*')
        .eq('university_id', selectedUniversity.id);

      // Fetch MOUs
      const { data: mousData } = await supabase
        .from('mous')
        .select('*')
        .or(`initiator_university_id.eq.${selectedUniversity.id},partner_university_id.eq.${selectedUniversity.id}`);

      // Build partner data map
      const partnerIds = new Set<string>();
      (projectsData || []).forEach((p: any) => partnerIds.add(p.partner_university_id));
      (roiData || []).forEach((r: any) => partnerIds.add(r.partner_university_id));
      (mousData || []).forEach((m: any) => {
        if (m.initiator_university_id === selectedUniversity.id) {
          partnerIds.add(m.partner_university_id);
        } else {
          partnerIds.add(m.initiator_university_id);
        }
      });

      const partnersWithData: PartnerWithData[] = [];
      partnerIds.forEach(partnerId => {
        const uni = universities.find(u => u.id === partnerId);
        if (uni) {
          const partnerProjects = (projectsData || []).filter((p: any) => p.partner_university_id === partnerId) as PartnerProject[];
          const partnerRoi = (roiData || []).filter((r: any) => r.partner_university_id === partnerId) as PartnerROI[];
          const partnerMessages = (messagesData || []).filter((m: any) => 
            m.from_university_id === partnerId || m.to_university_id === partnerId
          ) as PartnerMessage[];
          const mou = (mousData || []).find((m: any) => 
            (m.initiator_university_id === selectedUniversity.id && m.partner_university_id === partnerId) ||
            (m.partner_university_id === selectedUniversity.id && m.initiator_university_id === partnerId)
          );
          
          partnersWithData.push({
            university: uni,
            projects: partnerProjects,
            roi: partnerRoi,
            messages: partnerMessages,
            mou_status: mou?.status,
          });
        }
      });

      setPartners(partnersWithData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateAIRecommendations = async () => {
    if (!selectedUniversity || partners.length === 0) return;
    setIsGeneratingAI(true);

    try {
      const partnerSummary = partners.map(p => ({
        name: p.university.name,
        country: p.university.country,
        projects_count: p.projects.length,
        mou_status: p.mou_status,
        satisfaction: p.roi.length > 0 
          ? (p.roi.reduce((sum, r) => sum + Number(r.satisfaction_score), 0) / p.roi.length).toFixed(1)
          : null,
      }));

      const { data, error } = await supabase.functions.invoke('partner-advisor', {
        body: {
          partners: partnerSummary,
          university_name: selectedUniversity.name,
        },
      });

      if (error) throw error;
      if (data?.recommendations) {
        setAiRecommendations(data.recommendations);
        setOverallStrategy(data.overall_strategy || '');
      }
    } catch (error) {
      console.error('Error generating AI recommendations:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate AI recommendations',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingAI(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedUniversity || !messageDialog.partnerId || !newMessage.subject || !newMessage.message) return;
    setIsSending(true);

    try {
      const { error } = await supabase.from('partner_messages').insert({
        from_university_id: selectedUniversity.id,
        to_university_id: messageDialog.partnerId,
        subject: newMessage.subject,
        message: newMessage.message,
        message_type: newMessage.type,
      });

      if (error) throw error;
      
      toast({ title: 'Sent', description: 'Message sent successfully' });
      setMessageDialog({ open: false });
      setNewMessage({ subject: '', message: '', type: 'general' });
      fetchAllData();
    } catch (error) {
      console.error('Error sending message:', error);
      toast({ title: 'Error', description: 'Failed to send message', variant: 'destructive' });
    } finally {
      setIsSending(false);
    }
  };

  const handleRequestAction = async (action: 'accept' | 'reject') => {
    if (!requestDialog.request) return;

    try {
      const { error } = await supabase
        .from('partner_requests')
        .update({ 
          status: action === 'accept' ? 'accepted' : 'rejected',
          responded_at: new Date().toISOString(),
        })
        .eq('id', requestDialog.request.id);

      if (error) throw error;

      toast({ 
        title: action === 'accept' ? 'Accepted' : 'Rejected', 
        description: `Request has been ${action}ed` 
      });
      setRequestDialog({ open: false });
      fetchAllData();
    } catch (error) {
      console.error('Error updating request:', error);
      toast({ title: 'Error', description: 'Failed to update request', variant: 'destructive' });
    }
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'expand': return 'bg-green-500/10 text-green-600';
      case 'maintain': return 'bg-blue-500/10 text-blue-600';
      case 'restructure': return 'bg-amber-500/10 text-amber-600';
      case 'pause': return 'bg-red-500/10 text-red-600';
      default: return 'bg-gray-500/10 text-gray-600';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/10 text-red-600 border-red-300';
      case 'medium': return 'bg-amber-500/10 text-amber-600 border-amber-300';
      case 'low': return 'bg-green-500/10 text-green-600 border-green-300';
      default: return '';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/10 text-green-600';
      case 'planning': return 'bg-blue-500/10 text-blue-600';
      case 'completed': return 'bg-gray-500/10 text-gray-600';
      case 'paused': return 'bg-amber-500/10 text-amber-600';
      default: return '';
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const unreadMessages = allMessages.filter(m => 
    m.to_university_id === selectedUniversity?.id && !m.is_read
  ).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Partnership Management</h1>
        <p className="text-muted-foreground">
          AI-powered partner management, project tracking, and request handling
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Handshake className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Partners</p>
                <p className="text-2xl font-bold">{partners.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <FolderKanban className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Projects</p>
                <p className="text-2xl font-bold">{allProjects.filter(p => p.status === 'active').length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Inbox className="h-5 w-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pending Requests</p>
                <p className="text-2xl font-bold">{requests.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <Mail className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Unread Messages</p>
                <p className="text-2xl font-bold">{unreadMessages}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">AI Advisor</TabsTrigger>
          <TabsTrigger value="projects">Projects</TabsTrigger>
          <TabsTrigger value="requests">
            Requests
            {requests.length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 rounded-full p-0 text-xs">
                {requests.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>

        {/* AI Advisor Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI Partnership Advisor
                </CardTitle>
                <Button
                  onClick={generateAIRecommendations}
                  disabled={isGeneratingAI || partners.length === 0}
                >
                  {isGeneratingAI ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <RefreshCw className="h-4 w-4 mr-2" />
                  )}
                  Generate Recommendations
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {overallStrategy && (
                <div className="mb-6 rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Overall Strategy
                  </h4>
                  <p className="text-sm text-muted-foreground">{overallStrategy}</p>
                </div>
              )}

              {aiRecommendations.length > 0 ? (
                <div className="space-y-4">
                  {aiRecommendations.map((rec, idx) => (
                    <Card key={idx}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">{rec.partner_name}</h4>
                              <Badge className={getActionBadgeColor(rec.action)}>
                                {rec.action}
                              </Badge>
                              <Badge variant="outline" className={getPriorityBadgeColor(rec.priority)}>
                                {rec.priority} priority
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">{rec.recommendation}</p>
                            <div className="grid gap-2 md:grid-cols-2">
                              <div className="rounded-md bg-muted/50 p-2">
                                <p className="text-xs font-medium text-muted-foreground mb-1">Next Steps</p>
                                <p className="text-sm">{rec.next_steps}</p>
                              </div>
                              {rec.opportunity && (
                                <div className="rounded-md bg-green-500/5 p-2">
                                  <p className="text-xs font-medium text-green-600 mb-1">Opportunity</p>
                                  <p className="text-sm">{rec.opportunity}</p>
                                </div>
                              )}
                              {rec.risk && (
                                <div className="rounded-md bg-red-500/5 p-2">
                                  <p className="text-xs font-medium text-red-600 mb-1">Risk</p>
                                  <p className="text-sm">{rec.risk}</p>
                                </div>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const partner = partners.find(p => p.university.name === rec.partner_name);
                              if (partner) {
                                setMessageDialog({ 
                                  open: true, 
                                  partnerId: partner.university.id,
                                  partnerName: partner.university.name 
                                });
                              }
                            }}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Contact
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Sparkles className="h-12 w-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">
                    Click "Generate Recommendations" to get AI-powered insights for your partnerships
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Partner Overview */}
          <Card>
            <CardHeader>
              <CardTitle>Partner Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {partners.map((partner) => {
                  const avgSatisfaction = partner.roi.length > 0
                    ? partner.roi.reduce((sum, r) => sum + Number(r.satisfaction_score), 0) / partner.roi.length
                    : 0;
                  
                  return (
                    <div 
                      key={partner.university.id}
                      className="flex items-center justify-between rounded-lg border p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                          <Building2 className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-medium">{partner.university.name}</p>
                          <p className="text-sm text-muted-foreground">{partner.university.country}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium">{partner.projects.length} projects</p>
                          <p className="text-xs text-muted-foreground">
                            {avgSatisfaction > 0 ? `${avgSatisfaction.toFixed(1)}/5 satisfaction` : 'No ROI data'}
                          </p>
                        </div>
                        {partner.mou_status && (
                          <Badge variant="outline" className="capitalize">
                            {partner.mou_status}
                          </Badge>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setMessageDialog({ 
                            open: true, 
                            partnerId: partner.university.id,
                            partnerName: partner.university.name 
                          })}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Projects Tab */}
        <TabsContent value="projects" className="space-y-4">
          <div className="grid gap-4">
            {allProjects.map((project) => {
              const partner = universities.find(u => u.id === project.partner_university_id);
              return (
                <Card key={project.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{project.project_name}</h4>
                          <Badge className={getStatusColor(project.status)}>
                            {project.status}
                          </Badge>
                          <Badge variant="outline">{project.project_type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          Partner: {partner?.name || 'Unknown'}
                        </p>
                        {project.description && (
                          <p className="text-sm text-muted-foreground mb-3">{project.description}</p>
                        )}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span>Progress</span>
                            <span className="font-medium">{project.progress}%</span>
                          </div>
                          <Progress value={project.progress} />
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
                          {project.start_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              {new Date(project.start_date).toLocaleDateString()} - {project.end_date ? new Date(project.end_date).toLocaleDateString() : 'Ongoing'}
                            </span>
                          )}
                          {project.budget_usd && (
                            <span className="flex items-center gap-1">
                              <DollarSign className="h-3 w-3" />
                              ${Number(project.budget_usd).toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        {/* Requests Tab */}
        <TabsContent value="requests" className="space-y-4">
          {requests.length > 0 ? (
            requests.map((request) => {
              const fromUni = universities.find(u => u.id === request.from_university_id);
              return (
                <Card key={request.id} className={request.priority === 'high' ? 'border-red-300' : ''}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-medium">{request.subject}</h4>
                          <Badge variant="outline" className={getPriorityBadgeColor(request.priority)}>
                            {request.priority}
                          </Badge>
                          <Badge variant="secondary">{request.request_type}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          From: <span className="font-medium">{fromUni?.name || 'Unknown'}</span>
                        </p>
                        <p className="text-sm text-muted-foreground mb-3">{request.message}</p>
                        <p className="text-xs text-muted-foreground">
                          <Clock className="h-3 w-3 inline mr-1" />
                          {new Date(request.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-red-600"
                          onClick={() => setRequestDialog({ open: true, request, action: 'reject' })}
                        >
                          <X className="h-4 w-4 mr-1" />
                          Reject
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setRequestDialog({ open: true, request, action: 'accept' })}
                        >
                          <Check className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Inbox className="h-12 w-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No pending requests</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Messages Tab */}
        <TabsContent value="messages" className="space-y-4">
          {allMessages.slice(0, 10).map((msg) => {
            const fromUni = universities.find(u => u.id === msg.from_university_id);
            const isIncoming = msg.to_university_id === selectedUniversity?.id;
            
            return (
              <Card key={msg.id} className={!msg.is_read && isIncoming ? 'border-primary/50' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`flex h-8 w-8 items-center justify-center rounded-full ${isIncoming ? 'bg-primary/10' : 'bg-secondary'}`}>
                      {isIncoming ? (
                        <Inbox className="h-4 w-4 text-primary" />
                      ) : (
                        <Send className="h-4 w-4 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{msg.subject}</span>
                        {!msg.is_read && isIncoming && (
                          <Badge variant="default" className="text-xs">New</Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {isIncoming ? 'From' : 'To'}: {fromUni?.name || 'Unknown'}
                      </p>
                      <p className="text-sm text-muted-foreground">{msg.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">
                        {new Date(msg.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </TabsContent>
      </Tabs>

      {/* Message Dialog */}
      <Dialog open={messageDialog.open} onOpenChange={() => setMessageDialog({ open: false })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Message to {messageDialog.partnerName}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Subject</label>
              <Input
                placeholder="Message subject"
                value={newMessage.subject}
                onChange={(e) => setNewMessage({ ...newMessage, subject: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <Select 
                value={newMessage.type} 
                onValueChange={(value) => setNewMessage({ ...newMessage, type: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General</SelectItem>
                  <SelectItem value="request">Request</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="invitation">Invitation</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <Textarea
                placeholder="Write your message..."
                value={newMessage.message}
                onChange={(e) => setNewMessage({ ...newMessage, message: e.target.value })}
                rows={5}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMessageDialog({ open: false })}>
              Cancel
            </Button>
            <Button onClick={handleSendMessage} disabled={isSending || !newMessage.subject || !newMessage.message}>
              {isSending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Send className="h-4 w-4 mr-2" />}
              Send
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Action Dialog */}
      <AlertDialog open={requestDialog.open} onOpenChange={() => setRequestDialog({ open: false })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {requestDialog.action === 'accept' ? 'Accept Request?' : 'Reject Request?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {requestDialog.action === 'accept'
                ? 'This will accept the partnership request. You can then proceed to discuss details with the partner.'
                : 'This will reject the partnership request. The requesting university will be notified.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleRequestAction(requestDialog.action!)}
              className={requestDialog.action === 'reject' ? 'bg-destructive text-destructive-foreground' : ''}
            >
              {requestDialog.action === 'accept' ? 'Accept' : 'Reject'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
