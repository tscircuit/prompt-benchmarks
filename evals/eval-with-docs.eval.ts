/**
 * Eval entry-point that uses the system prompt augmented with the cached
 * tscircuit docs wrapped in a `<tscircuit_docs>` block.
 *
 * Run `npx tsx scripts/update-docs.ts` first to populate `assets/tscircuit-docs.md`.
 */
import { getSystemPromptWithDocs } from "../lib/get-system-prompt-with-docs"

export const systemPrompt = getSystemPromptWithDocs()
