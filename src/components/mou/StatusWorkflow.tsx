import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  ChevronDown, 
  FileEdit, 
  Send, 
  CheckCircle, 
  XCircle, 
  MessageSquare,
  Clock
} from 'lucide-react';

type MOUStatus = 'draft' | 'pending' | 'revised' | 'counter_proposed' | 'accepted' | 'rejected';

interface StatusWorkflowProps {
  currentStatus: MOUStatus;
  onStatusChange: (newStatus: MOUStatus) => void;
  isInitiator: boolean;
  disabled?: boolean;
}

const STATUS_CONFIG: Record<MOUStatus, { label: string; color: string; icon: React.ReactNode }> = {
  draft: { 
    label: 'Draft', 
    color: 'bg-gray-500/10 text-gray-600 border-gray-300',
    icon: <FileEdit className="h-4 w-4" />
  },
  pending: { 
    label: 'Pending Review', 
    color: 'bg-amber-500/10 text-amber-600 border-amber-300',
    icon: <Clock className="h-4 w-4" />
  },
  revised: { 
    label: 'Revised', 
    color: 'bg-blue-500/10 text-blue-600 border-blue-300',
    icon: <FileEdit className="h-4 w-4" />
  },
  counter_proposed: { 
    label: 'Counter Proposed', 
    color: 'bg-purple-500/10 text-purple-600 border-purple-300',
    icon: <MessageSquare className="h-4 w-4" />
  },
  accepted: { 
    label: 'Accepted', 
    color: 'bg-green-500/10 text-green-600 border-green-300',
    icon: <CheckCircle className="h-4 w-4" />
  },
  rejected: { 
    label: 'Rejected', 
    color: 'bg-red-500/10 text-red-600 border-red-300',
    icon: <XCircle className="h-4 w-4" />
  },
};

const STATUS_FLOW: Record<MOUStatus, { initiator: MOUStatus[]; partner: MOUStatus[] }> = {
  draft: { 
    initiator: ['pending'], 
    partner: [] 
  },
  pending: { 
    initiator: ['draft'], 
    partner: ['accepted', 'rejected', 'counter_proposed'] 
  },
  revised: { 
    initiator: ['pending'], 
    partner: ['accepted', 'rejected', 'counter_proposed'] 
  },
  counter_proposed: { 
    initiator: ['revised', 'accepted', 'rejected'], 
    partner: [] 
  },
  accepted: { 
    initiator: [], 
    partner: [] 
  },
  rejected: { 
    initiator: ['draft'], 
    partner: [] 
  },
};

export function StatusWorkflow({ 
  currentStatus, 
  onStatusChange, 
  isInitiator,
  disabled 
}: StatusWorkflowProps) {
  const config = STATUS_CONFIG[currentStatus];
  const availableTransitions = isInitiator 
    ? STATUS_FLOW[currentStatus].initiator 
    : STATUS_FLOW[currentStatus].partner;

  const getActionLabel = (status: MOUStatus) => {
    switch (status) {
      case 'pending': return 'Submit for Review';
      case 'draft': return 'Return to Draft';
      case 'revised': return 'Submit Revision';
      case 'counter_proposed': return 'Counter Propose';
      case 'accepted': return 'Accept Agreement';
      case 'rejected': return 'Reject Agreement';
      default: return status;
    }
  };

  const getActionIcon = (status: MOUStatus) => {
    switch (status) {
      case 'pending': return <Send className="h-4 w-4 mr-2" />;
      case 'draft': return <FileEdit className="h-4 w-4 mr-2" />;
      case 'revised': return <FileEdit className="h-4 w-4 mr-2" />;
      case 'counter_proposed': return <MessageSquare className="h-4 w-4 mr-2" />;
      case 'accepted': return <CheckCircle className="h-4 w-4 mr-2" />;
      case 'rejected': return <XCircle className="h-4 w-4 mr-2" />;
      default: return null;
    }
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Status:</span>
        <Badge variant="outline" className={`${config.color} flex items-center gap-1`}>
          {config.icon}
          {config.label}
        </Badge>
      </div>

      {availableTransitions.length > 0 && !disabled && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              Change Status
              <ChevronDown className="h-4 w-4 ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {availableTransitions.map((status) => (
              <DropdownMenuItem 
                key={status}
                onClick={() => onStatusChange(status)}
              >
                {getActionIcon(status)}
                {getActionLabel(status)}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
}

export function StatusTimeline({ currentStatus }: { currentStatus: MOUStatus }) {
  const steps: MOUStatus[] = ['draft', 'pending', 'accepted'];
  const currentIndex = steps.indexOf(currentStatus);
  const isRejected = currentStatus === 'rejected';
  const isCounterProposed = currentStatus === 'counter_proposed' || currentStatus === 'revised';

  return (
    <div className="flex items-center justify-between w-full max-w-md">
      {steps.map((step, index) => {
        const config = STATUS_CONFIG[step];
        const isActive = step === currentStatus;
        const isComplete = currentIndex > index || (currentStatus === 'accepted' && step === 'accepted');
        const isPending = !isComplete && !isActive;

        return (
          <div key={step} className="flex items-center">
            <div className="flex flex-col items-center">
              <div 
                className={`flex h-10 w-10 items-center justify-center rounded-full border-2 transition-colors ${
                  isComplete 
                    ? 'bg-primary border-primary text-primary-foreground' 
                    : isActive 
                      ? 'bg-primary/10 border-primary text-primary' 
                      : 'bg-muted border-muted-foreground/30 text-muted-foreground'
                }`}
              >
                {isComplete ? (
                  <CheckCircle className="h-5 w-5" />
                ) : (
                  config.icon
                )}
              </div>
              <span className={`mt-2 text-xs ${isActive ? 'font-medium' : 'text-muted-foreground'}`}>
                {config.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div 
                className={`h-0.5 w-16 mx-2 ${
                  isComplete ? 'bg-primary' : 'bg-muted-foreground/30'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
