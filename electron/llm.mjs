/**
 * IRIS — local LLM manager (llama.cpp via node-llama-cpp v3).
 *
 * Runs a genuine language model fully offline inside the Electron main
 * process. Models (GGUF files) are downloaded once into
 * `<userData>/models/` and loaded lazily on first use. Every public
 * method is guarded: LLM problems must never crash the app — errors are
 * returned as data ({ error }) and the renderer falls back to the
 * deterministic IRIS engine.
 *
 * Imported lazily from electron/main.js so a broken native module can
 * never block app boot.
 */
import path from "node:path";
import fs from "node:fs";
import os from "node:os";
import https from "node:https";
import { app } from "electron";

/** A GGUF smaller than this is a partial/failed download, not a model. */
const MIN_VALID_BYTES = 100 * 1024 * 1024; // 100 MB

export const MODEL_TIERS = [
  {
    id: "qwen2.5-1.5b",
    label: "Fast (1.5B, ~1.1 GB, any laptop)",
    url: "https://huggingface.co/Qwen/Qwen2.5-1.5B-Instruct-GGUF/resolve/main/qwen2.5-1.5b-instruct-q4_k_m.gguf",
    file: "qwen2.5-1.5b-instruct-q4_k_m.gguf",
    ram: "4 GB",
  },
  {
    id: "qwen2.5-3b",
    label: "Balanced (3B, ~2.0 GB, most laptops)",
    url: "https://huggingface.co/Qwen/Qwen2.5-3B-Instruct-GGUF/resolve/main/qwen2.5-3b-instruct-q4_k_m.gguf",
    file: "qwen2.5-3b-instruct-q4_k_m.gguf",
    ram: "6 GB",
  },
  {
    id: "qwen2.5-7b",
    label: "Full (7B, ~4.7 GB, 8+ GB RAM) — recommended",
    url: "https://huggingface.co/Qwen/Qwen2.5-7B-Instruct-GGUF/resolve/main/qwen2.5-7b-instruct-q4_k_m.gguf",
    file: "qwen2.5-7b-instruct-q4_k_m.gguf",
    ram: "8 GB",
  },
];

const TIER_FILES = new Set(MODEL_TIERS.map((t) => t.file));

export class LocalLLMManager {
  constructor() {
    this.modelsDir = path.join(app.getPath("userData"), "models");
    // Inference state (cached across calls)
    this.llama = null;
    this.model = null;
    this.loadedPath = null;
    this.activeId = null; // last successfully loaded model id
    // Download state
    this.downloading = null; // { id, pct, received, total }
    this.downloadRequest = null;
    this.downloadCancelled = false;
  }

  // -------------------------------------------------------------------------
  // Status
  // -------------------------------------------------------------------------

