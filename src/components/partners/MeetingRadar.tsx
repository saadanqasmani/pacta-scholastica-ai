/**
 * Meeting Radar — scans the connected work mailbox (IMAP) for meeting
 * requests and partnership outreach, and lists them as actionable leads.
 * Desktop-only: relies on the window.iris.mail bridge (electron/mail.mjs).
 */
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Radar,
  Loader2,
  Building2,
  Clock,
  Mail,
  Plug,
  X,
  ExternalLink,
  Pencil,
} from 'lucide-react';
import { toast } from 'sonner';
import { useUniversity } from '@/contexts/UniversityContext';
import { listLeads, setLeadStatus, syncMeetingLeads, MeetingLead } from '@/lib/meetingRadar';
import type { IrisMailConfig } from '@/types/iris-desktop';

interface MailFormState {
  host: string;
  port: string;
  user: string;
  pass: string;
}

const EMPTY_FORM: MailFormState = { host: '', port: '993', user: '', pass: '' };

export function MeetingRadar() {
  const mail = typeof window !== 'undefined' ? window.iris?.mail : undefined;
  const { universities } = useUniversity();

  const [config, setConfig] = useState<IrisMailConfig | null>(null);
  const [showSetup, setShowSetup] = useState(false);
  const [form, setForm] = useState<MailFormState>(EMPTY_FORM);
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [leads, setLeads] = useState<MeetingLead[]>([]);
  const [lastScan, setLastScan] = useState<{ scanned: number; leads: number; matched: number } | null>(null);

  const refreshConfig = useCallback(async () => {
    if (!mail) return;
    try {
      const cfg = await mail.getConfig();
      setConfig(cfg);
      setForm({
        host: cfg.host ?? '',
        port: String(cfg.port ?? 993),
        user: cfg.user ?? '',
        pass: '',
      });
    } catch {
      setConfig({ configured: false });
    }
  }, [mail]);

  const refreshLeads = useCallback(async () => {
    try {
      setLeads(await listLeads());
    } catch {
      /* table empty / db unavailable — keep current list */
    }
  }, []);

  useEffect(() => {
    refreshConfig();
    refreshLeads();
  }, [refreshConfig, refreshLeads]);

  const formInput = () => ({
    host: form.host.trim(),
    port: Number(form.port) || 993,
    secure: true,
    user: form.user.trim(),
    // Empty password keeps the stored one (edit host without retyping).
    ...(form.pass ? { pass: form.pass } : {}),
  });

  const handleTest = async () => {
    if (!mail) return;
    setIsTesting(true);
    try {
      const res = await mail.test(formInput());
      if (res.ok) toast.success(res.message || 'Connection successful.');
      else toast.error(res.message || 'Connection failed.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Connection failed.');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = async () => {
    if (!mail) return;
    setIsSaving(true);
    try {
      const res = await mail.saveConfig(formInput());
      if (res.error) {
        toast.error(res.error);
      } else {
        toast.success('Mailbox settings saved.');
        setShowSetup(false);
        await refreshConfig();
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Could not save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleScan = async () => {
    setIsScanning(true);
    try {
      const counts = await syncMeetingLeads();
      setLastScan(counts);
      await refreshLeads();
      toast.success(
        `Scanned ${counts.scanned} emails — ${counts.leads} leads (${counts.matched} matched to partners).`
      );
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Mailbox scan failed.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await setLeadStatus(id, 'dismissed');
      await refreshLeads();
    } catch {
      toast.error('Could not update the lead.');
    }
  };

  // --- Not running inside the desktop shell -------------------------------
  if (!mail) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Radar className="h-5 w-5" /> Meeting Radar
          </CardTitle>
          <CardDescription>
            Connect your work mailbox and IRIS finds meeting requests and partnership outreach for
            you. Available in the IRIS desktop app only.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Open IRIS as a desktop app to connect a mailbox.
          </p>
        </CardContent>
      </Card>
    );
  }

  const configured = Boolean(config?.configured);
  const visibleLeads = leads.filter((l) => l.status !== 'dismissed');

  const setupForm = (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="radar-host">IMAP host</Label>
          <Input
            id="radar-host"
            placeholder="imap.gmail.com"
            value={form.host}
            onChange={(e) => setForm({ ...form, host: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="radar-port">Port</Label>
          <Input
            id="radar-port"
            placeholder="993"
            inputMode="numeric"
            value={form.port}
            onChange={(e) => setForm({ ...form, port: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="radar-user">Email address</Label>
          <Input
            id="radar-user"
            type="email"
            placeholder="you@university.edu.tr"
            value={form.user}
            onChange={(e) => setForm({ ...form, user: e.target.value })}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="radar-pass">App password</Label>
          <Input
            id="radar-pass"
            type="password"
            placeholder={config?.hasPassword ? '•••••••• (unchanged)' : 'App password'}
            value={form.pass}
            onChange={(e) => setForm({ ...form, pass: e.target.value })}
          />
        </div>
      </div>
      <p className="text-xs text-muted-foreground">
        Common presets: Gmail — imap.gmail.com:993 (an app password is required, not your normal
        password) · Outlook / Microsoft 365 — outlook.office365.com:993. The password is stored
        only on this computer.
      </p>
      <div className="flex gap-2">
        <Button variant="outline" onClick={handleTest} disabled={isTesting || isSaving}>
          {isTesting ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Plug className="h-4 w-4 mr-2" />
          )}
          Test connection
        </Button>
        <Button onClick={handleSave} disabled={isSaving || isTesting}>
          {isSaving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save
        </Button>
        {configured && (
          <Button variant="ghost" onClick={() => setShowSetup(false)}>
            Cancel
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Radar className="h-5 w-5 text-primary" /> Meeting Radar
                <Badge variant="outline" className="text-xs">Beta</Badge>
              </CardTitle>
              <CardDescription className="mt-1.5">
                IRIS scans your work inbox (last 45 days) for meeting requests and partnership
                outreach and links them to your partner universities.
              </CardDescription>
            </div>
            {configured && !showSetup && (
              <Button onClick={handleScan} disabled={isScanning}>
                {isScanning ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Radar className="h-4 w-4 mr-2" />
                )}
                Scan mailbox
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {!configured || showSetup ? (
            setupForm
          ) : (
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Mail className="h-4 w-4" />
              <span>
                Connected mailbox: <span className="font-medium text-foreground">{config?.user}</span>{' '}
                ({config?.host}:{config?.port})
              </span>
              <Button variant="ghost" size="sm" onClick={() => setShowSetup(true)}>
                <Pencil className="h-3.5 w-3.5 mr-1" /> Edit
              </Button>
              {lastScan && (
                <span className="ml-auto text-xs">
                  Last scan: {lastScan.scanned} emails, {lastScan.leads} leads, {lastScan.matched}{' '}
                  matched
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {configured &&
        (visibleLeads.length > 0 ? (
          <div className="space-y-3">
            {visibleLeads.map((lead) => {
              const uni = lead.university_id
                ? universities.find((u) => u.id === lead.university_id)
                : undefined;
              return (
                <Card key={lead.id}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h4 className="font-medium">{lead.subject || '(no subject)'}</h4>
                          {uni ? (
                            <Badge className="bg-green-500/10 text-green-600">
                              <Building2 className="h-3 w-3 mr-1" />
                              {uni.name}
                            </Badge>
                          ) : (
                            <Badge variant="outline">Unmatched</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {lead.from_name ? `${lead.from_name} — ` : ''}
                          {lead.from_address}
                          {lead.email_date && (
                            <span className="ml-2 text-xs">
                              <Clock className="h-3 w-3 inline mr-1" />
                              {new Date(lead.email_date).toLocaleDateString()}
                            </span>
                          )}
                        </p>
                        {lead.snippet && (
                          <p className="text-sm text-muted-foreground mb-2">{lead.snippet}</p>
                        )}
                        {lead.proposed_times.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {lead.proposed_times.map((t, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                {t}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 shrink-0">
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-muted-foreground"
                          onClick={() => handleDismiss(lead.id)}
                        >
                          <X className="h-4 w-4 mr-1" /> Dismiss
                        </Button>
                        {uni && (
                          <Button variant="outline" size="sm" asChild>
                            <Link to="/partners">
                              <ExternalLink className="h-4 w-4 mr-1" /> Open partner
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Radar className="h-12 w-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground">
                No meeting leads yet — click "Scan mailbox" to look through the last 45 days of
                your inbox.
              </p>
            </CardContent>
          </Card>
        ))}
    </div>
  );
}
