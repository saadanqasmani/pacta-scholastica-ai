import { useMemo } from 'react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type FairStatus = 'attended' | 'planned' | 'not_attending' | 'no_fairs';

interface CountryMapData {
  name: string;
  code: string;
  status: FairStatus;
  fairName?: string;
  date?: string;
}

// SVG path data for a simplified world map - key countries only
const countryPaths: Record<string, { d: string; cx: number; cy: number }> = {
  // Middle East & North Africa
  QA: { d: '', cx: 555, cy: 235 },
  SA: { d: '', cx: 535, cy: 225 },
  AE: { d: '', cx: 560, cy: 230 },
  KW: { d: '', cx: 540, cy: 210 },
  BH: { d: '', cx: 548, cy: 218 },
  OM: { d: '', cx: 565, cy: 240 },
  JO: { d: '', cx: 520, cy: 205 },
  LB: { d: '', cx: 518, cy: 198 },
  EG: { d: '', cx: 500, cy: 220 },
  LY: { d: '', cx: 475, cy: 215 },
  TN: { d: '', cx: 455, cy: 198 },
  DZ: { d: '', cx: 435, cy: 205 },
  MA: { d: '', cx: 415, cy: 205 },
  IQ: { d: '', cx: 540, cy: 200 },
  IR: { d: '', cx: 560, cy: 195 },
  // Sub-Saharan Africa
  NG: { d: '', cx: 440, cy: 265 },
  GH: { d: '', cx: 425, cy: 265 },
  KE: { d: '', cx: 520, cy: 290 },
  ET: { d: '', cx: 525, cy: 270 },
  TZ: { d: '', cx: 520, cy: 305 },
  ZA: { d: '', cx: 495, cy: 365 },
  SN: { d: '', cx: 400, cy: 250 },
  CI: { d: '', cx: 415, cy: 265 },
  CM: { d: '', cx: 455, cy: 270 },
  // Central & South Asia
  PK: { d: '', cx: 590, cy: 205 },
  IN: { d: '', cx: 610, cy: 235 },
  BD: { d: '', cx: 630, cy: 225 },
  NP: { d: '', cx: 615, cy: 210 },
  LK: { d: '', cx: 615, cy: 260 },
  // Central Asia
  KZ: { d: '', cx: 580, cy: 165 },
  UZ: { d: '', cx: 575, cy: 175 },
  TM: { d: '', cx: 565, cy: 180 },
  KG: { d: '', cx: 590, cy: 175 },
  // Southeast Asia
  MY: { d: '', cx: 660, cy: 270 },
  ID: { d: '', cx: 670, cy: 290 },
  PH: { d: '', cx: 690, cy: 250 },
  VN: { d: '', cx: 670, cy: 245 },
  TH: { d: '', cx: 655, cy: 250 },
  // Europe
  TR: { d: '', cx: 510, cy: 185 },
  DE: { d: '', cx: 455, cy: 165 },
  GB: { d: '', cx: 430, cy: 155 },
  FR: { d: '', cx: 440, cy: 170 },
  NL: { d: '', cx: 445, cy: 158 },
  ES: { d: '', cx: 425, cy: 180 },
  IT: { d: '', cx: 460, cy: 178 },
  // Americas
  US: { d: '', cx: 220, cy: 195 },
  CA: { d: '', cx: 220, cy: 155 },
  BR: { d: '', cx: 310, cy: 310 },
  // East Asia
  CN: { d: '', cx: 650, cy: 195 },
  JP: { d: '', cx: 710, cy: 190 },
  KR: { d: '', cx: 695, cy: 190 },
  // Oceania
  AU: { d: '', cx: 700, cy: 350 },
};

