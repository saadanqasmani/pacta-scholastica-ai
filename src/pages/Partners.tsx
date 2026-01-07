import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, RefreshCw, Sparkles, Search, Filter, Building2 } from 'lucide-react';
import { useUniversity } from '@/contexts/UniversityContext';
import { useAIEvaluation } from '@/hooks/useAIEvaluation';
import { PartnerRecommendation, University } from '@/types/database';
import { PartnerCard } from '@/components/partners/PartnerCard';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PartnerRecommendationsResponse {
  recommendations: PartnerRecommendation[];
}

export default function Partners() {
  const { selectedUniversity, universities, isLoading: universitiesLoading } = useUniversity();
  const { data, isLoading, evaluate } = useAIEvaluation<PartnerRecommendationsResponse>('partner_recommendations');
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'recommended' | 'all'>('recommended');
  const navigate = useNavigate();
  const { toast } = useToast();

  // Get unique regions from universities
  const regions = [...new Set(universities.map(u => u.region))].sort();

  useEffect(() => {
    if (selectedUniversity?.id && !data && !isLoading && viewMode === 'recommended') {
      evaluate(selectedUniversity.id);
    }
  }, [selectedUniversity?.id, viewMode]);

  // Filter all universities (excluding selected)
  const filteredUniversities = universities
    .filter(u => u.id !== selectedUniversity?.id)
    .filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           u.country.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRegion = regionFilter === 'all' || u.region === regionFilter;
      return matchesSearch && matchesRegion;
    });

  // Filter recommendations
  const filteredRecommendations = data?.recommendations?.filter(r => {
    const matchesSearch = r.university_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         r.country.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  }) || [];

  const handleInitiateMOU = (universityName: string) => {
    // Find the university ID
    const partner = universities.find(u => u.name === universityName);
    if (partner) {
      navigate(`/mou?partner=${partner.id}`);
    } else {
      toast({
        title: 'Partner not found',
        description: 'Could not find the selected university.',
        variant: 'destructive',
      });
    }
  };

  if (universitiesLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">Partner Discovery</h1>
        <p className="text-muted-foreground">
          AI-powered partner recommendations based on strategic alignment and complementarity
        </p>
      </div>

      {/* Context Card */}
      {selectedUniversity && (
        <Card className="border-l-4 border-l-primary">
          <CardContent className="py-4">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Finding partners for</p>
                <p className="font-semibold">{selectedUniversity.name}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Controls */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'recommended' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('recommended')}
          >
            <Sparkles className="h-4 w-4 mr-1" />
            AI Recommended
          </Button>
          <Button
            variant={viewMode === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('all')}
          >
            All Universities
          </Button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search universities..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          {viewMode === 'all' && (
            <Select value={regionFilter} onValueChange={setRegionFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Regions</SelectItem>
                {regions.map(region => (
                  <SelectItem key={region} value={region}>{region}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          {viewMode === 'recommended' && (
            <Button
              variant="outline"
              size="icon"
              onClick={() => selectedUniversity && evaluate(selectedUniversity.id)}
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      {viewMode === 'recommended' ? (
        isLoading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
              <span className="text-muted-foreground">Analyzing strategic partnerships...</span>
            </div>
          </div>
        ) : filteredRecommendations.length > 0 ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">
                {filteredRecommendations.length} AI-recommended partners
              </span>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredRecommendations.map((rec, index) => (
                <PartnerCard
                  key={index}
                  recommendation={rec}
                  onInitiateMOU={handleInitiateMOU}
                />
              ))}
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className="flex h-48 flex-col items-center justify-center">
              <Sparkles className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground mb-4">No recommendations generated yet</p>
              <Button onClick={() => selectedUniversity && evaluate(selectedUniversity.id)}>
                Generate Recommendations
              </Button>
            </CardContent>
          </Card>
        )
      ) : (
        /* All Universities View */
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {filteredUniversities.length} universities available
            </span>
          </div>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {filteredUniversities.map((university) => (
              <Card key={university.id} className="transition-shadow hover:shadow-md">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-secondary">
                      <Building2 className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium truncate">{university.name}</h3>
                      <p className="text-sm text-muted-foreground">{university.country}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        <Badge variant="outline" className="text-xs capitalize">
                          {university.type}
                        </Badge>
                        <Badge variant="secondary" className="text-xs capitalize">
                          {university.internationalization_maturity}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="outline"
                    className="w-full mt-3"
                    onClick={() => handleInitiateMOU(university.name)}
                  >
                    Initiate MOU
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
