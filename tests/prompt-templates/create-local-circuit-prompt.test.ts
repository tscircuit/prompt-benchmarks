import { afterEach, expect, test } from "bun:test"
import { createLocalCircuitPrompt } from "lib/prompt-templates/create-local-circuit-prompt"

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

test("createLocalCircuitPrompt includes generated ai docs when available", async () => {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input)

    if (url === "https://docs.tscircuit.com/ai.txt") {
      return new Response("Use <chip /> pinLabels for IC pins.")
    }

    return new Response("# Props\n\n<resistor /> props")
  }) as typeof fetch

  const prompt = await createLocalCircuitPrompt()

  expect(prompt).toContain("## Generated tscircuit docs")
  expect(prompt).toContain("Use <chip /> pinLabels for IC pins.")
})

test("createLocalCircuitPrompt still builds when generated ai docs cannot be fetched", async () => {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input)

    if (url === "https://docs.tscircuit.com/ai.txt") {
      return new Response("not found", { status: 404 })
    }

    return new Response("# Props\n\n<resistor /> props")
  }) as typeof fetch

  const prompt = await createLocalCircuitPrompt()

  expect(prompt).toContain("Here's an overview of the tscircuit API")
  expect(prompt).not.toContain("## Generated tscircuit docs")
})