const countries: CountryMapData[] = [
  // Attended
  { name: 'Qatar', code: 'QA', status: 'attended', fairName: 'EDIS 8th Edition', date: 'Feb 2025' },
  { name: 'Saudi Arabia', code: 'SA', status: 'attended', fairName: 'EDIS KSA Education Fair', date: 'Mar 2025' },
  { name: 'Nigeria', code: 'NG', status: 'attended', fairName: 'CUEF Nigeria', date: 'Jan 2025' },
  { name: 'Turkey', code: 'TR', status: 'attended', fairName: 'Studyportals Türkiye', date: 'Apr 2025' },
  { name: 'Azerbaijan', code: 'AZ', status: 'attended', fairName: 'Baku Education Fair', date: 'Mar 2025' },
  { name: 'Iraq', code: 'IQ', status: 'attended', fairName: 'Erbil International Education', date: 'Feb 2025' },
  { name: 'Kazakhstan', code: 'KZ', status: 'attended', fairName: 'EAIE Almaty Roadshow', date: 'Nov 2024' },
  // Planned
  { name: 'UAE', code: 'AE', status: 'planned', fairName: 'GETEX Dubai', date: 'Sep 2025' },
  { name: 'Pakistan', code: 'PK', status: 'planned', fairName: 'CUEF Pakistan', date: 'Oct 2025' },
  { name: 'Egypt', code: 'EG', status: 'planned', fairName: 'Cairo Education Expo', date: 'Nov 2025' },
  { name: 'Indonesia', code: 'ID', status: 'planned', fairName: 'EHEF Indonesia', date: 'Oct 2025' },
  { name: 'Morocco', code: 'MA', status: 'planned', fairName: 'Forum de l\'Étudiant', date: 'Dec 2025' },
  { name: 'Kenya', code: 'KE', status: 'planned', fairName: 'Nairobi Education Fair', date: 'Jan 2026' },
  { name: 'Uzbekistan', code: 'UZ', status: 'planned', fairName: 'Tashkent Edu Expo', date: 'Feb 2026' },
  // Not attending (fairs exist)
  { name: 'India', code: 'IN', status: 'not_attending', fairName: 'BMI India Roadshow', date: 'Nov 2025' },
  { name: 'Malaysia', code: 'MY', status: 'not_attending', fairName: 'Facon Education Fair', date: 'Mar 2026' },
  { name: 'Jordan', code: 'JO', status: 'not_attending', fairName: 'Amman Education Week', date: 'Apr 2026' },
  { name: 'UK', code: 'GB', status: 'not_attending', fairName: 'ICEF Higher Education', date: 'Sep 2025' },
  { name: 'Germany', code: 'DE', status: 'not_attending', fairName: 'EAIE Conference', date: 'Sep 2025' },
  { name: 'USA', code: 'US', status: 'not_attending', fairName: 'NAFSA Annual', date: 'May 2026' },
  { name: 'South Korea', code: 'KR', status: 'not_attending', fairName: 'Korean Edu Fair', date: 'Oct 2025' },
  { name: 'Bangladesh', code: 'BD', status: 'not_attending', fairName: 'Dhaka Edu Expo', date: 'Mar 2026' },
  { name: 'Ghana', code: 'GH', status: 'not_attending', fairName: 'Accra Study Abroad', date: 'Feb 2026' },
  { name: 'Ethiopia', code: 'ET', status: 'not_attending', fairName: 'Addis Education Fair', date: 'Apr 2026' },
  { name: 'Philippines', code: 'PH', status: 'not_attending', fairName: 'Manila Edu Expo', date: 'Nov 2025' },
  // No fairs
  { name: 'Turkmenistan', code: 'TM', status: 'no_fairs' },
  { name: 'Libya', code: 'LY', status: 'no_fairs' },
  { name: 'Iran', code: 'IR', status: 'no_fairs' },
  { name: 'Nepal', code: 'NP', status: 'no_fairs' },
  { name: 'Sri Lanka', code: 'LK', status: 'no_fairs' },
  { name: 'Kyrgyzstan', code: 'KG', status: 'no_fairs' },
  { name: 'Senegal', code: 'SN', status: 'no_fairs' },
  { name: 'Cameroon', code: 'CM', status: 'no_fairs' },
  { name: 'Tanzania', code: 'TZ', status: 'no_fairs' },
];

const statusConfig: Record<FairStatus, { color: string; dotColor: string; label: string }> = {
  attended: { color: 'bg-green-500', dotColor: 'bg-green-500', label: 'Attended' },
  planned: { color: 'bg-blue-500', dotColor: 'bg-blue-500', label: 'Planned' },
  not_attending: { color: 'bg-yellow-500', dotColor: 'bg-yellow-500', label: 'Fair Exists — Not Attending' },
  no_fairs: { color: 'bg-muted', dotColor: 'bg-muted-foreground/40', label: 'No Major Fairs' },
};

