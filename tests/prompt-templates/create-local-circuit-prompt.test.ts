import { afterEach, beforeEach, describe, expect, it } from "bun:test"
import {
  clearCreateLocalCircuitPromptCacheForTests,
  createLocalCircuitPrompt,
} from "lib/prompt-templates/create-local-circuit-prompt"

const originalFetch = globalThis.fetch

beforeEach(() => {
  clearCreateLocalCircuitPromptCacheForTests()
})

afterEach(() => {
  globalThis.fetch = originalFetch
  clearCreateLocalCircuitPromptCacheForTests()
})

describe("createLocalCircuitPrompt", () => {
  it("includes generated tscircuit docs and caches them across prompt builds", async () => {
    const fetchCounts = new Map<string, number>()

    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = input.toString()
      fetchCounts.set(url, (fetchCounts.get(url) ?? 0) + 1)

      if (url === "https://docs.tscircuit.com/ai.txt") {
        return new Response("GENERATED_TSCIRCUIT_DOCS", { status: 200 })
      }

      if (
        url ===
        "https://raw.githubusercontent.com/tscircuit/props/main/generated/COMPONENT_TYPES.md"
      ) {
        return new Response("# Props\n\nPROP_COMPONENT_DOCS", { status: 200 })
      }

      throw new Error(`Unexpected URL: ${url}`)
    }) as typeof fetch

    const firstPrompt = await createLocalCircuitPrompt()
    const secondPrompt = await createLocalCircuitPrompt()

    expect(firstPrompt).toContain("## Auto-generated tscircuit docs")
    expect(firstPrompt).toContain("<tscircuit_generated_docs>")
    expect(firstPrompt).toContain("GENERATED_TSCIRCUIT_DOCS")
    expect(firstPrompt).toContain("PROP_COMPONENT_DOCS")
    expect(secondPrompt).toContain("GENERATED_TSCIRCUIT_DOCS")
    expect(fetchCounts.get("https://docs.tscircuit.com/ai.txt")).toBe(1)
  })

  it("keeps building the prompt if generated docs are unavailable", async () => {
    let generatedDocsFetchCount = 0

    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = input.toString()

      if (url === "https://docs.tscircuit.com/ai.txt") {
        generatedDocsFetchCount += 1
        return new Response("", { status: 503 })
      }

      if (
        url ===
        "https://raw.githubusercontent.com/tscircuit/props/main/generated/COMPONENT_TYPES.md"
      ) {
        return new Response("# Props\n\nPROP_COMPONENT_DOCS", { status: 200 })
      }

      throw new Error(`Unexpected URL: ${url}`)
    }) as typeof fetch

    const prompt = await createLocalCircuitPrompt()

    expect(prompt).not.toContain("<tscircuit_generated_docs>")
    expect(prompt).toContain("PROP_COMPONENT_DOCS")
    expect(prompt).toContain("## tscircuit API overview")
    expect(generatedDocsFetchCount).toBe(1)
  })

  it("does not cache empty generated docs after a transient fetch failure", async () => {
    let generatedDocsFetchCount = 0

    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = input.toString()

      if (url === "https://docs.tscircuit.com/ai.txt") {
        generatedDocsFetchCount += 1
        if (generatedDocsFetchCount === 1) {
          return new Response("", { status: 503 })
        }
        return new Response("RECOVERED_GENERATED_DOCS", { status: 200 })
      }

      if (
        url ===
        "https://raw.githubusercontent.com/tscircuit/props/main/generated/COMPONENT_TYPES.md"
      ) {
        return new Response("# Props\n\nPROP_COMPONENT_DOCS", { status: 200 })
      }

      throw new Error(`Unexpected URL: ${url}`)
    }) as typeof fetch

    const firstPrompt = await createLocalCircuitPrompt()
    const secondPrompt = await createLocalCircuitPrompt()

    expect(firstPrompt).not.toContain("<tscircuit_generated_docs>")
    expect(secondPrompt).toContain("RECOVERED_GENERATED_DOCS")
    expect(generatedDocsFetchCount).toBe(2)
  })
})
