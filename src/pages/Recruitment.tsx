import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { useUniversity } from '@/contexts/UniversityContext';
import { useLanguage } from '@/contexts/LanguageContext';
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
  Building2,
  GraduationCap,
  FileCheck,
  CreditCard,
  Pause,
  Trash2,
  ArrowRightLeft,
  Save,
  Edit2,
} from 'lucide-react';

// Dummy data for 96 countries with ~5000 students total
const generateCountryData = () => {
  const countries = [
    { name: 'Syria', students: 412 },
    { name: 'Iran', students: 387 },
    { name: 'Azerbaijan', students: 356 },
    { name: 'Turkmenistan', students: 289 },
    { name: 'Kazakhstan', students: 276 },
    { name: 'Afghanistan', students: 234 },
    { name: 'Iraq', students: 223 },
    { name: 'Pakistan', students: 198 },
    { name: 'Egypt', students: 187 },
    { name: 'Jordan', students: 156 },
    { name: 'Palestine', students: 145 },
    { name: 'Libya', students: 134 },
    { name: 'Yemen', students: 123 },
    { name: 'Somalia', students: 112 },
    { name: 'Sudan', students: 98 },
    { name: 'Morocco', students: 87 },
    { name: 'Tunisia', students: 76 },
    { name: 'Algeria', students: 72 },
    { name: 'Nigeria', students: 68 },
    { name: 'Kenya', students: 64 },
    { name: 'Ethiopia', students: 58 },
    { name: 'Tanzania', students: 52 },
    { name: 'Uganda', students: 48 },
    { name: 'Ghana', students: 45 },
    { name: 'Cameroon', students: 42 },
    { name: 'Senegal', students: 38 },
    { name: 'Côte d\'Ivoire', students: 35 },
    { name: 'Mali', students: 32 },
    { name: 'Burkina Faso', students: 28 },
    { name: 'Niger', students: 25 },
    { name: 'Chad', students: 22 },
    { name: 'Mauritania', students: 18 },
    { name: 'Djibouti', students: 15 },
    { name: 'Comoros', students: 12 },
    { name: 'Indonesia', students: 89 },
    { name: 'Malaysia', students: 76 },
    { name: 'Bangladesh', students: 65 },
    { name: 'India', students: 58 },
    { name: 'Philippines', students: 45 },
    { name: 'Vietnam', students: 42 },
    { name: 'Thailand', students: 38 },
    { name: 'Nepal', students: 34 },
    { name: 'Sri Lanka', students: 28 },
    { name: 'Myanmar', students: 24 },
    { name: 'Cambodia', students: 18 },
    { name: 'Laos', students: 14 },
    { name: 'Mongolia', students: 32 },
    { name: 'Uzbekistan', students: 78 },
    { name: 'Kyrgyzstan', students: 65 },
    { name: 'Tajikistan', students: 54 },
    { name: 'Georgia', students: 48 },
    { name: 'Armenia', students: 42 },
    { name: 'Russia', students: 56 },
    { name: 'Ukraine', students: 45 },
    { name: 'Belarus', students: 32 },
    { name: 'Moldova', students: 24 },
    { name: 'Kosovo', students: 28 },
    { name: 'Albania', students: 35 },
    { name: 'North Macedonia', students: 22 },
    { name: 'Bosnia', students: 18 },
    { name: 'Serbia', students: 15 },
    { name: 'Montenegro', students: 12 },
    { name: 'Bulgaria', students: 25 },
    { name: 'Romania', students: 28 },
    { name: 'Greece', students: 22 },
    { name: 'Cyprus', students: 18 },
    { name: 'Germany', students: 45 },
    { name: 'France', students: 38 },
    { name: 'UK', students: 32 },
    { name: 'Netherlands', students: 28 },
    { name: 'Belgium', students: 22 },
    { name: 'Austria', students: 18 },
    { name: 'Switzerland', students: 15 },
    { name: 'Italy', students: 25 },
    { name: 'Spain', students: 22 },
    { name: 'Portugal', students: 15 },
    { name: 'Poland', students: 28 },
    { name: 'Czech Republic', students: 22 },
    { name: 'Hungary', students: 18 },
    { name: 'Slovakia', students: 12 },
    { name: 'Slovenia', students: 10 },
    { name: 'Croatia', students: 14 },
    { name: 'Sweden', students: 18 },
    { name: 'Norway', students: 14 },
    { name: 'Denmark', students: 12 },
    { name: 'Finland', students: 10 },
    { name: 'USA', students: 42 },
    { name: 'Canada', students: 28 },
    { name: 'Mexico', students: 18 },
    { name: 'Brazil', students: 22 },
    { name: 'Argentina', students: 15 },
    { name: 'Colombia', students: 12 },
    { name: 'Chile', students: 10 },
    { name: 'Peru', students: 8 },
    { name: 'Australia', students: 18 },
    { name: 'New Zealand', students: 10 },
  ];

  return countries.map(c => ({
    ...c,
    acceptanceLetters: Math.floor(c.students * (1.2 + Math.random() * 0.3)),
    applied: Math.floor(c.students * (0.85 + Math.random() * 0.15)),
    paid: c.students,
    frozen: Math.floor(c.students * (0.02 + Math.random() * 0.05)),
    transfer: Math.floor(c.students * (0.05 + Math.random() * 0.08)),
    deleted: Math.floor(c.students * (0.03 + Math.random() * 0.04)),
    graduated: Math.floor(c.students * (0.15 + Math.random() * 0.2)),
  }));
};

