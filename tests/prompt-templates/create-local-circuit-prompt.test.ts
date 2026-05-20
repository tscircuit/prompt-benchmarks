import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test"
import {
  clearGeneratedDocsCacheForTests,
  createLocalCircuitPrompt,
} from "../../lib/prompt-templates/create-local-circuit-prompt"

const originalFetch = globalThis.fetch

beforeEach(() => {
  clearGeneratedDocsCacheForTests()
})

afterEach(() => {
  globalThis.fetch = originalFetch
  clearGeneratedDocsCacheForTests()
})

function mockDocsFetch(generatedDocsResponse: Response | Error) {
  const fetchMock = mock(async (url: string | URL | Request) => {
    const requestUrl = String(url)

    if (requestUrl === "https://docs.tscircuit.com/ai.txt") {
      if (generatedDocsResponse instanceof Error) {
        throw generatedDocsResponse
      }

      return generatedDocsResponse
    }

    if (
      requestUrl ===
      "https://raw.githubusercontent.com/tscircuit/props/main/generated/COMPONENT_TYPES.md"
    ) {
      return new Response("# Components\n\n<resistor />")
    }

    throw new Error(`Unexpected fetch URL: ${requestUrl}`)
  })

  globalThis.fetch = fetchMock as unknown as typeof fetch

  return fetchMock
}

describe("createLocalCircuitPrompt", () => {
  it("includes the generated tscircuit docs when they are available", async () => {
    mockDocsFetch(new Response("Generated docs content"))

    const prompt = await createLocalCircuitPrompt()

    expect(prompt).toContain("Generated tscircuit documentation:")
    expect(prompt).toContain("Generated docs content")
  })

  it("keeps creating the prompt when generated docs cannot be fetched", async () => {
    mockDocsFetch(new Error("docs unavailable"))

    const prompt = await createLocalCircuitPrompt()

    expect(prompt).toContain("Here's an overview of the tscircuit API:")
    expect(prompt).not.toContain("Generated tscircuit documentation:")
  })
})
