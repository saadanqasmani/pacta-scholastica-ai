import { University, PartnerRecommendation } from '@/types/database';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Building2, Handshake, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';

interface PartnerCardProps {
  recommendation: PartnerRecommendation;
  onInitiateMOU?: (universityName: string) => void;
}

export function PartnerCard({ recommendation, onInitiateMOU }: PartnerCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-primary bg-primary/10';
    if (score >= 70) return 'text-info bg-info/10';
    return 'text-muted-foreground bg-muted';
  };

  return (
    <Card className="transition-shadow hover:shadow-md">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-secondary">
              <Building2 className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold truncate">{recommendation.university_name}</h3>
              <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                <MapPin className="h-3 w-3" />
                <span>{recommendation.country}</span>
              </div>
            </div>
          </div>
          <div className={`flex h-12 w-12 items-center justify-center rounded-lg font-bold ${getScoreColor(recommendation.match_score)}`}>
            {recommendation.match_score}
          </div>
        </div>

        {/* Expand/Collapse Toggle */}
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-3 text-muted-foreground"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              Hide reasoning
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              View reasoning
            </>
          )}
        </Button>

        {/* Reasoning Details */}
        {isExpanded && (
          <div className="mt-4 space-y-3 animate-fade-in">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg bg-secondary/50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Departmental Complementarity
                </p>
                <p className="text-sm">{recommendation.reasoning.departmental_complementarity}</p>
              </div>
              <div className="rounded-lg bg-secondary/50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Geographic Diversification
                </p>
                <p className="text-sm">{recommendation.reasoning.geographic_diversification}</p>
              </div>
              <div className="rounded-lg bg-secondary/50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Mobility Balance
                </p>
                <p className="text-sm">{recommendation.reasoning.mobility_balance}</p>
              </div>
              <div className="rounded-lg bg-secondary/50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  Strategic Alignment
                </p>
                <p className="text-sm">{recommendation.reasoning.strategic_alignment}</p>
              </div>
            </div>
          </div>
        )}

        {/* Action Button */}
        <div className="mt-4 flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            AI Recommended
          </Badge>
          <Button 
            size="sm" 
            onClick={() => onInitiateMOU?.(recommendation.university_name)}
          >
            <Handshake className="h-4 w-4 mr-1" />
            Initiate MOU
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
