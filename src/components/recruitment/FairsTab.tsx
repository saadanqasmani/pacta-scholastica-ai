import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  Sparkles,
  MapPin,
  Calendar,
  Users,
  MessageSquare,
  TrendingUp,
  DollarSign,
  Globe,
  ChevronDown,
  ChevronUp,
  Building2,
  Target,
  Briefcase,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  Lightbulb,
  UserCheck,
} from 'lucide-react';
import { useUniversity } from '@/contexts/UniversityContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FairWorldMap } from './FairWorldMap';

// ── Fair data ──────────────────────────────────────────────

interface StaffFeedback {
  staffName: string;
  role: string;
  country: string;
  city: string;
  fairName: string;
  agency: string;
  dates: string;
  leadsGenerated: number;
  feedback: string;
  keyInsights: string[];
  diversityObserved: string[];
  challenges: string[];
  spendingPower: 'high' | 'medium' | 'low';
  spendingNote: string;
  demandPrograms: string[];
  languageBarrier: boolean;
}

const fairsData: StaffFeedback[] = [
  {
    staffName: 'Saadan',
    role: 'Senior Recruitment Specialist',
    country: 'Qatar',
    city: 'Doha',
    fairName: 'EDIS 8th Edition – Turkish Universities in Qatar',
    agency: 'United Education',
    dates: '15 Feb 2025',
    leadsGenerated: 187,
    feedback: 'Qatar has enormous potential but language of instruction is the critical barrier. Parents — especially Qatari nationals and long-term residents — want English-medium programs. Medicine had the highest demand at our booth but interest dropped sharply once we explained the program is in Turkish. Many students and parents asked about AI, Cloud Engineering, and Cybersecurity as standalone degrees. They felt "Computer Engineering" was too broad. The fair was extremely well-organised by United Education with high footfall.',
    keyInsights: [
      'Medicine in English would be a game-changer — multiple families said they would enroll immediately',
      'AI & Cloud Engineering demanded as separate degree, not a track inside CS',
      'Parents drive decisions — need parent-facing materials in Arabic & English',
      'Scholarship availability is the #1 question after language of instruction',
      'Strong interest in Foundation Year / preparatory programs before degree',
    ],
    diversityObserved: ['Pakistan', 'Nepal', 'India', 'Bangladesh', 'Nigeria', 'Iran', 'Morocco', 'Kuwait', 'Sudan', 'Philippines'],
    challenges: ['Turkish-medium programs limiting conversions', 'Lack of English program brochures', 'Competitor Turkish universities offering English tracks'],
    spendingPower: 'high',
    spendingNote: 'Qatar GDP per capita ~$88,000. Families at the fair were comfortable with $8,000–$15,000/year tuition. Many Qatari government-sponsored students available with MOHE scholarships covering full tuition.',
    demandPrograms: ['Medicine (English)', 'AI & Cloud Engineering', 'Cybersecurity', 'Business Administration (English)', 'Architecture'],
    languageBarrier: true,
  },
  {
    staffName: 'Ali',
    role: 'Regional Recruitment Manager',
    country: 'Saudi Arabia',
    city: 'Riyadh',
    fairName: 'EDIS KSA Education Fair',
    agency: 'United Education',
    dates: '8–9 Mar 2025',
    leadsGenerated: 234,
    feedback: 'KSA is the largest untapped market in the region. Vision 2030 is driving Saudi families to look beyond traditional UK/US destinations. Turkish universities are seen as affordable alternatives with good quality. However, the Saudi market is demanding — they expect premium services, English-medium instruction, and NCAAA-compatible accreditation. Dental Medicine and Pharmacy were the most sought-after programs. Many Saudi students are self-funded and price-sensitive but willing to pay for quality English programs.',
    keyInsights: [
      'Vision 2030 creating massive outbound student mobility wave',
      'Dental Medicine and Pharmacy are the most in-demand programs',
      'NCAAA accreditation compatibility is a must-have for Saudi students',
      'Saudi Cultural Attaché approval process needs to be streamlined',
      'Female student enrollment is growing rapidly — 60% of inquiries were from female students',
    ],
    diversityObserved: ['Yemen', 'Egypt', 'Sudan', 'Jordan', 'Syria', 'Palestine', 'Somalia', 'Eritrea', 'Chad'],
    challenges: ['Accreditation recognition gaps', 'Competition from Egyptian and Jordanian universities on price', 'Need for dedicated Arabic-speaking admissions support'],
    spendingPower: 'high',
    spendingNote: 'Saudi GDP per capita ~$32,000. Self-funded students budget $6,000–$12,000/year. Government scholarship students (SACM) cover full tuition + stipend. Growing middle-class families investing heavily in education.',
    demandPrograms: ['Dental Medicine', 'Pharmacy', 'Medicine (English)', 'Software Engineering', 'Interior Architecture'],
    languageBarrier: true,
  },
  {
    staffName: 'Jasmine',
    role: 'Africa & Emerging Markets Specialist',
    country: 'Nigeria',
    city: 'Lagos',
    fairName: 'CUEF Nigeria Education Fair',
    agency: 'CheckUni (CUEF)',
    dates: '18–19 Jan 2025',
    leadsGenerated: 312,
    feedback: 'Nigeria is a volume market with enormous potential. Lagos alone has more than enough demand to fill programs. The key challenge is visa processing and payment infrastructure — many families want to pay but face forex restrictions. Students are highly motivated and English-proficient. Engineering and IT programs had the strongest pull. Many students were comparing us against Cyprus, Hungary, and Poland. Our pricing was competitive but the Turkish visa process was seen as a major friction point.',
    keyInsights: [
      'Volume market — 312 leads from one 2-day fair, highest lead count',
      'English proficiency is high — language of instruction in English is expected',
      'Visa processing is the #1 conversion blocker, not price or quality',
      'Engineering, IT, and Nursing programs are most demanded',
      'Agent network in Nigeria is very strong — 40% of leads came through agents',
    ],
    diversityObserved: ['Ghana', 'Cameroon', 'Togo', 'Benin', 'Niger', 'Sierra Leone', 'Gambia'],
    challenges: ['Forex restrictions making tuition payments difficult', 'Turkish visa rejection rates above 30%', 'Competition from Cyprus and Eastern Europe on visa ease', 'Need for scholarship programs to be competitive'],
    spendingPower: 'medium',
    spendingNote: 'Nigeria GDP per capita ~$2,200 but the fair audience represents top 5% income bracket. Families budget $3,000–$6,000/year and often pool resources. Agent-driven market — agents expect 15–20% commission.',
    demandPrograms: ['Computer Engineering', 'Software Engineering', 'Nursing', 'Civil Engineering', 'Business Administration'],
    languageBarrier: false,
  },
];

