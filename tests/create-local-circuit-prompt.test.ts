import { afterEach, beforeEach, expect, test } from "bun:test"
import {
  createLocalCircuitPrompt,
  resetGeneratedDocsCacheForTests,
} from "lib/prompt-templates/create-local-circuit-prompt"

const originalFetch = globalThis.fetch
const generatedDocsUrl = "https://docs.tscircuit.com/llms.txt"
const legacyGeneratedDocsUrl = "https://docs.tscircuit.com/ai.txt"
const componentTypesUrl =
  "https://raw.githubusercontent.com/tscircuit/props/main/generated/COMPONENT_TYPES.md"
const propsOverviewUrl =
  "https://raw.githubusercontent.com/tscircuit/props/main/generated/PROPS_OVERVIEW.md"

beforeEach(() => {
  resetGeneratedDocsCacheForTests()
})

afterEach(() => {
  globalThis.fetch = originalFetch
  resetGeneratedDocsCacheForTests()
})

test("includes generated tscircuit docs when available", async () => {
  mockPromptDocsFetch({
    generatedDocsResponses: [
      new Response("Generated docs: prefer net aliases for shared rails."),
    ],
    propsDoc: "# Component Types\n\n## resistor\n\nUse resistance prop.",
    propsOverviewDoc:
      "# @tscircuit/props Overview\n\nUse chipProps.parse for validation.",
  })

  const prompt = await createLocalCircuitPrompt()

  expect(prompt).toContain("## Auto-generated tscircuit docs")
  expect(prompt).toContain("Generated docs: prefer net aliases")
  expect(prompt).toContain("Use resistance prop.")
  expect(prompt).toContain("Use chipProps.parse for validation.")
})

test("continues with component docs when generated docs are unavailable", async () => {
  mockPromptDocsFetch({
    generatedDocsResponses: [
      new Response("missing", { status: 404, statusText: "Not Found" }),
      new Response("missing", { status: 404, statusText: "Not Found" }),
    ],
    propsDoc: "# Component Types\n\n## capacitor\n\nUse capacitance prop.",
    propsOverviewDoc:
      "# @tscircuit/props Overview\n\nUse capacitorProps for validation.",
  })

  const prompt = await createLocalCircuitPrompt()

  expect(prompt).not.toContain("## Auto-generated tscircuit docs")
  expect(prompt).toContain("Use capacitance prop.")
  expect(prompt).toContain("Use capacitorProps for validation.")
  expect(prompt).toContain("YOU MUST ABIDE BY THE RULES IN THE RULES SECTION")
})

test("caches successful generated docs across prompt builds", async () => {
  const calls: string[] = []
  mockPromptDocsFetch({
    generatedDocsResponses: [new Response("Cached generated docs")],
    propsDoc: "# Component Types\n\n## led\n\nLED props.",
    propsOverviewDoc: "# @tscircuit/props Overview\n\nLED prop overview.",
    onRequest: (url) => calls.push(url),
  })

  await createLocalCircuitPrompt()
  await createLocalCircuitPrompt()

  expect(calls.filter((url) => url === generatedDocsUrl)).toHaveLength(1)
  expect(calls.filter((url) => url === legacyGeneratedDocsUrl)).toHaveLength(0)
  expect(calls.filter((url) => url === componentTypesUrl)).toHaveLength(2)
  expect(calls.filter((url) => url === propsOverviewUrl)).toHaveLength(2)
})

test("falls back to legacy generated docs URL", async () => {
  const calls: string[] = []
  mockPromptDocsFetch({
    generatedDocsResponses: [
      new Response("missing", { status: 404, statusText: "Not Found" }),
      new Response("Legacy generated docs"),
    ],
    propsDoc: "# Component Types\n\n## chip\n\nChip props.",
    propsOverviewDoc: "# @tscircuit/props Overview\n\nChip prop overview.",
    onRequest: (url) => calls.push(url),
  })

  const prompt = await createLocalCircuitPrompt()

  expect(prompt).toContain("Legacy generated docs")
  expect(calls.filter((url) => url === generatedDocsUrl)).toHaveLength(1)
  expect(calls.filter((url) => url === legacyGeneratedDocsUrl)).toHaveLength(1)
})

test("retries generated docs after a failed fetch", async () => {
  mockPromptDocsFetch({
    generatedDocsResponses: [
      new Response("temporary failure", {
        status: 503,
        statusText: "Service Unavailable",
      }),
      new Response("temporary failure", {
        status: 503,
        statusText: "Service Unavailable",
      }),
      new Response("Recovered generated docs"),
    ],
    propsDoc: "# Component Types\n\n## diode\n\nDiode props.",
    propsOverviewDoc: "# @tscircuit/props Overview\n\nDiode prop overview.",
  })

  const firstPrompt = await createLocalCircuitPrompt()
  const secondPrompt = await createLocalCircuitPrompt()

  expect(firstPrompt).not.toContain("Recovered generated docs")
  expect(secondPrompt).toContain("Recovered generated docs")
})

function mockPromptDocsFetch({
  generatedDocsResponses,
  propsDoc,
  propsOverviewDoc,
  onRequest,
}: {
  generatedDocsResponses: Response[]
  propsDoc: string
  propsOverviewDoc: string
  onRequest?: (url: string) => void
}) {
  globalThis.fetch = (async (input, init) => {
    const url = input.toString()
    onRequest?.(url)

    if (url === generatedDocsUrl || url === legacyGeneratedDocsUrl) {
      expect(init?.signal).toBeInstanceOf(AbortSignal)
      return generatedDocsResponses.shift() ?? new Response("", { status: 200 })
    }

    if (url === componentTypesUrl) {
      return new Response(propsDoc, { status: 200 })
    }

    if (url === propsOverviewUrl) {
      return new Response(propsOverviewDoc, { status: 200 })
    }

    return new Response(`Unexpected URL: ${url}`, { status: 500 })
  }) as typeof fetch
}
