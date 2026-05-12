import { afterEach, beforeEach, expect, it } from "bun:test"
import {
  clearGeneratedDocsCacheForTests,
  createLocalCircuitPrompt,
} from "lib/prompt-templates/create-local-circuit-prompt"

const originalFetch = globalThis.fetch
const originalConsoleError = console.error

beforeEach(() => {
  clearGeneratedDocsCacheForTests()
  console.error = () => {}
})

afterEach(() => {
  globalThis.fetch = originalFetch
  console.error = originalConsoleError
  clearGeneratedDocsCacheForTests()
})

it("includes generated tscircuit docs in the local circuit prompt", async () => {
  const requestedUrls: string[] = []

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = input.toString()
    requestedUrls.push(url)

    if (url === "https://docs.tscircuit.com/ai.txt") {
      return new Response("GENERATED_AI_DOCS_SENTINEL", { status: 200 })
    }

    return new Response("# Components\nmock component props", { status: 200 })
  }) as typeof fetch

  const prompt = await createLocalCircuitPrompt()

  expect(prompt).toContain("## Generated tscircuit docs")
  expect(prompt).toContain("GENERATED_AI_DOCS_SENTINEL")
  expect(prompt).toContain("mock component props")
  expect(requestedUrls).toContain("https://docs.tscircuit.com/ai.txt")
})

it("still creates a local circuit prompt when generated docs fetch fails", async () => {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = input.toString()

    if (url === "https://docs.tscircuit.com/ai.txt") {
      return new Response("not found", { status: 404, statusText: "Not Found" })
    }

    return new Response("# Components\nmock component props", { status: 200 })
  }) as typeof fetch

  const prompt = await createLocalCircuitPrompt()

  expect(prompt).toContain("## tscircuit API overview")
  expect(prompt).toContain("mock component props")
  expect(prompt).not.toContain("## Generated tscircuit docs")
})
