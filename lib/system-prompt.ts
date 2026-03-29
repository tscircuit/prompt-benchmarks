import fs from "node:fs"
import path from "node:path"
import { getBaseSystemPromptText } from "./base-system-prompt"

const CACHED_DOCS_PATH = path.join(
  path.dirname(new URL(import.meta.url).pathname),
  "../assets/tscircuit-docs.md",
)

/**
 * Builds a system prompt that optionally appends cached component docs
 * inside a `<tscircuit_docs>` XML block. Use this helper when you want
 * to inject docs that were pre-fetched via `scripts/update-docs.ts`.
 *
 * Note: benchmarks that call `createLocalCircuitPrompt()` build their prompt
 * independently; this helper is intended for eval files that want a richer,
 * docs-augmented prompt without the benchmark scaffolding overhead.
 */
export function buildSystemPrompt({
  includeDocs = true,
}: { includeDocs?: boolean } = {}): string {
  const base = getBaseSystemPromptText()

  if (!includeDocs) {
    return base
  }

  let docs: string | null = null
  if (fs.existsSync(CACHED_DOCS_PATH)) {
    docs = fs.readFileSync(CACHED_DOCS_PATH, "utf-8")
  }

  if (!docs) {
    return base
  }

  return `${base}
<tscircuit_docs>
${docs.trim()}
</tscircuit_docs>
`
}

/** Convenience export: base prompt without docs. */
export const baseSystemPrompt = buildSystemPrompt({ includeDocs: false })

/** Convenience export: base prompt with cached docs appended. */
export const systemPromptWithDocs = buildSystemPrompt({ includeDocs: true })
