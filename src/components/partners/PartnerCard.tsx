import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, ChevronDown, ChevronUp, Handshake, Eye, MapPin 
} from 'lucide-react';
import { PartnerRecommendation } from '@/types/database';
import { useLanguage } from '@/contexts/LanguageContext';

interface PartnerCardProps {
  recommendation: PartnerRecommendation;
  onInitiateMOU: (universityName: string) => void;
  onViewProfile?: (universityName: string) => void;
}

export function PartnerCard({ recommendation, onInitiateMOU, onViewProfile }: PartnerCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const { t } = useLanguage();

  const getScoreColor = (score: number) => {
    if (score >= 85) return 'text-primary bg-primary/10';
    if (score >= 70) return 'text-amber-600 bg-amber-500/10';
    return 'text-muted-foreground bg-muted';
  };

  return (
    <Card className="transition-all hover:shadow-md">
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

        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-3 text-muted-foreground"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4 mr-1" />
              {t('partners.showLess')}
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4 mr-1" />
              {t('partners.showMore')}
            </>
          )}
        </Button>

        {isExpanded && (
          <div className="mt-4 space-y-3 animate-fade-in">
            <div className="grid gap-3 md:grid-cols-2">
              <div className="rounded-lg bg-secondary/50 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1">
                  {t('partners.complementaryAreas')}
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
                  {t('partners.strategicFit')}
                </p>
                <p className="text-sm">{recommendation.reasoning.strategic_alignment}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mt-4 flex items-center justify-between gap-2">
          <Badge variant="outline" className="text-xs">
            {t('partners.aiRecommended')}
          </Badge>
          <div className="flex gap-2">
            {onViewProfile && (
              <Button size="sm" variant="outline" onClick={() => onViewProfile(recommendation.university_name)}>
                <Eye className="h-4 w-4 mr-1" />
                {t('partners.viewProfile')}
              </Button>
            )}
            <Button size="sm" onClick={() => onInitiateMOU(recommendation.university_name)}>
              <Handshake className="h-4 w-4 mr-1" />
              {t('partners.initiateMOU')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
