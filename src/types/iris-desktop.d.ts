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

export interface IrisDesktopBridge {
  isDesktop: true;
  getAppInfo: () => Promise<IrisAppInfo>;
  ai?: IrisAIBridge;
}

declare global {
  interface Window {
    iris?: IrisDesktopBridge;
  }
}