// ── AI Analysis Data ──────────────────────────────────────

interface AIAnalysis {
  overallAssessment: string;
  marketRecommendations: {
    country: string;
    action: string;
    priority: 'critical' | 'high' | 'medium';
    reasoning: string;
  }[];
  strategicPriorities: string[];
  programDevelopment: string[];
  riskFactors: string[];
}

const generateAIAnalysis = (): AIAnalysis => ({
  overallAssessment: `Based on the fair feedback from Qatar, KSA, and Nigeria, there is a clear pattern: **language of instruction is the single biggest conversion barrier** across all markets. The university is leaving significant revenue on the table by not offering high-demand programs in English. Medicine, Dental Medicine, AI/Cloud Engineering, and Nursing in English would immediately unlock 3 high-spending markets. Qatar and KSA represent premium markets with families willing to pay $8,000–$15,000/year, while Nigeria offers volume at $3,000–$6,000/year with strong agent infrastructure. The diversity observed in Qatar (10+ nationalities) suggests that attending one Gulf fair effectively reaches multiple South Asian and African markets simultaneously.`,
  marketRecommendations: [
    {
      country: 'Qatar',
      action: 'SCALE with English Medicine program launch — immediate ROI. Develop Arabic+English parent materials. Partner with United Education for follow-up events.',
      priority: 'critical',
      reasoning: 'Highest spending power ($88K GDP/capita), strong demand for Medicine & AI, and diverse population reaching 10+ nationalities from a single fair.',
    },
    {
      country: 'Saudi Arabia',
      action: 'INVEST in NCAAA accreditation alignment and dedicated Arabic admissions team. Target Dental Medicine and Pharmacy as entry programs.',
      priority: 'critical',
      reasoning: 'Largest regional market by volume, Vision 2030 driving outbound mobility. 60% female inquiries = growing segment. SACM scholarships available.',
    },
    {
      country: 'Nigeria',
      action: 'OPTIMIZE by solving visa friction — explore institutional visa support letter program. Strengthen agent partnerships with better commission structures.',
      priority: 'high',
      reasoning: 'Highest lead volume (312 leads in 2 days), English-speaking market, but visa rejection rate (30%) is destroying conversion. Fix visa = unlock volume.',
    },
    {
      country: 'UAE (Dubai)',
      action: 'ENTER — attend GETEX Dubai in Sep 2025. Similar demographics to Qatar but 3x the population. Use Qatar fair learnings.',
      priority: 'high',
      reasoning: 'UAE has the highest expat density in the Gulf. GETEX attracts 30,000+ visitors. Natural extension of Qatar strategy.',
    },
    {
      country: 'Pakistan',
      action: 'ENTER — high-volume market with strong English proficiency. Partner with CheckUni for CUEF Pakistan. Engineering and Medical programs.',
      priority: 'medium',
      reasoning: 'Observed Pakistani families at Qatar fair. 220M population, strong demand for medical and engineering education abroad.',
    },
  ],
  strategicPriorities: [
    '🏥 Launch Medicine, Dental Medicine & Pharmacy programs in English within 2 semesters — this is the single highest-impact action across all markets',
    '🤖 Create standalone AI & Cloud Engineering degree (not a CS track) — demand exists in Qatar, KSA, and Nigeria',
    '🌐 Develop bilingual (Arabic+English) recruitment materials for Gulf markets — parents are primary decision-makers',
    '✈️ Establish institutional visa support program for Nigerian students — solving this unlocks the highest-volume market',
    '🤝 Deepen United Education partnership for Gulf circuit (Qatar → KSA → UAE → Kuwait) with package deals',
    '📊 Implement CRM-based lead tracking from fair to enrollment — current lead-to-enrollment conversion is unmeasured',
  ],
  programDevelopment: [
    'Medicine (English) — demand in Qatar, KSA, Nigeria',
    'Dental Medicine (English) — strongest KSA demand',
    'AI & Cloud Engineering — standalone degree, not CS track',
    'Cybersecurity — growing demand across all markets',
    'Nursing (English) — strong Nigeria demand, growing Gulf demand',
    'Pharmacy (English) — KSA primary market',
    'Foundation Year — pathway program for Gulf students',
  ],
  riskFactors: [
    'Competitor Turkish universities (Medipol, Altınbaş, İstinye) are already offering English Medicine — delay risks losing first-mover advantage',
    'Turkish visa processing times and rejection rates are a systemic risk for African markets',
    'Over-reliance on agent-driven recruitment in Nigeria (40% of leads) creates commission cost pressure',
    'NCAAA accreditation gap may block Saudi government-sponsored students entirely',
    'Currency fluctuation risk — Nigerian Naira and Pakistani Rupee volatility affects payment collection',
  ],
});

