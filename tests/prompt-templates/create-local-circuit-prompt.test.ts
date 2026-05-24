import { afterEach, beforeEach, describe, expect, test } from "bun:test"
import {
  createLocalCircuitPrompt,
  resetGeneratedTscircuitDocsCacheForTests,
  setGeneratedTscircuitDocsTimeoutForTests,
} from "../../lib/prompt-templates/create-local-circuit-prompt"

const originalFetch = globalThis.fetch

const propsDoc = `# Component Types

<resistor resistance="1k" footprint="0603" />
`

function mockFetch(handler: (url: string) => Response | Promise<Response>) {
  globalThis.fetch = (async (input) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.toString()
          : input.url
    return handler(url)
  }) as typeof fetch
}

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

beforeEach(() => {
  resetGeneratedTscircuitDocsCacheForTests()
})

afterEach(() => {
  globalThis.fetch = originalFetch
  resetGeneratedTscircuitDocsCacheForTests()
})

describe("createLocalCircuitPrompt", () => {
  test("includes auto-generated docs before the handwritten API overview", async () => {
    mockFetch((url) => {
      if (url.includes("COMPONENT_TYPES.md")) {
        return new Response(propsDoc)
      }
      if (url.includes("docs.tscircuit.com/ai.txt")) {
        return new Response("Generated docs: prefer <chip /> pinLabels.")
      }
      return new Response("not found", { status: 404 })
    })

    const prompt = await createLocalCircuitPrompt()

    expect(prompt).toContain("## Auto-generated tscircuit documentation")
    expect(prompt).toContain("Generated docs: prefer <chip /> pinLabels.")
    expect(
      prompt.indexOf("## Auto-generated tscircuit documentation"),
    ).toBeLessThan(prompt.indexOf("## tscircuit API overview"))
  })

  test("keeps prompt creation working when generated docs are unavailable", async () => {
    mockFetch((url) => {
      if (url.includes("COMPONENT_TYPES.md")) {
        return new Response(propsDoc)
      }
      if (url.includes("docs.tscircuit.com/ai.txt")) {
        return new Response("temporarily unavailable", { status: 503 })
      }
      return new Response("not found", { status: 404 })
    })

    const prompt = await createLocalCircuitPrompt()

    expect(prompt).not.toContain("## Auto-generated tscircuit documentation")
    expect(prompt).toContain("## tscircuit API overview")
    expect(prompt).toContain("<resistor resistance")
  })

  test("caches successful generated docs while still fetching current props docs", async () => {
    const calls: string[] = []

    mockFetch((url) => {
      calls.push(url)
      if (url.includes("COMPONENT_TYPES.md")) {
        return new Response(propsDoc)
      }
      if (url.includes("docs.tscircuit.com/ai.txt")) {
        return new Response("Generated docs cached once.")
      }
      return new Response("not found", { status: 404 })
    })

    await createLocalCircuitPrompt()
    await createLocalCircuitPrompt()

    expect(
      calls.filter((url) => url.includes("docs.tscircuit.com/ai.txt")).length,
    ).toBe(1)
    expect(
      calls.filter((url) => url.includes("COMPONENT_TYPES.md")).length,
    ).toBe(2)
  })

  test("times out and caches slow optional generated docs", async () => {
    const calls: string[] = []
    setGeneratedTscircuitDocsTimeoutForTests(1)

    mockFetch((url) => {
      calls.push(url)
      if (url.includes("COMPONENT_TYPES.md")) {
        return new Response(propsDoc)
      }
      if (url.includes("docs.tscircuit.com/ai.txt")) {
        return wait(100).then(
          () => new Response("Generated docs arrived too late."),
        )
      }
      return new Response("not found", { status: 404 })
    })

    const prompt = await createLocalCircuitPrompt()
    const promptWithCachedTimeout = await createLocalCircuitPrompt()

    expect(prompt).not.toContain("Generated docs arrived too late.")
    expect(promptWithCachedTimeout).toContain("## tscircuit API overview")
    expect(
      calls.filter((url) => url.includes("docs.tscircuit.com/ai.txt")).length,
    ).toBe(1)
    expect(
      calls.filter((url) => url.includes("COMPONENT_TYPES.md")).length,
    ).toBe(2)
  })
})
