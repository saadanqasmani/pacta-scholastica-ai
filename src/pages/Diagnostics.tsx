import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calculator, Gauge, History, Trash2, FlaskConical, ArrowRight, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { useUniversity } from '@/contexts/UniversityContext';
import { db, newId } from '@/lib/localdb';
import {
  computeIMGIPI,
  IMGIPIInputs,
  IMGIPIResult,
  INSTITUTION_A_EXAMPLE,
  Band,
} from '@/lib/imgIpi';

const DEFAULT_INPUTS: IMGIPIInputs = {
  item1_daysToCandidates: 30,
  item2_platformCount: 2,
  item3_documentedProcess: false,
  item4_approvalDepartments: 4,
  item5_daysToSignedMOU: 90,
  item6_initiated: 20,
  item6_signed: 14,
  item7_purposeBuiltSoftware: false,
  item8_centralisedRecords: false,
  item9_mobilityTracking: false,
  item10_nationalIntegration: false,
  item11_dashboard: false,
  item12_toolCount: 1,
  lc1_strategyDocument: false,
  lc2_dedicatedOffice: true,
  lc3_budgetLine: false,
  item13_digitalComfort: 3,
  item14_aiFamiliarity: 3,
  item15_aiTrust: 3,
  item16_aiConcern: 3,
  item17_likelihoodOfUse: 3,
  surveyRespondents: 20,
  rfStdDev: undefined,
};

interface SavedAssessment {
  id: string;
  university_id: string;
  inputs: IMGIPIInputs;
  result: IMGIPIResult;
  created_at: string;
}

function bandColor(band: Band): string {
  switch (band) {
    case 'Low':
      return 'bg-green-100 text-green-800 border-green-300';
    case 'Moderate':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'High':
      return 'bg-orange-100 text-orange-800 border-orange-300';
    case 'Critical':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'Very High':
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
  }
}

// For IPI, higher is better — color accordingly.
function ipiBandColor(band: Band): string {
  switch (band) {
    case 'Low':
      return 'bg-red-100 text-red-800 border-red-300';
    case 'Moderate':
      return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    case 'High':
      return 'bg-green-100 text-green-800 border-green-300';
    default:
      return 'bg-emerald-100 text-emerald-800 border-emerald-300';
  }
}

function NumberField({
  label,
  hint,
  value,
  onChange,
  min,
  max,
  step,
}: {
  label: string;
  hint?: string;
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <div className="space-y-1">
      <Label className="text-sm">{label}</Label>
      <Input
        type="number"
        value={Number.isFinite(value) ? value : ''}
        min={min}
        max={max}
        step={step ?? 1}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function BoolField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  value: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 py-2">
      <div>
        <Label className="text-sm">{label}</Label>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </div>
      <Switch checked={value} onCheckedChange={onChange} />
    </div>
  );
}

