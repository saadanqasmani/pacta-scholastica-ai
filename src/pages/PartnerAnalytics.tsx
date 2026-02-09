import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart3, Globe, TrendingUp, Users, DollarSign, BookOpen, Building2, Star, ArrowUpRight, ArrowDownLeft, Loader2 } from 'lucide-react';
import { useUniversity } from '@/contexts/UniversityContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, PieChart as RechartsPieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

interface PartnerSummary {
  id: string;
  name: string;
  country: string;
  region: string;
  mouStatus: string;
  totalStudents: number;
  incomingStudents: number;
  outgoingStudents: number;
  researchProjects: number;
  publications: number;
  funding: number;
  satisfaction: number;
  programType: string[];
}

interface CountryStats {
  country: string;
  partners: number;
  students: number;
}

interface ProgramDistribution {
  name: string;
  value: number;
  color: string;
}

const COLORS = [
  'hsl(var(--primary))', 'hsl(220 70% 50%)', 'hsl(142 76% 36%)', 'hsl(38 92% 50%)',
  'hsl(0 84% 60%)', 'hsl(262 83% 58%)', 'hsl(199 89% 48%)', 'hsl(24 94% 50%)',
];

export default function PartnerAnalytics() {
  const { selectedUniversity, universities } = useUniversity();
  const { t } = useLanguage();

  const [isLoading, setIsLoading] = useState(true);
  const [partnerSummaries, setPartnerSummaries] = useState<PartnerSummary[]>([]);
  const [countryStats, setCountryStats] = useState<CountryStats[]>([]);
  const [programDistribution, setProgramDistribution] = useState<ProgramDistribution[]>([]);
  const [mobilityTrend, setMobilityTrend] = useState<{ year: string; incoming: number; outgoing: number }[]>([]);
  const [sortBy, setSortBy] = useState<string>('totalStudents');
  const [regionFilter, setRegionFilter] = useState<string>('all');

  useEffect(() => {
    if (!selectedUniversity?.id) return;
    fetchAnalytics();
  }, [selectedUniversity?.id]);

  const fetchAnalytics = async () => {
    if (!selectedUniversity) return;
    setIsLoading(true);
    try {
      const { data: mous } = await supabase.from('mous').select('*').or(`initiator_university_id.eq.${selectedUniversity.id},partner_university_id.eq.${selectedUniversity.id}`);
      const { data: mobility } = await supabase.from('mobility_records').select('*').eq('university_id', selectedUniversity.id);
      const { data: research } = await supabase.from('research_collaborations').select('*').eq('university_id', selectedUniversity.id);
      const { data: roi } = await supabase.from('partner_roi').select('*').eq('university_id', selectedUniversity.id);

      const partnerMap = new Map<string, PartnerSummary>();

      (mous || []).forEach((mou: any) => {
        const partnerId = mou.initiator_university_id === selectedUniversity.id ? mou.partner_university_id : mou.initiator_university_id;
        const uni = universities.find(u => u.id === partnerId);
        if (!uni) return;
        if (!partnerMap.has(partnerId)) {
          partnerMap.set(partnerId, {
            id: partnerId, name: uni.name, country: uni.country, region: uni.region, mouStatus: mou.status,
            totalStudents: 0, incomingStudents: 0, outgoingStudents: 0, researchProjects: 0, publications: 0, funding: 0, satisfaction: 0, programType: mou.cooperation_scope || [],
          });
        }
      });

      (mobility || []).forEach((m: any) => {
        const existing = partnerMap.get(m.partner_university_id);
        if (existing) {
          if (m.direction === 'incoming') existing.incomingStudents += m.student_count; else existing.outgoingStudents += m.student_count;
          existing.totalStudents += m.student_count;
        }
      });

      (research || []).forEach((r: any) => {
        const existing = partnerMap.get(r.partner_university_id);
        if (existing) { existing.researchProjects += 1; existing.publications += r.publications_count || 0; existing.funding += Number(r.funding_amount) || 0; }
      });

      const roiByPartner = new Map<string, any[]>();
      (roi || []).forEach((r: any) => { const arr = roiByPartner.get(r.partner_university_id) || []; arr.push(r); roiByPartner.set(r.partner_university_id, arr); });
      roiByPartner.forEach((records, partnerId) => {
        const latest = records.sort((a: any, b: any) => b.partnership_year - a.partnership_year)[0];
        const existing = partnerMap.get(partnerId);
        if (existing && latest) existing.satisfaction = Number(latest.satisfaction_score) || 0;
      });

      const summaries = Array.from(partnerMap.values());
      setPartnerSummaries(summaries);

      const countryMap = new Map<string, { partners: number; students: number }>();
      summaries.forEach(p => {
        const existing = countryMap.get(p.country) || { partners: 0, students: 0 };
        existing.partners += 1; existing.students += p.totalStudents;
        countryMap.set(p.country, existing);
      });
      setCountryStats(Array.from(countryMap.entries()).map(([country, data]) => ({ country, ...data })).sort((a, b) => b.partners - a.partners));

      const programMap = new Map<string, number>();
      (mous || []).forEach((mou: any) => {
        (mou.cooperation_scope || []).forEach((scope: string) => {
          let program = 'Other';
          if (scope.includes('KA-131')) program = 'Erasmus KA-131'; else if (scope.includes('KA-171')) program = 'KA-171'; else if (scope.includes('Internship')) program = 'Internship'; else program = scope;
          programMap.set(program, (programMap.get(program) || 0) + 1);
        });
      });
      setProgramDistribution(Array.from(programMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8).map(([name, value], i) => ({ name, value, color: COLORS[i % COLORS.length] })));

      const yearMap = new Map<string, { incoming: number; outgoing: number }>();
      (mobility || []).forEach((m: any) => {
        const current = yearMap.get(m.academic_year) || { incoming: 0, outgoing: 0 };
        if (m.direction === 'incoming') current.incoming += m.student_count; else current.outgoing += m.student_count;
        yearMap.set(m.academic_year, current);
      });
      setMobilityTrend(Array.from(yearMap.entries()).sort((a, b) => a[0].localeCompare(b[0])).map(([year, data]) => ({ year, ...data })));

    } catch (error) { console.error('Error fetching analytics:', error); } finally { setIsLoading(false); }
  };

  const regions = [...new Set(partnerSummaries.map(p => p.region))].sort();
  const filteredSummaries = partnerSummaries
    .filter(p => regionFilter === 'all' || p.region === regionFilter)
    .sort((a, b) => {
      switch (sortBy) {
        case 'totalStudents': return b.totalStudents - a.totalStudents;
        case 'satisfaction': return b.satisfaction - a.satisfaction;
        case 'funding': return b.funding - a.funding;
        case 'publications': return b.publications - a.publications;
        case 'name': return a.name.localeCompare(b.name);
        default: return b.totalStudents - a.totalStudents;
      }
    });

  const totalPartners = partnerSummaries.length;
  const totalCountries = new Set(partnerSummaries.map(p => p.country)).size;
  const totalStudentExchanges = partnerSummaries.reduce((sum, p) => sum + p.totalStudents, 0);
  const totalFunding = partnerSummaries.reduce((sum, p) => sum + p.funding, 0);
  const totalPublications = partnerSummaries.reduce((sum, p) => sum + p.publications, 0);
  const avgSatisfaction = partnerSummaries.filter(p => p.satisfaction > 0).length > 0 ? (partnerSummaries.filter(p => p.satisfaction > 0).reduce((sum, p) => sum + p.satisfaction, 0) / partnerSummaries.filter(p => p.satisfaction > 0).length).toFixed(1) : '—';

  if (isLoading) return <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">{t('analytics.title')}</h1>
        <p className="text-muted-foreground">{t('analytics.subtitle')} {selectedUniversity?.name}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Building2 className="h-5 w-5 text-primary" /><div><p className="text-xs text-muted-foreground">{t('analytics.partners')}</p><p className="text-2xl font-bold">{totalPartners}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Globe className="h-5 w-5 text-blue-600" /><div><p className="text-xs text-muted-foreground">{t('analytics.countries')}</p><p className="text-2xl font-bold">{totalCountries}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Users className="h-5 w-5 text-green-600" /><div><p className="text-xs text-muted-foreground">{t('analytics.exchanges')}</p><p className="text-2xl font-bold">{totalStudentExchanges}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><DollarSign className="h-5 w-5 text-amber-600" /><div><p className="text-xs text-muted-foreground">{t('analytics.funding')}</p><p className="text-2xl font-bold">${(totalFunding / 1000).toFixed(0)}K</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><BookOpen className="h-5 w-5 text-purple-600" /><div><p className="text-xs text-muted-foreground">{t('analytics.publications')}</p><p className="text-2xl font-bold">{totalPublications}</p></div></div></CardContent></Card>
        <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><Star className="h-5 w-5 text-yellow-500" /><div><p className="text-xs text-muted-foreground">{t('analytics.avgSatisfaction')}</p><p className="text-2xl font-bold">{avgSatisfaction}/10</p></div></div></CardContent></Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><BarChart3 className="h-4 w-4" />{t('analytics.studentMobilityTrend')}</CardTitle><CardDescription>{t('analytics.incomingVsOutgoing')}</CardDescription></CardHeader>
          <CardContent>{mobilityTrend.length > 0 ? (
            <ChartContainer config={{ incoming: { label: t('dashboard.incoming'), color: 'hsl(142 76% 36%)' }, outgoing: { label: t('dashboard.outgoing'), color: 'hsl(var(--primary))' } }} className="h-[250px] w-full">
              <BarChart data={mobilityTrend}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" /><XAxis dataKey="year" className="text-xs" /><YAxis className="text-xs" /><ChartTooltip content={<ChartTooltipContent />} /><Legend /><Bar dataKey="incoming" fill="hsl(142 76% 36%)" radius={[4, 4, 0, 0]} /><Bar dataKey="outgoing" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ChartContainer>
          ) : <div className="flex h-[250px] items-center justify-center text-muted-foreground">{t('analytics.noMobilityData')}</div>}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><TrendingUp className="h-4 w-4" />{t('analytics.agreementTypeDist')}</CardTitle><CardDescription>{t('analytics.partnersByProgram')}</CardDescription></CardHeader>
          <CardContent>{programDistribution.length > 0 ? (
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%"><RechartsPieChart><Pie data={programDistribution} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={2} dataKey="value">{programDistribution.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}</Pie><ChartTooltip /></RechartsPieChart></ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-2">{programDistribution.slice(0, 4).map((entry) => (<div key={entry.name} className="flex items-center gap-1 text-xs"><div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} /><span>{entry.name}: {entry.value}</span></div>))}</div>
            </div>
          ) : <div className="flex h-[250px] items-center justify-center text-muted-foreground">{t('analytics.noProgramData')}</div>}</CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Globe className="h-4 w-4" />{t('analytics.partnerDistByCountry')}</CardTitle></CardHeader>
        <CardContent><div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">{countryStats.slice(0, 12).map((cs) => (<div key={cs.country} className="flex items-center justify-between rounded-lg border p-3"><div><p className="font-medium text-sm">{cs.country}</p><p className="text-xs text-muted-foreground">{cs.students} {t('analytics.studentsExchanged')}</p></div><Badge variant="outline">{cs.partners} {t('analytics.partnersLabel')}</Badge></div>))}</div></CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div><CardTitle className="text-base">{t('analytics.partnerPerformance')}</CardTitle><CardDescription>{t('analytics.detailedMetrics')}</CardDescription></div>
            <div className="flex items-center gap-2">
              <Select value={regionFilter} onValueChange={setRegionFilter}><SelectTrigger className="w-36"><SelectValue placeholder={t('analytics.filterByRegion')} /></SelectTrigger><SelectContent><SelectItem value="all">{t('analytics.allRegions')}</SelectItem>{regions.map(r => (<SelectItem key={r} value={r}>{r}</SelectItem>))}</SelectContent></Select>
              <Select value={sortBy} onValueChange={setSortBy}><SelectTrigger className="w-36"><SelectValue placeholder={t('analytics.sortBy')} /></SelectTrigger><SelectContent><SelectItem value="totalStudents">{t('analytics.totalStudents')}</SelectItem><SelectItem value="satisfaction">{t('analytics.satisfaction')}</SelectItem><SelectItem value="funding">{t('analytics.funding')}</SelectItem><SelectItem value="publications">{t('analytics.publications')}</SelectItem><SelectItem value="name">{t('analytics.name')}</SelectItem></SelectContent></Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('analytics.university')}</TableHead><TableHead>{t('analytics.country')}</TableHead>
                  <TableHead className="text-right"><div className="flex items-center justify-end gap-1"><ArrowDownLeft className="h-3 w-3 text-green-600" />{t('dashboard.in')}</div></TableHead>
                  <TableHead className="text-right"><div className="flex items-center justify-end gap-1"><ArrowUpRight className="h-3 w-3 text-blue-600" />{t('dashboard.out')}</div></TableHead>
                  <TableHead className="text-right">{t('analytics.research')}</TableHead><TableHead className="text-right">Pubs</TableHead><TableHead className="text-right">{t('analytics.funding')}</TableHead><TableHead className="text-right">Score</TableHead><TableHead>MOU</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSummaries.slice(0, 25).map((partner) => (
                  <TableRow key={partner.id}>
                    <TableCell className="font-medium max-w-[200px] truncate">{partner.name}</TableCell><TableCell className="text-muted-foreground">{partner.country}</TableCell>
                    <TableCell className="text-right">{partner.incomingStudents || '—'}</TableCell><TableCell className="text-right">{partner.outgoingStudents || '—'}</TableCell>
                    <TableCell className="text-right">{partner.researchProjects || '—'}</TableCell><TableCell className="text-right">{partner.publications || '—'}</TableCell>
                    <TableCell className="text-right">{partner.funding > 0 ? `$${(partner.funding / 1000).toFixed(0)}K` : '—'}</TableCell>
                    <TableCell className="text-right">{partner.satisfaction > 0 ? (<span className={partner.satisfaction >= 8 ? 'text-green-600 font-medium' : ''}>{partner.satisfaction.toFixed(1)}</span>) : '—'}</TableCell>
                    <TableCell><Badge variant={partner.mouStatus === 'accepted' ? 'default' : 'secondary'} className="text-xs capitalize">{partner.mouStatus?.replace('_', ' ') || 'none'}</Badge></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
