import { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Building2, Upload, FileText, X, Loader2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { db, newId } from '@/lib/localdb';
import { ingestFile } from '@/lib/libraryIndex';

const REGIONS = [
  'Marmara',
  'Central Anatolia',
  'Aegean',
  'Mediterranean',
  'Black Sea',
  'Eastern Anatolia',
  'Southeastern Anatolia',
  'Europe',
  'North America',
  'Asia',
  'Middle East',
  'Africa',
  'Latin America',
  'Oceania',
];

export default function AddUniversity() {
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);
  const [saving, setSaving] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [form, setForm] = useState({
    name: '',
    country: 'Turkey',
    region: 'Marmara',
    type: 'public',
    size: 'medium',
    internationalization_maturity: 'medium',
    founded_year: '',
    website: '',
    ranking: '',
    research_strengths: '',
    accreditations: '',
    notes: '',
  });

  const set = (key: keyof typeof form, value: string) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast.error('University name is required.');
      return;
    }
    setSaving(true);
    try {
      const id = newId();
      const now = new Date().toISOString();
      await db.universities.add({
        id,
        name: form.name.trim(),
        country: form.country.trim() || 'Turkey',
        region: form.region,
        type: form.type,
        size: form.size,
        internationalization_maturity: form.internationalization_maturity,
        ranking: form.ranking ? Number(form.ranking) : null,
        educational_union: 'Erasmus+',
        journals: [],
        research_strengths: form.research_strengths
          ? form.research_strengths.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        accreditations: form.accreditations
          ? form.accreditations.split(',').map((s) => s.trim()).filter(Boolean)
          : [],
        founded_year: form.founded_year ? Number(form.founded_year) : null,
        website: form.website.trim() || null,
        created_at: now,
        updated_at: now,
      });

      // Free-text notes become a searchable library document for this university.
      if (form.notes.trim()) {
        const notesFile = new File([form.notes], `${form.name.trim()} — notes.txt`, {
          type: 'text/plain',
        });
        await ingestFile(notesFile, { universityId: id, title: `${form.name.trim()} — profile notes` });
      }

      let ingested = 0;
      for (const file of files) {
        try {
          await ingestFile(file, { universityId: id });
          ingested++;
        } catch (e) {
          toast.error(e instanceof Error ? e.message : `Could not read ${file.name}`);
        }
      }

      toast.success(
        `${form.name.trim()} added${ingested > 0 ? ` with ${ingested} document${ingested > 1 ? 's' : ''} in the Data Library` : ''}.`
      );
      navigate('/partners');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to save university');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Building2 className="h-7 w-7 text-primary" />
          Add University
        </h1>
        <p className="text-muted-foreground">
          Create a new university profile. Attach documents with the university's information — they are
          parsed into the Data Library and become searchable immediately.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Basic information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-1 md:col-span-2">
            <Label>University name *</Label>
            <Input value={form.name} onChange={(e) => set('name', e.target.value)} placeholder="e.g. Example University" />
          </div>
          <div className="space-y-1">
            <Label>Country</Label>
            <Input value={form.country} onChange={(e) => set('country', e.target.value)} />
          </div>
          <div className="space-y-1">
            <Label>Region</Label>
            <Select value={form.region} onValueChange={(v) => set('region', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {REGIONS.map((r) => (
                  <SelectItem key={r} value={r}>
                    {r}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Type</Label>
            <Select value={form.type} onValueChange={(v) => set('type', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="public">Public</SelectItem>
                <SelectItem value="private">Private / Foundation</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Size</Label>
            <Select value={form.size} onValueChange={(v) => set('size', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="small">Small (&lt; 15,000 students)</SelectItem>
                <SelectItem value="medium">Medium (15,000–40,000)</SelectItem>
                <SelectItem value="large">Large (&gt; 40,000)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1">
            <Label>Internationalization maturity</Label>
            <Select
              value={form.internationalization_maturity}
              onValueChange={(v) => set('internationalization_maturity', v)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Tip: run an IMG/IPI assessment later for an evidence-based value.
            </p>
          </div>
          <div className="space-y-1">
            <Label>Founded year</Label>
            <Input
              type="number"
              value={form.founded_year}
              onChange={(e) => set('founded_year', e.target.value)}
              placeholder="e.g. 1956"
            />
          </div>
          <div className="space-y-1">
            <Label>National ranking (optional)</Label>
            <Input
              type="number"
              value={form.ranking}
              onChange={(e) => set('ranking', e.target.value)}
              placeholder="e.g. 12"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label>Website</Label>
            <Input
              value={form.website}
              onChange={(e) => set('website', e.target.value)}
              placeholder="https://www.example.edu"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label>Research strengths (comma-separated)</Label>
            <Input
              value={form.research_strengths}
              onChange={(e) => set('research_strengths', e.target.value)}
              placeholder="Engineering, Medicine, Social Sciences"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label>Accreditations (comma-separated)</Label>
            <Input
              value={form.accreditations}
              onChange={(e) => set('accreditations', e.target.value)}
              placeholder="ABET, AACSB, MÜDEK"
            />
          </div>
          <div className="space-y-1 md:col-span-2">
            <Label>Profile notes (optional — becomes searchable in the Data Library)</Label>
            <Textarea
              rows={4}
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              placeholder="Anything worth knowing: partnership history, contacts, admission specifics…"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Attach documents</CardTitle>
          <CardDescription>
            PDF, Word, text, Markdown, CSV, JSON or HTML files with the university's information. They are
            indexed into the Data Library, linked to this university.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            ref={fileInput}
            type="file"
            multiple
            accept=".pdf,.docx,.txt,.md,.csv,.json,.html,.htm"
            className="hidden"
            onChange={(e) => {
              if (e.target.files) setFiles((f) => [...f, ...Array.from(e.target.files!)]);
              if (fileInput.current) fileInput.current.value = '';
            }}
          />
          <Button variant="outline" onClick={() => fileInput.current?.click()}>
            <Upload className="h-4 w-4 mr-1" /> Choose files
          </Button>
          {files.length > 0 && (
            <div className="space-y-1">
              {files.map((f, i) => (
                <div key={i} className="flex items-center justify-between text-sm border rounded px-3 py-1.5">
                  <span className="flex items-center gap-2 min-w-0">
                    <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                    <span className="truncate">{f.name}</span>
                    <Badge variant="outline">{(f.size / 1024).toFixed(0)} KB</Badge>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setFiles((arr) => arr.filter((_, j) => j !== i))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => navigate(-1)}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}
          Add university
        </Button>
      </div>
    </div>
  );
}
