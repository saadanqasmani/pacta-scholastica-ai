import { useState, useMemo } from 'react';
import { Badge } from '@/components/ui/badge';

type FairStatus = 'attended' | 'planned' | 'not_attending' | 'no_fairs';

interface CountryMapData {
  name: string;
  code: string;
  status: FairStatus;
  fairName?: string;
  date?: string;
  // Mercator-projected positions on an 800x400 viewBox
  x: number;
  y: number;
}

const countries: CountryMapData[] = [
  // Attended (green)
  { name: 'Qatar', code: 'QA', status: 'attended', fairName: 'EDIS 8th Edition', date: 'Feb 2025', x: 551, y: 207 },
  { name: 'Saudi Arabia', code: 'SA', status: 'attended', fairName: 'EDIS KSA Education Fair', date: 'Mar 2025', x: 536, y: 200 },
  { name: 'Nigeria', code: 'NG', status: 'attended', fairName: 'CUEF Nigeria', date: 'Jan 2025', x: 412, y: 240 },
  { name: 'Turkey', code: 'TR', status: 'attended', fairName: 'Studyportals Türkiye', date: 'Apr 2025', x: 500, y: 165 },
  { name: 'Azerbaijan', code: 'AZ', status: 'attended', fairName: 'Baku Education Fair', date: 'Mar 2025', x: 540, y: 168 },
  { name: 'Iraq', code: 'IQ', status: 'attended', fairName: 'Erbil International Education', date: 'Feb 2025', x: 538, y: 183 },
  { name: 'Kazakhstan', code: 'KZ', status: 'attended', fairName: 'EAIE Almaty Roadshow', date: 'Nov 2024', x: 580, y: 148 },
  // Planned (blue)
  { name: 'UAE', code: 'AE', status: 'planned', fairName: 'GETEX Dubai', date: 'Sep 2025', x: 558, y: 203 },
  { name: 'Pakistan', code: 'PK', status: 'planned', fairName: 'CUEF Pakistan', date: 'Oct 2025', x: 590, y: 192 },
  { name: 'Egypt', code: 'EG', status: 'planned', fairName: 'Cairo Education Expo', date: 'Nov 2025', x: 494, y: 196 },
  { name: 'Indonesia', code: 'ID', status: 'planned', fairName: 'EHEF Indonesia', date: 'Oct 2025', x: 680, y: 260 },
  { name: 'Morocco', code: 'MA', status: 'planned', fairName: "Forum de l'Étudiant", date: 'Dec 2025', x: 404, y: 182 },
  { name: 'Kenya', code: 'KE', status: 'planned', fairName: 'Nairobi Education Fair', date: 'Jan 2026', x: 510, y: 258 },
  { name: 'Uzbekistan', code: 'UZ', status: 'planned', fairName: 'Tashkent Edu Expo', date: 'Feb 2026', x: 578, y: 163 },
  // Not attending (fairs exist — yellow)
  { name: 'India', code: 'IN', status: 'not_attending', fairName: 'BMI India Roadshow', date: 'Nov 2025', x: 610, y: 210 },
  { name: 'Malaysia', code: 'MY', status: 'not_attending', fairName: 'Facon Education Fair', date: 'Mar 2026', x: 665, y: 242 },
  { name: 'Jordan', code: 'JO', status: 'not_attending', fairName: 'Amman Education Week', date: 'Apr 2026', x: 518, y: 185 },
  { name: 'UK', code: 'GB', status: 'not_attending', fairName: 'ICEF Higher Education', date: 'Sep 2025', x: 420, y: 140 },
  { name: 'Germany', code: 'DE', status: 'not_attending', fairName: 'EAIE Conference', date: 'Sep 2025', x: 444, y: 142 },
  { name: 'USA', code: 'US', status: 'not_attending', fairName: 'NAFSA Annual', date: 'May 2026', x: 190, y: 175 },
  { name: 'South Korea', code: 'KR', status: 'not_attending', fairName: 'Korean Edu Fair', date: 'Oct 2025', x: 706, y: 172 },
  { name: 'Bangladesh', code: 'BD', status: 'not_attending', fairName: 'Dhaka Edu Expo', date: 'Mar 2026', x: 630, y: 205 },
  { name: 'Ghana', code: 'GH', status: 'not_attending', fairName: 'Accra Study Abroad', date: 'Feb 2026', x: 404, y: 240 },
  { name: 'Ethiopia', code: 'ET', status: 'not_attending', fairName: 'Addis Education Fair', date: 'Apr 2026', x: 516, y: 242 },
  { name: 'Philippines', code: 'PH', status: 'not_attending', fairName: 'Manila Edu Expo', date: 'Nov 2025', x: 700, y: 228 },
  // No fairs (gray)
  { name: 'Turkmenistan', code: 'TM', status: 'no_fairs', x: 568, y: 165 },
  { name: 'Libya', code: 'LY', status: 'no_fairs', x: 460, y: 195 },
  { name: 'Iran', code: 'IR', status: 'no_fairs', x: 556, y: 180 },
  { name: 'Nepal', code: 'NP', status: 'no_fairs', x: 618, y: 196 },
  { name: 'Sri Lanka', code: 'LK', status: 'no_fairs', x: 615, y: 238 },
  { name: 'Kyrgyzstan', code: 'KG', status: 'no_fairs', x: 590, y: 158 },
  { name: 'Senegal', code: 'SN', status: 'no_fairs', x: 388, y: 228 },
  { name: 'Cameroon', code: 'CM', status: 'no_fairs', x: 444, y: 248 },
  { name: 'Tanzania', code: 'TZ', status: 'no_fairs', x: 510, y: 270 },
];

