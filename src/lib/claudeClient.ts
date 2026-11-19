/**
 * Claude API client for IRIS.
 *
 * Runs directly from the app (desktop, browser or the Android WebView) with
 * the user's own API key, which is stored only on their device. The SDK is
 * loaded lazily so it costs nothing until Claude is actually used.
 *
 * Defaults follow current API guidance: Claude Opus 5.5, adaptive thinking
 * (always on for this model family), effort set explicitly, and server-side
 * refusal fallbacks enabled on the models that support them.
 */
import type Anthropic from '@anthropic-ai/sdk';
import type { BetaMessage, BetaMessageParam } from '@anthropic-ai/sdk/resources/beta/messages/messages';

export interface ClaudeModelOption {
  id: string;
  label: string;
  detail: string;
}

/** Models offered in Settings. Opus 5.5 is the default; the choice is the user's. */
export const CLAUDE_MODELS: ClaudeModelOption[] = [
  {
    id: 'claude-opus-5-5',
    label: 'Claude Opus 5.5 — most capable (default)',
    detail: 'Best analysis and recommendations · $4 / $20 per million tokens',
  },
  {
    id: 'claude-sonnet-5-5',
    label: 'Claude Sonnet 5.5 — fast and capable',
    detail: 'Quicker answers at half the price · $2 / $10 per million tokens',
  },
  {
    id: 'claude-haiku-5-5',
    label: 'Claude Haiku 5.5 — fastest, lowest cost',
    detail: 'Instant replies for simple questions · $0.10 / $0.50 per million tokens',
  },
];

export const DEFAULT_CLAUDE_MODEL = 'claude-opus-5-5';

/** Models that accept the server-side refusal fallback ("default" routing). */
const FALLBACK_CAPABLE = new Set(['claude-opus-5-5', 'claude-sonnet-5-5']);

export type ClaudeTurn = BetaMessageParam;

export interface ClaudeRequest {
  apiKey: string;
  model: string;
  system: string;
  messages: ClaudeTurn[];
  /** Output ceiling; adaptive thinking counts toward it, so keep it generous. */
  maxTokens?: number;
  effort?: 'low' | 'medium' | 'high' | 'xhigh' | 'max';
}

/** Thrown when Claude declines a request (stop_reason "refusal"). */
export class ClaudeRefusalError extends Error {
  constructor(public category: string | null) {
    super('Claude declined this request.');
    this.name = 'ClaudeRefusalError';
  }
}

let sdkPromise: Promise<typeof import('@anthropic-ai/sdk')> | null = null;
const loadSdk = () => (sdkPromise ??= import('@anthropic-ai/sdk'));

async function client(apiKey: string): Promise<Anthropic> {
  const { default: AnthropicCtor } = await loadSdk();
  return new AnthropicCtor({
    apiKey,
    // The key belongs to the person using this app and lives only on their
    // device; requests go straight from the app to Anthropic.
    dangerouslyAllowBrowser: true,
    maxRetries: 2,
  });
}

function params(req: ClaudeRequest) {
  return {
    model: req.model,
    max_tokens: Math.max(1024, req.maxTokens ?? 16000),
    system: req.system,
    messages: req.messages,
    output_config: { effort: req.effort ?? 'medium' },
    ...(FALLBACK_CAPABLE.has(req.model)
      ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const }
      : {}),
  };
}

function textOf(message: BetaMessage): string {
  if (message.stop_reason === 'refusal') {
    const details = (message as { stop_details?: { category?: string | null } | null }).stop_details;
    throw new ClaudeRefusalError(details?.category ?? null);
  }
  const text = message.content
    .filter((b): b is Extract<typeof b, { type: 'text' }> => b.type === 'text')
    .map((b) => b.text)
    .join('')
    .trim();
  if (!text) throw new Error('Claude returned an empty response.');
  return text;
}

/** One complete response (used for structured analyses that return JSON). */
export async function claudeComplete(req: ClaudeRequest): Promise<string> {
  const c = await client(req.apiKey);
  const message = await c.beta.messages.create(params(req));
  return textOf(message);
}

/** Streamed response: `onText` receives each text delta as it arrives. */
export async function claudeStream(
  req: ClaudeRequest,
  onText: (delta: string) => void
): Promise<string> {
  const c = await client(req.apiKey);
  const stream = c.beta.messages.stream(params(req));
  stream.on('text', (delta) => onText(delta));
  const message = await stream.finalMessage();
  return textOf(message);
}

/** Translate SDK errors into a sentence a non-developer can act on. */
export async function describeClaudeError(err: unknown): Promise<string> {
  if (err instanceof ClaudeRefusalError) {
    return 'Claude declined this request. Try rephrasing it.';
  }
  const { default: A } = await loadSdk();
  if (err instanceof A.AuthenticationError) {
    return 'The Claude API key was rejected. Check that it was copied completely in Settings.';
  }
  if (err instanceof A.PermissionDeniedError) {
    return 'This API key does not have access to the selected model. Pick another model in Settings.';
  }
  if (err instanceof A.NotFoundError) {
    return 'The selected Claude model was not found for this key. Pick another model in Settings.';
  }
  if (err instanceof A.RateLimitError) {
    return 'Claude rate limit reached. Wait a moment, or check the plan limits in the Claude Console.';
  }
  if (err instanceof A.BadRequestError) {
    return /credit|billing|balance/i.test(err.message)
      ? 'The Claude account has no remaining credit. Add credit in the Claude Console (Plans & Billing).'
      : `Claude rejected the request: ${err.message}`;
  }
  if (err instanceof A.APIConnectionError) {
    return 'Could not reach Claude. Check the internet connection.';
  }
  if (err instanceof A.APIError) {
    return `Claude is temporarily unavailable (error ${err.status ?? 'unknown'}). Try again shortly.`;
  }
  return err instanceof Error ? err.message : 'Claude request failed.';
}