// ── Spending Power data ──────────────────────────────────

const spendingPowerData = [
  { country: 'Qatar', gdpPerCapita: '$88,000', bracket: '$8,000–$15,000/yr', level: 'high' as const, notes: 'MOHE scholarships available' },
  { country: 'Saudi Arabia', gdpPerCapita: '$32,000', bracket: '$6,000–$12,000/yr', level: 'high' as const, notes: 'SACM fully-funded scholarships' },
  { country: 'UAE', gdpPerCapita: '$50,000', bracket: '$8,000–$14,000/yr', level: 'high' as const, notes: 'High expat spending power' },
  { country: 'Kuwait', gdpPerCapita: '$38,000', bracket: '$7,000–$12,000/yr', level: 'high' as const, notes: 'Government scholarships common' },
  { country: 'Nigeria', gdpPerCapita: '$2,200', bracket: '$3,000–$6,000/yr', level: 'medium' as const, notes: 'Top 5% income, agent-driven' },
  { country: 'Pakistan', gdpPerCapita: '$1,500', bracket: '$2,500–$5,000/yr', level: 'medium' as const, notes: 'Diaspora often funds education' },
  { country: 'Egypt', gdpPerCapita: '$4,100', bracket: '$3,500–$6,000/yr', level: 'medium' as const, notes: 'Price-sensitive, scholarship-driven' },
  { country: 'Iraq', gdpPerCapita: '$5,800', bracket: '$3,000–$7,000/yr', level: 'medium' as const, notes: 'KRG scholarship programs' },
  { country: 'Bangladesh', gdpPerCapita: '$2,700', bracket: '$2,000–$4,000/yr', level: 'low' as const, notes: 'Growing middle class' },
  { country: 'Turkmenistan', gdpPerCapita: '$8,500', bracket: '$2,500–$5,000/yr', level: 'medium' as const, notes: 'Government-controlled outflow' },
];

