import { afterEach, expect, test } from "bun:test"
import { createLocalCircuitPrompt } from "lib/prompt-templates/create-local-circuit-prompt"

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

test("includes generated tscircuit docs in the local circuit prompt", async () => {
  const fetchedUrls: string[] = []

  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = input.toString()
    fetchedUrls.push(url)

    if (
      url ===
      "https://raw.githubusercontent.com/tscircuit/props/main/generated/COMPONENT_TYPES.md"
    ) {
      return new Response("# Components\n\nGenerated component props")
    }

    if (url === "https://docs.tscircuit.com/ai.txt") {
      return new Response("Generated AI docs content")
    }

    return new Response("", { status: 404, statusText: "Not Found" })
  }) as typeof fetch

  const prompt = await createLocalCircuitPrompt()

  expect(fetchedUrls).toContain("https://docs.tscircuit.com/ai.txt")
  expect(prompt).toContain("## Generated tscircuit Documentation")
  expect(prompt).toContain("Generated AI docs content")
  expect(prompt).toContain("Generated component props")
})
