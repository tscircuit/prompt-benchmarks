import fs from "node:fs"
import path from "node:path"
import { BASE_SYSTEM_PROMPT } from "./base-system-prompt"

const DOCS_PATH = path.join(import.meta.dirname ?? __dirname, "../assets/tscircuit-docs.md")

/**
 * Returns the base system prompt without any docs appended.
 * Useful when you want to compare eval quality with/without the docs reference.
 */
export function getBaseSystemPrompt(): string {
  return BASE_SYSTEM_PROMPT
}

/**
 * Returns the base system prompt with the cached tscircuit docs appended inside
 * a `<tscircuit_docs>` block.
 *
 * If `assets/tscircuit-docs.md` does not exist, falls back to the base prompt.
 * Run `npx tsx scripts/update-docs.ts` to populate the cache.
 */
export function getSystemPromptWithDocs(): string {
  let docs = ""
  try {
    docs = fs.readFileSync(DOCS_PATH, "utf-8")
  } catch {
    // Cache file not present – return base prompt only
    return BASE_SYSTEM_PROMPT
  }

  return `${BASE_SYSTEM_PROMPT}\n<tscircuit_docs>\n${docs}\n</tscircuit_docs>`
}
