import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Calendar,
  Wrench,
  ShieldCheck,
  School,
  Flag,
} from 'lucide-react';
import { StudentPlacementTab } from '@/components/recruitment/StudentPlacementTab';
import { NationalityDistributionTab } from '@/components/recruitment/NationalityDistributionTab';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// Years available
const years = ['2024-2025', '2023-2024', '2022-2023', '2021-2022', '2020-2021'];

// Helpers

type Totals = {
  acceptanceLetters: number;
  registered: number;
  frozen: number;
  transfer: number;
  deleted: number;
  graduated: number;
};

const normalizeToTotal = (values: number[], targetTotal: number) => {
  const safeTarget = Math.max(0, Math.floor(targetTotal));
  const safeValues = values.map((v) => Math.max(0, Number.isFinite(v) ? v : 0));
  const sum = safeValues.reduce((a, b) => a + b, 0);

  if (sum === 0) return safeValues.map(() => 0);
  if (safeTarget === sum) return safeValues;

  const scaled = safeValues.map((v) => (v / sum) * safeTarget);
  const floors = scaled.map((v) => Math.floor(v));
  let remainder = safeTarget - floors.reduce((a, b) => a + b, 0);

  const order = scaled
    .map((v, idx) => ({ idx, frac: v - Math.floor(v) }))
    .sort((a, b) => b.frac - a.frac);

  const result = [...floors];
  for (let i = 0; i < order.length && remainder > 0; i += 1) {
    result[order[i].idx] += 1;
    remainder -= 1;
  }
  return result;
};

const isKocUniversityName = (name?: string | null) => {
  if (!name) return false;
  const normalized = name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  return normalized.includes('koc');
};

