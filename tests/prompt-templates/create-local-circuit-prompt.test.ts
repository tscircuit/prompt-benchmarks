import { afterEach, expect, test } from "bun:test"
import { createLocalCircuitPrompt } from "lib/prompt-templates/create-local-circuit-prompt"

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

test("includes generated docs in the local circuit system prompt", async () => {
  const requestedUrls: string[] = []

  globalThis.fetch = (async (input) => {
    const url = String(input)
    requestedUrls.push(url)

    if (url === "https://docs.tscircuit.com/ai.txt") {
      return new Response('Use <chip name="U1" /> from generated docs')
    }

    return new Response("# Components\n<resistor />")
  }) as typeof fetch

  const prompt = await createLocalCircuitPrompt()

  expect(requestedUrls).toContain("https://docs.tscircuit.com/ai.txt")
  expect(prompt).toContain("## Current auto-generated tscircuit docs")
  expect(prompt).toContain('Use <chip name="U1" /> from generated docs')
})

test("keeps prompt generation working when generated docs fetch fails", async () => {
  globalThis.fetch = (async (input) => {
    const url = String(input)

    if (url === "https://docs.tscircuit.com/ai.txt") {
      return new Response("missing", { status: 503, statusText: "Offline" })
    }

    return new Response("# Components\n<resistor />")
  }) as typeof fetch

  const prompt = await createLocalCircuitPrompt()

  expect(prompt).toContain("## tscircuit API overview")
  expect(prompt).not.toContain("## Current auto-generated tscircuit docs")
})
