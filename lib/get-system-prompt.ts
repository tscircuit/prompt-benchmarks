import fs from "node:fs"
import path from "node:path"
import { getBaseSystemPromptText } from "./base-system-prompt"

const REGISTRY_DOCS_URL =
  "https://registry-api.tscircuit.com/api/v1/docs/markdown"
const CACHED_DOCS_PATH = path.join(
  path.dirname(new URL(import.meta.url).pathname),
  "../assets/tscircuit-docs.md",
)

async function fetchDocs(): Promise<string | null> {
  try {
    const res = await fetch(REGISTRY_DOCS_URL)
    if (res.ok) {
      return await res.text()
    }
  } catch (_e) {
    // fall through
  }
  return null
}

/**
 * Async system prompt builder. Reads cached docs from `assets/tscircuit-docs.md`
 * when available, otherwise attempts to fetch them live from the registry.
 * Docs are wrapped in a `<tscircuit_docs>` XML block so the model can clearly
 * identify the reference material.
 */
export async function getSystemPrompt(): Promise<string> {
  const base = getBaseSystemPromptText()

  let docs: string | null = null

  if (fs.existsSync(CACHED_DOCS_PATH)) {
    docs = fs.readFileSync(CACHED_DOCS_PATH, "utf-8")
  } else {
    docs = await fetchDocs()
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
