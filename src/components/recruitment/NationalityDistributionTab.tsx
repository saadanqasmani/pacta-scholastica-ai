import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Globe, Users, Flag, MapPin } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface NationalityData {
  country: string;
  region: string;
  students: number;
  trend: 'up' | 'stable' | 'down';
}

// Top 30 nationalities — Turkmenistan #1, then Syria, Yemen, Iraq, etc.
// Total: 6,500 international from 101 nationalities
const top30Nationalities: NationalityData[] = [
  { country: 'Turkmenistan', region: 'Central Asia', students: 3000, trend: 'stable' },
  { country: 'Syria', region: 'Middle East', students: 520, trend: 'down' },
  { country: 'Yemen', region: 'Middle East', students: 340, trend: 'up' },
  { country: 'Iraq', region: 'Middle East', students: 310, trend: 'stable' },
  { country: 'Iran', region: 'Middle East', students: 245, trend: 'down' },
  { country: 'Afghanistan', region: 'South Asia', students: 210, trend: 'up' },
  { country: 'Azerbaijan', region: 'Central Asia', students: 195, trend: 'stable' },
  { country: 'Palestine', region: 'Middle East', students: 175, trend: 'up' },
  { country: 'Somalia', region: 'East Africa', students: 155, trend: 'up' },
  { country: 'Libya', region: 'North Africa', students: 140, trend: 'stable' },
  { country: 'Egypt', region: 'North Africa', students: 125, trend: 'down' },
  { country: 'Jordan', region: 'Middle East', students: 110, trend: 'stable' },
  { country: 'Pakistan', region: 'South Asia', students: 105, trend: 'up' },
  { country: 'Kazakhstan', region: 'Central Asia', students: 95, trend: 'stable' },
  { country: 'Sudan', region: 'East Africa', students: 85, trend: 'up' },
  { country: 'Indonesia', region: 'Southeast Asia', students: 72, trend: 'up' },
  { country: 'Uzbekistan', region: 'Central Asia', students: 68, trend: 'up' },
  { country: 'Nigeria', region: 'West Africa', students: 62, trend: 'stable' },
  { country: 'Morocco', region: 'North Africa', students: 55, trend: 'stable' },
  { country: 'Bangladesh', region: 'South Asia', students: 48, trend: 'up' },
  { country: 'Chad', region: 'Central Africa', students: 42, trend: 'stable' },
  { country: 'Kyrgyzstan', region: 'Central Asia', students: 38, trend: 'stable' },
  { country: 'Tajikistan', region: 'Central Asia', students: 35, trend: 'up' },
  { country: 'Tunisia', region: 'North Africa', students: 32, trend: 'stable' },
  { country: 'Algeria', region: 'North Africa', students: 28, trend: 'down' },
  { country: 'Djibouti', region: 'East Africa', students: 25, trend: 'stable' },
  { country: 'Mauritania', region: 'West Africa', students: 22, trend: 'up' },
  { country: 'Kenya', region: 'East Africa', students: 20, trend: 'stable' },
  { country: 'India', region: 'South Asia', students: 18, trend: 'up' },
  { country: 'Malaysia', region: 'Southeast Asia', students: 15, trend: 'stable' },
];

const TOTAL_STUDENTS = 40000;
const TOTAL_INTERNATIONAL = 6500;
const TOTAL_NATIONALITIES = 101;

const regionColors: Record<string, string> = {
  'Central Asia': 'bg-blue-500/10 text-blue-700 border-blue-500/20',
  'Middle East': 'bg-amber-500/10 text-amber-700 border-amber-500/20',
  'South Asia': 'bg-green-500/10 text-green-700 border-green-500/20',
  'East Africa': 'bg-purple-500/10 text-purple-700 border-purple-500/20',
  'North Africa': 'bg-orange-500/10 text-orange-700 border-orange-500/20',
  'West Africa': 'bg-rose-500/10 text-rose-700 border-rose-500/20',
  'Central Africa': 'bg-red-500/10 text-red-700 border-red-500/20',
  'Southeast Asia': 'bg-teal-500/10 text-teal-700 border-teal-500/20',
};

