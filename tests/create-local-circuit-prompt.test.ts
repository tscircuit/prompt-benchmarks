import { afterEach, beforeEach, expect, test } from "bun:test"
import {
  createLocalCircuitPrompt,
  resetGeneratedDocsCacheForTests,
} from "../lib/prompt-templates/create-local-circuit-prompt"

const originalFetch = globalThis.fetch

beforeEach(() => {
  resetGeneratedDocsCacheForTests()
})

afterEach(() => {
  globalThis.fetch = originalFetch
  resetGeneratedDocsCacheForTests()
})

function mockFetchWithGeneratedDocs(generatedDocsResponse: string | Error) {
  const calls: string[] = []

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = input.toString()
    calls.push(url)

    if (url === "https://docs.tscircuit.com/ai.txt") {
      if (generatedDocsResponse instanceof Error) {
        throw generatedDocsResponse
      }

      return new Response(generatedDocsResponse)
    }

    if (
      url ===
      "https://raw.githubusercontent.com/tscircuit/props/main/generated/COMPONENT_TYPES.md"
    ) {
      return new Response('# Component Types\n\n<led name="LED1" />')
    }

    return new Response("not found", { status: 404, statusText: "Not Found" })
  }) as typeof fetch

  return calls
}

test("includes generated tscircuit docs when ai.txt is available", async () => {
  mockFetchWithGeneratedDocs(
    "Use net aliases for shared rails.\nPrefer explicit footprints.",
  )

  const prompt = await createLocalCircuitPrompt()

  expect(prompt).toContain("### Generated tscircuit docs")
  expect(prompt).toContain("Use net aliases for shared rails.")
  expect(prompt).toContain("Prefer explicit footprints.")
  expect(prompt).toContain('<led name="LED1" />')
})

test("continues without generated docs when ai.txt cannot be loaded", async () => {
  mockFetchWithGeneratedDocs(new Error("docs unavailable"))

  const prompt = await createLocalCircuitPrompt()

  expect(prompt).not.toContain("### Generated tscircuit docs")
  expect(prompt).toContain('<led name="LED1" />')
  expect(prompt).toContain("YOU MUST ABIDE BY THE RULES IN THE RULES SECTION")
})

test("caches generated docs across prompt creation calls", async () => {
  const calls = mockFetchWithGeneratedDocs("Generated docs body")

  await createLocalCircuitPrompt()
  await createLocalCircuitPrompt()

  const generatedDocsCalls = calls.filter(
    (url) => url === "https://docs.tscircuit.com/ai.txt",
  )
  expect(generatedDocsCalls).toHaveLength(1)
})
