/**
 * scripts/update-docs-cache.ts
 *
 * Downloads the latest auto-generated tscircuit docs and writes them to
 * assets/tscircuit-docs.md so the system prompt can reference them without a
 * network call at evaluation time.
 *
 * Usage:
 *   npx tsx scripts/update-docs-cache.ts
 *   # or via package.json:
 *   bun run update-docs
 */

import fs from "node:fs/promises"
import path from "node:path"

const DOCS_URL =
  "https://raw.githubusercontent.com/tscircuit/docs/main/ai-docs/FULL_DOCS.md"

const OUTPUT_PATH = path.resolve(
  path.dirname(new URL(import.meta.url).pathname),
  "..",
  "assets",
  "tscircuit-docs.md",
)

async function main() {
  console.log(`Fetching docs from:\n  ${DOCS_URL}\n`)

  const res = await fetch(DOCS_URL)
  if (!res.ok) {
    throw new Error(`Failed to fetch docs: ${res.status} ${res.statusText}`)
  }

  const content = await res.text()

  await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true })
  await fs.writeFile(OUTPUT_PATH, content, "utf-8")

  const lines = content.split("\n").length
  console.log(
    `✓ Wrote ${lines} lines (${content.length} bytes) to:\n  ${OUTPUT_PATH}`,
  )
}

main().catch((err) => {
  console.error("Error updating docs cache:", err)
  process.exit(1)
})
