import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Gauge, ArrowRight, TrendingDown } from 'lucide-react';
import { useUniversity } from '@/contexts/UniversityContext';
import { db } from '@/lib/localdb';
import { computeIMGIPI, type IMGIPIInputs, type IMGIPIResult } from '@/lib/imgIpi';
import { INTERVENTIONS } from '@/lib/imgIpiForecast';

/** Which IMG/IPI concern each module page addresses, and which single
 *  intervention best represents "fully adopting this module". */
const ROUTE_FOCUS: Record<
  string,
  { dimension: 'IA' | 'WF' | 'DID' | 'LC'; label: string; interventionId: string }
> = {
  '/partners': { dimension: 'IA', label: 'Information Asymmetry', interventionId: 'item1-response' },
  '/mou': { dimension: 'WF', label: 'Workflow Fragmentation', interventionId: 'item5-mou-cycle' },
  '/partnerships': { dimension: 'WF', label: 'Workflow Fragmentation', interventionId: 'item5-mou-cycle' },
  '/mobility': { dimension: 'DID', label: 'Digital Infrastructure', interventionId: 'item9-mobility' },
  '/documentation': { dimension: 'DID', label: 'Digital Infrastructure', interventionId: 'item8-records' },
  '/library': { dimension: 'DID', label: 'Digital Infrastructure', interventionId: 'item8-records' },
  '/partner-analytics': { dimension: 'DID', label: 'Digital Infrastructure', interventionId: 'item11-dashboard' },
};

interface Latest {
  inputs: IMGIPIInputs;
  result: IMGIPIResult;
}

/** Slim, route-aware banner that keeps the IMG/IPI framework visible inside
 *  every operational module: current gap, the dimension this module
 *  addresses, and the projected effect of fully adopting it. */
export function ImgIpiStrip() {
  const { pathname } = useLocation();
  const { selectedUniversity } = useUniversity();
  const [latest, setLatest] = useState<Latest | null>(null);

  const focus = ROUTE_FOCUS[pathname];

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!selectedUniversity || !focus) return;
      const rows = (await db.img_ipi_assessments
        .where('university_id')
        .equals(selectedUniversity.id)
        .toArray()) as unknown as (Latest & { created_at: string })[];
      rows.sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));
      if (!cancelled) setLatest(rows[0] ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, [selectedUniversity, focus, pathname]);

  if (!focus) return null;

  if (!latest) {
    return (
      <div className="border-b bg-primary/5">
        <div className="container flex items-center gap-2 py-1.5 text-xs text-muted-foreground">
          <Gauge className="h-3.5 w-3.5 text-primary" />
          <span>
            This module addresses <span className="font-medium">{focus.label}</span> in the IMG/IPI
            framework.
          </span>
          <Link to="/diagnostics" className="ml-auto flex items-center gap-1 text-primary hover:underline">
            Run an assessment to measure your gap <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    );
  }

  const r = latest.result;
  const dimScore =
    focus.dimension === 'IA'
      ? r.ia.score
      : focus.dimension === 'WF'
        ? r.wf.score
        : focus.dimension === 'DID'
          ? r.did.score
          : 1 - r.lc;

  const intervention = INTERVENTIONS.find((iv) => iv.id === focus.interventionId);
  let delta: number | null = null;
  if (intervention && intervention.applicable(latest.inputs)) {
    delta = Math.round((computeIMGIPI(intervention.apply(latest.inputs)).img - r.img) * 1000) / 1000;
  }

  return (
    <div className="border-b bg-primary/5">
      <div className="container flex flex-wrap items-center gap-x-3 gap-y-1 py-1.5 text-xs">
        <span className="flex items-center gap-1.5 font-medium">
          <Gauge className="h-3.5 w-3.5 text-primary" />
          IMG {r.img.toFixed(3)}
          <Badge variant="outline" className="h-4 px-1 text-[10px]">
            {r.imgBand}
          </Badge>
        </span>
        <span className="text-muted-foreground">
          This module addresses <span className="font-medium text-foreground">{focus.label}</span>{' '}
          (your {focus.dimension} score: {dimScore.toFixed(3)})
        </span>
        {delta !== null && delta < 0 && (
          <span className="flex items-center gap-1 text-green-700">
            <TrendingDown className="h-3.5 w-3.5" />
            full adoption projected: IMG {delta.toFixed(3)}
          </span>
        )}
        <Link
          to="/diagnostics"
          className="ml-auto flex items-center gap-1 text-primary hover:underline"
        >
          Full diagnosis <ArrowRight className="h-3 w-3" />
        </Link>
      </div>
    </div>
  );
}
