import { afterEach, expect, test } from "bun:test"
import { createLocalCircuitPrompt } from "../../lib/prompt-templates/create-local-circuit-prompt"

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

test("createLocalCircuitPrompt includes generated ai.txt docs", async () => {
  const requestedUrls: string[] = []

  globalThis.fetch = (async (input) => {
    const url = input instanceof Request ? input.url : String(input)
    requestedUrls.push(url)

    if (url === "https://docs.tscircuit.com/ai.txt") {
      return new Response(
        "# Generated Docs\nUse generated docs when selecting tscircuit APIs.\n",
      )
    }

    if (
      url ===
      "https://raw.githubusercontent.com/tscircuit/props/main/generated/COMPONENT_TYPES.md"
    ) {
      return new Response(
        '# Component Types\n<resistor name="R1" resistance="1k" />\n',
      )
    }

    throw new Error(`Unexpected fetch URL: ${url}`)
  }) as typeof fetch

  const prompt = await createLocalCircuitPrompt()

  expect(requestedUrls).toContain("https://docs.tscircuit.com/ai.txt")
  expect(prompt).toContain("## Auto-generated tscircuit docs")
  expect(prompt).toContain("Use generated docs when selecting tscircuit APIs.")
  expect(prompt).toContain('<resistor name="R1" resistance="1k" />')
})