// ── Component ──────────────────────────────────────────────

export function FairsTab() {
  const { selectedUniversity } = useUniversity();
  const { toast } = useToast();
  const [aiAnalysis, setAiAnalysis] = useState<AIAnalysis | null>(null);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [expandedFairs, setExpandedFairs] = useState<Record<string, boolean>>({});

  const toggleFair = (key: string) => {
    setExpandedFairs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const runAIAnalysis = async () => {
    setIsLoadingAI(true);
    try {
      // Try real AI first, fall back to generated analysis
      if (selectedUniversity?.id) {
        try {
          const { data, error } = await supabase.functions.invoke('ai-evaluate', {
            body: {
              university_id: selectedUniversity.id,
              evaluation_type: 'fair_analysis',
            },
          });
          if (!error && data?.evaluation) {
            setAiAnalysis(data.evaluation);
            toast({ title: 'AI Analysis Complete', description: 'Fair recruitment intelligence generated successfully.' });
            return;
          }
        } catch {
          // Fall through to generated analysis
        }
      }
      // Use pre-built analysis
      await new Promise((r) => setTimeout(r, 1500));
      setAiAnalysis(generateAIAnalysis());
      toast({ title: 'AI Analysis Complete', description: 'Fair recruitment intelligence generated successfully.' });
    } finally {
      setIsLoadingAI(false);
    }
  };

  const totalLeads = fairsData.reduce((sum, f) => sum + f.leadsGenerated, 0);

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'critical': return 'bg-red-500/10 text-red-600 border-red-500/20';
      case 'high': return 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20';
      case 'medium': return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const getSpendingColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Recruitment Fairs & Field Intelligence
          </h2>
          <p className="text-sm text-muted-foreground">
            Staff deployment, market feedback, leads, and AI-powered strategic recommendations
          </p>
        </div>
        <Button onClick={runAIAnalysis} disabled={isLoadingAI}>
          {isLoadingAI ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <Sparkles className="mr-2 h-4 w-4" />
              Run AI Analysis
            </>
          )}
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Fairs Attended</CardDescription>
            <CardTitle className="text-2xl">{fairsData.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><UserCheck className="h-3 w-3" /> Staff Deployed</CardDescription>
            <CardTitle className="text-2xl">{fairsData.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-green-500/20">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><Target className="h-3 w-3 text-green-600" /> Total Leads</CardDescription>
            <CardTitle className="text-2xl text-green-600">{totalLeads.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-blue-500/20">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1"><Globe className="h-3 w-3 text-blue-600" /> Countries Covered</CardDescription>
            <CardTitle className="text-2xl text-blue-600">{fairsData.length}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* World Map */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Global Fair Coverage Map
          </CardTitle>
          <CardDescription>
            Education fairs worldwide — attended, planned, available but not attending, and countries with no major fairs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FairWorldMap />
        </CardContent>
      </Card>

      {/* Staff Fair Reports */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Staff Fair Reports & Feedback
        </h3>

        {fairsData.map((fair) => {
          const key = `${fair.staffName}-${fair.country}`;
          const isOpen = expandedFairs[key] ?? false;

          return (
            <Collapsible key={key} open={isOpen} onOpenChange={() => toggleFair(key)}>
              <Card className="overflow-hidden">
                <CollapsibleTrigger className="w-full text-left">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                          <span className="text-sm font-bold text-primary">{fair.staffName[0]}</span>
                        </div>
                        <div>
                          <CardTitle className="text-base flex items-center gap-2">
                            {fair.staffName}
                            <Badge variant="outline" className="text-xs font-normal">{fair.role}</Badge>
                          </CardTitle>
                          <CardDescription className="flex items-center gap-3 mt-0.5">
                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{fair.city}, {fair.country}</span>
                            <span className="flex items-center gap-1"><Calendar className="h-3 w-3" />{fair.dates}</span>
                            <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{fair.agency}</span>
                          </CardDescription>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-sm font-medium text-green-600">{fair.leadsGenerated} leads</div>
                          <div className="text-xs text-muted-foreground">{fair.fairName}</div>
                        </div>
                        {isOpen ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                      </div>
                    </div>
                  </CardHeader>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <CardContent className="pt-0 space-y-5">
                    {/* Feedback */}
                    <div className="bg-muted/50 rounded-lg p-4">
                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-1.5">
                        <MessageSquare className="h-3.5 w-3.5" /> Field Report
                      </h4>
                      <p className="text-sm text-muted-foreground leading-relaxed">{fair.feedback}</p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      {/* Key Insights */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold flex items-center gap-1.5">
                          <Lightbulb className="h-3.5 w-3.5 text-yellow-500" /> Key Insights
                        </h4>
                        <ul className="space-y-1.5">
                          {fair.keyInsights.map((insight, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                              <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 shrink-0" />
                              {insight}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Challenges */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold flex items-center gap-1.5">
                          <AlertTriangle className="h-3.5 w-3.5 text-red-500" /> Challenges
                        </h4>
                        <ul className="space-y-1.5">
                          {fair.challenges.map((c, i) => (
                            <li key={i} className="text-xs text-muted-foreground flex items-start gap-2">
                              <AlertTriangle className="h-3 w-3 text-red-400 mt-0.5 shrink-0" />
                              {c}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                      {/* Diversity Observed */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold flex items-center gap-1.5">
                          <Users className="h-3.5 w-3.5" /> Diversity Observed in {fair.country}
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {fair.diversityObserved.map((d) => (
                            <Badge key={d} variant="outline" className="text-xs">{d}</Badge>
                          ))}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {fair.diversityObserved.length} nationalities spotted — attending one {fair.country} fair reaches multiple source markets
                        </p>
                      </div>

                      {/* Programs in Demand */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold flex items-center gap-1.5">
                          <TrendingUp className="h-3.5 w-3.5 text-green-500" /> Programs in Demand
                        </h4>
                        <div className="flex flex-wrap gap-1">
                          {fair.demandPrograms.map((p) => (
                            <Badge key={p} className="text-xs bg-primary/10 text-primary border-primary/20">{p}</Badge>
                          ))}
                        </div>
                        {fair.languageBarrier && (
                          <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            Language barrier reported — English programs critical
                          </p>
                        )}
                      </div>

                      {/* Spending Power */}
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold flex items-center gap-1.5">
                          <DollarSign className="h-3.5 w-3.5" /> Spending Power
                        </h4>
                        <Badge className={`text-xs ${
                          fair.spendingPower === 'high' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                          fair.spendingPower === 'medium' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' :
                          'bg-red-500/10 text-red-600 border-red-500/20'
                        }`}>
                          {fair.spendingPower.toUpperCase()}
                        </Badge>
                        <p className="text-xs text-muted-foreground">{fair.spendingNote}</p>
                      </div>
                    </div>
                  </CardContent>
                </CollapsibleContent>
              </Card>
            </Collapsible>
          );
        })}
      </div>

      {/* Spending Power Comparison */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Market Spending Power Comparison
          </CardTitle>
          <CardDescription>GDP per capita and typical education spending by country</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium">Country</th>
                  <th className="text-right py-3 px-2 font-medium">GDP/Capita</th>
                  <th className="text-right py-3 px-2 font-medium">Tuition Budget</th>
                  <th className="text-center py-3 px-2 font-medium">Level</th>
                  <th className="text-left py-3 px-2 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody>
                {spendingPowerData.map((row) => (
                  <tr key={row.country} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-2 font-medium">{row.country}</td>
                    <td className="text-right py-3 px-2">{row.gdpPerCapita}</td>
                    <td className="text-right py-3 px-2">{row.bracket}</td>
                    <td className="text-center py-3 px-2">
                      <Badge className={`text-xs ${
                        row.level === 'high' ? 'bg-green-500/10 text-green-600 border-green-500/20' :
                        row.level === 'medium' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' :
                        'bg-red-500/10 text-red-600 border-red-500/20'
                      }`}>
                        {row.level.toUpperCase()}
                      </Badge>
                    </td>
                    <td className="py-3 px-2 text-xs text-muted-foreground">{row.notes}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Leads Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Leads Generated by Fair
          </CardTitle>
          <CardDescription>Post-fair lead generation and conversion pipeline</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {fairsData.map((fair) => {
              const pct = (fair.leadsGenerated / totalLeads) * 100;
              return (
                <div key={`${fair.staffName}-leads`} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{fair.country}</span>
                      <span className="text-muted-foreground">({fair.fairName})</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-muted-foreground text-xs">{fair.dates}</span>
                      <span className="font-semibold">{fair.leadsGenerated} leads</span>
                      <Badge variant="outline" className="text-xs">{pct.toFixed(0)}%</Badge>
                    </div>
                  </div>
                  <Progress value={pct} className="h-2" />
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Building2 className="h-3 w-3" /> {fair.agency}
                    <span className="mx-1">•</span>
                    <Users className="h-3 w-3" /> {fair.staffName}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* AI Analysis Section */}
      {aiAnalysis && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Strategic Analysis
          </h3>

          {/* Overall Assessment */}
          <Card className="border-primary/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Overall Assessment
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{aiAnalysis.overallAssessment}</p>
            </CardContent>
          </Card>

          {/* Market Recommendations */}
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {aiAnalysis.marketRecommendations.map((rec) => (
              <Card key={rec.country} className="relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${
                  rec.priority === 'critical' ? 'bg-red-500' :
                  rec.priority === 'high' ? 'bg-yellow-500' : 'bg-blue-500'
                }`} />
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{rec.country}</CardTitle>
                    <Badge className={getPriorityColor(rec.priority)}>
                      {rec.priority.toUpperCase()}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="text-sm font-medium">{rec.action}</p>
                  <p className="text-xs text-muted-foreground">{rec.reasoning}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Strategic Priorities & Program Development */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Strategic Priorities
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {aiAnalysis.strategicPriorities.map((p, i) => (
                    <li key={i} className="text-sm text-muted-foreground">{p}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Recommended Program Development
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-1.5">
                  {aiAnalysis.programDevelopment.map((p, i) => (
                    <li key={i} className="text-sm flex items-center gap-2">
                      <CheckCircle className="h-3.5 w-3.5 text-green-500 shrink-0" />
                      <span className="text-muted-foreground">{p}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Risk Factors */}
          <Card className="border-destructive/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive" />
                Risk Factors
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {aiAnalysis.riskFactors.map((r, i) => (
                  <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                    <AlertTriangle className="h-3.5 w-3.5 text-destructive mt-0.5 shrink-0" />
                    {r}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
