import { afterEach, beforeEach, expect, test } from "bun:test"
import {
  __resetGeneratedDocsCacheForTests,
  createLocalCircuitPrompt,
} from "lib/prompt-templates/create-local-circuit-prompt"

const originalFetch = globalThis.fetch

beforeEach(() => {
  __resetGeneratedDocsCacheForTests()
})

afterEach(() => {
  globalThis.fetch = originalFetch
  __resetGeneratedDocsCacheForTests()
})

test("includes generated tscircuit docs when available", async () => {
  mockFetch({
    generatedDocs: "Generated docs: prefer <resistor /> with resistance.",
    propsDoc: "# Component Types\n\n## resistor\n\nresistance prop",
  })

  const prompt = await createLocalCircuitPrompt()

  expect(prompt).toContain("### Generated tscircuit docs")
  expect(prompt).toContain("Generated docs: prefer <resistor />")
  expect(prompt).toContain("resistance prop")
})

test("falls back to props docs when generated docs fetch fails", async () => {
  mockFetch({
    generatedDocsError: true,
    propsDoc: "# Component Types\n\n## capacitor\n\ncapacitance prop",
  })

  const prompt = await createLocalCircuitPrompt()

  expect(prompt).not.toContain("### Generated tscircuit docs")
  expect(prompt).toContain("capacitance prop")
})

test("caches generated docs across prompt builds", async () => {
  const requestedUrls: string[] = []
  mockFetch({
    generatedDocs: "Cached generated docs",
    propsDoc: "# Component Types\n\n## led",
    onRequest: (url) => requestedUrls.push(url),
  })

  await createLocalCircuitPrompt()
  await createLocalCircuitPrompt()

  expect(
    requestedUrls.filter((url) => url === "https://docs.tscircuit.com/ai.txt"),
  ).toHaveLength(1)
})

function mockFetch({
  generatedDocs,
  generatedDocsError = false,
  propsDoc,
  onRequest,
}: {
  generatedDocs?: string
  generatedDocsError?: boolean
  propsDoc: string
  onRequest?: (url: string) => void
}) {
  globalThis.fetch = (async (url: string | URL | Request) => {
    const urlString = url.toString()
    onRequest?.(urlString)

    if (urlString === "https://docs.tscircuit.com/ai.txt") {
      if (generatedDocsError) {
        return new Response("Not found", { status: 404 })
      }
      return new Response(generatedDocs ?? "", { status: 200 })
    }

    if (
      urlString ===
      "https://raw.githubusercontent.com/tscircuit/props/main/generated/COMPONENT_TYPES.md"
    ) {
      return new Response(propsDoc, { status: 200 })
    }

    return new Response("Unexpected URL", { status: 500 })
  }) as typeof fetch
}
