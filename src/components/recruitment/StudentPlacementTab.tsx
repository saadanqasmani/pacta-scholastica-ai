import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import {
  Building2,
  GraduationCap,
  Users,
  Globe2,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

// Faculty placement data based on actual Nişantaşı departments
const facultyPlacementData = [
  {
    faculty: 'Faculty of Economics, Administrative and Social Sciences',
    totalStudents: 12400,
    internationalStudents: 2150,
    language: 'Turkish / English',
    departments: [
      { name: 'Business Administration', total: 2800, international: 520, lang: 'English' },
      { name: 'Psychology', total: 1850, international: 310, lang: 'Turkish' },
      { name: 'Political Science and Public Administration', total: 1200, international: 180, lang: 'Turkish' },
      { name: 'Management Information Systems', total: 1100, international: 195, lang: 'English' },
      { name: 'English Language and Literature', total: 950, international: 165, lang: 'English' },
      { name: 'New Media and Communication', total: 1050, international: 185, lang: 'Turkish' },
      { name: 'Aviation Management', total: 900, international: 145, lang: 'English' },
      { name: 'English Translation and Interpreting', total: 650, international: 120, lang: 'English' },
      { name: 'Social Services', total: 700, international: 105, lang: 'Turkish' },
      { name: 'Public Relations and Advertising', total: 650, international: 110, lang: 'Turkish' },
      { name: 'Sociology', total: 550, international: 115, lang: 'Turkish' },
    ],
  },
  {
    faculty: 'Faculty of Engineering and Architecture',
    totalStudents: 7200,
    internationalStudents: 1350,
    language: 'English / Turkish',
    departments: [
      { name: 'Computer Engineering', total: 1800, international: 380, lang: 'English' },
      { name: 'Software Engineering', total: 1400, international: 310, lang: 'English' },
      { name: 'Architecture', total: 1100, international: 185, lang: 'Turkish' },
      { name: 'Civil Engineering', total: 950, international: 160, lang: 'Turkish' },
      { name: 'Electrical and Electronics Engineering', total: 850, international: 140, lang: 'English' },
      { name: 'Mechatronics Engineering', total: 600, international: 95, lang: 'Turkish' },
      { name: 'Industrial Engineering', total: 500, international: 80, lang: 'English' },
    ],
  },
  {
    faculty: 'Faculty of Art and Design',
    totalStudents: 4200,
    internationalStudents: 580,
    language: 'Turkish',
    departments: [
      { name: 'Graphic Design', total: 950, international: 145, lang: 'Turkish' },
      { name: 'Interior Design', total: 850, international: 120, lang: 'Turkish' },
      { name: 'Radio, Television and Cinema', total: 700, international: 95, lang: 'Turkish' },
      { name: 'Fashion and Textile Design', total: 550, international: 75, lang: 'Turkish' },
      { name: 'Digital Game Design', total: 500, international: 65, lang: 'Turkish' },
      { name: 'Industrial Design', total: 350, international: 45, lang: 'Turkish' },
      { name: 'Communication and Design', total: 300, international: 35, lang: 'Turkish' },
    ],
  },
  {
    faculty: 'Faculty of Health Sciences',
    totalStudents: 3800,
    internationalStudents: 620,
    language: 'Turkish',
    departments: [
      { name: 'Nursing', total: 1400, international: 240, lang: 'Turkish' },
      { name: 'Physiotherapy and Rehabilitation', total: 1000, international: 165, lang: 'Turkish' },
      { name: 'Nutrition and Dietetics', total: 850, international: 125, lang: 'Turkish' },
      { name: 'Speech and Language Therapy', total: 550, international: 90, lang: 'Turkish' },
    ],
  },
  {
    faculty: 'Faculty of Medicine',
    totalStudents: 1800,
    internationalStudents: 420,
    language: 'English',
    departments: [
      { name: 'Medicine', total: 1800, international: 420, lang: 'English' },
    ],
  },
  {
    faculty: 'Faculty of Dentistry',
    totalStudents: 1200,
    internationalStudents: 285,
    language: 'Turkish',
    departments: [
      { name: 'Dentistry', total: 1200, international: 285, lang: 'Turkish' },
    ],
  },
  {
    faculty: 'School of Civil Aviation',
    totalStudents: 1600,
    internationalStudents: 210,
    language: 'English / Turkish',
    departments: [
      { name: 'Pilotage', total: 500, international: 75, lang: 'English' },
      { name: 'Aircraft Maintenance and Repair', total: 400, international: 55, lang: 'Turkish' },
      { name: 'Air Traffic Control', total: 350, international: 45, lang: 'English' },
      { name: 'Aviation Management', total: 350, international: 35, lang: 'English' },
    ],
  },
  {
    faculty: 'School of Physical Education and Sports',
    totalStudents: 1100,
    internationalStudents: 145,
    language: 'Turkish',
    departments: [
      { name: 'Coaching Education', total: 450, international: 65, lang: 'Turkish' },
      { name: 'Sports Management', total: 400, international: 50, lang: 'Turkish' },
      { name: 'Recreation', total: 250, international: 30, lang: 'Turkish' },
    ],
  },
  {
    faculty: 'Conservatory',
    totalStudents: 450,
    internationalStudents: 65,
    language: 'Turkish',
    departments: [
      { name: 'Music', total: 250, international: 40, lang: 'Turkish' },
      { name: 'Performing Arts (Theatre)', total: 200, international: 25, lang: 'Turkish' },
    ],
  },
  {
    faculty: 'School of Applied Sciences',
    totalStudents: 800,
    internationalStudents: 95,
    language: 'Turkish',
    departments: [
      { name: 'Gastronomy and Culinary Arts', total: 450, international: 55, lang: 'Turkish' },
      { name: 'Management Information Systems', total: 350, international: 40, lang: 'Turkish' },
    ],
  },
  {
    faculty: 'Vocational Schools',
    totalStudents: 3200,
    internationalStudents: 320,
    language: 'Turkish',
    departments: [
      { name: 'Health Programs (Various)', total: 1400, international: 140, lang: 'Turkish' },
      { name: 'Technical Programs (Various)', total: 1000, international: 100, lang: 'Turkish' },
      { name: 'Social Programs (Various)', total: 800, international: 80, lang: 'Turkish' },
    ],
  },
  {
    faculty: 'Graduate School',
    totalStudents: 2250,
    internationalStudents: 260,
    language: 'Turkish / English',
    departments: [
      { name: 'Business Administration (MBA)', total: 400, international: 55, lang: 'English' },
      { name: 'Artificial Intelligence Engineering', total: 250, international: 40, lang: 'English' },
      { name: 'Clinical Psychology', total: 200, international: 25, lang: 'Turkish' },
      { name: 'Computer Engineering', total: 180, international: 30, lang: 'English' },
      { name: 'Other Programs (28 programs)', total: 1220, international: 110, lang: 'Turkish' },
    ],
  },
];

export function StudentPlacementTab() {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedFaculties, setExpandedFaculties] = useState<string[]>([]);

  const totalAllStudents = facultyPlacementData.reduce((sum, f) => sum + f.totalStudents, 0);
  const totalIntlStudents = facultyPlacementData.reduce((sum, f) => sum + f.internationalStudents, 0);

  const toggleFaculty = (faculty: string) => {
    setExpandedFaculties((prev) =>
      prev.includes(faculty) ? prev.filter((f) => f !== faculty) : [...prev, faculty]
    );
  };

  const filteredFaculties = facultyPlacementData.filter(
    (f) =>
      f.faculty.toLowerCase().includes(searchTerm.toLowerCase()) ||
      f.departments.some((d) => d.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Users className="h-3 w-3" />
              Total Students
            </CardDescription>
            <CardTitle className="text-2xl">{totalAllStudents.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card className="border-primary/20">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Globe2 className="h-3 w-3 text-primary" />
              International Students
            </CardDescription>
            <CardTitle className="text-2xl text-primary">{totalIntlStudents.toLocaleString()}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Building2 className="h-3 w-3" />
              Faculties & Schools
            </CardDescription>
            <CardTitle className="text-2xl">{facultyPlacementData.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <GraduationCap className="h-3 w-3" />
              Int'l Ratio
            </CardDescription>
            <CardTitle className="text-2xl">
              {((totalIntlStudents / totalAllStudents) * 100).toFixed(1)}%
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Search */}
      <Input
        placeholder="Search faculty or department..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="max-w-xs"
      />

      {/* Faculty Breakdown */}
      <div className="space-y-3">
        {filteredFaculties
          .sort((a, b) => b.internationalStudents - a.internationalStudents)
          .map((faculty) => {
            const isExpanded = expandedFaculties.includes(faculty.faculty);
            const intlPercent = (faculty.internationalStudents / faculty.totalStudents) * 100;

            return (
              <Collapsible
                key={faculty.faculty}
                open={isExpanded}
                onOpenChange={() => toggleFaculty(faculty.faculty)}
              >
                <Card>
                  <CollapsibleTrigger asChild>
                    <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                          <div>
                            <CardTitle className="text-base">{faculty.faculty}</CardTitle>
                            <CardDescription className="mt-1">
                              {faculty.departments.length} departments · {faculty.language}
                            </CardDescription>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-right">
                          <div>
                            <p className="text-sm text-muted-foreground">Total</p>
                            <p className="font-semibold">{faculty.totalStudents.toLocaleString()}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Int'l</p>
                            <p className="font-semibold text-primary">
                              {faculty.internationalStudents.toLocaleString()}
                            </p>
                          </div>
                          <div className="w-20">
                            <p className="text-xs text-muted-foreground mb-1">
                              {intlPercent.toFixed(1)}%
                            </p>
                            <Progress value={intlPercent} className="h-2" />
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <CardContent className="pt-0">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-2 px-3 font-medium">Department</th>
                              <th className="text-left py-2 px-3 font-medium">Language</th>
                              <th className="text-right py-2 px-3 font-medium">Total</th>
                              <th className="text-right py-2 px-3 font-medium">International</th>
                              <th className="text-right py-2 px-3 font-medium">Int'l %</th>
                            </tr>
                          </thead>
                          <tbody>
                            {faculty.departments
                              .sort((a, b) => b.international - a.international)
                              .map((dept) => {
                                const deptIntlPct = (dept.international / dept.total) * 100;
                                return (
                                  <tr
                                    key={dept.name}
                                    className="border-b last:border-0 hover:bg-muted/30"
                                  >
                                    <td className="py-2 px-3 font-medium">{dept.name}</td>
                                    <td className="py-2 px-3">
                                      <Badge
                                        variant={dept.lang === 'English' ? 'default' : 'secondary'}
                                        className="text-xs"
                                      >
                                        {dept.lang}
                                      </Badge>
                                    </td>
                                    <td className="text-right py-2 px-3">
                                      {dept.total.toLocaleString()}
                                    </td>
                                    <td className="text-right py-2 px-3 text-primary font-medium">
                                      {dept.international.toLocaleString()}
                                    </td>
                                    <td className="text-right py-2 px-3">
                                      <div className="flex items-center justify-end gap-2">
                                        <Progress value={deptIntlPct} className="w-16 h-1.5" />
                                        <span className="text-xs text-muted-foreground w-12 text-right">
                                          {deptIntlPct.toFixed(1)}%
                                        </span>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                          </tbody>
                        </table>
                      </div>
                    </CardContent>
                  </CollapsibleContent>
                </Card>
              </Collapsible>
            );
          })}
      </div>
    </div>
  );
}
