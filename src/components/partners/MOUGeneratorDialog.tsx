import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  Loader2,
  Sparkles,
  FileText,
  Send,
  CheckCircle,
  AlertTriangle,
  Building2,
  ArrowLeftRight,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';
import { University } from '@/types/database';

interface AIRecommendation {
  partner_name: string;
  action: 'expand' | 'maintain' | 'restructure' | 'pause';
  priority: 'high' | 'medium' | 'low';
  recommendation: string;
  next_steps: string;
  opportunity?: string;
  risk?: string;
}

interface SuggestedClause {
  title: string;
  content: string;
  category: string;
  priority: string;
}

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

interface MOUGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUniversity: University;
  partnerUniversity: University;
  recommendation?: AIRecommendation;
  onSuccess: () => void;
}

export function MOUGeneratorDialog({
  open,
  onOpenChange,
  selectedUniversity,
  partnerUniversity,
  recommendation,
  onSuccess,
}: MOUGeneratorDialogProps) {
  const { toast } = useToast();
  const { language } = useLanguage();

  const [step, setStep] = useState<'generating' | 'review' | 'sending' | 'done'>('generating');
  const [cooperationScope, setCooperationScope] = useState<string[]>([
    'student_exchange',
    'faculty_exchange',
    'joint_research',
  ]);
  const [suggestedClauses, setSuggestedClauses] = useState<SuggestedClause[]>([]);
  const [selectedClauses, setSelectedClauses] = useState<Set<number>>(new Set());
  const [additionalMessage, setAdditionalMessage] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setStep('generating');
      setError(null);
      setSuggestedClauses([]);
      setSelectedClauses(new Set());
      setAdditionalMessage('');
      generateMOU();
    }
  }, [open]);

  const generateMOU = async () => {
    setStep('generating');
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('mou-suggest', {
        body: {
          cooperation_scope: cooperationScope,
          initiator_name: selectedUniversity.name,
          partner_name: partnerUniversity.name,
          existing_clauses: [],
          language,
        },
      });

      if (fnError) throw new Error(fnError.message);
      if (data?.error) throw new Error(data.error);

      if (data?.clauses && data.clauses.length > 0) {
        setSuggestedClauses(data.clauses);
        // Select all by default
        setSelectedClauses(new Set(data.clauses.map((_: SuggestedClause, i: number) => i)));
        setStep('review');
      } else {
        throw new Error('No clauses were generated');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate MOU';
      setError(message);
      setStep('review');
      toast({
        title: 'Generation Error',
        description: message,
        variant: 'destructive',
      });
    }
  };

  const toggleClause = (index: number) => {
    const next = new Set(selectedClauses);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setSelectedClauses(next);
  };

  const handleSendRequest = async () => {
    if (selectedClauses.size === 0) {
      toast({
        title: 'No Clauses Selected',
        description: 'Please select at least one clause to include in the MOU.',
        variant: 'destructive',
      });
      return;
    }

    setStep('sending');

    try {
      // 1. Create the MOU with selected clauses
      const clausesToInclude = suggestedClauses
        .filter((_, i) => selectedClauses.has(i))
        .map((clause) => ({
          id: crypto.randomUUID(),
          title: clause.title,
          content: clause.content,
          proposed_by: selectedUniversity.id,
        }));

      const { data: mouData, error: mouError } = await supabase
        .from('mous')
        .insert({
          initiator_university_id: selectedUniversity.id,
          partner_university_id: partnerUniversity.id,
          status: 'pending',
          cooperation_scope: cooperationScope,
          clauses: JSON.parse(JSON.stringify(clausesToInclude)),
        })
        .select()
        .single();

      if (mouError) throw mouError;

      // 2. Log creation in MOU history
      await supabase.from('mou_history').insert({
        mou_id: mouData.id,
        actor_university_id: selectedUniversity.id,
        action: 'created_via_ai_advisor',
        changes: {
          clauses_count: clausesToInclude.length,
          cooperation_scope: cooperationScope,
          ai_generated: true,
        },
      });

      // 3. Send partnership request
      const clauseSummary = clausesToInclude
        .map((c) => `• ${c.title}`)
        .join('\n');

      const requestMessage = `Partnership request from ${selectedUniversity.name} based on AI-recommended terms.\n\nProposed cooperation areas: ${cooperationScope.join(', ')}\n\nProposed MOU clauses:\n${clauseSummary}${additionalMessage ? `\n\nAdditional message:\n${additionalMessage}` : ''}`;

      const { error: requestError } = await supabase
        .from('partner_requests')
        .insert({
          from_university_id: selectedUniversity.id,
          to_university_id: partnerUniversity.id,
          request_type: 'partnership',
          subject: `MOU Partnership Proposal – ${selectedUniversity.name}`,
          message: requestMessage,
          priority: recommendation?.priority === 'high' ? 'high' : 'normal',
          status: 'pending',
        });

      if (requestError) throw requestError;

      // 4. Send a notification message
      const { error: msgError } = await supabase
        .from('partner_messages')
        .insert({
          from_university_id: selectedUniversity.id,
          to_university_id: partnerUniversity.id,
          subject: `New MOU Proposal from ${selectedUniversity.name}`,
          message: `We have initiated an MOU proposal based on our AI-driven partnership analysis. The proposal includes ${clausesToInclude.length} clauses covering ${cooperationScope.join(', ')}. Please review the proposal in your MOU Management section.`,
          message_type: 'request',
        });

      if (msgError) console.error('Message notification failed:', msgError);

      setStep('done');
      toast({
        title: 'Partnership Request Sent',
        description: `MOU created and partnership request sent to ${partnerUniversity.name}`,
      });
    } catch (err) {
      console.error('Error sending partnership request:', err);
      setStep('review');
      toast({
        title: 'Error',
        description: 'Failed to send partnership request. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'governance': return 'bg-purple-500/10 text-purple-600';
      case 'academic': return 'bg-blue-500/10 text-blue-600';
      case 'financial': return 'bg-green-500/10 text-green-600';
      case 'mobility': return 'bg-amber-500/10 text-amber-600';
      case 'research': return 'bg-cyan-500/10 text-cyan-600';
      case 'termination': return 'bg-red-500/10 text-red-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            AI-Generated MOU Proposal
          </DialogTitle>
          <DialogDescription>
            Review the AI-generated terms and send a partnership request
          </DialogDescription>
        </DialogHeader>

        {/* Partnership Header */}
        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 p-3">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">{selectedUniversity.name}</span>
          </div>
          <ArrowLeftRight className="h-4 w-4 text-muted-foreground" />
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{partnerUniversity.name}</span>
          </div>
        </div>

        {/* Content based on step */}
        {step === 'generating' && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-sm font-medium">Generating MOU clauses with AI...</p>
            <p className="text-xs text-muted-foreground mt-1">
              Analyzing partnership compatibility and drafting terms
            </p>
          </div>
        )}

        {step === 'review' && (
          <ScrollArea className="flex-1 max-h-[50vh]">
            <div className="space-y-4 pr-4">
              {error && (
                <div className="flex items-center gap-2 rounded-lg border border-destructive/50 bg-destructive/5 p-3">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                  <p className="text-sm text-destructive">{error}</p>
                </div>
              )}

              {/* AI Recommendation Context */}
              {recommendation && (
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-primary mb-1 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" />
                    AI Recommendation
                  </p>
                  <p className="text-sm">{recommendation.recommendation}</p>
                </div>
              )}

              {/* Cooperation Scope */}
              <div>
                <p className="text-sm font-medium mb-2">Cooperation Scope</p>
                <div className="grid gap-2 grid-cols-2">
                  {COOPERATION_SCOPES.map((scope) => (
                    <div key={scope.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`scope-${scope.id}`}
                        checked={cooperationScope.includes(scope.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setCooperationScope([...cooperationScope, scope.id]);
                          } else {
                            setCooperationScope(cooperationScope.filter((s) => s !== scope.id));
                          }
                        }}
                      />
                      <label htmlFor={`scope-${scope.id}`} className="text-sm">
                        {scope.label}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              {/* Generated Clauses */}
              {suggestedClauses.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">
                      Proposed Clauses ({selectedClauses.size}/{suggestedClauses.length} selected)
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (selectedClauses.size === suggestedClauses.length) {
                          setSelectedClauses(new Set());
                        } else {
                          setSelectedClauses(new Set(suggestedClauses.map((_, i) => i)));
                        }
                      }}
                    >
                      {selectedClauses.size === suggestedClauses.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {suggestedClauses.map((clause, idx) => (
                      <div
                        key={idx}
                        className={`rounded-lg border p-3 transition-colors cursor-pointer ${
                          selectedClauses.has(idx)
                            ? 'border-primary/40 bg-primary/5'
                            : 'border-border bg-background opacity-60'
                        }`}
                        onClick={() => toggleClause(idx)}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedClauses.has(idx)}
                            onCheckedChange={() => toggleClause(idx)}
                            className="mt-0.5"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <h4 className="text-sm font-medium">{clause.title}</h4>
                              <Badge className={`text-xs ${getCategoryColor(clause.category)}`}>
                                {clause.category}
                              </Badge>
                              <Badge
                                variant={clause.priority === 'essential' ? 'default' : 'secondary'}
                                className="text-xs"
                              >
                                {clause.priority}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground leading-relaxed">
                              {clause.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <Separator />

              {/* Additional Message */}
              <div>
                <label className="text-sm font-medium">Additional Message (Optional)</label>
                <Textarea
                  placeholder="Add a personal note to accompany your partnership request..."
                  value={additionalMessage}
                  onChange={(e) => setAdditionalMessage(e.target.value)}
                  rows={3}
                  className="mt-1"
                />
              </div>
            </div>
          </ScrollArea>
        )}

        {step === 'sending' && (
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-10 w-10 animate-spin text-primary mb-4" />
            <p className="text-sm font-medium">Creating MOU & sending request...</p>
            <p className="text-xs text-muted-foreground mt-1">
              Saving agreement and notifying {partnerUniversity.name}
            </p>
          </div>
        )}

        {step === 'done' && (
          <div className="flex flex-col items-center justify-center py-12">
            <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
            <p className="text-lg font-semibold">Partnership Request Sent!</p>
            <p className="text-sm text-muted-foreground mt-1 text-center max-w-md">
              An MOU has been created and a partnership request has been sent to{' '}
              <span className="font-medium">{partnerUniversity.name}</span>. You can track
              the status in the MOU Management section.
            </p>
          </div>
        )}

        {/* Footer */}
        <DialogFooter>
          {step === 'review' && (
            <>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              {suggestedClauses.length > 0 && (
                <>
                  <Button variant="outline" onClick={generateMOU}>
                    <Sparkles className="h-4 w-4 mr-1" />
                    Regenerate
                  </Button>
                  <Button onClick={handleSendRequest} disabled={selectedClauses.size === 0}>
                    <Send className="h-4 w-4 mr-1" />
                    Send Partnership Request
                  </Button>
                </>
              )}
              {error && suggestedClauses.length === 0 && (
                <Button onClick={generateMOU}>
                  <Sparkles className="h-4 w-4 mr-1" />
                  Retry Generation
                </Button>
              )}
            </>
          )}
          {step === 'done' && (
            <Button
              onClick={() => {
                onOpenChange(false);
                onSuccess();
              }}
            >
              Done
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
