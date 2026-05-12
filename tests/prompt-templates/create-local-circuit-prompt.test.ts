import { afterEach, expect, test } from "bun:test"
import { createLocalCircuitPrompt } from "lib/prompt-templates/create-local-circuit-prompt"

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

test("createLocalCircuitPrompt includes generated tscircuit docs", async () => {
  const fetchedUrls: string[] = []
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = input.toString()
    fetchedUrls.push(url)

    if (url.endsWith("/ai.txt")) {
      return new Response("# AI docs\n\nGenerated docs marker\n\n<resistor />")
    }

    return new Response("# Props\n\n<board />\n\n<chip />")
  }) as typeof fetch

  const prompt = await createLocalCircuitPrompt()

  expect(fetchedUrls).toContain("https://docs.tscircuit.com/ai.txt")
  expect(prompt).toContain("### Generated tscircuit docs")
  expect(prompt).toContain("Generated docs marker")
  expect(prompt).toContain("<resistor />")
})
