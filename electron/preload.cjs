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

  /** Local LLM (llama.cpp) — fully offline AI. See electron/llm.mjs. */
  ai: {
    status: () => ipcRenderer.invoke("iris:ai:status"),
    download: (id) => ipcRenderer.invoke("iris:ai:download", id),
    cancel: () => ipcRenderer.invoke("iris:ai:cancel"),
    delete: (id) => ipcRenderer.invoke("iris:ai:delete", id),
    generate: (p) => ipcRenderer.invoke("iris:ai:generate", p),
    onProgress: (cb) => {
      ipcRenderer.on("iris:ai:progress", (_event, data) => cb(data));
      return () => ipcRenderer.removeAllListeners("iris:ai:progress");
    },
  },

  // Future capability namespaces — handlers are registered in
  // electron/main.js as the corresponding migration steps land:
  //
  // db:    invoke("iris:db:query", ...)      — local SQLite storage
  // vault: invoke("iris:vault:search", ...)  — Knowledge Vault retrieval
});
