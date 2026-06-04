import { afterEach, beforeEach, expect, test } from "bun:test"
import {
  createLocalCircuitPrompt,
  resetGeneratedDocsCacheForTests,
} from "lib/prompt-templates/create-local-circuit-prompt"

const originalFetch = globalThis.fetch
const originalConsoleError = console.error

beforeEach(() => {
  resetGeneratedDocsCacheForTests()
  console.error = () => {}
})

afterEach(() => {
  globalThis.fetch = originalFetch
  console.error = originalConsoleError
})

test("includes generated docs from ai.txt in the local circuit prompt", async () => {
  globalThis.fetch = async (input: RequestInfo | URL) => {
    const url = input.toString()

    if (url === "https://docs.tscircuit.com/ai.txt") {
      return new Response("Use <resistor /> with resistance and footprint.")
    }

    if (url.includes("COMPONENT_TYPES.md")) {
      return new Response("# Components\n\n<resistor /> props")
    }

    throw new Error(`Unexpected fetch: ${url}`)
  }

  const prompt = await createLocalCircuitPrompt()

  expect(prompt).toContain("### Auto-generated tscircuit docs")
  expect(prompt).toContain("Use <resistor /> with resistance and footprint.")
  expect(prompt).toContain("<resistor /> props")
})

test("keeps prompt generation working when generated docs cannot be fetched", async () => {
  globalThis.fetch = async (input: RequestInfo | URL) => {
    const url = input.toString()

    if (url === "https://docs.tscircuit.com/ai.txt") {
      return new Response("missing", { status: 500, statusText: "Error" })
    }

    if (url.includes("COMPONENT_TYPES.md")) {
      return new Response("# Components\n\n<capacitor /> props")
    }

    throw new Error(`Unexpected fetch: ${url}`)
  }

  const prompt = await createLocalCircuitPrompt()

  expect(prompt).not.toContain("### Auto-generated tscircuit docs")
  expect(prompt).toContain("<capacitor /> props")
})