// Generate country data with year-specific variations
const generateCountryDataForYear = (
  year: string,
  opts?: { targetRegisteredTotal?: number; maxCountries?: number }
) => {
  const baseCountries = [
    { name: 'Turkmenistan', base: 3000 },
    { name: 'Syria', base: 520 },
    { name: 'Yemen', base: 340 },
    { name: 'Iraq', base: 310 },
    { name: 'Iran', base: 245 },
    { name: 'Afghanistan', base: 210 },
    { name: 'Azerbaijan', base: 195 },
    { name: 'Palestine', base: 175 },
    { name: 'Somalia', base: 155 },
    { name: 'Libya', base: 140 },
    { name: 'Egypt', base: 125 },
    { name: 'Jordan', base: 110 },
    { name: 'Pakistan', base: 105 },
    { name: 'Kazakhstan', base: 95 },
    { name: 'Sudan', base: 85 },
    { name: 'Indonesia', base: 72 },
    { name: 'Uzbekistan', base: 68 },
    { name: 'Nigeria', base: 62 },
    { name: 'Morocco', base: 55 },
    { name: 'Bangladesh', base: 48 },
    { name: 'Chad', base: 42 },
    { name: 'Kyrgyzstan', base: 38 },
    { name: 'Tajikistan', base: 35 },
    { name: 'Ghana', base: 45 },
    { name: 'Cameroon', base: 42 },
    { name: 'Senegal', base: 38 },
    { name: "Côte d'Ivoire", base: 35 },
    { name: 'Mali', base: 32 },
    { name: 'Burkina Faso', base: 28 },
    { name: 'Niger', base: 25 },
    { name: 'Chad', base: 22 },
    { name: 'Mauritania', base: 18 },
    { name: 'Djibouti', base: 15 },
    { name: 'Comoros', base: 12 },
    { name: 'Indonesia', base: 89 },
    { name: 'Malaysia', base: 76 },
    { name: 'Bangladesh', base: 65 },
    { name: 'India', base: 58 },
    { name: 'Philippines', base: 45 },
    { name: 'Vietnam', base: 42 },
    { name: 'Thailand', base: 38 },
    { name: 'Nepal', base: 34 },
    { name: 'Sri Lanka', base: 28 },
    { name: 'Myanmar', base: 24 },
    { name: 'Cambodia', base: 18 },
    { name: 'Laos', base: 14 },
    { name: 'Mongolia', base: 32 },
    { name: 'Uzbekistan', base: 78 },
    { name: 'Kyrgyzstan', base: 65 },
    { name: 'Tajikistan', base: 54 },
    { name: 'Georgia', base: 48 },
    { name: 'Armenia', base: 42 },
    { name: 'Russia', base: 56 },
    { name: 'Ukraine', base: 45 },
    { name: 'Belarus', base: 32 },
    { name: 'Moldova', base: 24 },
    { name: 'Kosovo', base: 28 },
    { name: 'Albania', base: 35 },
    { name: 'North Macedonia', base: 22 },
    { name: 'Bosnia', base: 18 },
    { name: 'Serbia', base: 15 },
    { name: 'Montenegro', base: 12 },
    { name: 'Bulgaria', base: 25 },
    { name: 'Romania', base: 28 },
    { name: 'Greece', base: 22 },
    { name: 'Cyprus', base: 18 },
    { name: 'Germany', base: 45 },
    { name: 'France', base: 38 },
    { name: 'UK', base: 32 },
    { name: 'Netherlands', base: 28 },
    { name: 'Belgium', base: 22 },
    { name: 'Austria', base: 18 },
    { name: 'Switzerland', base: 15 },
    { name: 'Italy', base: 25 },
    { name: 'Spain', base: 22 },
    { name: 'Portugal', base: 15 },
    { name: 'Poland', base: 28 },
    { name: 'Czech Republic', base: 22 },
    { name: 'Hungary', base: 18 },
    { name: 'Slovakia', base: 12 },
    { name: 'Slovenia', base: 10 },
    { name: 'Croatia', base: 14 },
    { name: 'Sweden', base: 18 },
    { name: 'Norway', base: 14 },
    { name: 'Denmark', base: 12 },
    { name: 'Finland', base: 10 },
    { name: 'USA', base: 42 },
    { name: 'Canada', base: 28 },
    { name: 'Mexico', base: 18 },
    { name: 'Brazil', base: 22 },
    { name: 'Argentina', base: 15 },
    { name: 'Colombia', base: 12 },
    { name: 'Chile', base: 10 },
    { name: 'Peru', base: 8 },
    { name: 'Australia', base: 18 },
    { name: 'New Zealand', base: 10 },
  ];

  // Year multiplier for variation
  const yearIndex = Math.max(0, years.indexOf(year));
  const multiplier = 1 - yearIndex * 0.08; // Older years have fewer students

  const countries = typeof opts?.maxCountries === 'number' ? baseCountries.slice(0, opts.maxCountries) : baseCountries;

  const rawRegistered = countries.map((c) => Math.max(0, Math.floor(c.base * multiplier)));
  const registeredValues =
    typeof opts?.targetRegisteredTotal === 'number'
      ? normalizeToTotal(rawRegistered, opts.targetRegisteredTotal)
      : rawRegistered;

  return countries.map((c, idx) => {
    const registered = registeredValues[idx];
    return {
      name: c.name,
      acceptanceLetters: Math.round(registered * 1.35),
      registered,
      frozen: Math.round(registered * 0.04),
      transfer: Math.round(registered * 0.07),
      deleted: Math.round(registered * 0.035),
      graduated: Math.round(registered * 0.18),
    };
  });
};

