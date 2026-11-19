/**
 * Android (Capacitor) integration. No-ops on desktop and in the browser.
 * - Hardware back button walks back through IRIS screens, and only closes
 *   the app from the dashboard.
 * - Status bar colour follows the light/dark theme.
 */
import { Capacitor } from '@capacitor/core';

export function isNativeApp(): boolean {
  return Capacitor.isNativePlatform();
}

export async function initNativeShell(): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { App } = await import('@capacitor/app');
    await App.addListener('backButton', ({ canGoBack }) => {
      const atHome = window.location.pathname === '/' || window.location.pathname === '/auth';
      if (canGoBack && !atHome) window.history.back();
      else App.exitApp();
    });
  } catch (err) {
    console.warn('[IRIS] Back-button integration unavailable:', err);
  }
}

export async function syncStatusBar(dark: boolean): Promise<void> {
  if (!isNativeApp()) return;
  try {
    const { StatusBar, Style } = await import('@capacitor/status-bar');
    await StatusBar.setStyle({ style: dark ? Style.Dark : Style.Light });
    await StatusBar.setBackgroundColor({ color: dark ? '#0b0f1a' : '#f3f5fb' });
  } catch (err) {
    console.warn('[IRIS] Status bar integration unavailable:', err);
  }
}
