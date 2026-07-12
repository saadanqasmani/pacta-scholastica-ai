import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Settings as SettingsIcon, Sparkles, ShieldCheck, Loader2, Plug, WifiOff } from 'lucide-react';
import { toast } from 'sonner';
import { getAIConfig, saveAIConfig, testAIConnection, AIConfig, AIProvider } from '@/lib/aiService';

const PROVIDER_INFO: Record<Exclude<AIProvider, 'none'>, { label: string; defaultModel: string; keyHint: string; keyUrl: string }> = {
  gemini: {
    label: 'Google Gemini',
    defaultModel: 'gemini-2.5-flash',
    keyHint: 'Free API key from Google AI Studio',
    keyUrl: 'https://aistudio.google.com/apikey',
  },
  openai: {
    label: 'ChatGPT (OpenAI)',
    defaultModel: 'gpt-4o-mini',
    keyHint: 'API key from the OpenAI platform',
    keyUrl: 'https://platform.openai.com/api-keys',
  },
};

export default function Settings() {
  const [config, setConfig] = useState<AIConfig>(getAIConfig());
  const [testing, setTesting] = useState(false);

  const set = <K extends keyof AIConfig>(key: K, value: AIConfig[K]) =>
    setConfig((c) => ({ ...c, [key]: value }));

  const handleProviderChange = (provider: AIProvider) => {
    setConfig((c) => ({
      ...c,
      provider,
      model: provider === 'none' ? '' : PROVIDER_INFO[provider].defaultModel,
    }));
  };

  const handleSave = () => {
    saveAIConfig(config);
    toast.success(
      config.provider === 'none'
        ? 'Using the IRIS built-in engine — all AI features work offline.'
        : `Cloud AI connected: ${PROVIDER_INFO[config.provider].label}. IRIS falls back to the built-in engine when offline.`
    );
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const res = await testAIConnection(config);
      if (res.ok) toast.success(res.message);
      else toast.error(res.message);
    } finally {
      setTesting(false);
    }
  };

  const info = config.provider !== 'none' ? PROVIDER_INFO[config.provider] : null;

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <SettingsIcon className="h-7 w-7 text-primary" />
          Settings
        </h1>
        <p className="text-muted-foreground">Configure how IRIS works on this computer.</p>
      </div>

      <Card className="border-l-4 border-l-primary">
        <CardContent className="py-3 flex items-center gap-2 text-sm">
          <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
          IRIS has its own built-in analysis engine: every AI feature (Ask AI, health analysis, partner
          recommendations, MOU suggestions) works completely offline using your local data. Connecting a
          cloud provider below is optional — it upgrades the answers when you have internet, and IRIS
          automatically falls back to the built-in engine whenever the cloud is unavailable.
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" /> AI assistant
          </CardTitle>
          <CardDescription>
            Optionally link ChatGPT or Google Gemini with your own API key. The key is stored only on this
            computer. Gemini offers a free tier — recommended if you don't want to pay.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label>Provider</Label>
            <Select value={config.provider} onValueChange={(v) => handleProviderChange(v as AIProvider)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">
                  <span className="flex items-center gap-2">
                    <WifiOff className="h-4 w-4" /> IRIS built-in engine — offline (default)
                  </span>
                </SelectItem>
                <SelectItem value="gemini">Google Gemini (free tier available)</SelectItem>
                <SelectItem value="openai">ChatGPT (OpenAI)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {info && (
            <>
              <div className="space-y-1">
                <Label>API key</Label>
                <Input
                  type="password"
                  value={config.apiKey}
                  onChange={(e) => set('apiKey', e.target.value)}
                  placeholder="Paste your API key"
                />
                <p className="text-xs text-muted-foreground">
                  {info.keyHint} —{' '}
                  <a href={info.keyUrl} target="_blank" rel="noreferrer" className="underline">
                    {info.keyUrl}
                  </a>
                </p>
              </div>
              <div className="space-y-1">
                <Label>Model</Label>
                <Input
                  value={config.model}
                  onChange={(e) => set('model', e.target.value)}
                  placeholder={info.defaultModel}
                />
                <p className="text-xs text-muted-foreground">
                  Leave as <Badge variant="outline">{info.defaultModel}</Badge> unless you know you want a
                  different model.
                </p>
              </div>
            </>
          )}

          <div className="flex gap-2 justify-end">
            {info && (
              <Button variant="outline" onClick={handleTest} disabled={testing || !config.apiKey}>
                {testing ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <Plug className="h-4 w-4 mr-1" />
                )}
                Test connection
              </Button>
            )}
            <Button onClick={handleSave}>Save</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
