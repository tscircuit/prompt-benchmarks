/**
 * Script to fetch and cache the auto-generated tscircuit documentation.
 * Run this periodically to keep the docs up-to-date.
 *
 * Usage: npx tsx scripts/update-docs.ts
 */

import * as fs from "fs"
import * as path from "path"

const DOCS_OUTPUT_PATH = path.join(process.cwd(), "assets", "tscircuit-docs.md")

const DOCS_SOURCES = [
  // tscircuit registry auto-generated docs
  "https://registry-api.tscircuit.com/autorouting/docs/auto-generated",
  // fallback: GitHub raw content
  "https://raw.githubusercontent.com/tscircuit/tscircuit/main/docs/AUTO_GENERATED.md",
]

async function fetchDocs(): Promise<string | null> {
  for (const url of DOCS_SOURCES) {
    try {
      console.log(`Trying to fetch docs from: ${url}`)
      const response = await fetch(url)
      if (response.ok) {
        const text = await response.text()
        if (text.trim().length > 0) {
          console.log(`✓ Successfully fetched docs from: ${url}`)
          return text
        }
      } else {
        console.warn(`✗ Failed to fetch from ${url}: HTTP ${response.status}`)
      }
    } catch (e) {
      console.warn(`✗ Error fetching from ${url}:`, e)
    }
  }
  return null
}

async function main() {
  const docs = await fetchDocs()

  if (!docs) {
    console.error("Failed to fetch docs from any source.")
    process.exit(1)
  }

  // Ensure the assets directory exists
  const assetsDir = path.dirname(DOCS_OUTPUT_PATH)
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir, { recursive: true })
  }

  fs.writeFileSync(DOCS_OUTPUT_PATH, docs, "utf-8")
  console.log(`✓ Docs written to: ${DOCS_OUTPUT_PATH}`)
  console.log(`  Size: ${(docs.length / 1024).toFixed(1)} KB`)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
