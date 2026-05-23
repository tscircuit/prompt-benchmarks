import { afterEach, beforeEach, expect, test } from "bun:test"
import {
  __resetGeneratedDocsCacheForTests,
  createLocalCircuitPrompt,
} from "../lib/prompt-templates/create-local-circuit-prompt"

const COMPONENT_TYPES_URL =
  "https://raw.githubusercontent.com/tscircuit/props/main/generated/COMPONENT_TYPES.md"
const GENERATED_DOCS_URL = "https://docs.tscircuit.com/ai.txt"

const originalFetch = globalThis.fetch

beforeEach(() => {
  __resetGeneratedDocsCacheForTests()
})

afterEach(() => {
  globalThis.fetch = originalFetch
  __resetGeneratedDocsCacheForTests()
})

test("includes generated docs in the local circuit system prompt", async () => {
  const requestedUrls: string[] = []
  mockFetch({
    requestedUrls,
    generatedDocs: "generated-docs-sentinel: prefer modern tscircuit APIs",
    propsDoc: "# Component Types\n\n## resistor\n\nresistance prop",
  })

  const prompt = await createLocalCircuitPrompt()

  expect(requestedUrls).toContain(GENERATED_DOCS_URL)
  expect(requestedUrls).toContain(COMPONENT_TYPES_URL)
  expect(prompt).toContain("## Auto-generated tscircuit docs")
  expect(prompt).toContain("generated-docs-sentinel")
  expect(prompt.indexOf("generated-docs-sentinel")).toBeLessThan(
    prompt.indexOf("## tscircuit API overview"),
  )
  expect(prompt).toContain("resistance prop")
})

test("still builds the prompt when generated docs are unavailable", async () => {
  mockFetch({
    generatedDocsStatus: 503,
    propsDoc: "# Component Types\n\n## capacitor\n\ncapacitance prop",
  })

  const prompt = await createLocalCircuitPrompt()

  expect(prompt).not.toContain("## Auto-generated tscircuit docs")
  expect(prompt).toContain("## tscircuit API overview")
  expect(prompt).toContain("capacitance prop")
})

test("caches generated docs across prompt builds", async () => {
  const requestedUrls: string[] = []
  mockFetch({
    requestedUrls,
    generatedDocs: "cached generated docs",
    propsDoc: "# Component Types\n\n## led\n\nled prop",
  })

  await createLocalCircuitPrompt()
  await createLocalCircuitPrompt()

  expect(requestedUrls.filter((url) => url === GENERATED_DOCS_URL)).toHaveLength(
    1,
  )
  expect(requestedUrls.filter((url) => url === COMPONENT_TYPES_URL)).toHaveLength(
    2,
  )
})

function mockFetch({
  requestedUrls,
  generatedDocs = "",
  generatedDocsStatus = 200,
  propsDoc,
}: {
  requestedUrls?: string[]
  generatedDocs?: string
  generatedDocsStatus?: number
  propsDoc: string
}) {
  globalThis.fetch = (async (input: string | URL | Request) => {
    const url = input.toString()
    requestedUrls?.push(url)

    if (url === GENERATED_DOCS_URL) {
      return new Response(generatedDocs, { status: generatedDocsStatus })
    }

    if (url === COMPONENT_TYPES_URL) {
      return new Response(propsDoc, { status: 200 })
    }

    return new Response(`Unexpected URL: ${url}`, { status: 500 })
  }) as typeof fetch
}