// 20 recruitment agencies with year variations
const generateAgencyDataForYear = (year: string, opts?: { targetStudentsTotal?: number }) => {
  const baseAgencies = [
    { name: 'United Education', base: 423, countries: ['Syria', 'Iraq', 'Jordan'], commission: 15 },
    { name: 'Global Study Partners', base: 387, countries: ['Iran', 'Azerbaijan', 'Turkmenistan'], commission: 12 },
    { name: 'EduWorld International', base: 356, countries: ['Pakistan', 'Afghanistan', 'Bangladesh'], commission: 14 },
    { name: 'Academic Bridge', base: 312, countries: ['Egypt', 'Libya', 'Tunisia'], commission: 13 },
    { name: 'Horizon Education', base: 289, countries: ['Kazakhstan', 'Uzbekistan', 'Kyrgyzstan'], commission: 11 },
    { name: 'StudyAbroad Pro', base: 267, countries: ['Nigeria', 'Ghana', 'Kenya'], commission: 16 },
    { name: 'Eastern Gateway', base: 245, countries: ['Indonesia', 'Malaysia', 'Philippines'], commission: 12 },
    { name: 'Eurasia Connect', base: 223, countries: ['Russia', 'Ukraine', 'Belarus'], commission: 10 },
    { name: 'Middle East Education', base: 198, countries: ['Palestine', 'Yemen', 'Somalia'], commission: 14 },
    { name: 'African Scholars', base: 187, countries: ['Ethiopia', 'Tanzania', 'Uganda'], commission: 15 },
    { name: 'Central Asia Link', base: 165, countries: ['Tajikistan', 'Mongolia', 'Georgia'], commission: 11 },
    { name: 'Balkan Education Hub', base: 145, countries: ['Kosovo', 'Albania', 'North Macedonia'], commission: 13 },
    { name: 'European Studies', base: 134, countries: ['Germany', 'France', 'Netherlands'], commission: 8 },
    { name: 'South Asia Connect', base: 123, countries: ['India', 'Nepal', 'Sri Lanka'], commission: 14 },
    { name: 'Americas Education', base: 98, countries: ['USA', 'Canada', 'Brazil'], commission: 9 },
    { name: 'Pacific Rim Partners', base: 87, countries: ['Australia', 'New Zealand', 'Thailand'], commission: 10 },
    { name: 'Nordic Bridge', base: 65, countries: ['Sweden', 'Norway', 'Finland'], commission: 7 },
    { name: 'Mediterranean Gate', base: 54, countries: ['Italy', 'Spain', 'Portugal'], commission: 9 },
    { name: 'Silk Road Education', base: 45, countries: ['Armenia', 'Moldova', 'Vietnam'], commission: 12 },
    { name: 'Global Campus', base: 38, countries: ['Mexico', 'Colombia', 'Chile'], commission: 11 },
  ];

  const yearIndex = Math.max(0, years.indexOf(year));
  const multiplier = 1 - yearIndex * 0.08;

  const rawStudents = baseAgencies.map((a) => Math.max(0, Math.floor(a.base * multiplier)));
  const studentsValues =
    typeof opts?.targetStudentsTotal === 'number'
      ? normalizeToTotal(rawStudents, opts.targetStudentsTotal)
      : rawStudents;

  return baseAgencies.map((a, idx) => ({
    ...a,
    students: studentsValues[idx],
  }));
};

