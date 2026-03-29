import fs from "node:fs"
import path from "node:path"
import { BASE_SYSTEM_PROMPT } from "./base-system-prompt"

const DOCS_PATH = path.join(import.meta.dirname ?? __dirname, "../assets/tscircuit-docs.md")
const REGISTRY_DOCS_URL =
  "https://raw.githubusercontent.com/tscircuit/tscircuit/main/docs/tscircuit-docs.md"

/**
 * Async system prompt builder.
 *
 * 1. Tries to read the pre-cached `assets/tscircuit-docs.md`.
 * 2. Falls back to fetching from the registry/GitHub when the cache is absent.
 * 3. Returns the base prompt alone when neither source is available.
 *
 * Docs are wrapped in a `<tscircuit_docs>` block so models can easily
 * identify the reference material.
 */
export async function getSystemPrompt(): Promise<string> {
  let docs: string | null = null

  // 1. Try cache first
  try {
    docs = fs.readFileSync(DOCS_PATH, "utf-8")
  } catch {
    // Cache miss – fall through to network fetch
  }

  // 2. Fetch from registry if cache is unavailable
  if (!docs) {
    try {
      const res = await fetch(REGISTRY_DOCS_URL)
      if (res.ok) {
        docs = await res.text()
      }
    } catch {
      // Network unavailable – fall through
    }
  }

  if (!docs) {
    return BASE_SYSTEM_PROMPT
  }

  return `${BASE_SYSTEM_PROMPT}\n<tscircuit_docs>\n${docs}\n</tscircuit_docs>`
}
