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
  type LucideIcon,
} from 'lucide-react';

export interface NavItem {
  to: string;
  labelKey: string;
  icon: LucideIcon;
}

export interface NavGroup {
  key: string;
  /** Full name (desktop) */
  label: string;
  /** One-word name (phone tab bar) */
  short: string;
  icon: LucideIcon;
  items: NavItem[];
}

/** The five IRIS "windows" and the screens inside each. */
export const NAV_GROUPS: NavGroup[] = [
  {
    key: 'overview',
    label: 'Executive Overview',
    short: 'Overview',
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
    label: 'Academic Relations',
    short: 'Relations',
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
    short: 'Mobility',
    icon: Plane,
    items: [{ to: '/mobility', labelKey: 'mobility.title', icon: Plane }],
  },
  {
    key: 'recruitment',
    label: 'Recruitment',
    short: 'Recruit',
    icon: TrendingUp,
    items: [
      { to: '/recruitment', labelKey: 'recruitment.title', icon: TrendingUp },
      { to: '/intelligence', labelKey: 'nav.intelligence', icon: LineChart },
      { to: '/documentation', labelKey: 'nav.documentation', icon: FolderOpen },
    ],
  },
  {
    key: 'system',
    label: 'Library & Settings',
    short: 'More',
    icon: Settings,
    items: [
      { to: '/library', labelKey: 'nav.library', icon: Library },
      { to: '/settings', labelKey: 'nav.settings', icon: Settings },
    ],
  },
];

/** Screens that belong to a window without appearing in its tab row. */
const EXTRA_ROUTES: Record<string, string> = {
  '/add-university': 'iar',
};

export function groupForPath(pathname: string): NavGroup {
  const extra = EXTRA_ROUTES[pathname];
  if (extra) return NAV_GROUPS.find((g) => g.key === extra) ?? NAV_GROUPS[0];
  return NAV_GROUPS.find((g) => g.items.some((it) => it.to === pathname)) ?? NAV_GROUPS[0];
}
