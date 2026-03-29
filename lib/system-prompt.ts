import fs from "node:fs"
import path from "node:path"
import { BASE_SYSTEM_PROMPT } from "./base-system-prompt"

const DOCS_PATH = path.join(import.meta.dirname ?? __dirname, "../assets/tscircuit-docs.md")

/**
 * Returns the base system prompt, optionally appending cached tscircuit docs
 * wrapped in a `<tscircuit_docs>` block.
 *
 * Note: benchmarks that use `createLocalCircuitPrompt()` build their own prompt
 * inline. This helper is provided for eval scripts that want a pre-built prompt
 * with or without the cached docs appended.
 *
 * @param includeDocs - When true, the contents of `assets/tscircuit-docs.md`
 *   are appended (if the file exists).
 */
export function getSystemPrompt(includeDocs = false): string {
  if (!includeDocs) {
    return BASE_SYSTEM_PROMPT
  }

  let docs = ""
  try {
    docs = fs.readFileSync(DOCS_PATH, "utf-8")
  } catch {
    // Cache file not present – return base prompt only
    return BASE_SYSTEM_PROMPT
  }

  return `${BASE_SYSTEM_PROMPT}\n<tscircuit_docs>\n${docs}\n</tscircuit_docs>`
}

/**
 * The base system prompt without any docs appended.
 * Provided as a convenience export for cases where a static string is needed.
 */
export const systemPrompt = BASE_SYSTEM_PROMPT
