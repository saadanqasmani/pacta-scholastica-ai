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

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/profile', label: 'University Profile', icon: Building2 },
  { to: '/partners', label: 'Partner Discovery', icon: Handshake },
  { to: '/partnerships', label: 'Partnership Management', icon: Handshake },
  { to: '/mobility', label: 'Mobility Tracking', icon: Plane },
  { to: '/mou', label: 'MOU Management', icon: FileText },
  { to: '/intelligence', label: 'Market Intelligence', icon: TrendingUp },
];

export function Navigation() {
  const location = useLocation();

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
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
