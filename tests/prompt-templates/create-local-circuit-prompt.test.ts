import { afterEach, describe, expect, it } from "bun:test"
import {
  COMPONENT_TYPES_DOC_URL,
  GENERATED_TSCIRCUIT_DOCS_URL,
  createLocalCircuitPrompt,
  resetGeneratedTscircuitDocsCacheForTests,
  setGeneratedTscircuitDocsTimeoutForTests,
} from "../../lib/prompt-templates/create-local-circuit-prompt"

const originalFetch = globalThis.fetch

const mockFetch = (responses: Record<string, Response>) => {
  globalThis.fetch = async (input) => {
    const url = input.toString()
    const response = responses[url]
    if (!response) {
      return new Response("not found", { status: 404, statusText: "Not Found" })
    }
    return response
  }
}

describe("createLocalCircuitPrompt", () => {
  afterEach(() => {
    globalThis.fetch = originalFetch
    resetGeneratedTscircuitDocsCacheForTests()
  })

  it("includes the generated docs feed in the system prompt", async () => {
    mockFetch({
      [COMPONENT_TYPES_DOC_URL]: new Response(
        "# Component Types\n\nresistor docs",
      ),
      [GENERATED_TSCIRCUIT_DOCS_URL]: new Response(
        "Generated docs: use <jumper /> for solder jumpers.",
      ),
    })

    const prompt = await createLocalCircuitPrompt()

    expect(prompt).toContain("## Auto-generated tscircuit docs")
    expect(prompt).toContain(
      "Generated docs: use <jumper /> for solder jumpers.",
    )
    expect(prompt.indexOf("## Auto-generated tscircuit docs")).toBeLessThan(
      prompt.indexOf("## tscircuit API overview"),
    )
    expect(prompt).toContain("resistor docs")
  })

  it("still builds the prompt when generated docs are unavailable", async () => {
    mockFetch({
      [COMPONENT_TYPES_DOC_URL]: new Response("# Component Types\n\nchip docs"),
      [GENERATED_TSCIRCUIT_DOCS_URL]: new Response("server error", {
        status: 500,
        statusText: "Internal Server Error",
      }),
    })

    const prompt = await createLocalCircuitPrompt()

    expect(prompt).toContain("## tscircuit API overview")
    expect(prompt).toContain("chip docs")
    expect(prompt).not.toContain("## Auto-generated tscircuit docs")
  })

  it("caches generated docs during the process", async () => {
    const fetchCounts = new Map<string, number>()

    globalThis.fetch = async (input) => {
      const url = input.toString()
      fetchCounts.set(url, (fetchCounts.get(url) ?? 0) + 1)

      if (url === COMPONENT_TYPES_DOC_URL) {
        return new Response("# Component Types\n\nresistor docs")
      }

      if (url === GENERATED_TSCIRCUIT_DOCS_URL) {
        return new Response("Generated docs: cached once.")
      }

      return new Response("not found", { status: 404, statusText: "Not Found" })
    }

    await createLocalCircuitPrompt()
    await createLocalCircuitPrompt()

    expect(fetchCounts.get(COMPONENT_TYPES_DOC_URL)).toBe(2)
    expect(fetchCounts.get(GENERATED_TSCIRCUIT_DOCS_URL)).toBe(1)
  })

  it("retries generated docs after a transient failure", async () => {
    let generatedDocsAttempts = 0

    globalThis.fetch = async (input) => {
      const url = input.toString()

      if (url === COMPONENT_TYPES_DOC_URL) {
        return new Response("# Component Types\n\nresistor docs")
      }

      if (url === GENERATED_TSCIRCUIT_DOCS_URL) {
        generatedDocsAttempts += 1
        if (generatedDocsAttempts === 1) {
          return new Response("temporarily unavailable", {
            status: 503,
            statusText: "Service Unavailable",
          })
        }
        return new Response("Generated docs: recovered after retry.")
      }

      return new Response("not found", { status: 404, statusText: "Not Found" })
    }

    const promptAfterFailure = await createLocalCircuitPrompt()
    const promptAfterRetry = await createLocalCircuitPrompt()

    expect(promptAfterFailure).not.toContain("## Auto-generated tscircuit docs")
    expect(promptAfterRetry).toContain("Generated docs: recovered after retry.")
    expect(generatedDocsAttempts).toBe(2)
  })

  it("bounds slow generated docs fetches and retries after timeout", async () => {
    let generatedDocsAttempts = 0
    setGeneratedTscircuitDocsTimeoutForTests(1)

    globalThis.fetch = async (input, init) => {
      const url = input.toString()

      if (url === COMPONENT_TYPES_DOC_URL) {
        return new Response("# Component Types\n\nresistor docs")
      }

      if (url === GENERATED_TSCIRCUIT_DOCS_URL) {
        generatedDocsAttempts += 1
        if (generatedDocsAttempts === 1) {
          return await new Promise<Response>((resolve, reject) => {
            const timeoutId = setTimeout(
              () => resolve(new Response("Generated docs: too late.")),
              50,
            )
            init?.signal?.addEventListener("abort", () => {
              clearTimeout(timeoutId)
              reject(new DOMException("Aborted", "AbortError"))
            })
          })
        }
        return new Response("Generated docs: recovered after timeout.")
      }

      return new Response("not found", { status: 404, statusText: "Not Found" })
    }

    const promptAfterTimeout = await createLocalCircuitPrompt()
    const promptAfterRetry = await createLocalCircuitPrompt()

    expect(promptAfterTimeout).not.toContain("## Auto-generated tscircuit docs")
    expect(promptAfterRetry).toContain(
      "Generated docs: recovered after timeout.",
    )
    expect(generatedDocsAttempts).toBe(2)
  })
})
