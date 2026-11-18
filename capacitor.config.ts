import type { CapacitorConfig } from '@capacitor/cli';

// IRIS for Android — the same app as the desktop build, served from the
// bundled web assets inside the APK (works offline; Claude API calls go out
// directly when the user has linked a key and is online).
const config: CapacitorConfig = {
  appId: 'app.iris.mobile',
  appName: 'IRIS',
  webDir: 'dist',
  android: {
    // Light background shown before the web view paints.
    backgroundColor: '#f3f5fb',
  },
};

export default config;
