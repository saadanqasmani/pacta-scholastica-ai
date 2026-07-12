/**
 * IRIS — Electron preload script.
 *
 * Exposes a minimal, typed bridge (`window.iris`) to the renderer.
 * The React app can feature-detect the desktop shell with
 * `typeof window.iris !== "undefined"` and progressively use the
 * desktop-only capabilities as they land (SQLite, Claude API,
 * Knowledge Vault). See src/types/iris-desktop.d.ts for the types.
 */
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("iris", {
  /** True whenever the app runs inside the desktop shell. */
  isDesktop: true,

  /** App version, platform and storage paths from the main process. */
  getAppInfo: () => ipcRenderer.invoke("iris:app:get-info"),

  // Future capability namespaces — handlers are registered in
  // electron/main.js as the corresponding migration steps land:
  //
  // db:    invoke("iris:db:query", ...)      — local SQLite storage
  // ai:    invoke("iris:ai:complete", ...)   — Claude API bridge
  // vault: invoke("iris:vault:search", ...)  — Knowledge Vault retrieval
});
