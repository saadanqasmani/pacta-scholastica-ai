import { useUniversity } from '@/contexts/UniversityContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Building2, Users, FileText, Plane, TrendingUp, Globe } from 'lucide-react';

const Index = () => {
  const { selectedUniversity, isLoading } = useUniversity();

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Section */}
      <div className="space-y-2">
        <h1 className="text-3xl font-semibold tracking-tight">
          Governance Dashboard
        </h1>
        <p className="text-muted-foreground">
          AI-driven decision infrastructure for {selectedUniversity?.name || 'your institution'}
        </p>
      </div>

      {/* University Quick Info */}
      {selectedUniversity && (
        <Card className="border-l-4 border-l-primary">
          <CardContent className="flex items-center gap-6 py-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-primary/10">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">{selectedUniversity.name}</h2>
              <div className="flex items-center gap-3 text-sm text-muted-foreground">
                <span>{selectedUniversity.country}</span>
                <span>•</span>
                <span className="capitalize">{selectedUniversity.type}</span>
                <span>•</span>
                <span className="capitalize">{selectedUniversity.size} institution</span>
              </div>
            </div>
            <Badge 
              variant={selectedUniversity.internationalization_maturity === 'high' ? 'default' : 'secondary'}
              className="capitalize"
            >
              {selectedUniversity.internationalization_maturity} internationalization
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Partnerships
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground">via signed MOUs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending MOUs
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground">awaiting response</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Mobility Balance
            </CardTitle>
            <Plane className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground">incoming / outgoing</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Health Index
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
            <p className="text-xs text-muted-foreground">AI-generated score</p>
          </CardContent>
        </Card>
      </div>

      {/* Platform Message */}
      <Card className="bg-secondary/30">
        <CardContent className="flex items-start gap-4 py-6">
          <Globe className="mt-1 h-8 w-8 text-primary" />
          <div className="space-y-2">
            <h3 className="font-semibold">This is not a dashboard. This is governance infrastructure.</h3>
            <p className="text-sm text-muted-foreground">
              IARSMS provides AI-driven decision intelligence for international academic relations. 
              Use the "Ask AI" button to query your institutional data, discover optimal partners, 
              and receive strategic recommendations.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Index;
