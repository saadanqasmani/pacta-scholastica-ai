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

export interface IrisDesktopBridge {
  isDesktop: true;
  getAppInfo: () => Promise<IrisAppInfo>;
}

declare global {
  interface Window {
    iris?: IrisDesktopBridge;
  }
}
