import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Loader2, RefreshCw, Sparkles, Search, Filter, Building2, Handshake } from 'lucide-react';
import { useUniversity } from '@/contexts/UniversityContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAIEvaluation } from '@/hooks/useAIEvaluation';
import { PartnerRecommendation, University } from '@/types/database';
import { PartnerCard } from '@/components/partners/PartnerCard';
import { UniversityProfileModal } from '@/components/partners/UniversityProfileModal';
import { ActivePartnerships } from '@/components/partners/ActivePartnerships';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PartnerRecommendationsResponse {
  recommendations: PartnerRecommendation[];
}

export default function Partners() {
  const { selectedUniversity, universities, isLoading: universitiesLoading } = useUniversity();
  const { t } = useLanguage();
  const { data, isLoading, evaluate } = useAIEvaluation<PartnerRecommendationsResponse>('partner_recommendations');
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'active' | 'recommended' | 'all'>('active');
  const [selectedProfileUniversity, setSelectedProfileUniversity] = useState<University | null>(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const regions = [...new Set(universities.map(u => u.region))].sort();

  useEffect(() => {
    if (selectedUniversity?.id && !data && !isLoading && viewMode === 'recommended') {
      evaluate(selectedUniversity.id);
    }
  }, [selectedUniversity?.id, viewMode]);

  const filteredUniversities = universities
    .filter(u => u.id !== selectedUniversity?.id)
    .filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           u.country.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRegion = regionFilter === 'all' || u.region === regionFilter;
      return matchesSearch && matchesRegion;
    });

  const filteredRecommendations = data?.recommendations?.filter(r => {
    const matchesSearch = r.university_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         r.country.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }) || [];

  const handleInitiateMOU = (universityName: string) => {
    const partner = universities.find(u => u.name === universityName);
    if (partner) {
      setIsProfileModalOpen(false);
      navigate(`/mou?partner=${partner.id}`);
    } else {
      toast({ title: t('common.error'), description: t('partners.noRecommendations'), variant: 'destructive' });
    }
  };

  const handleViewProfile = (universityName: string) => {
    const university = universities.find(u => u.name === universityName);
    if (university) {
      setSelectedProfileUniversity(university);
      setIsProfileModalOpen(true);
    }
  };

  const handleCardClick = (university: University) => {
    setSelectedProfileUniversity(university);
    setIsProfileModalOpen(true);
  };

  if (universitiesLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{t('partners.title')}</h1>
        <p className="text-muted-foreground">{t('partners.subtitle')}</p>
      </div>

      {selectedUniversity && (
        <Card className="border-l-4 border-l-primary">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">{t('partners.findingPartnersFor')}</p>
                <p className="font-semibold">{selectedUniversity.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as 'active' | 'recommended' | 'all')}>
        <TabsList>
          <TabsTrigger value="active" className="gap-1">
            <Handshake className="h-4 w-4" />
            Active Partnerships
          </TabsTrigger>
          <TabsTrigger value="recommended" className="gap-1">
            <Sparkles className="h-4 w-4" />
            {t('partners.aiRecommended')}
          </TabsTrigger>
          <TabsTrigger value="all">
            {t('partners.allUniversities')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <ActivePartnerships />
        </TabsContent>

        <TabsContent value="recommended">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 md:w-64 md:flex-initial">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder={t('partners.search')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
              </div>
              <Button variant="outline" size="icon" onClick={() => selectedUniversity && evaluate(selectedUniversity.id)} disabled={isLoading}>
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
              </Button>
            </div>

            {isLoading ? (
              <div className="flex h-64 items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="h-10 w-10 animate-spin text-primary" />
                  <span className="text-muted-foreground">{t('partners.analyzingPartnerships')}</span>
                </div>
              </div>
            ) : filteredRecommendations.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium">{filteredRecommendations.length} {t('partners.aiRecommendedPartners')}</span>
                </div>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {filteredRecommendations.map((rec, index) => (
                    <PartnerCard key={index} recommendation={rec} onInitiateMOU={handleInitiateMOU} onViewProfile={handleViewProfile} />
                  ))}
                </div>
              </div>
            ) : (
              <Card>
                <CardContent className="flex h-48 flex-col items-center justify-center">
                  <Sparkles className="h-10 w-10 text-muted-foreground/50 mb-3" />
                  <p className="text-muted-foreground mb-4">{t('partners.noRecommendations')}</p>
                  <Button onClick={() => selectedUniversity && evaluate(selectedUniversity.id)}>{t('partners.generateRecommendations')}</Button>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        <TabsContent value="all">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="relative flex-1 md:w-64 md:flex-initial">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input placeholder={t('partners.search')} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9" />
              </div>
              <Select value={regionFilter} onValueChange={setRegionFilter}>
                <SelectTrigger className="w-40">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder={t('common.region')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('partners.allRegions')}</SelectItem>
                  {regions.map(region => (
                    <SelectItem key={region} value={region}>{region}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium">{filteredUniversities.length} {t('partners.universitiesAvailable')}</span>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {filteredUniversities.map((university) => (
                <Card key={university.id} className="transition-all hover:shadow-md cursor-pointer hover:border-primary/50" onClick={() => handleCardClick(university)}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="font-medium truncate">{university.name}</h3>
                        <p className="text-sm text-muted-foreground">{university.country}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          <Badge variant="outline" className="text-xs capitalize">{university.type}</Badge>
                          <Badge variant="secondary" className="text-xs capitalize">{university.internationalization_maturity}</Badge>
                          {university.ranking && <Badge variant="default" className="text-xs">#{university.ranking}</Badge>}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-3">
                      <Button size="sm" variant="outline" className="flex-1" onClick={(e) => { e.stopPropagation(); handleCardClick(university); }}>{t('partners.viewProfile')}</Button>
                      <Button size="sm" className="flex-1" onClick={(e) => { e.stopPropagation(); handleInitiateMOU(university.name); }}>{t('partners.initiateMOU')}</Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <UniversityProfileModal university={selectedProfileUniversity} isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} onInitiateMOU={handleInitiateMOU} />
    </div>
  );
}
