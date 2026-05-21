import { afterEach, expect, test } from "bun:test"
import { createLocalCircuitPrompt } from "lib/prompt-templates/create-local-circuit-prompt"

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

test("createLocalCircuitPrompt includes generated docs when available", async () => {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input)
    if (url === "https://docs.tscircuit.com/ai.txt") {
      return new Response("GENERATED_TSCIRCUIT_DOCS")
    }
    if (url.includes("COMPONENT_TYPES.md")) {
      return new Response("# Props\n<resistor /> docs")
    }
    throw new Error(`Unexpected fetch: ${url}`)
  }) as typeof fetch

  const prompt = await createLocalCircuitPrompt()

  expect(prompt).toContain("## Generated tscircuit docs")
  expect(prompt).toContain("GENERATED_TSCIRCUIT_DOCS")
  expect(prompt).toContain("<resistor /> docs")
})

test("createLocalCircuitPrompt still works when generated docs are unavailable", async () => {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input)
    if (url === "https://docs.tscircuit.com/ai.txt") {
      return new Response("missing", { status: 404, statusText: "Not Found" })
    }
    if (url.includes("COMPONENT_TYPES.md")) {
      return new Response("# Props\n<capacitor /> docs")
    }
    throw new Error(`Unexpected fetch: ${url}`)
  }) as typeof fetch

  const prompt = await createLocalCircuitPrompt()

  expect(prompt).not.toContain("## Generated tscircuit docs")
  expect(prompt).toContain("<capacitor /> docs")
})
