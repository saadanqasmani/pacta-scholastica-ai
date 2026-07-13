import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Building2,
  Handshake,
  FileText,
  Plane,
  TrendingUp,
  FolderOpen,
  BarChart3,
  Gauge,
  Library,
  Settings,
  Globe2,
  Briefcase,
  LineChart,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface NavItem {
  to: string;
  labelKey: string;
  icon: typeof LayoutDashboard;
}

interface NavGroup {
  key: string;
  label: string;
  icon: typeof LayoutDashboard;
  items: NavItem[];
}

/** Two-tier navigation: top-level "windows", each opening its own set of
 *  screens. Grouping follows the product's operating model — executive
 *  measurement first, then the operational offices. */
const GROUPS: NavGroup[] = [
  {
    key: 'overview',
    label: 'Executive Overview',
    icon: Gauge,
    items: [
      { to: '/', labelKey: 'nav.dashboard', icon: LayoutDashboard },
      { to: '/diagnostics', labelKey: 'nav.diagnostics', icon: Gauge },
      { to: '/profile', labelKey: 'profile.title', icon: Building2 },
      { to: '/partner-analytics', labelKey: 'nav.partnerAnalytics', icon: BarChart3 },
    ],
  },
  {
    key: 'iar',
    label: 'International Academic Relations',
    icon: Globe2,
    items: [
      { to: '/partners', labelKey: 'partners.title', icon: Handshake },
      { to: '/partnerships', labelKey: 'nav.partnerships', icon: Briefcase },
      { to: '/mou', labelKey: 'mou.title', icon: FileText },
    ],
  },
  {
    key: 'mobility',
    label: 'Mobility',
    icon: Plane,
    items: [{ to: '/mobility', labelKey: 'mobility.title', icon: Plane }],
  },
  {
    key: 'recruitment',
    label: 'Recruitment',
    icon: TrendingUp,
    items: [
      { to: '/recruitment', labelKey: 'recruitment.title', icon: TrendingUp },
      { to: '/intelligence', labelKey: 'nav.intelligence', icon: LineChart },
      { to: '/documentation', labelKey: 'nav.documentation', icon: FolderOpen },
    ],
  },
  {
    key: 'system',
    label: 'Settings',
    icon: Settings,
    items: [
      { to: '/settings', labelKey: 'nav.settings', icon: Settings },
      { to: '/library', labelKey: 'nav.library', icon: Library },
    ],
  },
];

function groupOf(pathname: string): NavGroup {
  return (
    GROUPS.find((g) => g.items.some((it) => it.to === pathname)) ??
    GROUPS[0]
  );
}

export function Navigation() {
  const location = useLocation();
  const { t } = useLanguage();
  const activeGroup = groupOf(location.pathname);

  return (
    <nav className="border-b border-border bg-background">
      {/* Tier 1 — windows */}
      <div className="container">
        <div className="flex items-center gap-1 overflow-x-auto py-2">
          {GROUPS.map((group) => {
            const isActive = group.key === activeGroup.key;
            const Icon = group.icon;
            return (
              <NavLink
                key={group.key}
                to={group.items[0].to}
                className={cn(
                  'flex items-center gap-2 whitespace-nowrap rounded-md px-4 py-2 text-sm font-medium transition-colors',
                  'hover:bg-secondary hover:text-secondary-foreground',
                  isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{group.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>

      {/* Tier 2 — screens inside the active window */}
      {activeGroup.items.length > 1 && (
        <div className="border-t border-border bg-secondary/30">
          <div className="container">
            <div className="flex items-center gap-1 overflow-x-auto py-1.5">
              {activeGroup.items.map((item) => {
                const isActive = location.pathname === item.to;
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={cn(
                      'flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors',
                      'hover:bg-secondary hover:text-secondary-foreground',
                      isActive
                        ? 'bg-background text-foreground shadow-sm border'
                        : 'text-muted-foreground'
                    )}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    <span>{t(item.labelKey)}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
