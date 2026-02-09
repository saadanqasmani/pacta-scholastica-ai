import { useEffect, useState } from 'react';
import { useUniversity } from '@/contexts/UniversityContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Building2, Users, FileText, Plane, TrendingUp, Globe,
  ArrowUpRight, ArrowDownRight, CheckCircle, Clock, AlertTriangle,
  Sparkles, BarChart3, PieChart,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import {
  BarChart, Bar, XAxis, YAxis, ResponsiveContainer,
  PieChart as RechartsPieChart, Pie, Cell, CartesianGrid, Legend,
} from 'recharts';

interface DashboardStats {
  activePartnerships: number;
  pendingMOUs: number;
  signedMOUs: number;
  draftMOUs: number;
  incomingMobility: number;
  outgoingMobility: number;
  totalProjects: number;
  pendingRequests: number;
  unreadMessages: number;
}

interface MobilityByYear {
  year: string;
  incoming: number;
  outgoing: number;
}

interface MOUByStatus {
  name: string;
  value: number;
  color: string;
}

interface PartnerByRegion {
  region: string;
  count: number;
}

const Index = () => {
  const { selectedUniversity, isLoading: universityLoading } = useUniversity();
  const { t } = useLanguage();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [mobilityByYear, setMobilityByYear] = useState<MobilityByYear[]>([]);
  const [mouByStatus, setMouByStatus] = useState<MOUByStatus[]>([]);
  const [partnersByRegion, setPartnersByRegion] = useState<PartnerByRegion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!selectedUniversity?.id) return;

    const fetchDashboardData = async () => {
      setIsLoading(true);
      try {
        const { data: mous } = await supabase
          .from('mous')
          .select('status')
          .or(`initiator_university_id.eq.${selectedUniversity.id},partner_university_id.eq.${selectedUniversity.id}`);

        const { data: mobility } = await supabase
          .from('mobility_records')
          .select('direction, academic_year, student_count, partner_university_id')
          .eq('university_id', selectedUniversity.id);

        const { data: projects } = await supabase
          .from('partner_projects')
          .select('status')
          .eq('university_id', selectedUniversity.id);

        const { data: requests } = await supabase
          .from('partner_requests')
          .select('status')
          .eq('to_university_id', selectedUniversity.id);

        const { data: messages } = await supabase
          .from('partner_messages')
          .select('is_read')
          .eq('to_university_id', selectedUniversity.id)
          .eq('is_read', false);

        const partnerIds = new Set<string>();
        mobility?.forEach(m => partnerIds.add(m.partner_university_id));

        const uniquePartnerIds = Array.from(partnerIds);
        let partnerRegions: { region: string }[] = [];
        if (uniquePartnerIds.length > 0) {
          const { data: partners } = await supabase
            .from('universities')
            .select('region')
            .in('id', uniquePartnerIds);
          partnerRegions = partners || [];
        }

        const signedMOUs = mous?.filter(m => m.status === 'signed').length || 0;
        const pendingMOUs = mous?.filter(m => ['pending_review', 'pending_approval'].includes(m.status)).length || 0;
        const draftMOUs = mous?.filter(m => m.status === 'draft').length || 0;

        const incomingMobility = mobility?.filter(m => m.direction === 'incoming').reduce((sum, m) => sum + m.student_count, 0) || 0;
        const outgoingMobility = mobility?.filter(m => m.direction === 'outgoing').reduce((sum, m) => sum + m.student_count, 0) || 0;

        setStats({
          activePartnerships: signedMOUs,
          pendingMOUs,
          signedMOUs,
          draftMOUs,
          incomingMobility,
          outgoingMobility,
          totalProjects: projects?.length || 0,
          pendingRequests: requests?.filter(r => r.status === 'pending').length || 0,
          unreadMessages: messages?.length || 0,
        });

        const yearMap = new Map<string, { incoming: number; outgoing: number }>();
        mobility?.forEach(m => {
          const current = yearMap.get(m.academic_year) || { incoming: 0, outgoing: 0 };
          if (m.direction === 'incoming') {
            current.incoming += m.student_count;
          } else {
            current.outgoing += m.student_count;
          }
          yearMap.set(m.academic_year, current);
        });
        const sortedYears = Array.from(yearMap.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([year, data]) => ({ year, ...data }));
        setMobilityByYear(sortedYears);

        setMouByStatus([
          { name: t('dashboard.draft'), value: draftMOUs, color: 'hsl(var(--muted-foreground))' },
          { name: t('dashboard.pending'), value: pendingMOUs, color: 'hsl(220 70% 50%)' },
          { name: t('dashboard.signed'), value: signedMOUs, color: 'hsl(var(--primary))' },
        ]);

        const regionMap = new Map<string, number>();
        partnerRegions.forEach(p => {
          const region = p.region || t('common.unknown');
          regionMap.set(region, (regionMap.get(region) || 0) + 1);
        });
        setPartnersByRegion(
          Array.from(regionMap.entries())
            .map(([region, count]) => ({ region, count }))
            .sort((a, b) => b.count - a.count)
        );

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [selectedUniversity?.id]);

  if (universityLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">{t('common.loading')}</div>
      </div>
    );
  }

  const mobilityBalance = stats ? stats.incomingMobility - stats.outgoingMobility : 0;
  const totalMobility = stats ? stats.incomingMobility + stats.outgoingMobility : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">{t('dashboard.title')}</h1>
          <p className="text-muted-foreground">
            {t('dashboard.subtitle')} {selectedUniversity?.name || t('dashboard.yourInstitution')}
          </p>
        </div>
        <Button asChild>
          <Link to="/intelligence">
            <Sparkles className="mr-2 h-4 w-4" />
            {t('dashboard.marketIntelligence')}
          </Link>
        </Button>
      </div>

      {/* University Info Card */}
      {selectedUniversity && (
        <Card className="border-l-4 border-l-primary">
          <CardContent className="flex items-center gap-6 py-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">{selectedUniversity.name}</h2>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>{selectedUniversity.country}</span>
                <span>•</span>
                <span className="capitalize">{selectedUniversity.type}</span>
                <span>•</span>
                <span className="capitalize">{selectedUniversity.size} {t('dashboard.institution')}</span>
                {selectedUniversity.ranking && (
                  <>
                    <span>•</span>
                    <span>{t('dashboard.rank')} #{selectedUniversity.ranking}</span>
                  </>
                )}
              </div>
            </div>
            <Badge 
              variant={selectedUniversity.internationalization_maturity === 'high' ? 'default' : 'secondary'}
              className="capitalize"
            >
              {selectedUniversity.internationalization_maturity} {t('dashboard.internationalization')}
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.activePartnerships')}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activePartnerships ?? '—'}</div>
            <p className="text-xs text-muted-foreground">{t('dashboard.viaSigned')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.pendingMOUs')}
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{stats?.pendingMOUs ?? '—'}</span>
              {stats?.draftMOUs ? (
                <span className="text-sm text-muted-foreground">+ {stats.draftMOUs} {t('dashboard.drafts')}</span>
              ) : null}
            </div>
            <p className="text-xs text-muted-foreground">{t('dashboard.awaitingResponse')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.mobilityBalance')}
            </CardTitle>
            <Plane className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{totalMobility}</span>
              <span className={`flex items-center text-sm ${mobilityBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {mobilityBalance >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {mobilityBalance >= 0 ? '+' : ''}{mobilityBalance}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.incomingMobility ?? 0} {t('dashboard.in')} / {stats?.outgoingMobility ?? 0} {t('dashboard.out')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {t('dashboard.actionItems')}
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(stats?.pendingRequests ?? 0) + (stats?.unreadMessages ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              {stats?.pendingRequests ?? 0} {t('dashboard.requests')}, {stats?.unreadMessages ?? 0} {t('dashboard.messages')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-4 w-4" />
              {t('dashboard.mobilityTrends')}
            </CardTitle>
            <CardDescription>{t('dashboard.studentExchangesByYear')}</CardDescription>
          </CardHeader>
          <CardContent>
            {mobilityByYear.length > 0 ? (
              <ChartContainer
                config={{
                  incoming: { label: t('dashboard.incoming'), color: 'hsl(var(--primary))' },
                  outgoing: { label: t('dashboard.outgoing'), color: 'hsl(var(--muted-foreground))' },
                }}
                className="h-[200px] w-full"
              >
                <BarChart data={mobilityByYear}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                  <XAxis dataKey="year" className="text-xs" />
                  <YAxis className="text-xs" />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Legend />
                  <Bar dataKey="incoming" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="outgoing" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                {t('dashboard.noMobilityData')}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PieChart className="h-4 w-4" />
              {t('dashboard.mouStatus')}
            </CardTitle>
            <CardDescription>{t('dashboard.currentAgreementDist')}</CardDescription>
          </CardHeader>
          <CardContent>
            {mouByStatus.some(m => m.value > 0) ? (
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPieChart>
                    <Pie
                      data={mouByStatus.filter(m => m.value > 0)}
                      cx="50%" cy="50%" innerRadius={40} outerRadius={70}
                      paddingAngle={2} dataKey="value"
                    >
                      {mouByStatus.filter(m => m.value > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                  </RechartsPieChart>
                </ResponsiveContainer>
                <div className="flex justify-center gap-4 mt-2">
                  {mouByStatus.filter(m => m.value > 0).map((entry) => (
                    <div key={entry.name} className="flex items-center gap-1 text-xs">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span>{entry.name}: {entry.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-muted-foreground">
                {t('dashboard.noMOUData')}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Insights Row */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Globe className="h-4 w-4" />
              {t('dashboard.partnersByRegion')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {partnersByRegion.length > 0 ? (
              partnersByRegion.slice(0, 5).map((region) => (
                <div key={region.region} className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span>{region.region}</span>
                    <span className="font-medium">{region.count}</span>
                  </div>
                  <Progress 
                    value={(region.count / Math.max(...partnersByRegion.map(r => r.count))) * 100} 
                    className="h-1.5" 
                  />
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">{t('dashboard.noPartnerData')}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-4 w-4" />
              {t('dashboard.projectsOverview')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">{t('dashboard.totalProjects')}</span>
                <span className="text-2xl font-bold">{stats?.totalProjects ?? 0}</span>
              </div>
              <div className="space-y-2">
                <Link 
                  to="/partnerships" 
                  className="flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors"
                >
                  <span className="text-sm">{t('dashboard.viewAllProjects')}</span>
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
                <Link 
                  to="/mou" 
                  className="flex items-center justify-between p-2 rounded-md hover:bg-muted transition-colors"
                >
                  <span className="text-sm">{t('dashboard.manageMOUs')}</span>
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="h-4 w-4" />
              {t('dashboard.quickActions')}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/partners">
                <Users className="mr-2 h-4 w-4" />
                {t('dashboard.discoverPartners')}
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/mobility">
                <Plane className="mr-2 h-4 w-4" />
                {t('dashboard.trackMobility')}
              </Link>
            </Button>
            <Button asChild variant="outline" className="w-full justify-start">
              <Link to="/profile">
                <Building2 className="mr-2 h-4 w-4" />
                {t('dashboard.viewProfile')}
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Status Summary */}
      <Card className="bg-secondary/30">
        <CardContent className="py-4">
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <span>{stats?.signedMOUs ?? 0} {t('dashboard.activeAgreements')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-600" />
              <span>{stats?.pendingMOUs ?? 0} {t('dashboard.pendingReview')}</span>
            </div>
            <div className="flex items-center gap-2">
              <Plane className="h-4 w-4 text-primary" />
              <span>{totalMobility} {t('dashboard.totalExchanges')}</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span>{stats?.totalProjects ?? 0} {t('dashboard.activeProjects')}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
