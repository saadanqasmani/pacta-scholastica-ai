/**
 * IRIS — Electron main process.
 *
 * Wraps the existing Vite/React SPA in a desktop shell.
 * The renderer is served through a custom `app://` protocol with an
 * SPA fallback, so the existing BrowserRouter routes keep working
 * exactly as they do on the web — no changes to the React codebase.
 */
import { app, BrowserWindow, protocol, net, shell, ipcMain } from "electron";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const APP_SCHEME = "app";
const DIST_DIR = path.join(__dirname, "..", "dist");

// In development, point Electron at the Vite dev server instead of dist/.
// Started via `npm run electron:dev`, which sets ELECTRON_START_URL.
const DEV_SERVER_URL = process.env.ELECTRON_START_URL;

// The app:// scheme must be registered as privileged before app is ready,
// otherwise fetch/XHR, localStorage and ES modules won't work under it.
protocol.registerSchemesAsPrivileged([
  {
    scheme: APP_SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

// USB-portable mode: when packaged as a portable exe, keep all user data
// (and later the SQLite database) next to the executable so the whole app
// travels on the stick. PORTABLE_EXECUTABLE_DIR is set by electron-builder's
// portable target at runtime.
const portableDir = process.env.PORTABLE_EXECUTABLE_DIR;
if (portableDir) {
  app.setPath("userData", path.join(portableDir, "iris-data"));
}

/**
 * Serve files from dist/ for app:// requests. Any path that doesn't match a
 * real file falls back to index.html so client-side routing (BrowserRouter)
 * handles it — same behaviour as an SPA-aware web server.
 */
function registerAppProtocol() {
  protocol.handle(APP_SCHEME, (request) => {
    const { pathname } = new URL(request.url);
    const relativePath = decodeURIComponent(pathname).replace(/^\/+/, "");
    const filePath = path.normalize(path.join(DIST_DIR, relativePath));

    // Never serve anything outside dist/.
    const isInsideDist =
      filePath === DIST_DIR || filePath.startsWith(DIST_DIR + path.sep);
    const target =
      isInsideDist && fs.existsSync(filePath) && fs.statSync(filePath).isFile()
        ? filePath
        : path.join(DIST_DIR, "index.html");

    return net.fetch(pathToFileURL(target).toString());
  });
}

function createMainWindow() {
  const win = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    show: false,
    autoHideMenuBar: true,
    title: "IRIS - International Relations Intelligent System",
    backgroundColor: "#ffffff",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  win.once("ready-to-show", () => win.show());

  // Open external links (e.g. partner university websites) in the
  // system browser, never inside the desktop shell.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });

  if (DEV_SERVER_URL) {
    win.loadURL(DEV_SERVER_URL);
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadURL(`${APP_SCHEME}://bundle/`);
  }

  return win;
}

// --- IPC handlers -----------------------------------------------------------
// Channels consumed by electron/preload.cjs. The data and AI layers land in
// later migration steps and will register their handlers here:
//   iris:db:*      → local SQLite storage (replaces Supabase)
//   iris:ai:*      → Claude API bridge (activates once an API key is set)
//   iris:vault:*   → Knowledge Vault document ingestion / retrieval

ipcMain.handle("iris:app:get-info", () => ({
  version: app.getVersion(),
  platform: process.platform,
  userDataPath: app.getPath("userData"),
  portable: Boolean(portableDir),
}));

// ----------------------------------------------------------------------------

const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    const [win] = BrowserWindow.getAllWindows();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    if (!DEV_SERVER_URL) registerAppProtocol();
    createMainWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}