// 20 recruitment agencies
const generateAgencyData = () => [
  { name: 'United Education', students: 423, countries: ['Syria', 'Iraq', 'Jordan'], commission: 15 },
  { name: 'Global Study Partners', students: 387, countries: ['Iran', 'Azerbaijan', 'Turkmenistan'], commission: 12 },
  { name: 'EduWorld International', students: 356, countries: ['Pakistan', 'Afghanistan', 'Bangladesh'], commission: 14 },
  { name: 'Academic Bridge', students: 312, countries: ['Egypt', 'Libya', 'Tunisia'], commission: 13 },
  { name: 'Horizon Education', students: 289, countries: ['Kazakhstan', 'Uzbekistan', 'Kyrgyzstan'], commission: 11 },
  { name: 'StudyAbroad Pro', students: 267, countries: ['Nigeria', 'Ghana', 'Kenya'], commission: 16 },
  { name: 'Eastern Gateway', students: 245, countries: ['Indonesia', 'Malaysia', 'Philippines'], commission: 12 },
  { name: 'Eurasia Connect', students: 223, countries: ['Russia', 'Ukraine', 'Belarus'], commission: 10 },
  { name: 'Middle East Education', students: 198, countries: ['Palestine', 'Yemen', 'Somalia'], commission: 14 },
  { name: 'African Scholars', students: 187, countries: ['Ethiopia', 'Tanzania', 'Uganda'], commission: 15 },
  { name: 'Central Asia Link', students: 165, countries: ['Tajikistan', 'Mongolia', 'Georgia'], commission: 11 },
  { name: 'Balkan Education Hub', students: 145, countries: ['Kosovo', 'Albania', 'North Macedonia'], commission: 13 },
  { name: 'European Studies', students: 134, countries: ['Germany', 'France', 'Netherlands'], commission: 8 },
  { name: 'South Asia Connect', students: 123, countries: ['India', 'Nepal', 'Sri Lanka'], commission: 14 },
  { name: 'Americas Education', students: 98, countries: ['USA', 'Canada', 'Brazil'], commission: 9 },
  { name: 'Pacific Rim Partners', students: 87, countries: ['Australia', 'New Zealand', 'Thailand'], commission: 10 },
  { name: 'Nordic Bridge', students: 65, countries: ['Sweden', 'Norway', 'Finland'], commission: 7 },
  { name: 'Mediterranean Gate', students: 54, countries: ['Italy', 'Spain', 'Portugal'], commission: 9 },
  { name: 'Silk Road Education', students: 45, countries: ['Armenia', 'Moldova', 'Vietnam'], commission: 12 },
  { name: 'Global Campus', students: 38, countries: ['Mexico', 'Colombia', 'Chile'], commission: 11 },
];