  /** List installed models: known tiers plus any manually dropped *.gguf. */
  #installedModels() {
    const installed = [];
    let entries = [];
    try {
      entries = fs.readdirSync(this.modelsDir);
    } catch {
      return installed; // models dir does not exist yet
    }
    for (const tier of MODEL_TIERS) {
      try {
        const st = fs.statSync(path.join(this.modelsDir, tier.file));
        if (st.isFile() && st.size > MIN_VALID_BYTES) {
          installed.push({ id: tier.id, file: tier.file, sizeBytes: st.size });
        }
      } catch {
        /* not installed */
      }
    }
    // Any other .gguf dropped manually into the models folder works too.
    for (const name of entries) {
      if (!name.toLowerCase().endsWith(".gguf") || TIER_FILES.has(name)) continue;
      try {
        const st = fs.statSync(path.join(this.modelsDir, name));
        if (st.isFile() && st.size > MIN_VALID_BYTES) {
          installed.push({ id: "custom", file: name, sizeBytes: st.size });
        }
      } catch {
        /* ignore unreadable files */
      }
    }
    return installed;
  }

  status() {
    try {
      const installed = this.#installedModels();
      const active =
        (this.activeId && installed.some((m) => m.id === this.activeId)
          ? this.activeId
          : installed[0]?.id) ?? null;
      return {
        available: true,
        installed,
        active,
        downloading: this.downloading,
        totalRamGB: Math.round(os.totalmem() / (1024 * 1024 * 1024)),
        modelsDir: this.modelsDir,
        tiers: MODEL_TIERS.map(({ id, label, file, ram }) => ({ id, label, file, ram })),
      };
    } catch (err) {
      return { available: false, reason: err?.message ? String(err.message) : String(err) };
    }
  }

  #resolveActive() {
    const installed = this.#installedModels();
    if (this.activeId) {
      const hit = installed.find((m) => m.id === this.activeId);
      if (hit) return hit;
    }
    return installed[0] ?? null;
  }

  // -------------------------------------------------------------------------
  // Download
  // -------------------------------------------------------------------------

  /**
   * Stream a model file to disk with redirect support and ~1% progress
   * events on `iris:ai:progress`. Writes to a `.part` file and renames on
   * success; anything under 100 MB is treated as a failed download.
   */
  async download(tierId, webContents) {
    try {
      const tier = MODEL_TIERS.find((t) => t.id === tierId);
      if (!tier) return { error: `Unknown model tier: ${tierId}` };
      if (this.downloading) return { error: "Another download is already in progress." };

      fs.mkdirSync(this.modelsDir, { recursive: true });
      const finalPath = path.join(this.modelsDir, tier.file);
      const partPath = finalPath + ".part";

      this.downloading = { id: tier.id, pct: 0, received: 0, total: 0 };
      this.downloadCancelled = false;

      await this.#streamToFile(tier.url, partPath, tier.id, webContents);

      const st = fs.statSync(partPath);
      if (st.size <= MIN_VALID_BYTES) {
        fs.rmSync(partPath, { force: true });
        throw new Error(
          "Downloaded file is too small to be a valid model — the download likely failed."
        );
      }
      fs.renameSync(partPath, finalPath);
      this.#emitProgress(webContents, { id: tier.id, pct: 100, received: st.size, total: st.size });
      return { ok: true, id: tier.id, file: tier.file, sizeBytes: st.size };
    } catch (err) {
      const message = err?.message ? String(err.message) : String(err);
      return { error: this.downloadCancelled ? "Download cancelled." : message };
    } finally {
      this.downloading = null;
      this.downloadRequest = null;
    }
  }

  #emitProgress(webContents, payload) {
    try {
      if (webContents && !webContents.isDestroyed()) {
        webContents.send("iris:ai:progress", payload);
      }
    } catch {
      /* renderer gone — ignore */
    }
  }

  #streamToFile(url, destPath, tierId, webContents, redirectsLeft = 5) {
    return new Promise((resolve, reject) => {
      const req = https.get(
        url,
        { headers: { "User-Agent": "IRIS-desktop" } },
        (res) => {
          // Follow redirects (Hugging Face serves models via CDN redirects).
          if (
            res.statusCode >= 300 &&
            res.statusCode < 400 &&
            res.headers.location
          ) {
            res.resume();
            if (redirectsLeft <= 0) return reject(new Error("Too many redirects."));
            const next = new URL(res.headers.location, url).toString();
            return resolve(
              this.#streamToFile(next, destPath, tierId, webContents, redirectsLeft - 1)
            );
          }
          if (res.statusCode !== 200) {
            res.resume();
            return reject(new Error(`Download failed with HTTP ${res.statusCode}.`));
          }

          const total = Number(res.headers["content-length"]) || 0;
          let received = 0;
          let lastPct = -1;
          const out = fs.createWriteStream(destPath);

          res.on("data", (chunk) => {
            received += chunk.length;
            const pct = total > 0 ? Math.floor((received / total) * 100) : 0;
            this.downloading = { id: tierId, pct, received, total };
            if (pct !== lastPct) {
              lastPct = pct;
              this.#emitProgress(webContents, { id: tierId, pct, received, total });
            }
          });
          res.pipe(out);
          out.on("finish", () => resolve());
          out.on("error", (err) => {
            res.destroy();
            fs.rm(destPath, { force: true }, () => reject(err));
          });
          res.on("error", (err) => {
            out.destroy();
            fs.rm(destPath, { force: true }, () => reject(err));
          });
        }
      );
      this.downloadRequest = req;
      req.on("error", (err) => {
        fs.rm(destPath, { force: true }, () =>
          reject(this.downloadCancelled ? new Error("Download cancelled.") : err)
        );
      });
    });
  }

  cancelDownload() {
    try {
      if (!this.downloading) return { ok: true, cancelled: false };
      this.downloadCancelled = true;
      if (this.downloadRequest) this.downloadRequest.destroy(new Error("Download cancelled."));
      return { ok: true, cancelled: true };
    } catch (err) {
      return { error: err?.message ? String(err.message) : String(err) };
    }
  }

  // -------------------------------------------------------------------------
  // Delete
  // -------------------------------------------------------------------------

  async deleteModel(id) {
    try {
      const hit = this.#installedModels().find((m) => m.id === id);
      if (!hit) return { error: `No installed model with id "${id}".` };
      const filePath = path.join(this.modelsDir, hit.file);
      // If the model being deleted is loaded, unload it first.
      if (this.loadedPath === filePath) {
        if (this.model) await this.model.dispose().catch(() => {});
        this.model = null;
        this.loadedPath = null;
      }
      if (this.activeId === id) this.activeId = null;
      fs.rmSync(filePath, { force: true });
      return { ok: true };
    } catch (err) {
      return { error: err?.message ? String(err.message) : String(err) };
    }
  }

  // -------------------------------------------------------------------------
  // Inference
  // -------------------------------------------------------------------------

  /**
   * Run one chat completion against the active model. The llama runtime and
   * model are cached across calls (the model is disposed and reloaded when
   * the active file changes); a fresh context/session is created per call so
   * conversations never leak between unrelated requests.
   */
  async generate({ system, prompt, maxTokens } = {}) {
    try {
      const active = this.#resolveActive();
      if (!active) {
        return { error: "No local model is installed. Download one in Settings → IRIS Local AI." };
      }
      const modelPath = path.join(this.modelsDir, active.file);

      const { getLlama, LlamaChatSession } = await import("node-llama-cpp");
      if (!this.llama) this.llama = await getLlama();

      if (!this.model || this.loadedPath !== modelPath) {
        if (this.model) {
          await this.model.dispose().catch(() => {});
          this.model = null;
          this.loadedPath = null;
        }
        this.model = await this.llama.loadModel({ modelPath });
        this.loadedPath = modelPath;
      }
      this.activeId = active.id;

      const context = await this.model.createContext({ contextSize: { max: 4096 } });
      try {
        const session = new LlamaChatSession({
          contextSequence: context.getSequence(),
          systemPrompt: String(system ?? ""),
        });
        const text = await session.prompt(String(prompt ?? ""), {
          temperature: 0.4,
          maxTokens: Number(maxTokens) > 0 ? Math.floor(Number(maxTokens)) : 512,
        });
        if (!text || !String(text).trim()) {
          return { error: "The local model returned an empty response." };
        }
        return { text: String(text).trim() };
      } finally {
        await context.dispose().catch(() => {});
      }
    } catch (err) {
      // Never let native-layer failures escape as exceptions.
      return { error: err?.message ? String(err.message) : String(err) };
    }
  }
}

let managerInstance = null;

/** Singleton accessor used by electron/main.js. */
export function getLLMManager() {
  if (!managerInstance) managerInstance = new LocalLLMManager();
  return managerInstance;
}
