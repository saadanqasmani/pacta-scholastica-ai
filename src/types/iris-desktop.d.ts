/**
 * Types for the desktop bridge exposed by electron/preload.cjs.
 * `window.iris` only exists when the app runs inside the Electron shell;
 * in the browser it is undefined, so always feature-detect before use.
 */
export interface IrisAppInfo {
  version: string;
  platform: NodeJS.Platform;
  userDataPath: string;
  portable: boolean;
}

/** One selectable local model tier (see MODEL_TIERS in electron/llm.mjs). */
export interface IrisAITier {
  id: string;
  label: string;
  file: string;
  ram: string;
}

export interface IrisAIInstalledModel {
  id: string;
  file: string;
  sizeBytes: number;
}

export interface IrisAIDownloadProgress {
  id: string;
  pct: number;
  received: number;
  total: number;
}

export interface IrisAIStatus {
  available: boolean;
  /** Present when available === false (e.g. native module failed to load). */
  reason?: string;
  installed?: IrisAIInstalledModel[];
  active?: string | null;
  downloading?: IrisAIDownloadProgress | null;
  totalRamGB?: number;
  modelsDir?: string;
  tiers?: IrisAITier[];
}

export interface IrisAIGenerateResult {
  text?: string;
  error?: string;
}

export interface IrisAIBridge {
  status: () => Promise<IrisAIStatus>;
  download: (id: string) => Promise<{ ok?: boolean; error?: string }>;
  cancel: () => Promise<{ ok?: boolean; error?: string }>;
  delete: (id: string) => Promise<{ ok?: boolean; error?: string }>;
  generate: (p: {
    system?: string;
    prompt: string;
    maxTokens?: number;
  }) => Promise<IrisAIGenerateResult>;
  /** Subscribe to download progress; returns an unsubscribe function. */
  onProgress: (cb: (data: IrisAIDownloadProgress) => void) => () => void;
}

/** Mailbox connection settings as seen by the renderer (password redacted). */
export interface IrisMailConfig {
  configured: boolean;
  host?: string;
  port?: number;
  secure?: boolean;
  user?: string;
  /** The password itself never crosses the bridge. */
  hasPassword?: boolean;
  error?: string;
}

/** Settings sent to save/test; pass may be omitted to keep the stored one. */
export interface IrisMailConfigInput {
  host: string;
  port: number;
  secure?: boolean;
  user: string;
  /** IMAP app password (OAuth support comes later). */
  pass?: string;
}

/** One classified meeting/partnership email found by a mailbox scan. */
export interface IrisMailLead {
  from: { name: string; address: string };
  subject: string;
  date: string | null;
  snippet: string;
  /** Raw datetime-looking strings found in the body ("next Tuesday", "12 May"…). */
  proposedTimes: string[];
}

export interface IrisMailScanResult {
  ok?: boolean;
  scanned?: number;
  leads?: IrisMailLead[];
  error?: string;
}

export interface IrisMailBridge {
  getConfig: () => Promise<IrisMailConfig>;
  saveConfig: (cfg: IrisMailConfigInput) => Promise<{ ok?: boolean; error?: string }>;
  test: (cfg: IrisMailConfigInput) => Promise<{ ok: boolean; message: string }>;
  scan: () => Promise<IrisMailScanResult>;
}

export interface IrisDesktopBridge {
  isDesktop: true;
  getAppInfo: () => Promise<IrisAppInfo>;
  ai?: IrisAIBridge;
  mail?: IrisMailBridge;
}

declare global {
  interface Window {
    iris?: IrisDesktopBridge;
  }
}