export function NationalityDistributionTab() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');

  const top30Total = top30Nationalities.reduce((sum, n) => sum + n.students, 0);
  const otherNationalities = TOTAL_INTERNATIONAL - top30Total;

  // Region breakdown
  const regionBreakdown = top30Nationalities.reduce(
    (acc, n) => {
      acc[n.region] = (acc[n.region] || 0) + n.students;
      return acc;
    },
    {} as Record<string, number>
  );

  const sortedRegions = Object.entries(regionBreakdown).sort((a, b) => b[1] - a[1]);

  const filteredNationalities = top30Nationalities.filter((n) =>
    n.country.toLowerCase().includes(searchTerm.toLowerCase()) ||
    n.region.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const maxStudents = top30Nationalities[0].students;

  return (
    <div className="space-y-6">
      {/* Headline Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              Total Students
            </CardDescription>
            <CardTitle className="text-2xl">{TOTAL_STUDENTS.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Globe className="h-3 w-3 text-primary" />
              International Students
            </CardDescription>
            <CardTitle className="text-2xl text-primary">{TOTAL_INTERNATIONAL.toLocaleString()}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">
              {((TOTAL_INTERNATIONAL / TOTAL_STUDENTS) * 100).toFixed(1)}% of total enrollment
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Flag className="h-3 w-3" />
              Nationalities
            </CardDescription>
            <CardTitle className="text-2xl">{TOTAL_NATIONALITIES}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-blue-500/20">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-blue-600" />
              #1 Nationality
            </CardDescription>
            <CardTitle className="text-xl text-blue-600">Turkmenistan</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-xs text-muted-foreground">
              {top30Nationalities[0].students.toLocaleString()} students ({((top30Nationalities[0].students / TOTAL_INTERNATIONAL) * 100).toFixed(1)}%)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Region Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Regional Distribution</CardTitle>
          <CardDescription>Top 30 nationalities grouped by region</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            {sortedRegions.map(([region, count]) => {
              const pct = (count / top30Total) * 100;
              return (
                <div key={region} className="rounded-lg border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className={regionColors[region] || ''}>
                      {region}
                    </Badge>
                    <span className="text-sm font-semibold">{count.toLocaleString()}</span>
                  </div>
                  <Progress value={pct} className="h-1.5" />
                  <p className="text-xs text-muted-foreground mt-1">{pct.toFixed(1)}% of top 30</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <Input
        placeholder="Search by country or region..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-xs"
      />

      {/* Top 30 Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Globe className="h-5 w-5" />
              Top 30 Nationalities
            </span>
            <Badge variant="outline">
              {TOTAL_NATIONALITIES - 30} other nationalities ({otherNationalities.toLocaleString()} students)
            </Badge>
          </CardTitle>
          <CardDescription>
            Showing the top 30 source countries for international students
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-background z-10">
                <tr className="border-b">
                  <th className="text-left py-3 px-3 font-medium w-8">#</th>
                  <th className="text-left py-3 px-3 font-medium">Country</th>
                  <th className="text-left py-3 px-3 font-medium">Region</th>
                  <th className="text-right py-3 px-3 font-medium">Students</th>
                  <th className="text-right py-3 px-3 font-medium">% of Int'l</th>
                  <th className="text-left py-3 px-3 font-medium w-40">Distribution</th>
                  <th className="text-center py-3 px-3 font-medium">Trend</th>
                </tr>
              </thead>
              <tbody>
                {filteredNationalities.map((nat, idx) => {
                  const pct = (nat.students / TOTAL_INTERNATIONAL) * 100;
                  const barPct = (nat.students / maxStudents) * 100;
                  const originalIdx = top30Nationalities.indexOf(nat);

                  return (
                    <tr
                      key={nat.country}
                      className={`border-b hover:bg-muted/50 ${originalIdx < 3 ? 'bg-primary/5' : ''}`}
                    >
                      <td className="py-3 px-3 text-muted-foreground font-mono text-xs">
                        {originalIdx + 1}
                      </td>
                      <td className="py-3 px-3 font-medium">{nat.country}</td>
                      <td className="py-3 px-3">
                        <Badge
                          variant="outline"
                          className={`text-xs ${regionColors[nat.region] || ''}`}
                        >
                          {nat.region}
                        </Badge>
                      </td>
                      <td className="text-right py-3 px-3 font-semibold">
                        {nat.students.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-3 text-muted-foreground">
                        {pct.toFixed(1)}%
                      </td>
                      <td className="py-3 px-3">
                        <div className="w-full bg-muted rounded-full h-2">
                          <div
                            className="bg-primary rounded-full h-2 transition-all"
                            style={{ width: `${barPct}%` }}
                          />
                        </div>
                      </td>
                      <td className="text-center py-3 px-3">
                        {nat.trend === 'up' && (
                          <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-xs">
                            ↑
                          </Badge>
                        )}
                        {nat.trend === 'stable' && (
                          <Badge className="bg-muted text-muted-foreground text-xs">→</Badge>
                        )}
                        {nat.trend === 'down' && (
                          <Badge className="bg-red-500/10 text-red-600 border-red-500/20 text-xs">
                            ↓
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="sticky bottom-0 bg-muted font-medium">
                <tr>
                  <td className="py-3 px-3" colSpan={3}>
                    Top 30 Total
                  </td>
                  <td className="text-right py-3 px-3">{top30Total.toLocaleString()}</td>
                  <td className="text-right py-3 px-3 text-muted-foreground">
                    {((top30Total / TOTAL_INTERNATIONAL) * 100).toFixed(1)}%
                  </td>
                  <td colSpan={2}></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
