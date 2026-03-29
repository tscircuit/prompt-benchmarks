import fs from "node:fs"
import path from "node:path"
import { getBaseSystemPromptText } from "./base-system-prompt"

const CACHED_DOCS_PATH = path.join(
  path.dirname(new URL(import.meta.url).pathname),
  "../assets/tscircuit-docs.md",
)

/**
 * Returns the base system prompt without any docs appended.
 * Useful when you want to measure model performance without extra context.
 */
export function getBaseSystemPrompt(): string {
  return getBaseSystemPromptText()
}

/**
 * Returns the base system prompt with cached component docs appended inside
 * a `<tscircuit_docs>` XML block. Falls back to the base prompt if the cache
 * file does not exist (run `bun scripts/update-docs.ts` to populate it).
 */
export function getSystemPromptWithDocs(): string {
  const base = getBaseSystemPromptText()

  if (!fs.existsSync(CACHED_DOCS_PATH)) {
    return base
  }

  const docs = fs.readFileSync(CACHED_DOCS_PATH, "utf-8")

  return `${base}
<tscircuit_docs>
${docs.trim()}
</tscircuit_docs>
`
}
