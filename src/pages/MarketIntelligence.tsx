import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { useUniversity } from '@/contexts/UniversityContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  PauseCircle,
  XCircle,
  Globe,
  Users,
  Target,
  BarChart3,
  RefreshCw,
  Sparkles,
} from 'lucide-react';

interface MarketData {
  country: string;
  applications: number;
  offers: number;
  enrollments: number;
  capacity: number;
  agentDriven: number;
  organic: number;
  conversionRate: number;
  offerAcceptanceRate: number;
  overOfferingRatio: number;
  wasteRatio: number;
}

interface MarketRecommendation {
  country: string;
  action: 'scale' | 'pause' | 'exit';
  confidence: number;
  reasoning: string;
  riskLevel: 'low' | 'medium' | 'high';
  keyMetrics: {
    conversionEfficiency: number;
    recruitmentQuality: number;
    capacityAlignment: number;
  };
}

interface MarketAnalysis {
  markets: MarketData[];
  recommendations: MarketRecommendation[];
  summary: {
    totalApplications: number;
    averageConversion: number;
    marketsToScale: number;
    marketsToPause: number;
    marketsToExit: number;
  };
  generatedAt: string;
}

export default function MarketIntelligence() {
  const { selectedUniversity } = useUniversity();
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<MarketAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateAnalysis = async () => {
    if (!selectedUniversity?.id) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('market-intelligence', {
        body: { university_id: selectedUniversity.id },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setAnalysis(data.analysis);
      toast({
        title: 'Analysis Complete',
        description: 'Market intelligence report generated successfully.',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to generate analysis';
      toast({
        title: 'Analysis Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (selectedUniversity?.id) {
      generateAnalysis();
    }
  }, [selectedUniversity?.id]);

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'scale':
        return <TrendingUp className="h-4 w-4" />;
      case 'pause':
        return <PauseCircle className="h-4 w-4" />;
      case 'exit':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'scale':
        return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'pause':
        return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'exit':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low':
        return 'bg-green-500/10 text-green-600';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-600';
      case 'high':
        return 'bg-red-500/10 text-red-600';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  if (!selectedUniversity) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Please select a university to view market intelligence.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Market Intelligence</h1>
          <p className="text-muted-foreground">
            AI-powered recruitment market analysis for {selectedUniversity.name}
          </p>
        </div>
        <Button onClick={generateAnalysis} disabled={isLoading}>
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Refresh Analysis
            </>
          )}
        </Button>
      </div>

      {analysis && (
        <>
          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-5">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Total Applications</CardDescription>
                <CardTitle className="text-2xl">{analysis.summary.totalApplications.toLocaleString()}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>Avg. Conversion</CardDescription>
                <CardTitle className="text-2xl">{analysis.summary.averageConversion.toFixed(1)}%</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-green-500/20">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  Markets to Scale
                </CardDescription>
                <CardTitle className="text-2xl text-green-600">{analysis.summary.marketsToScale}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-yellow-500/20">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <PauseCircle className="h-3 w-3 text-yellow-600" />
                  Markets to Pause
                </CardDescription>
                <CardTitle className="text-2xl text-yellow-600">{analysis.summary.marketsToPause}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-red-500/20">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <XCircle className="h-3 w-3 text-red-600" />
                  Markets to Exit
                </CardDescription>
                <CardTitle className="text-2xl text-red-600">{analysis.summary.marketsToExit}</CardTitle>
              </CardHeader>
            </Card>
          </div>

          <Tabs defaultValue="recommendations" className="space-y-4">
            <TabsList>
              <TabsTrigger value="recommendations">AI Recommendations</TabsTrigger>
              <TabsTrigger value="metrics">Market Metrics</TabsTrigger>
            </TabsList>

            <TabsContent value="recommendations" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {analysis.recommendations.map((rec) => (
                  <Card key={rec.country} className="relative overflow-hidden">
                    <div className={`absolute top-0 left-0 w-1 h-full ${
                      rec.action === 'scale' ? 'bg-green-500' :
                      rec.action === 'pause' ? 'bg-yellow-500' : 'bg-red-500'
                    }`} />
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Globe className="h-4 w-4 text-muted-foreground" />
                          <CardTitle className="text-lg">{rec.country}</CardTitle>
                        </div>
                        <Badge className={getActionColor(rec.action)}>
                          {getActionIcon(rec.action)}
                          <span className="ml-1 capitalize">{rec.action}</span>
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-sm text-muted-foreground">{rec.reasoning}</p>
                      
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Confidence</span>
                        <div className="flex items-center gap-2">
                          <Progress value={rec.confidence} className="w-20 h-2" />
                          <span className="font-medium">{rec.confidence}%</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Risk Level</span>
                        <Badge variant="outline" className={getRiskColor(rec.riskLevel)}>
                          {rec.riskLevel === 'high' && <AlertTriangle className="h-3 w-3 mr-1" />}
                          {rec.riskLevel === 'low' && <CheckCircle className="h-3 w-3 mr-1" />}
                          <span className="capitalize">{rec.riskLevel}</span>
                        </Badge>
                      </div>

                      <div className="pt-3 border-t space-y-2">
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Conversion Efficiency</span>
                          <span className="font-medium">{rec.keyMetrics.conversionEfficiency}%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Recruitment Quality</span>
                          <span className="font-medium">{rec.keyMetrics.recruitmentQuality}%</span>
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-muted-foreground">Capacity Alignment</span>
                          <span className="font-medium">{rec.keyMetrics.capacityAlignment}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="metrics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Market Performance Metrics
                  </CardTitle>
                  <CardDescription>
                    Detailed breakdown of recruitment metrics by country
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-2 font-medium">Country</th>
                          <th className="text-right py-3 px-2 font-medium">Applications</th>
                          <th className="text-right py-3 px-2 font-medium">Offers</th>
                          <th className="text-right py-3 px-2 font-medium">Enrollments</th>
                          <th className="text-right py-3 px-2 font-medium">Conversion %</th>
                          <th className="text-right py-3 px-2 font-medium">Over-Offering</th>
                          <th className="text-right py-3 px-2 font-medium">Waste Ratio</th>
                          <th className="text-right py-3 px-2 font-medium">Agent %</th>
                        </tr>
                      </thead>
                      <tbody>
                        {analysis.markets.map((market) => (
                          <tr key={market.country} className="border-b hover:bg-muted/50">
                            <td className="py-3 px-2 font-medium">{market.country}</td>
                            <td className="text-right py-3 px-2">{market.applications.toLocaleString()}</td>
                            <td className="text-right py-3 px-2">{market.offers.toLocaleString()}</td>
                            <td className="text-right py-3 px-2">{market.enrollments.toLocaleString()}</td>
                            <td className="text-right py-3 px-2">
                              <span className={market.conversionRate >= 20 ? 'text-green-600' : market.conversionRate >= 10 ? 'text-yellow-600' : 'text-red-600'}>
                                {market.conversionRate.toFixed(1)}%
                              </span>
                            </td>
                            <td className="text-right py-3 px-2">
                              <span className={market.overOfferingRatio <= 1.2 ? 'text-green-600' : market.overOfferingRatio <= 1.5 ? 'text-yellow-600' : 'text-red-600'}>
                                {market.overOfferingRatio.toFixed(2)}x
                              </span>
                            </td>
                            <td className="text-right py-3 px-2">
                              <span className={market.wasteRatio <= 30 ? 'text-green-600' : market.wasteRatio <= 50 ? 'text-yellow-600' : 'text-red-600'}>
                                {market.wasteRatio.toFixed(0)}%
                              </span>
                            </td>
                            <td className="text-right py-3 px-2">
                              {((market.agentDriven / (market.agentDriven + market.organic)) * 100).toFixed(0)}%
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Recruitment Channel Quality
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {analysis.markets.slice(0, 5).map((market) => {
                      const agentPct = (market.agentDriven / (market.agentDriven + market.organic)) * 100;
                      return (
                        <div key={market.country} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>{market.country}</span>
                            <span className="text-muted-foreground">
                              {agentPct.toFixed(0)}% Agent / {(100 - agentPct).toFixed(0)}% Organic
                            </span>
                          </div>
                          <div className="flex h-2 rounded-full overflow-hidden bg-muted">
                            <div 
                              className="bg-blue-500" 
                              style={{ width: `${agentPct}%` }} 
                            />
                            <div 
                              className="bg-green-500" 
                              style={{ width: `${100 - agentPct}%` }} 
                            />
                          </div>
                        </div>
                      );
                    })}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      High-Risk Markets
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {analysis.recommendations
                        .filter((r) => r.riskLevel === 'high')
                        .map((rec) => (
                          <div key={rec.country} className="flex items-center justify-between p-3 rounded-lg bg-red-500/5 border border-red-500/10">
                            <div>
                              <p className="font-medium">{rec.country}</p>
                              <p className="text-xs text-muted-foreground">{rec.reasoning.slice(0, 60)}...</p>
                            </div>
                            <Badge variant="outline" className="bg-red-500/10 text-red-600">
                              {rec.action}
                            </Badge>
                          </div>
                        ))}
                      {analysis.recommendations.filter((r) => r.riskLevel === 'high').length === 0 && (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No high-risk markets identified
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </>
      )}

      {isLoading && !analysis && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Generating AI market analysis...</p>
        </div>
      )}
    </div>
  );
}
