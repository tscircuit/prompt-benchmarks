import fs from "node:fs"
import path from "node:path"
import { getBaseSystemPrompt } from "./base-system-prompt"

const DOCS_PATH = path.join(
  import.meta.dirname ?? __dirname,
  "../assets/tscircuit-docs.md",
)

/**
 * Returns the base system prompt without docs appended.
 *
 * If you need the prompt with auto-generated component docs included, use
 * `getSystemPromptWithCachedDocs()` (which wraps docs in a `<tscircuit_docs>`
 * block) or the async `getSystemPrompt()` from `lib/get-system-prompt.ts`.
 */
export function getSystemPromptBase(): string {
  return getBaseSystemPrompt()
}

/**
 * Returns the base system prompt with auto-generated tscircuit component docs
 * appended (read from the local `assets/tscircuit-docs.md` cache).
 *
 * The docs are wrapped in a `<tscircuit_docs>` XML block so that models can
 * clearly distinguish the reference material from the instructions.
 *
 * Run `npx tsx scripts/update-docs.ts` to refresh the cached docs file.
 */
export function getSystemPromptWithCachedDocs(): string {
  const base = getBaseSystemPrompt()

  if (!fs.existsSync(DOCS_PATH)) {
    console.warn(
      "[system-prompt] assets/tscircuit-docs.md not found — returning base prompt without docs. " +
        "Run `npx tsx scripts/update-docs.ts` to generate it.",
    )
    return base
  }

  const docs = fs.readFileSync(DOCS_PATH, "utf-8")
  return `${base}\n<tscircuit_docs>\n${docs}\n</tscircuit_docs>\n`
}
