import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useLanguage } from '@/contexts/LanguageContext';
import { NAV_GROUPS, groupForPath } from './navConfig';

/** Screen tabs for the active window (all sizes). */
export function Navigation() {
  const { pathname } = useLocation();
  const { t } = useLanguage();
  const active = groupForPath(pathname);
  if (active.items.length < 2) return null;

  return (
    <nav aria-label={active.label} className="mx-auto mt-3 max-w-[1400px] px-3 md:px-4">
      <div className="no-scrollbar flex items-center gap-1.5 overflow-x-auto">
        {active.items.map((item) => {
          const isActive = pathname === item.to;
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              className={cn(
                'flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-sm font-medium transition-all',
                isActive
                  ? 'glass-pill glass-active text-primary'
                  : 'text-muted-foreground hover:bg-white/40 hover:text-foreground dark:hover:bg-white/5'
              )}
            >
              <Icon className="h-4 w-4" />
              {t(item.labelKey)}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

/** Floating glass tab bar for phones — the five windows within thumb reach. */
export function MobileTabBar() {
  const { pathname } = useLocation();
  const active = groupForPath(pathname);

  return (
    <nav
      aria-label="Windows"
      className="pb-safe fixed inset-x-0 bottom-0 z-40 px-3 lg:hidden"
    >
      <div className="glass-strong mx-auto flex max-w-md items-stretch justify-between rounded-[26px] p-1.5">
        {NAV_GROUPS.map((g) => {
          const isActive = g.key === active.key;
          const Icon = g.icon;
          return (
            <NavLink
              key={g.key}
              to={g.items[0].to}
              aria-label={g.label}
              className={cn(
                'flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-[20px] py-1.5 text-[10.5px] font-medium transition-all',
                isActive ? 'glass-active text-primary' : 'text-muted-foreground active:scale-95'
              )}
            >
              <Icon className="h-[22px] w-[22px]" strokeWidth={isActive ? 2.25 : 1.75} />
              <span className="truncate">{g.short}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
