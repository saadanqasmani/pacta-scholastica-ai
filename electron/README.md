# IRIS Desktop (Electron shell)

This directory contains the Electron wrapper that turns the existing IRIS
web app into a standalone Windows desktop application. The React codebase
in `src/` is unchanged — the shell loads the same Vite build.

## Files

| File          | Purpose                                                                 |
| ------------- | ----------------------------------------------------------------------- |
| `main.js`     | Main process: window, `app://` protocol with SPA fallback, IPC handlers |
| `preload.cjs` | Context-isolated bridge exposing `window.iris` to the renderer          |

Renderer-side types for the bridge live in `src/types/iris-desktop.d.ts`.

## Commands

```sh
npm run electron:dev        # Vite dev server + Electron with hot reload
npm run electron:start      # Production build, run locally in Electron
npm run electron:build:win  # Package Windows portable .exe + installer → release/
npm run electron:build      # Package for the current OS → release/
```

> The Windows portable/NSIS targets must be built on a Windows machine
> (or a Linux machine with Wine). On Saadan's Windows laptop,
> `npm run electron:build:win` produces `release/IRIS-<version>-portable.exe`.

## How routing works without a web server

The app uses `BrowserRouter`, which normally needs a server that falls back
to `index.html` for unknown paths. `main.js` registers a privileged custom
protocol (`app://bundle/...`) that serves files from `dist/` and falls back
to `index.html` for any path that isn't a real file — so all existing routes
(`/partners`, `/mou`, …) work exactly as on the web, with no code changes.

## USB-portable mode

When packaged with the `portable` target, electron-builder sets
`PORTABLE_EXECUTABLE_DIR` at runtime. `main.js` detects this and redirects
Electron's `userData` directory to an `iris-data/` folder next to the .exe,
so all local state (and the future SQLite database) lives on the USB stick.

## Planned IPC namespaces

Handlers are registered in `main.js`; the bridge in `preload.cjs` will grow
matching methods as each migration step lands:

- `iris:db:*` — local SQLite storage (replaces Supabase)
- `iris:ai:*` — Claude API bridge (kept dormant until an API key is configured)
- `iris:vault:*` — Knowledge Vault document ingestion and retrieval

`iris:app:get-info` is live today and returns version, platform, the
`userData` path, and whether the app is running in portable mode.

## Feature detection in the React app

```ts
if (window.iris?.isDesktop) {
  const info = await window.iris.getAppInfo();
}
```

`window.iris` is `undefined` in the browser, so web deployment via Lovable
is unaffected.
