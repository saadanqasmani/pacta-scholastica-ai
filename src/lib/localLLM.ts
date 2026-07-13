/**
 * Local LLM client — renderer side of the offline GPT.
 *
 * Talks to the llama.cpp model hosted in the Electron main process via the
 * `window.iris.ai` bridge (see electron/llm.mjs). Answers are grounded in a
 * RAG context block built from the local database and Data Library by
 * `buildChatContext` in src/lib/localEngine.ts, so the model quotes real
 * numbers instead of inventing them.
 *
 * Only exists in the desktop app; in the browser `window.iris` is undefined
 * and callers fall back to the deterministic IRIS engine.
 */
import { buildChatContext } from '@/lib/localEngine';

const SYSTEM_PROMPT = `You are IRIS, the intelligence layer of the International Relations Intelligent System — an expert advisor on university internationalization, partnerships, student mobility and academic cooperation. Answer ONLY from the CONTEXT below; quote real numbers from it. When relevant, frame advice through the IMG/IPI framework (gap dimensions IA = Information Asymmetry, WF = Workflow Fragmentation, DID = Digital Infrastructure Deficit; leadership commitment LC; readiness RF) and the institution's profile quadrant. If the context lacks the answer, say exactly what data is missing and which IRIS module would provide it. Be concise and expert. Never invent numbers.`;

/** True when running in the desktop shell with a downloaded model ready. */
export async function isLocalLLMAvailable(): Promise<boolean> {
  try {
    const ai = window.iris?.ai;
    if (!ai) return false;
    const status = await ai.status();
    return Boolean(status && status.available && status.active);
  } catch {
    return false;
  }
}

/**
 * Answer a question with the local model, grounded in the university's data.
 * Throws on any failure so callers can fall through to the built-in engine.
 */
export async function askLocalLLM(
  question: string,
  universityId: string | null
): Promise<string> {
  const ai = window.iris?.ai;
  if (!ai) throw new Error('Local LLM is only available in the desktop app.');

  const context = await buildChatContext(universityId, question);
  const result = await ai.generate({
    system: SYSTEM_PROMPT,
    prompt: `CONTEXT:\n${context}\n\nQUESTION: ${question}`,
    maxTokens: 768,
  });

  if (!result || result.error || !result.text) {
    throw new Error(result?.error || 'The local model returned no answer.');
  }
  return result.text;
}
