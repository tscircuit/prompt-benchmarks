import fs from "node:fs"
import path from "node:path"

const REGISTRY_DOCS_URL =
  "https://raw.githubusercontent.com/tscircuit/tscircuit/main/docs/tscircuit-docs.md"

const ASSETS_DIR = path.join(import.meta.dirname ?? __dirname, "../assets")
const DOCS_PATH = path.join(ASSETS_DIR, "tscircuit-docs.md")

async function main() {
  console.log(`Fetching docs from ${REGISTRY_DOCS_URL} …`)

  const res = await fetch(REGISTRY_DOCS_URL)
  if (!res.ok) {
    throw new Error(`Failed to fetch docs: ${res.status} ${res.statusText}`)
  }

  const content = await res.text()

  fs.mkdirSync(ASSETS_DIR, { recursive: true })
  fs.writeFileSync(DOCS_PATH, content, "utf-8")

  console.log(`✅ Docs written to ${DOCS_PATH} (${content.length} bytes)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
