import fs from "node:fs"
import path from "node:path"

const DOCS_URL =
  "https://raw.githubusercontent.com/tscircuit/tscircuit/main/docs/COMPONENTS.md"

const ASSETS_DIR = path.join(import.meta.dirname ?? __dirname, "../assets")
const OUTPUT_PATH = path.join(ASSETS_DIR, "tscircuit-docs.md")

async function fetchDocs(): Promise<string> {
  const response = await fetch(DOCS_URL)
  if (!response.ok) {
    throw new Error(
      `Failed to fetch docs: ${response.status} ${response.statusText}`,
    )
  }
  return response.text()
}

async function main() {
  console.log("Fetching tscircuit auto-generated docs...")
  const docs = await fetchDocs()

  if (!fs.existsSync(ASSETS_DIR)) {
    fs.mkdirSync(ASSETS_DIR, { recursive: true })
  }

  fs.writeFileSync(OUTPUT_PATH, docs, "utf-8")
  console.log(`Docs written to ${OUTPUT_PATH} (${docs.length} bytes)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