interface CountryStats {
  name: string;
  acceptanceLetters: number;
  registered: number;
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

const normalizeAgencyStudents = (agencies: AgencyStats[], targetTotal: number): AgencyStats[] => {
  const normalized = normalizeToTotal(
    agencies.map((a) => Math.max(0, a.students)),
    targetTotal
  );
  return agencies.map((a, idx) => ({ ...a, students: normalized[idx] }));
};

// Market Intelligence Component
function MarketIntelligenceTab(props: {
  isDummy?: boolean;
  totals?: Totals;
  countryStats?: CountryStats[];
  year?: string;
}) {
  const { isDummy, totals, countryStats, year } = props;

  const { selectedUniversity } = useUniversity();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  const buildDummyAnalysis = () => {
    const totalApplications = totals?.acceptanceLetters ?? 0;
    const registered = totals?.registered ?? 0;
    const averageConversion = totalApplications > 0 ? (registered / totalApplications) * 100 : 0;

    const top = [...(countryStats ?? [])]
      .sort((a, b) => b.registered - a.registered)
      .slice(0, 12);

    const recommendations = top.map((c, idx) => {
      const conversion = c.acceptanceLetters > 0 ? (c.registered / c.acceptanceLetters) * 100 : 0;

      const action = idx < 5 ? 'scale' : idx < 9 ? 'pause' : 'exit';
      const riskLevel = idx < 5 ? 'low' : idx < 9 ? 'medium' : 'high';
      const confidence = Math.max(55, Math.min(95, Math.round(conversion)));

      return {
        country: c.name,
        action,
        riskLevel,
        confidence,
        reasoning: `Based on ${c.registered.toLocaleString()} registered students (${conversion.toFixed(1)}% conversion) for ${year ?? 'this year'}.`,
      };
    });

    return {
      summary: {
        totalApplications,
        averageConversion,
        marketsToScale: recommendations.filter((r) => r.action === 'scale').length,
        marketsToPause: recommendations.filter((r) => r.action === 'pause').length,
        marketsToExit: recommendations.filter((r) => r.action === 'exit').length,
      },
      recommendations,
    };
  };

  const generateAnalysis = async () => {
    if (!selectedUniversity?.id) return;

    // Dummy mode for Koç: keep the intelligence numbers aligned with the country/agency tabs.
    if (isDummy) {
      setIsLoading(true);
      try {
        const dummy = buildDummyAnalysis();
        setAnalysis(dummy);
        toast({
          title: t('recruitment.analysisComplete'),
          description: t('recruitment.analysisCompleteDesc'),
        });
      } finally {
        setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('market-intelligence', {
        body: { university_id: selectedUniversity.id },
      });

      if (error) throw error;
      if (data.error) throw new Error(data.error);

      setAnalysis(data.analysis);
      toast({
        title: t('recruitment.analysisComplete'),
        description: t('recruitment.analysisCompleteDesc'),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : t('recruitment.analysisFailed');
      toast({
        title: t('recruitment.analysisError'),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedUniversity?.id, isDummy, totals?.registered, totals?.acceptanceLetters, year, countryStats?.length]);

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
          <h2 className="text-xl font-semibold">{t('recruitment.marketIntelligence')}</h2>
          <p className="text-sm text-muted-foreground">{t('intelligence.subtitle')}</p>
        </div>
        <Button onClick={generateAnalysis} disabled={isLoading}>
          {isLoading ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              {t('recruitment.analyzing')}
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              {t('common.refresh')}
            </>
          )}
        </Button>
      </div>

      {analysis && (
        <>
          <div className="grid gap-4 md:grid-cols-5">
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t('recruitment.totalApplications')}</CardDescription>
                <CardTitle className="text-2xl">{analysis.summary.totalApplications.toLocaleString()}</CardTitle>
              </CardHeader>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardDescription>{t('recruitment.avgConversion')}</CardDescription>
                <CardTitle className="text-2xl">{analysis.summary.averageConversion.toFixed(1)}%</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-green-500/20">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-600" />
                  {t('recruitment.marketsToScale')}
                </CardDescription>
                <CardTitle className="text-2xl text-green-600">{analysis.summary.marketsToScale}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-yellow-500/20">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <PauseCircle className="h-3 w-3 text-yellow-600" />
                  {t('recruitment.marketsToPause')}
                </CardDescription>
                <CardTitle className="text-2xl text-yellow-600">{analysis.summary.marketsToPause}</CardTitle>
              </CardHeader>
            </Card>
            <Card className="border-red-500/20">
              <CardHeader className="pb-2">
                <CardDescription className="flex items-center gap-1">
                  <XCircle className="h-3 w-3 text-red-600" />
                  {t('recruitment.marketsToExit')}
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
                    <span className="text-muted-foreground">{t('intelligence.confidence')}</span>
                    <div className="flex items-center gap-2">
                      <Progress value={rec.confidence} className="w-20 h-2" />
                      <span className="font-medium">{rec.confidence}%</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{t('intelligence.risk')}</span>
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
          <p className="text-muted-foreground">{t('recruitment.generatingIntelligence')}</p>
        </div>
      )}
    </div>
  );
}

export default function Recruitment() {
  const { selectedUniversity } = useUniversity();
  const { t } = useLanguage();
  const { toast } = useToast();

  const isKoc = isKocUniversityName(selectedUniversity?.name);

  const [selectedYear, setSelectedYear] = useState(years[0]);
  const [countryStats, setCountryStats] = useState<CountryStats[]>([]);
  const [agencyStats, setAgencyStats] = useState<AgencyStats[]>([]);
  const [editMode, setEditMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Load data when year changes
  useEffect(() => {
    const yearIndex = Math.max(0, years.indexOf(selectedYear));
    const multiplier = 1 - yearIndex * 0.08;

    // Only enforce the Koç "5,000 students" requirement in dummy mode.
    const targetRegisteredTotal = isKoc ? Math.round(5000 * multiplier) : undefined;
    const maxCountries = isKoc ? 96 : undefined;

    const countries = generateCountryDataForYear(selectedYear, {
      targetRegisteredTotal,
      maxCountries,
    });

    const registeredTotal = countries.reduce((acc, c) => acc + c.registered, 0);

    setCountryStats(countries);
    setAgencyStats(generateAgencyDataForYear(selectedYear, { targetStudentsTotal: registeredTotal }));
  }, [selectedYear, isKoc]);

  // Calculate totals
  const totals = countryStats.reduce((acc, c) => ({
    acceptanceLetters: acc.acceptanceLetters + c.acceptanceLetters,
    registered: acc.registered + c.registered,
    frozen: acc.frozen + c.frozen,
    transfer: acc.transfer + c.transfer,
    deleted: acc.deleted + c.deleted,
    graduated: acc.graduated + c.graduated,
  }), { acceptanceLetters: 0, registered: 0, frozen: 0, transfer: 0, deleted: 0, graduated: 0 });

  const agencyTotals = agencyStats.reduce((acc, a) => acc + a.students, 0);

  // Data Consistency Check
  const hasInconsistency = agencyTotals !== totals.registered;
  const discrepancy = Math.abs(agencyTotals - totals.registered);
  const discrepancyPercent = totals.registered > 0 ? ((discrepancy / totals.registered) * 100).toFixed(1) : '0';

  const autoFixConsistency = () => {
    // Normalize agency students to match country registered total
    setAgencyStats((prev) => normalizeAgencyStudents(prev, totals.registered));
    toast({
      title: t('recruitment.consistencyFixed'),
      description: t('recruitment.consistencyFixedDesc'),
    });
  };

  const handleCountryChange = (countryName: string, field: keyof CountryStats, value: string) => {
    const numValue = parseInt(value) || 0;
    setCountryStats(prev => prev.map(c => 
      c.name === countryName ? { ...c, [field]: numValue } : c
    ));
  };

  const handleAgencyChange = (agencyName: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setAgencyStats(prev => prev.map(a => 
      a.name === agencyName ? { ...a, students: numValue } : a
    ));
  };

  const saveChanges = () => {
    // Keep agency totals aligned with the country tab's registered total.
    setAgencyStats((prev) => normalizeAgencyStudents(prev, totals.registered));

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
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{t('recruitment.title')}</h1>
          <p className="text-muted-foreground">
            {t('recruitment.subtitle')} - {selectedUniversity.name}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-[140px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-7">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              {t('recruitment.registered')}
            </CardDescription>
            <CardTitle className="text-2xl">{totals.registered.toLocaleString()}</CardTitle>
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

      {/* Data Consistency Banner */}
      {hasInconsistency && (
        <Alert variant="destructive" className="border-yellow-500/50 bg-yellow-500/10 text-yellow-700 dark:text-yellow-400">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle className="flex items-center justify-between">
            <span>{t('recruitment.dataInconsistency')}</span>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={autoFixConsistency}
              className="ml-4 border-yellow-500/50 hover:bg-yellow-500/20"
            >
              <Wrench className="mr-2 h-3 w-3" />
              {t('recruitment.autoFix')}
            </Button>
          </AlertTitle>
          <AlertDescription>
            Agency total ({agencyTotals.toLocaleString()}) ≠ Country registered ({totals.registered.toLocaleString()}). 
            Difference: {discrepancy.toLocaleString()} ({discrepancyPercent}%)
          </AlertDescription>
        </Alert>
      )}

      {!hasInconsistency && (
        <Alert className="border-green-500/50 bg-green-500/10 text-green-700 dark:text-green-400">
          <ShieldCheck className="h-4 w-4" />
          <AlertTitle>{t('recruitment.dataConsistent')}</AlertTitle>
          <AlertDescription>
            All tabs reconcile to {totals.registered.toLocaleString()} registered students.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="countries" className="space-y-4">
        <TabsList className="flex flex-wrap">
          <TabsTrigger value="countries">{t('recruitment.byCountry')}</TabsTrigger>
          <TabsTrigger value="agencies">{t('recruitment.byAgency')}</TabsTrigger>
          <TabsTrigger value="placement" className="gap-1">
            <School className="h-3 w-3" />
            Student Placement
          </TabsTrigger>
          <TabsTrigger value="nationalities" className="gap-1">
            <Flag className="h-3 w-3" />
            Nationalities
          </TabsTrigger>
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
                {t('recruitment.studentsByCountry')} - {selectedYear}
              </CardTitle>
              <CardDescription>
                {t('recruitment.studentsByCountryDesc')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-background z-10">
                    <tr className="border-b">
                      <th className="text-left py-3 px-2 font-medium">{t('recruitment.country')}</th>
                      <th className="text-right py-3 px-2 font-medium">{t('recruitment.acceptanceLetters')}</th>
                      <th className="text-right py-3 px-2 font-medium">{t('recruitment.registered')}</th>
                      <th className="text-right py-3 px-2 font-medium">{t('recruitment.frozen')}</th>
                      <th className="text-right py-3 px-2 font-medium">{t('recruitment.transfer')}</th>
                      <th className="text-right py-3 px-2 font-medium">{t('recruitment.deleted')}</th>
                      <th className="text-right py-3 px-2 font-medium">{t('recruitment.graduated')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCountries.map((country) => (
                      <tr key={country.name} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-2 font-medium">{country.name}</td>
                        <td className="text-right py-3 px-2">
                          {editMode ? (
                            <Input
                              type="number"
                              value={country.acceptanceLetters}
                              onChange={(e) => handleCountryChange(country.name, 'acceptanceLetters', e.target.value)}
                              className="w-20 h-8 text-right"
                            />
                          ) : (
                            country.acceptanceLetters.toLocaleString()
                          )}
                        </td>
                        <td className="text-right py-3 px-2 text-green-600">
                          {editMode ? (
                            <Input
                              type="number"
                              value={country.registered}
                              onChange={(e) => handleCountryChange(country.name, 'registered', e.target.value)}
                              className="w-20 h-8 text-right"
                            />
                          ) : (
                            country.registered.toLocaleString()
                          )}
                        </td>
                        <td className="text-right py-3 px-2 text-yellow-600">
                          {editMode ? (
                            <Input
                              type="number"
                              value={country.frozen}
                              onChange={(e) => handleCountryChange(country.name, 'frozen', e.target.value)}
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
                              onChange={(e) => handleCountryChange(country.name, 'transfer', e.target.value)}
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
                              onChange={(e) => handleCountryChange(country.name, 'deleted', e.target.value)}
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
                              onChange={(e) => handleCountryChange(country.name, 'graduated', e.target.value)}
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
                      <td className="text-right py-3 px-2 text-green-600">{totals.registered.toLocaleString()}</td>
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
                {t('recruitment.studentsByAgency')} - {selectedYear}
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
                    {filteredAgencies.map((agency) => (
                      <tr key={agency.name} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-2 font-medium">{agency.name}</td>
                        <td className="text-right py-3 px-2">
                          {editMode ? (
                            <Input
                              type="number"
                              value={agency.students}
                              onChange={(e) => handleAgencyChange(agency.name, e.target.value)}
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

        <TabsContent value="placement">
          <StudentPlacementTab />
        </TabsContent>

        <TabsContent value="nationalities">
          <NationalityDistributionTab />
        </TabsContent>

        <TabsContent value="intelligence">
          <MarketIntelligenceTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
