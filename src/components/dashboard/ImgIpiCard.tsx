import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Gauge, ArrowRight } from 'lucide-react';
import { useUniversity } from '@/contexts/UniversityContext';
import { db } from '@/lib/localdb';
import type { IMGIPIResult } from '@/lib/imgIpi';

interface SavedAssessment {
  id: string;
  university_id: string;
  result: IMGIPIResult;
  created_at: string;
}

/** Dashboard card: latest IMG/IPI diagnosis for the selected university,
 *  with each gap linked to the IRIS module that addresses it. */
export function ImgIpiCard() {
  const { selectedUniversity } = useUniversity();
  const [latest, setLatest] = useState<SavedAssessment | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!selectedUniversity) return;
      const rows = (await db.img_ipi_assessments
        .where('university_id')
        .equals(selectedUniversity.id)
        .toArray()) as unknown as SavedAssessment[];
      if (!cancelled) {
        setLatest(
          rows.sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null
        );
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedUniversity]);

  if (!latest) {
    return (
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-base">
            <Gauge className="h-5 w-5 text-primary" /> IMG/IPI Diagnostics
          </CardTitle>
          <CardDescription>
            Measure your internationalization gap and see exactly which IRIS modules close it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild size="sm">
            <Link to="/diagnostics">
              Run the 17-item assessment <ArrowRight className="h-3 w-3 ml-1" />
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const r = latest.result;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-primary" /> IMG/IPI Diagnostics
          </span>
          <span className="text-xs font-normal text-muted-foreground">
            {new Date(latest.created_at).toLocaleDateString()}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{r.img.toFixed(3)}</span>
              <Badge variant="secondary">IMG · {r.imgBand}</Badge>
            </div>
            <Progress value={r.img * 100} className="mt-1 h-1.5" />
          </div>
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold">{r.ipi.toFixed(3)}</span>
              <Badge variant="secondary">IPI · {r.ipiBand}</Badge>
            </div>
            <Progress value={r.ipi * 100} className="mt-1 h-1.5" />
          </div>
        </div>

        <p className="text-xs text-muted-foreground">{r.profile.title}</p>

        {r.gaps.slice(0, 3).map((gap) => (
          <Link
            key={gap.dimension}
            to={gap.irisRoute}
            className="flex items-center justify-between text-sm border rounded-md px-3 py-1.5 hover:bg-secondary transition-colors"
          >
            <span className="flex items-center gap-2 min-w-0">
              <Badge variant="outline">{gap.dimension}</Badge>
              <span className="truncate text-xs">{gap.irisModule}</span>
            </span>
            <ArrowRight className="h-3 w-3 shrink-0" />
          </Link>
        ))}

        <Button asChild variant="outline" size="sm" className="w-full">
          <Link to="/diagnostics">Full diagnosis</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
