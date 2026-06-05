import { afterEach, expect, mock, test } from "bun:test"
import { createLocalCircuitPrompt } from "../lib/prompt-templates/create-local-circuit-prompt"

const originalFetch = global.fetch

test("createLocalCircuitPrompt includes fetched ai.txt and props data", async () => {
  global.fetch = mock(async (url: string | Request | URL) => {
    const urlStr = url.toString()
    if (urlStr.includes("COMPONENT_TYPES.md")) {
      return new Response("Mocked COMPONENT_TYPES content", { status: 200 })
    }
    if (urlStr.includes("ai.txt")) {
      return new Response("Mocked AI txt documentation content", {
        status: 200,
      })
    }
    return new Response("Not found", { status: 404 })
  }) as any

  const prompt = await createLocalCircuitPrompt()

  expect(prompt).toContain("Mocked COMPONENT_TYPES content")
  expect(prompt).toContain("Mocked AI txt documentation content")

  global.fetch = originalFetch
})

test("createLocalCircuitPrompt handles fetch failures gracefully", async () => {
  global.fetch = mock(async () => {
    throw new Error("Network error")
  }) as any

  // Should not throw
  const prompt = await createLocalCircuitPrompt()

  // Should still contain base sections
  expect(prompt).toContain("You are an expert in electronic circuit design")

  global.fetch = originalFetch
})