export default function Diagnostics() {
  const { selectedUniversity } = useUniversity();
  const [inputs, setInputs] = useState<IMGIPIInputs>(DEFAULT_INPUTS);
  const [result, setResult] = useState<IMGIPIResult | null>(null);
  const [history, setHistory] = useState<SavedAssessment[]>([]);
  const [tab, setTab] = useState('assessment');

  const set = <K extends keyof IMGIPIInputs>(key: K, value: IMGIPIInputs[K]) =>
    setInputs((prev) => ({ ...prev, [key]: value }));

  const loadHistory = useMemo(
    () => async () => {
      if (!selectedUniversity) return;
      const rows = (await db.img_ipi_assessments
        .where('university_id')
        .equals(selectedUniversity.id)
        .toArray()) as unknown as SavedAssessment[];
      setHistory(rows.sort((a, b) => b.created_at.localeCompare(a.created_at)));
    },
    [selectedUniversity]
  );

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const handleCalculate = async () => {
    const invalid =
      [
        inputs.item1_daysToCandidates,
        inputs.item2_platformCount,
        inputs.item4_approvalDepartments,
        inputs.item5_daysToSignedMOU,
        inputs.item6_initiated,
        inputs.item6_signed,
        inputs.item13_digitalComfort,
        inputs.item14_aiFamiliarity,
        inputs.item15_aiTrust,
        inputs.item16_aiConcern,
        inputs.item17_likelihoodOfUse,
      ].some((v) => !Number.isFinite(v)) || inputs.item6_signed > inputs.item6_initiated;
    if (invalid) {
      toast.error('Please fill all numeric items (signed MOUs cannot exceed initiated conversations).');
      return;
    }
    const r = computeIMGIPI(inputs);
    setResult(r);
    setTab('results');
    if (selectedUniversity) {
      const row: SavedAssessment = {
        id: newId(),
        university_id: selectedUniversity.id,
        inputs,
        result: r,
        created_at: new Date().toISOString(),
      };
      await db.img_ipi_assessments.add(row as unknown as Record<string, unknown>);
      loadHistory();
      toast.success(`Assessment saved for ${selectedUniversity.name}`);
    }
  };

  const loadExample = () => {
    setInputs(INSTITUTION_A_EXAMPLE);
    toast.info('Loaded the worked example from the research paper (Institution A).');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Gauge className="h-7 w-7 text-primary" />
          IMG/IPI Diagnostics
        </h1>
        <p className="text-muted-foreground">
          Measure your institution's internationalization gap (IMG) and its capacity to respond (IPI) —
          the 17-item institutional checklist from the research framework.
        </p>
      </div>

      {selectedUniversity && (
        <Card className="border-l-4 border-l-primary">
          <CardContent className="py-3 flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-primary" />
            Assessing: <span className="font-medium">{selectedUniversity.name}</span>
          </CardContent>
        </Card>
      )}

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="assessment">
            <Calculator className="h-4 w-4 mr-1" /> Assessment
          </TabsTrigger>
          <TabsTrigger value="results" disabled={!result}>
            <Gauge className="h-4 w-4 mr-1" /> Results
          </TabsTrigger>
          <TabsTrigger value="history">
            <History className="h-4 w-4 mr-1" /> History ({history.length})
          </TabsTrigger>
        </TabsList>

        {/* ----------------------------- ASSESSMENT ----------------------------- */}
        <TabsContent value="assessment" className="space-y-4">
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={loadExample}>
              <FlaskConical className="h-4 w-4 mr-1" /> Load worked example (Institution A)
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Information Asymmetry (IA) — Items 1–3</CardTitle>
              <CardDescription>Verified from institutional records. No survey required.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <NumberField
                label="1. Average days from faculty partner request to candidates presented"
                hint="From email logs or office records (1–365 days)"
                value={inputs.item1_daysToCandidates}
                onChange={(v) => set('item1_daysToCandidates', v)}
                min={1}
                max={365}
              />
              <NumberField
                label="2. Partner-search platforms actively used (0–10)"
                hint="IAU WHED, Erasmus+ Partner Finder, Scopus, EAIE, NAFSA, QS, THE, U-Multirank, Pivot-RP, EU Alliances"
                value={inputs.item2_platformCount}
                onChange={(v) => set('item2_platformCount', v)}
                min={0}
                max={10}
              />
              <div className="md:col-span-2">
                <BoolField
                  label="3. Documented, structured process for responding to faculty partner requests"
                  hint="Verified from office policy documents"
                  value={inputs.item3_documentedProcess}
                  onChange={(v) => set('item3_documentedProcess', v)}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workflow Fragmentation (WF) — Items 4–6</CardTitle>
              <CardDescription>Computed from MOU process documentation and signed records.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <NumberField
                label="4. Internal departments that must approve an MOU"
                hint="1–10 approving bodies"
                value={inputs.item4_approvalDepartments}
                onChange={(v) => set('item4_approvalDepartments', v)}
                min={1}
                max={10}
              />
              <NumberField
                label="5. Average calendar days from partnership request to signed MOU"
                hint="7–365 days, from signed MOU records"
                value={inputs.item5_daysToSignedMOU}
                onChange={(v) => set('item5_daysToSignedMOU', v)}
                min={7}
                max={365}
              />
              <NumberField
                label="6a. Partnership conversations initiated (past 12 months)"
                value={inputs.item6_initiated}
                onChange={(v) => set('item6_initiated', v)}
                min={0}
              />
              <NumberField
                label="6b. Of those, MOUs signed"
                hint="Abandonment rate is computed automatically"
                value={inputs.item6_signed}
                onChange={(v) => set('item6_signed', v)}
                min={0}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Digital Infrastructure (DID) — Items 7–11</CardTitle>
              <CardDescription>
                Toggle ON what your institution HAS. Each missing capability counts as a deficit.
              </CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              <BoolField
                label="7. Purpose-built software for managing international partnerships"
                hint="As the primary tool — not email, Excel or shared folders"
                value={inputs.item7_purposeBuiltSoftware}
                onChange={(v) => set('item7_purposeBuiltSoftware', v)}
              />
              <BoolField
                label="8. Centralised, searchable digital record of partnership documents"
                hint="Accessible to all staff without manual file-sharing"
                value={inputs.item8_centralisedRecords}
                onChange={(v) => set('item8_centralisedRecords', v)}
              />
              <BoolField
                label="9. Digital system for tracking student and faculty mobility"
                value={inputs.item9_mobilityTracking}
                onChange={(v) => set('item9_mobilityTracking', v)}
              />
              <BoolField
                label="10. Automatic data connection to YÖK, Erasmus+ or TÜBİTAK"
                hint="Automatic data flow — not manual entry"
                value={inputs.item10_nationalIntegration}
                onChange={(v) => set('item10_nationalIntegration', v)}
              />
              <BoolField
                label="11. Dashboard or reporting tool for partnership performance"
                value={inputs.item11_dashboard}
                onChange={(v) => set('item11_dashboard', v)}
              />
              <div className="pt-3">
                <NumberField
                  label="12. (Diagnostic only — not scored) Tools actively used, out of 5"
                  hint="Partner database, MOU tracker, mobility system, research analytics, recruitment ROI dashboard"
                  value={inputs.item12_toolCount}
                  onChange={(v) => set('item12_toolCount', v)}
                  min={0}
                  max={5}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Leadership Commitment (LC) — Items LC1–LC3</CardTitle>
              <CardDescription>Verified from institutional documents — feeds the IPI.</CardDescription>
            </CardHeader>
            <CardContent className="divide-y">
              <BoolField
                label="LC1. Formally approved internationalization strategy"
                hint="Signed by the rector or equivalent, dated within the past three years"
                value={inputs.lc1_strategyDocument}
                onChange={(v) => set('lc1_strategyDocument', v)}
              />
              <BoolField
                label="LC2. Dedicated International Relations office with ≥1 full-time staff"
                value={inputs.lc2_dedicatedOffice}
                onChange={(v) => set('lc2_dedicatedOffice', v)}
              />
              <BoolField
                label="LC3. Dedicated budget line for internationalization (current fiscal year)"
                value={inputs.lc3_budgetLine}
                onChange={(v) => set('lc3_budgetLine', v)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Faculty Readiness (RF) — Items 13–17</CardTitle>
              <CardDescription>
                Mean scores from a faculty survey (1–5 scale, minimum 20 respondents recommended) — feeds the IPI.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <NumberField
                label="13. Comfort using digital platforms"
                value={inputs.item13_digitalComfort}
                onChange={(v) => set('item13_digitalComfort', v)}
                min={1}
                max={5}
                step={0.1}
              />
              <NumberField
                label="14. Familiarity with AI-powered tools"
                value={inputs.item14_aiFamiliarity}
                onChange={(v) => set('item14_aiFamiliarity', v)}
                min={1}
                max={5}
                step={0.1}
              />
              <NumberField
                label="15. Trust in AI partner recommendations"
                value={inputs.item15_aiTrust}
                onChange={(v) => set('item15_aiTrust', v)}
                min={1}
                max={5}
                step={0.1}
              />
              <NumberField
                label="16. Concern about AI managing partnerships (reverse-scored)"
                value={inputs.item16_aiConcern}
                onChange={(v) => set('item16_aiConcern', v)}
                min={1}
                max={5}
                step={0.1}
              />
              <NumberField
                label="17. Likelihood of using a comprehensive digital platform"
                value={inputs.item17_likelihoodOfUse}
                onChange={(v) => set('item17_likelihoodOfUse', v)}
                min={1}
                max={5}
                step={0.1}
              />
              <NumberField
                label="Survey respondents (n)"
                hint="Paper recommends at least 20"
                value={inputs.surveyRespondents}
                onChange={(v) => set('surveyRespondents', v)}
                min={1}
              />
              <NumberField
                label="SD of normalized RF scores (optional)"
                hint="If provided, a 95% confidence interval for IPI is reported"
                value={inputs.rfStdDev ?? NaN}
                onChange={(v) => set('rfStdDev', Number.isFinite(v) ? v : undefined)}
                min={0}
                max={1}
                step={0.001}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button size="lg" onClick={handleCalculate}>
              <Calculator className="h-4 w-4 mr-2" /> Calculate IMG & IPI
            </Button>
          </div>
        </TabsContent>

        {/* ------------------------------- RESULTS ------------------------------- */}
        <TabsContent value="results" className="space-y-4">
          {result && (
            <>
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Internationalization Maturity Gap</CardDescription>
                    <CardTitle className="text-4xl flex items-center gap-3">
                      IMG {result.img.toFixed(3)}
                      <Badge variant="outline" className={bandColor(result.imgBand)}>
                        {result.imgBand}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    Higher IMG = larger structural gap. Bands: 0–0.25 Low · 0.26–0.50 Moderate · 0.51–0.75 High ·
                    0.76–1.0 Critical. IMG carries no standard error — all items are verified institutional facts.
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardDescription>Internationalization Potential Index</CardDescription>
                    <CardTitle className="text-4xl flex items-center gap-3">
                      IPI {result.ipi.toFixed(3)}
                      <Badge variant="outline" className={ipiBandColor(result.ipiBand)}>
                        {result.ipiBand}
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    IPI = [(LC + RF) / 2] × (1 − IMG). LC = {result.lc.toFixed(3)}, RF = {result.rf.toFixed(3)}.
                    {result.ipiCI95 && (
                      <>
                        {' '}
                        SE(IPI) = {result.seIpi?.toFixed(3)} → 95% CI [{result.ipiCI95[0].toFixed(3)},{' '}
                        {result.ipiCI95[1].toFixed(3)}].
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Dimension breakdown</CardTitle>
                </CardHeader>
                <CardContent className="space-y-5">
                  {[
                    { name: 'Information Asymmetry (IA)', dim: result.ia },
                    { name: 'Workflow Fragmentation (WF)', dim: result.wf },
                    { name: 'Digital Infrastructure Deficit (DID)', dim: result.did },
                  ].map(({ name, dim }) => (
                    <div key={name} className="space-y-2">
                      <div className="flex justify-between text-sm font-medium">
                        <span>{name}</span>
                        <span>{dim.score.toFixed(3)}</span>
                      </div>
                      <Progress value={dim.score * 100} />
                      <div className="grid gap-1 md:grid-cols-3 text-xs text-muted-foreground">
                        {dim.items.map((it) => (
                          <div key={it.id} className="flex justify-between border rounded px-2 py-1">
                            <span>
                              #{it.id} {it.label}: {it.raw}
                            </span>
                            <span className="font-mono ml-2">{it.score.toFixed(3)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-primary">
                <CardHeader>
                  <CardTitle>Institutional profile: {result.profile.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-sm">{result.profile.implication}</CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Gap diagnosis — what IRIS addresses</CardTitle>
                  <CardDescription>
                    Each diagnosed gap is mapped to the IRIS module designed to close it.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {result.gaps.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No significant gaps diagnosed — all dimensions are in the Low band.
                    </p>
                  )}
                  {result.gaps.map((gap) => (
                    <div key={gap.dimension} className="flex items-start justify-between gap-4 border rounded-lg p-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{gap.dimension}</Badge>
                          <span className="text-xs text-muted-foreground">
                            severity {gap.severity.toFixed(3)}
                          </span>
                        </div>
                        <p className="text-sm">{gap.finding}</p>
                        <p className="text-xs text-muted-foreground">{gap.irisModule}</p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={gap.irisRoute}>
                          Open <ArrowRight className="h-3 w-3 ml-1" />
                        </Link>
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* ------------------------------- HISTORY ------------------------------- */}
        <TabsContent value="history" className="space-y-3">
          {history.length === 0 && (
            <Card>
              <CardContent className="py-8 text-center text-sm text-muted-foreground">
                No saved assessments yet for this university. Complete the checklist to create one.
              </CardContent>
            </Card>
          )}
          {history.map((h) => (
            <Card key={h.id}>
              <CardContent className="py-3 flex items-center justify-between gap-4">
                <div className="text-sm">
                  <span className="font-medium">{new Date(h.created_at).toLocaleString()}</span>
                  <span className="ml-3">
                    IMG <span className="font-mono">{h.result.img.toFixed(3)}</span>{' '}
                    <Badge variant="outline" className={bandColor(h.result.imgBand)}>
                      {h.result.imgBand}
                    </Badge>
                  </span>
                  <span className="ml-3">
                    IPI <span className="font-mono">{h.result.ipi.toFixed(3)}</span>{' '}
                    <Badge variant="outline" className={ipiBandColor(h.result.ipiBand)}>
                      {h.result.ipiBand}
                    </Badge>
                  </span>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setInputs(h.inputs);
                      setResult(h.result);
                      setTab('results');
                    }}
                  >
                    View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      await db.img_ipi_assessments.delete(h.id);
                      loadHistory();
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
