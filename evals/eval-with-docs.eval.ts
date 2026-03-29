import { getSystemPromptWithDocs } from "../lib/get-system-prompt-with-docs"

/**
 * Re-exports the system prompt with auto-generated docs for use in evals.
 * Import `systemPrompt` from this module wherever you need the full prompt.
 *
 * Example usage in an eval file:
 *
 * ```ts
 * import { systemPrompt } from "../evals/eval-with-docs.eval"
 *
 * const result = await aiModel.complete({
 *   system: systemPrompt,
 *   prompt: "Create a simple LED circuit with a current-limiting resistor",
 * })
 * ```
 */
export const systemPrompt = getSystemPromptWithDocs()
