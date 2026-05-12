import { afterEach, beforeEach, expect, it, spyOn } from "bun:test"
import {
  clearGeneratedDocsCacheForTests,
  createLocalCircuitPrompt,
} from "lib/prompt-templates/create-local-circuit-prompt"

const propsDoc = `# Components

## resistor
Use <resistor /> with resistance and footprint props.
`

type MockResponse =
  | string
  | { body: string; status?: number; statusText?: string }
  | Error

const mockFetch = (responses: Record<string, MockResponse>) => {
  const originalFetch = globalThis.fetch
  const calls: string[] = []

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input)
    calls.push(url)
    const response = responses[url]
    if (response instanceof Error) throw response
    if (!response) throw new Error(`Unexpected fetch: ${url}`)
    if (typeof response === "string") return new Response(response)
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
    })
  }) as typeof fetch

  return {
    calls,
    restore: () => {
      globalThis.fetch = originalFetch
    },
  }
}

beforeEach(() => {
  clearGeneratedDocsCacheForTests()
})

afterEach(() => {
  clearGeneratedDocsCacheForTests()
})

it("includes generated docs from ai.txt in the local circuit prompt", async () => {
  const fetchMock = mockFetch({
    "https://raw.githubusercontent.com/tscircuit/props/main/generated/COMPONENT_TYPES.md":
      propsDoc,
    "https://docs.tscircuit.com/ai.txt":
      "Use <netlabel /> for readable net names.",
  })

  try {
    const prompt = await createLocalCircuitPrompt()

    expect(prompt).toContain("### Generated tscircuit docs")
    expect(prompt).toContain("Use <netlabel /> for readable net names.")
    expect(prompt).toContain(
      "Use <resistor /> with resistance and footprint props.",
    )
  } finally {
    fetchMock.restore()
  }
})

it("continues building the prompt when generated docs are unavailable", async () => {
  const warn = spyOn(console, "warn").mockImplementation(() => {})
  const fetchMock = mockFetch({
    "https://raw.githubusercontent.com/tscircuit/props/main/generated/COMPONENT_TYPES.md":
      propsDoc,
    "https://docs.tscircuit.com/ai.txt": {
      body: "not found",
      status: 404,
      statusText: "Not Found",
    },
  })

  try {
    const prompt = await createLocalCircuitPrompt()

    expect(prompt).not.toContain("### Generated tscircuit docs")
    expect(prompt).toContain(
      "Use <resistor /> with resistance and footprint props.",
    )
    expect(warn).toHaveBeenCalled()
  } finally {
    fetchMock.restore()
    warn.mockRestore()
  }
})

it("caches generated docs across prompt builds", async () => {
  const fetchMock = mockFetch({
    "https://raw.githubusercontent.com/tscircuit/props/main/generated/COMPONENT_TYPES.md":
      propsDoc,
    "https://docs.tscircuit.com/ai.txt": "Cached generated docs body.",
  })

  try {
    await createLocalCircuitPrompt()
    await createLocalCircuitPrompt()

    expect(
      fetchMock.calls.filter(
        (url) => url === "https://docs.tscircuit.com/ai.txt",
      ),
    ).toHaveLength(1)
  } finally {
    fetchMock.restore()
  }
})