interface CountryStats {
  name: string;
  students: number;
  acceptanceLetters: number;
  applied: number;
  paid: number;
  frozen: number;
  transfer: number;
  deleted: number;
  graduated: number;
}

interface AgencyStats {
  name: string;
  students: number;
  countries: string[];
  commission: number;
}

// Market Intelligence Component (existing)
function MarketIntelligenceTab() {
  const { selectedUniversity } = useUniversity();
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<any>(null);
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
      case 'scale': return <TrendingUp className="h-4 w-4" />;
      case 'pause': return <PauseCircle className="h-4 w-4" />;
      case 'exit': return <XCircle className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'scale': return 'bg-green-500/10 text-green-600 border-green-500/20';
      case 'pause': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'exit': return 'bg-red-500/10 text-red-600 border-red-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-500/10 text-green-600';
      case 'medium': return 'bg-yellow-500/10 text-yellow-600';
      case 'high': return 'bg-red-500/10 text-red-600';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Market Intelligence</h2>
          <p className="text-sm text-muted-foreground">AI-powered recruitment market analysis</p>
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

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {analysis.recommendations?.map((rec: any) => (
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
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      )}

      {isLoading && !analysis && (
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Generating market intelligence...</p>
        </div>
      )}
    </div>
  );
}

export default function Recruitment() {
  const { selectedUniversity } = useUniversity();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [countryStats, setCountryStats] = useState<CountryStats[]>(generateCountryData());
  const [agencyStats, setAgencyStats] = useState<AgencyStats[]>(generateAgencyData());
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Calculate totals
  const totals = countryStats.reduce((acc, c) => ({
    students: acc.students + c.students,
    acceptanceLetters: acc.acceptanceLetters + c.acceptanceLetters,
    applied: acc.applied + c.applied,
    paid: acc.paid + c.paid,
    frozen: acc.frozen + c.frozen,
    transfer: acc.transfer + c.transfer,
    deleted: acc.deleted + c.deleted,
    graduated: acc.graduated + c.graduated,
  }), { students: 0, acceptanceLetters: 0, applied: 0, paid: 0, frozen: 0, transfer: 0, deleted: 0, graduated: 0 });

  const agencyTotals = agencyStats.reduce((acc, a) => acc + a.students, 0);

  const updateCountryStat = (index: number, field: keyof CountryStats, value: number) => {
    const updated = [...countryStats];
    (updated[index] as any)[field] = value;
    setCountryStats(updated);
  };

  const updateAgencyStat = (index: number, value: number) => {
    const updated = [...agencyStats];
    updated[index].students = value;
    setAgencyStats(updated);
  };

  const saveChanges = () => {
    setEditMode(false);
    toast({
      title: t('recruitment.saved'),
      description: t('recruitment.savedDesc'),
    });
  };

  const filteredCountries = countryStats.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredAgencies = agencyStats.filter(a => 
    a.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!selectedUniversity) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">{t('recruitment.selectUniversity')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('recruitment.title')}</h1>
          <p className="text-muted-foreground">
            {t('recruitment.subtitle')} - {selectedUniversity.name}
          </p>
        </div>
        <div className="flex gap-2">
          {editMode ? (
            <Button onClick={saveChanges}>
              <Save className="mr-2 h-4 w-4" />
              {t('common.save')}
            </Button>
          ) : (
            <Button variant="outline" onClick={() => setEditMode(true)}>
              <Edit2 className="mr-2 h-4 w-4" />
              {t('recruitment.editNumbers')}
            </Button>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-8">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {t('recruitment.totalStudents')}
            </CardDescription>
            <CardTitle className="text-2xl">{totals.students.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Globe className="h-3 w-3" />
              {t('recruitment.countries')}
            </CardDescription>
            <CardTitle className="text-2xl">{countryStats.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-blue-500/20">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <FileCheck className="h-3 w-3 text-blue-600" />
              {t('recruitment.acceptanceLetters')}
            </CardDescription>
            <CardTitle className="text-2xl text-blue-600">{totals.acceptanceLetters.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-green-500/20">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <CreditCard className="h-3 w-3 text-green-600" />
              {t('recruitment.paid')}
            </CardDescription>
            <CardTitle className="text-2xl text-green-600">{totals.paid.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-yellow-500/20">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Pause className="h-3 w-3 text-yellow-600" />
              {t('recruitment.frozen')}
            </CardDescription>
            <CardTitle className="text-2xl text-yellow-600">{totals.frozen.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-purple-500/20">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <ArrowRightLeft className="h-3 w-3 text-purple-600" />
              {t('recruitment.transfer')}
            </CardDescription>
            <CardTitle className="text-2xl text-purple-600">{totals.transfer.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-red-500/20">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Trash2 className="h-3 w-3 text-red-600" />
              {t('recruitment.deleted')}
            </CardDescription>
            <CardTitle className="text-2xl text-red-600">{totals.deleted.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-emerald-500/20">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <GraduationCap className="h-3 w-3 text-emerald-600" />
              {t('recruitment.graduated')}
            </CardDescription>
            <CardTitle className="text-2xl text-emerald-600">{totals.graduated.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      <Tabs defaultValue="countries" className="space-y-4">
        <TabsList>
          <TabsTrigger value="countries">{t('recruitment.byCountry')}</TabsTrigger>
          <TabsTrigger value="agencies">{t('recruitment.byAgency')}</TabsTrigger>
          <TabsTrigger value="intelligence">{t('recruitment.marketIntelligence')}</TabsTrigger>
        </TabsList>

        <div className="flex items-center gap-4 mb-4">
          <Input
            placeholder={t('common.search')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-xs"
          />
        </div>

        <TabsContent value="countries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5" />
                {t('recruitment.studentsByCountry')}
              </CardTitle>
              <CardDescription>
                {t('recruitment.studentsByCountryDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-background">
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium">{t('recruitment.country')}</th>
                      <th className="text-right py-3 px-2 font-medium">{t('recruitment.acceptanceLetters')}</th>
                      <th className="text-right py-3 px-2 font-medium">{t('recruitment.applied')}</th>
                      <th className="text-right py-3 px-2 font-medium">{t('recruitment.paid')}</th>
                      <th className="text-right py-3 px-2 font-medium">{t('recruitment.frozen')}</th>
                      <th className="text-right py-3 px-2 font-medium">{t('recruitment.transfer')}</th>
                      <th className="text-right py-3 px-2 font-medium">{t('recruitment.deleted')}</th>
                      <th className="text-right py-3 px-2 font-medium">{t('recruitment.graduated')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCountries.map((country, index) => (
                      <tr key={country.name} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-2 font-medium">{country.name}</td>
                        <td className="text-right py-3 px-2">
                          {editMode ? (
                            <Input
                              type="number"
                              value={country.acceptanceLetters}
                              onChange={(e) => updateCountryStat(countryStats.indexOf(country), 'acceptanceLetters', parseInt(e.target.value) || 0)}
                              className="w-20 h-8 text-right"
                            />
                          ) : (
                            country.acceptanceLetters.toLocaleString()
                          )}
                        </td>
                        <td className="text-right py-3 px-2">
                          {editMode ? (
                            <Input
                              type="number"
                              value={country.applied}
                              onChange={(e) => updateCountryStat(countryStats.indexOf(country), 'applied', parseInt(e.target.value) || 0)}
                              className="w-20 h-8 text-right"
                            />
                          ) : (
                            country.applied.toLocaleString()
                          )}
                        </td>
                        <td className="text-right py-3 px-2 text-green-600">
                          {editMode ? (
                            <Input
                              type="number"
                              value={country.paid}
                              onChange={(e) => updateCountryStat(countryStats.indexOf(country), 'paid', parseInt(e.target.value) || 0)}
                              className="w-20 h-8 text-right"
                            />
                          ) : (
                            country.paid.toLocaleString()
                          )}
                        </td>
                        <td className="text-right py-3 px-2 text-yellow-600">
                          {editMode ? (
                            <Input
                              type="number"
                              value={country.frozen}
                              onChange={(e) => updateCountryStat(countryStats.indexOf(country), 'frozen', parseInt(e.target.value) || 0)}
                              className="w-20 h-8 text-right"
                            />
                          ) : (
                            country.frozen.toLocaleString()
                          )}
                        </td>
                        <td className="text-right py-3 px-2 text-purple-600">
                          {editMode ? (
                            <Input
                              type="number"
                              value={country.transfer}
                              onChange={(e) => updateCountryStat(countryStats.indexOf(country), 'transfer', parseInt(e.target.value) || 0)}
                              className="w-20 h-8 text-right"
                            />
                          ) : (
                            country.transfer.toLocaleString()
                          )}
                        </td>
                        <td className="text-right py-3 px-2 text-red-600">
                          {editMode ? (
                            <Input
                              type="number"
                              value={country.deleted}
                              onChange={(e) => updateCountryStat(countryStats.indexOf(country), 'deleted', parseInt(e.target.value) || 0)}
                              className="w-20 h-8 text-right"
                            />
                          ) : (
                            country.deleted.toLocaleString()
                          )}
                        </td>
                        <td className="text-right py-3 px-2 text-emerald-600">
                          {editMode ? (
                            <Input
                              type="number"
                              value={country.graduated}
                              onChange={(e) => updateCountryStat(countryStats.indexOf(country), 'graduated', parseInt(e.target.value) || 0)}
                              className="w-20 h-8 text-right"
                            />
                          ) : (
                            country.graduated.toLocaleString()
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="sticky bottom-0 bg-muted font-medium">
                    <tr>
                      <td className="py-3 px-2">{t('recruitment.total')}</td>
                      <td className="text-right py-3 px-2">{totals.acceptanceLetters.toLocaleString()}</td>
                      <td className="text-right py-3 px-2">{totals.applied.toLocaleString()}</td>
                      <td className="text-right py-3 px-2 text-green-600">{totals.paid.toLocaleString()}</td>
                      <td className="text-right py-3 px-2 text-yellow-600">{totals.frozen.toLocaleString()}</td>
                      <td className="text-right py-3 px-2 text-purple-600">{totals.transfer.toLocaleString()}</td>
                      <td className="text-right py-3 px-2 text-red-600">{totals.deleted.toLocaleString()}</td>
                      <td className="text-right py-3 px-2 text-emerald-600">{totals.graduated.toLocaleString()}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="agencies" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                {t('recruitment.studentsByAgency')}
              </CardTitle>
              <CardDescription>
                {t('recruitment.studentsByAgencyDesc')} ({agencyStats.length} {t('recruitment.agencies')})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium">{t('recruitment.agency')}</th>
                      <th className="text-right py-3 px-2 font-medium">{t('recruitment.students')}</th>
                      <th className="text-left py-3 px-2 font-medium">{t('recruitment.mainCountries')}</th>
                      <th className="text-right py-3 px-2 font-medium">{t('recruitment.commission')} %</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredAgencies.map((agency, index) => (
                      <tr key={agency.name} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-2 font-medium">{agency.name}</td>
                        <td className="text-right py-3 px-2">
                          {editMode ? (
                            <Input
                              type="number"
                              value={agency.students}
                              onChange={(e) => updateAgencyStat(agencyStats.indexOf(agency), parseInt(e.target.value) || 0)}
                              className="w-24 h-8 text-right"
                            />
                          ) : (
                            agency.students.toLocaleString()
                          )}
                        </td>
                        <td className="py-3 px-2">
                          <div className="flex gap-1 flex-wrap">
                            {agency.countries.map(c => (
                              <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                            ))}
                          </div>
                        </td>
                        <td className="text-right py-3 px-2">{agency.commission}%</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-muted font-medium">
                    <tr>
                      <td className="py-3 px-2">{t('recruitment.total')}</td>
                      <td className="text-right py-3 px-2">{agencyTotals.toLocaleString()}</td>
                      <td className="py-3 px-2"></td>
                      <td className="text-right py-3 px-2">
                        {(agencyStats.reduce((acc, a) => acc + a.commission, 0) / agencyStats.length).toFixed(1)}% {t('recruitment.avg')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="intelligence">
          <MarketIntelligenceTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
