import { useState } from 'react';
import { Link, NavLink, useLocation, useNavigate } from 'react-router-dom';
import { useTheme } from 'next-themes';
import {
  Eye,
  ChevronDown,
  LogOut,
  Check,
  Building2,
  Sun,
  Moon,
  Monitor,
  Globe,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUniversity } from '@/contexts/UniversityContext';
import { useLanguage, Language, languageNames } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';
import { NAV_GROUPS, groupForPath } from './navConfig';

const LANGS: Language[] = ['en', 'tr', 'de', 'ar'];

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
}

/** Searchable institution switcher for master accounts. */
function UniversitySwitcher({ compact }: { compact?: boolean }) {
  const { selectedUniversity, setSelectedUniversity, universities, isLoading } = useUniversity();
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const isTurkish = (c: string) => c === 'Turkey' || c === 'Türkiye';
  const groups = [
    { label: t('header.turkishUniversities'), list: universities.filter((u) => isTurkish(u.country)) },
    { label: t('header.internationalUniversities'), list: universities.filter((u) => !isTurkish(u.country)) },
  ];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          disabled={isLoading}
          aria-label={t('header.selectUniversity')}
          className={cn(
            'glass-pill flex items-center gap-2 text-left text-sm transition hover:brightness-105',
            compact ? 'h-10 w-10 justify-center' : 'h-10 max-w-[15rem] pl-1.5 pr-3 2xl:max-w-[18rem]'
          )}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
            {selectedUniversity ? initials(selectedUniversity.name) : <Building2 className="h-4 w-4" />}
          </span>
          {!compact && (
            <>
              <span className="min-w-0 flex-1 truncate font-medium">
                {isLoading ? t('header.loading') : selectedUniversity?.name || t('header.selectUniversity')}
              </span>
              <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
            </>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[min(22rem,calc(100vw-2rem))] p-0">
        <Command className="bg-transparent">
          <CommandInput placeholder="Search universities…" />
          <CommandList className="max-h-[60vh]">
            <CommandEmpty>No university found.</CommandEmpty>
            {groups.map((g) => (
              <CommandGroup key={g.label} heading={g.label}>
                {g.list.map((u) => (
                  <CommandItem
                    key={u.id}
                    value={`${u.name} ${u.country}`}
                    onSelect={() => {
                      setSelectedUniversity(u);
                      setOpen(false);
                    }}
                    className="rounded-lg"
                  >
                    <div className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate font-medium">{u.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {u.country} · {u.type}
                      </span>
                    </div>
                    {selectedUniversity?.id === u.id && <Check className="h-4 w-4 text-primary" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            ))}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function UserMenu() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const { theme, setTheme } = useTheme();
  if (!user) return null;
  const name = profile?.full_name || user.email || 'Account';

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Account menu"
          className="glass-pill flex h-10 w-10 items-center justify-center text-sm font-semibold text-primary"
        >
          {initials(name) || 'U'}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="font-normal">
          <div className="truncate text-sm font-medium">{name}</div>
          <div className="truncate text-xs text-muted-foreground">{user.email}</div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            {theme === 'dark' ? <Moon className="mr-2 h-4 w-4" /> : theme === 'light' ? <Sun className="mr-2 h-4 w-4" /> : <Monitor className="mr-2 h-4 w-4" />}
            Appearance
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {[
              { v: 'light', label: 'Light', icon: Sun },
              { v: 'dark', label: 'Dark', icon: Moon },
              { v: 'system', label: 'Match device', icon: Monitor },
            ].map(({ v, label, icon: Icon }) => (
              <DropdownMenuItem key={v} onClick={() => setTheme(v)}>
                <Icon className="mr-2 h-4 w-4" />
                {label}
                {theme === v && <Check className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Globe className="mr-2 h-4 w-4" />
            {languageNames[language]}
          </DropdownMenuSubTrigger>
          <DropdownMenuSubContent>
            {LANGS.map((l) => (
              <DropdownMenuItem key={l} onClick={() => setLanguage(l)}>
                {languageNames[l]}
                {language === l && <Check className="ml-auto h-4 w-4" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuSubContent>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={async () => {
            await signOut();
            navigate('/auth');
          }}
          className="text-destructive focus:text-destructive"
        >
          <LogOut className="mr-2 h-4 w-4" />
          {t('header.signOut')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Header() {
  const { pathname } = useLocation();
  const { selectedUniversity, isMaster } = useUniversity();
  const active = groupForPath(pathname);

  return (
    <header className="sticky top-0 z-40 px-3 pt-3 md:px-4">
      <div className="glass-strong mx-auto flex h-16 max-w-[1400px] items-center gap-3 rounded-[22px] px-3 md:px-4">
        {/* Brand */}
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <span className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-primary via-blue-500 to-violet-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.45),0_6px_16px_-6px_hsl(var(--primary)/0.7)]">
            <Eye className="h-5 w-5 text-white" />
          </span>
          <span className="leading-tight">
            <span className="block text-base font-semibold tracking-tight">IRIS</span>
            <span className="hidden text-[11px] text-muted-foreground 2xl:block">
              International Relations Intelligent System
            </span>
            <span className="block text-[11px] text-muted-foreground lg:hidden">{active.label}</span>
          </span>
        </Link>

        {/* Windows — desktop segmented control */}
        <nav aria-label="Windows" className="mx-auto hidden lg:block">
          <div className="glass-pill flex items-center gap-0.5 p-1">
            {NAV_GROUPS.map((g) => {
              const isActive = g.key === active.key;
              const Icon = g.icon;
              return (
                <NavLink
                  key={g.key}
                  to={g.items[0].to}
                  className={cn(
                    'flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-all',
                    isActive ? 'glass-active text-primary' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {g.label}
                </NavLink>
              );
            })}
          </div>
        </nav>

        {/* Right cluster */}
        <div className="ml-auto flex items-center gap-2 lg:ml-0">
          {isMaster ? (
            <>
              <div className="hidden sm:block">
                <UniversitySwitcher />
              </div>
              <div className="sm:hidden">
                <UniversitySwitcher compact />
              </div>
            </>
          ) : (
            <div className="glass-pill hidden h-10 max-w-[16rem] items-center gap-2 pl-1.5 pr-3 text-sm sm:flex">
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                {selectedUniversity ? initials(selectedUniversity.name) : '—'}
              </span>
              <span className="truncate font-medium">{selectedUniversity?.name ?? '—'}</span>
            </div>
          )}
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
