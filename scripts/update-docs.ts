import fs from "node:fs"
import path from "node:path"

const REGISTRY_DOCS_URL =
  "https://registry-api.tscircuit.com/api/v1/docs/markdown"
const GITHUB_DOCS_URL =
  "https://raw.githubusercontent.com/tscircuit/tscircuit/main/docs/components.md"

async function fetchDocs(): Promise<string> {
  // Try registry first, fall back to GitHub
  try {
    const res = await fetch(REGISTRY_DOCS_URL)
    if (res.ok) {
      return await res.text()
    }
  } catch (_e) {
    // fall through
  }

  const res = await fetch(GITHUB_DOCS_URL)
  if (!res.ok) {
    throw new Error(`Failed to fetch docs from GitHub: ${res.statusText}`)
  }
  return await res.text()
}

async function main() {
  const docs = await fetchDocs()
  const assetsDir = path.join(path.dirname(new URL(import.meta.url).pathname), "../assets")
  fs.mkdirSync(assetsDir, { recursive: true })
  const outPath = path.join(assetsDir, "tscircuit-docs.md")
  fs.writeFileSync(outPath, docs, "utf-8")
  console.log(`Wrote docs to ${outPath}`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
