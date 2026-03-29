import * as fs from "fs"
import * as path from "path"

const DOCS_CACHE_PATH = path.join(
  process.cwd(),
  "assets",
  "tscircuit-docs.md"
)

/**
 * Reads the auto-generated tscircuit docs from the local cache file.
 * The cache is populated by running `npx tsx scripts/update-docs.ts`.
 */
function readCachedDocs(): string {
  if (fs.existsSync(DOCS_CACHE_PATH)) {
    return fs.readFileSync(DOCS_CACHE_PATH, "utf-8")
  }
  return ""
}

/**
 * Returns the base system prompt text (without docs) as a plain string.
 * This is the static portion that instructs the model on tscircuit basics.
 */
export function getBaseSystemPrompt(): string {
  return `You are an expert at generating tscircuit code. tscircuit is a TypeScript library for designing electronic circuits using a React-like JSX/TSX syntax.

## Rules
- Always import components from "tscircuit"
- Use a \`<board>\` element as the root
- Specify component footprints using the \`footprint\` prop
- Connect pins using shared net name strings
- All coordinates and dimensions are in millimeters
- Export the circuit as a default function
- Do not use placeholder values; use real electrical values and footprints`
}

/**
 * Returns the full system prompt including auto-generated component docs.
 * The docs section is appended after the base prompt.
 */
export function getSystemPromptWithDocs(): string {
  const base = getBaseSystemPrompt()
  const docs = readCachedDocs()

  if (!docs) {
    return base
  }

  return `${base}

## tscircuit Component Reference (Auto-Generated Docs)

The following documentation is auto-generated from the tscircuit source and provides
accurate, up-to-date API references for all available components and their props.

${docs}`
}
