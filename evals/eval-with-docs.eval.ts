/**
 * Eval entry-point that uses a docs-augmented system prompt.
 *
 * The prompt is built synchronously from the cached docs file
 * (`assets/tscircuit-docs.md`). Run `bun scripts/update-docs.ts` first to
 * populate the cache.
 *
 * Docs are wrapped in a `<tscircuit_docs>` XML block so the model can clearly
 * identify the reference material.
 */
import { getSystemPromptWithDocs } from "../lib/get-system-prompt-with-docs"

export const systemPrompt = getSystemPromptWithDocs()