const statusColors: Record<FairStatus, { fill: string; label: string; bg: string; text: string }> = {
  attended: { fill: '#22c55e', label: 'Attended', bg: 'bg-green-500', text: 'text-green-600' },
  planned: { fill: '#3b82f6', label: 'Planned', bg: 'bg-blue-500', text: 'text-blue-600' },
  not_attending: { fill: '#eab308', label: 'Fair Exists — Not Attending', bg: 'bg-yellow-500', text: 'text-yellow-600' },
  no_fairs: { fill: '#9ca3af', label: 'No Major Fairs', bg: 'bg-gray-400', text: 'text-muted-foreground' },
};

// Simplified continent outlines (Natural Earth-inspired SVG paths)
const continentPaths = [
  // North America
  'M120,100 L130,90 L160,85 L200,80 L240,85 L270,95 L280,110 L285,130 L270,155 L250,170 L240,185 L230,200 L220,210 L200,215 L185,210 L175,200 L160,195 L150,180 L140,160 L130,140 L125,120 Z',
  // South America
  'M220,220 L230,215 L250,220 L265,230 L280,250 L290,270 L295,290 L290,310 L280,330 L265,345 L250,355 L240,360 L230,355 L225,340 L220,320 L215,300 L210,280 L215,260 L218,240 Z',
  // Europe
  'M410,100 L420,95 L440,90 L460,92 L475,100 L480,110 L485,120 L490,135 L485,150 L475,160 L465,165 L455,160 L445,155 L435,150 L425,145 L420,135 L415,120 L412,110 Z',
  // Africa
  'M410,185 L420,178 L440,175 L460,178 L480,185 L500,195 L510,210 L520,230 L525,250 L520,270 L510,290 L500,310 L490,325 L475,335 L460,340 L445,335 L435,320 L428,300 L420,280 L415,260 L410,240 L405,220 L408,200 Z',
  // Asia (main)
  'M490,80 L520,75 L560,72 L600,75 L640,80 L670,90 L700,100 L720,115 L730,135 L725,155 L715,170 L700,180 L680,188 L660,195 L640,200 L620,205 L600,200 L580,192 L560,185 L545,175 L530,165 L515,155 L505,140 L498,125 L492,110 L490,95 Z',
  // South/SE Asia
  'M580,195 L600,205 L620,210 L640,215 L660,225 L680,235 L700,230 L710,220 L715,210 L710,200 L700,195 L690,200 L680,210 L665,220 L650,225 L635,220 L620,215 L605,210 L590,200 Z',
  // Indonesia/SE Asia islands
  'M650,245 L660,240 L675,238 L690,242 L705,248 L715,255 L710,265 L695,270 L680,268 L665,262 L655,255 Z',
  // Australia
  'M680,300 L700,290 L720,288 L740,292 L755,300 L760,315 L755,330 L745,340 L730,345 L715,342 L700,335 L690,325 L685,312 Z',
  // Middle East
  'M520,170 L535,168 L550,172 L560,180 L565,190 L560,200 L550,208 L540,212 L530,208 L522,198 L518,188 L520,178 Z',
];

