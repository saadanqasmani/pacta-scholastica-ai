import { Eye, ChevronDown, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useUniversity } from '@/contexts/UniversityContext';
import { ScrollArea } from '@/components/ui/scroll-area';

export function Header() {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { selectedUniversity, setSelectedUniversity, universities, isLoading } = useUniversity();

  const turkishUniversities = universities.filter(u => u.country === 'Türkiye');
  const internationalUniversities = universities.filter(u => u.country !== 'Türkiye');

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        {/* Logo and Title */}
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary">
            <Eye className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">IRIS</h1>
            <p className="text-xs text-muted-foreground">International Relations Intelligent System</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* University Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="min-w-[280px] justify-between" disabled={isLoading}>
                <span className="flex items-center gap-2 truncate">
                  <span className="text-xs text-muted-foreground">Viewing as:</span>
                  <span className="font-medium">
                    {isLoading ? 'Loading...' : selectedUniversity?.name || 'Select University'}
                  </span>
                </span>
                <ChevronDown className="h-4 w-4 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[320px]">
              <ScrollArea className="h-[400px]">
                <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Turkish Universities
                </DropdownMenuLabel>
                {turkishUniversities.map((university) => (
                  <DropdownMenuItem
                    key={university.id}
                    onClick={() => setSelectedUniversity(university)}
                    className={selectedUniversity?.id === university.id ? 'bg-secondary' : ''}
                  >
                    <span className="flex flex-col">
                      <span className="font-medium">{university.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {university.type} • {university.size}
                      </span>
                    </span>
                  </DropdownMenuItem>
                ))}
                
                <DropdownMenuSeparator />
                
                <DropdownMenuLabel className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  International Universities
                </DropdownMenuLabel>
                {internationalUniversities.map((university) => (
                  <DropdownMenuItem
                    key={university.id}
                    onClick={() => setSelectedUniversity(university)}
                    className={selectedUniversity?.id === university.id ? 'bg-secondary' : ''}
                  >
                    <span className="flex flex-col">
                      <span className="font-medium">{university.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {university.country} • {university.type}
                      </span>
                    </span>
                  </DropdownMenuItem>
                ))}
              </ScrollArea>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <span className="text-sm">{profile?.full_name || user.email}</span>
                  <ChevronDown className="h-3 w-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>{user.email}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sign Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </header>
  );
}
