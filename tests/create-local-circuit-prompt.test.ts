import { afterEach, beforeEach, describe, expect, mock, test } from "bun:test"
import {
  createLocalCircuitPrompt,
  resetGeneratedDocsCacheForTesting,
} from "lib/prompt-templates/create-local-circuit-prompt"

const originalFetch = globalThis.fetch

const propsDoc = `# Component Types
<resistor resistance="1k" />
`
const generatedDocs = `# tscircuit generated docs
Use <resistor /> with resistance and footprint props.
`

describe("createLocalCircuitPrompt generated docs", () => {
  beforeEach(() => {
    resetGeneratedDocsCacheForTesting()
  })

  afterEach(() => {
    resetGeneratedDocsCacheForTesting()
    globalThis.fetch = originalFetch
  })

  test("includes generated docs from ai.txt in the system prompt", async () => {
    globalThis.fetch = mock(async (url: string | URL | Request) => {
      const urlString = url.toString()
      if (urlString === "https://docs.tscircuit.com/ai.txt") {
        return new Response(generatedDocs)
      }
      return new Response(propsDoc)
    }) as typeof fetch

    const prompt = await createLocalCircuitPrompt()

    expect(prompt).toContain("### Generated tscircuit docs")
    expect(prompt).toContain("Use <resistor /> with resistance")
    expect(prompt).toContain('<resistor resistance="1k" />')
  })

  test("keeps prompt creation working when generated docs fail", async () => {
    globalThis.fetch = mock(async (url: string | URL | Request) => {
      const urlString = url.toString()
      if (urlString === "https://docs.tscircuit.com/ai.txt") {
        return new Response("missing", { status: 503 })
      }
      return new Response(propsDoc)
    }) as typeof fetch

    const prompt = await createLocalCircuitPrompt()

    expect(prompt).not.toContain("### Generated tscircuit docs")
    expect(prompt).toContain('<resistor resistance="1k" />')
  })

  test("caches generated docs during the process", async () => {
    const generatedDocsFetch = mock(async () => new Response(generatedDocs))
    globalThis.fetch = mock(async (url: string | URL | Request) => {
      const urlString = url.toString()
      if (urlString === "https://docs.tscircuit.com/ai.txt") {
        return generatedDocsFetch()
      }
      return new Response(propsDoc)
    }) as typeof fetch

    await createLocalCircuitPrompt()
    await createLocalCircuitPrompt()

    expect(generatedDocsFetch).toHaveBeenCalledTimes(1)
  })
})
