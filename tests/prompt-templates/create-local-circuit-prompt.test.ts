import { describe, expect, it } from "bun:test"
import {
  TSCIRCUIT_AUTO_GENERATED_DOCS_URL,
  TSCIRCUIT_LEGACY_COMPONENT_TYPES_URL,
  cleanMarkdownDocs,
  fetchTscircuitDocs,
} from "../../lib/prompt-templates/create-local-circuit-prompt"

describe("create local circuit prompt docs", () => {
  it("cleans heading noise and repeated blank lines from markdown docs", () => {
    expect(cleanMarkdownDocs("# Title\n\n\nBody\n## Section\n\nValue\n")).toBe(
      "Body\n\nValue",
    )
  })

  it("prefers the auto-generated tscircuit docs", async () => {
    const requestedUrls: string[] = []
    const docs = await fetchTscircuitDocs(async (url) => {
      requestedUrls.push(url)
      return "# Auto docs\n\n<file path=\"docs/elements/board.mdx\">"
    })

    expect(requestedUrls).toEqual([TSCIRCUIT_AUTO_GENERATED_DOCS_URL])
    expect(docs).toContain('docs/elements/board.mdx">')
    expect(docs).not.toContain("# Auto docs")
  })

  it("falls back to legacy component docs when auto-generated docs cannot be fetched", async () => {
    const requestedUrls: string[] = []
    const docs = await fetchTscircuitDocs(async (url) => {
      requestedUrls.push(url)

      if (url === TSCIRCUIT_AUTO_GENERATED_DOCS_URL) {
        throw new Error("network error")
      }

      return "# Components\n\n<resistor /> props"
    })

    expect(requestedUrls).toEqual([
      TSCIRCUIT_AUTO_GENERATED_DOCS_URL,
      TSCIRCUIT_LEGACY_COMPONENT_TYPES_URL,
    ])
    expect(docs).toBe("<resistor /> props")
  })
})