export function FairWorldMap() {
  const grouped = useMemo(() => {
    const g: Record<FairStatus, CountryMapData[]> = {
      attended: [],
      planned: [],
      not_attending: [],
      no_fairs: [],
    };
    countries.forEach((c) => g[c.status].push(c));
    return g;
  }, []);

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center">
        {(Object.keys(statusConfig) as FairStatus[]).map((status) => (
          <div key={status} className="flex items-center gap-2 text-sm">
            <div className={`w-3 h-3 rounded-full ${statusConfig[status].dotColor}`} />
            <span className="text-muted-foreground">{statusConfig[status].label}</span>
            <Badge variant="outline" className="text-xs">{grouped[status].length}</Badge>
          </div>
        ))}
      </div>

      {/* Map visualization using dots */}
      <div className="relative w-full overflow-hidden rounded-lg border bg-card" style={{ aspectRatio: '2/1' }}>
        <svg
          viewBox="100 120 650 280"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Background grid */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="hsl(220 15% 90%)" strokeWidth="0.3" opacity="0.5" />
            </pattern>
          </defs>
          <rect x="100" y="120" width="650" height="280" fill="url(#grid)" />

          {/* Continent outlines (simplified) */}
          {/* Africa */}
          <ellipse cx="470" cy="280" rx="60" ry="80" fill="hsl(220 10% 94%)" opacity="0.4" />
          {/* Europe */}
          <ellipse cx="460" cy="165" rx="45" ry="25" fill="hsl(220 10% 94%)" opacity="0.4" />
          {/* Middle East */}
          <ellipse cx="540" cy="215" rx="40" ry="30" fill="hsl(220 10% 94%)" opacity="0.4" />
          {/* South Asia */}
          <ellipse cx="610" cy="230" rx="30" ry="35" fill="hsl(220 10% 94%)" opacity="0.4" />
          {/* Central Asia */}
          <ellipse cx="580" cy="175" rx="25" ry="15" fill="hsl(220 10% 94%)" opacity="0.4" />
          {/* SE Asia */}
          <ellipse cx="670" cy="265" rx="35" ry="30" fill="hsl(220 10% 94%)" opacity="0.4" />
          {/* Americas */}
          <ellipse cx="240" cy="240" rx="80" ry="100" fill="hsl(220 10% 94%)" opacity="0.3" />

          <TooltipProvider>
            {countries.map((country) => {
              const pos = countryPaths[country.code];
              if (!pos) return null;

              const cfg = statusConfig[country.status];
              const r = country.status === 'attended' ? 6 : country.status === 'planned' ? 5 : 4;

              const fillMap: Record<FairStatus, string> = {
                attended: '#22c55e',
                planned: '#3b82f6',
                not_attending: '#eab308',
                no_fairs: '#9ca3af',
              };

              return (
                <Tooltip key={country.code}>
                  <TooltipTrigger asChild>
                    <g className="cursor-pointer">
                      {/* Pulse ring for attended */}
                      {country.status === 'attended' && (
                        <circle cx={pos.cx} cy={pos.cy} r={r + 4} fill={fillMap[country.status]} opacity="0.2">
                          <animate attributeName="r" values={`${r + 2};${r + 8};${r + 2}`} dur="2s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.3;0.05;0.3" dur="2s" repeatCount="indefinite" />
                        </circle>
                      )}
                      <circle
                        cx={pos.cx}
                        cy={pos.cy}
                        r={r}
                        fill={fillMap[country.status]}
                        stroke="white"
                        strokeWidth="1.5"
                        opacity={country.status === 'no_fairs' ? 0.5 : 0.9}
                      />
                      <text
                        x={pos.cx}
                        y={pos.cy + r + 10}
                        textAnchor="middle"
                        fontSize="6"
                        fill="currentColor"
                        className="text-muted-foreground"
                        opacity="0.7"
                      >
                        {country.name.length > 10 ? country.code : country.name}
                      </text>
                    </g>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-[200px]">
                    <div className="space-y-1">
                      <p className="font-semibold">{country.name}</p>
                      <div className="flex items-center gap-1.5">
                        <div className={`w-2 h-2 rounded-full ${cfg.dotColor}`} />
                        <span className="text-xs">{cfg.label}</span>
                      </div>
                      {country.fairName && (
                        <p className="text-xs text-muted-foreground">{country.fairName}</p>
                      )}
                      {country.date && (
                        <p className="text-xs text-muted-foreground">{country.date}</p>
                      )}
                    </div>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </TooltipProvider>
        </svg>
      </div>

      {/* Country lists by category */}
      <div className="grid gap-3 md:grid-cols-4">
        {(Object.keys(statusConfig) as FairStatus[]).map((status) => (
          <div key={status} className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${statusConfig[status].dotColor}`} />
              <h4 className="text-sm font-medium">{statusConfig[status].label}</h4>
            </div>
            <div className="flex flex-wrap gap-1">
              {grouped[status].map((c) => (
                <Badge key={c.code} variant="outline" className="text-xs">
                  {c.name}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
