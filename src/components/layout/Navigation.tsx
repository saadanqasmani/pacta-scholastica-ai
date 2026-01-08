import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  Building2,
  Handshake,
  FileText,
  Plane,
  TrendingUp,
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface NavItem {
  to: string;
  labelKey: string;
  icon: typeof LayoutDashboard;
}

const navItems: NavItem[] = [
  { to: '/', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { to: '/profile', labelKey: 'profile.title', icon: Building2 },
  { to: '/partners', labelKey: 'partners.title', icon: Handshake },
  { to: '/partnerships', labelKey: 'nav.partnerships', icon: Handshake },
  { to: '/mobility', labelKey: 'mobility.title', icon: Plane },
  { to: '/mou', labelKey: 'mou.title', icon: FileText },
  { to: '/recruitment', labelKey: 'recruitment.title', icon: TrendingUp },
];

export function Navigation() {
  const location = useLocation();
  const { t } = useLanguage();

  return (
    <nav className="border-b border-border bg-background">
      <div className="container">
        <div className="flex items-center gap-1 overflow-x-auto py-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.to;
            const Icon = item.icon;
            
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-colors',
                  'hover:bg-secondary hover:text-secondary-foreground',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{t(item.labelKey)}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
