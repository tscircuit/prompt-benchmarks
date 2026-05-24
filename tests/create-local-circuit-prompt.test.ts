import { afterEach, expect, test } from "bun:test"
import {
  __resetGeneratedDocsCacheForTests,
  createLocalCircuitPrompt,
} from "../lib/prompt-templates/create-local-circuit-prompt"

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
  __resetGeneratedDocsCacheForTests()
})

test("includes generated docs when ai.txt is available", async () => {
  globalThis.fetch = async (url) =>
    new Response(
      url.toString().includes("ai.txt")
        ? "Generated docs content"
        : "# Component Types\n\ncomponent props content",
    )

  const prompt = await createLocalCircuitPrompt()

  expect(prompt).toContain("## Auto-generated tscircuit docs")
  expect(prompt).toContain("Generated docs content")
  expect(prompt).toContain("component props content")
})

test("keeps prompt creation working when generated docs fail", async () => {
  globalThis.fetch = async (url) => {
    if (url.toString().includes("ai.txt")) {
      throw new Error("docs unavailable")
    }

    return new Response("# Component Types\n\ncomponent props content")
  }

  const prompt = await createLocalCircuitPrompt()

  expect(prompt).not.toContain("## Auto-generated tscircuit docs")
  expect(prompt).toContain("component props content")
})