export function FairWorldMap() {
  const [hoveredCountry, setHoveredCountry] = useState<CountryMapData | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  const grouped = useMemo(() => {
    const g: Record<FairStatus, CountryMapData[]> = {
      attended: [], planned: [], not_attending: [], no_fairs: [],
    };
    countries.forEach((c) => g[c.status].push(c));
    return g;
  }, []);

  const handleMouseEnter = (country: CountryMapData, e: React.MouseEvent) => {
    const rect = (e.currentTarget as Element).closest('svg')?.getBoundingClientRect();
    if (rect) {
      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
    setHoveredCountry(country);
  };

  return (
    <div className="space-y-4">
      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center">
        {(Object.keys(statusColors) as FairStatus[]).map((status) => (
          <div key={status} className="flex items-center gap-2 text-sm">
            <div className={`w-3 h-3 rounded-full ${statusColors[status].bg}`} />
            <span className="text-muted-foreground">{statusColors[status].label}</span>
            <Badge variant="outline" className="text-xs">{grouped[status].length}</Badge>
          </div>
        ))}
      </div>

      {/* Map */}
      <div className="relative w-full overflow-hidden rounded-xl border bg-gradient-to-br from-card to-muted/30">
        <svg
          viewBox="80 60 700 320"
          className="w-full"
          style={{ aspectRatio: '2.2/1' }}
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Ocean background */}
          <rect x="80" y="60" width="700" height="320" fill="hsl(210 40% 96%)" rx="8" className="dark:fill-[hsl(220,15%,12%)]" />

          {/* Graticule lines */}
          {[120, 160, 200, 240, 280, 320, 360].map((y) => (
            <line key={`h-${y}`} x1="80" y1={y} x2="780" y2={y} stroke="hsl(210 30% 88%)" strokeWidth="0.4" opacity="0.5" className="dark:stroke-[hsl(220,15%,20%)]" />
          ))}
          {[150, 250, 350, 450, 550, 650, 750].map((x) => (
            <line key={`v-${x}`} x1={x} y1="60" x2={x} y2="380" stroke="hsl(210 30% 88%)" strokeWidth="0.4" opacity="0.5" className="dark:stroke-[hsl(220,15%,20%)]" />
          ))}

          {/* Continent shapes */}
          {continentPaths.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="hsl(220 10% 90%)"
              stroke="hsl(220 10% 82%)"
              strokeWidth="0.8"
              className="dark:fill-[hsl(220,12%,18%)] dark:stroke-[hsl(220,12%,25%)]"
            />
          ))}

          {/* Country markers */}
          {countries.map((country) => {
            const cfg = statusColors[country.status];
            const r = country.status === 'attended' ? 5.5 : country.status === 'planned' ? 4.5 : 3.5;
            const isHovered = hoveredCountry?.code === country.code;

            return (
              <g
                key={country.code}
                className="cursor-pointer"
                onMouseEnter={(e) => handleMouseEnter(country, e)}
                onMouseLeave={() => setHoveredCountry(null)}
              >
                {/* Pulse for attended */}
                {country.status === 'attended' && (
                  <circle cx={country.x} cy={country.y} r={r + 3} fill={cfg.fill} opacity="0.15">
                    <animate attributeName="r" values={`${r + 1};${r + 7};${r + 1}`} dur="2.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.25;0;0.25" dur="2.5s" repeatCount="indefinite" />
                  </circle>
                )}
                {/* Hover ring */}
                {isHovered && (
                  <circle cx={country.x} cy={country.y} r={r + 3} fill="none" stroke={cfg.fill} strokeWidth="1.5" opacity="0.6" />
                )}
                {/* Marker dot */}
                <circle
                  cx={country.x}
                  cy={country.y}
                  r={isHovered ? r + 1 : r}
                  fill={cfg.fill}
                  stroke="white"
                  strokeWidth="1.2"
                  opacity={country.status === 'no_fairs' ? 0.45 : 0.85}
                  style={{ transition: 'r 0.15s ease' }}
                />
                {/* Country label */}
                <text
                  x={country.x}
                  y={country.y + r + 9}
                  textAnchor="middle"
                  fontSize="5.5"
                  fontWeight={isHovered ? '600' : '400'}
                  fill="hsl(220 20% 30%)"
                  opacity={isHovered ? 1 : 0.6}
                  className="dark:fill-[hsl(220,10%,75%)]"
                  style={{ transition: 'opacity 0.15s ease' }}
                >
                  {country.name.length > 8 ? country.code : country.name}
                </text>
              </g>
            );
          })}
        </svg>

        {/* HTML tooltip (rendered outside SVG for proper styling) */}
        {hoveredCountry && (
          <div
            className="absolute z-50 pointer-events-none bg-popover text-popover-foreground border rounded-lg shadow-lg px-3 py-2 text-xs max-w-[200px]"
            style={{
              left: `${Math.min(tooltipPos.x + 12, 600)}px`,
              top: `${tooltipPos.y - 60}px`,
            }}
          >
            <p className="font-semibold text-sm">{hoveredCountry.name}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-2 h-2 rounded-full" style={{ backgroundColor: statusColors[hoveredCountry.status].fill }} />
              <span>{statusColors[hoveredCountry.status].label}</span>
            </div>
            {hoveredCountry.fairName && (
              <p className="text-muted-foreground mt-1">{hoveredCountry.fairName}</p>
            )}
            {hoveredCountry.date && (
              <p className="text-muted-foreground">{hoveredCountry.date}</p>
            )}
          </div>
        )}
      </div>

      {/* Country lists by category */}
      <div className="grid gap-3 md:grid-cols-4">
        {(Object.keys(statusColors) as FairStatus[]).map((status) => (
          <div key={status} className="rounded-lg border p-3 space-y-2">
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full ${statusColors[status].bg}`} />
              <h4 className="text-sm font-medium">{statusColors[status].label}</h4>
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
