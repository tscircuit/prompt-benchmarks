import { afterEach, describe, expect, it } from "bun:test"
import { createLocalCircuitPrompt } from "../../lib/prompt-templates/create-local-circuit-prompt"

const originalFetch = globalThis.fetch

const createTextResponse = (
  body: string,
  options: { ok?: boolean; status?: number; statusText?: string } = {},
) =>
  ({
    ok: options.ok ?? true,
    status: options.status ?? 200,
    statusText: options.statusText ?? "OK",
    text: async () => body,
  }) as Response

describe("createLocalCircuitPrompt", () => {
  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it("includes generated docs from the ai.txt feed", async () => {
    const fetchedUrls: string[] = []
    globalThis.fetch = (async (url: RequestInfo | URL) => {
      const urlString = url.toString()
      fetchedUrls.push(urlString)

      if (urlString === "https://docs.tscircuit.com/ai.txt") {
        return createTextResponse("Generated docs content for <board />")
      }

      return createTextResponse("# Component Types\n\n<board /> props doc")
    }) as typeof fetch

    const prompt = await createLocalCircuitPrompt()

    expect(fetchedUrls).toContain("https://docs.tscircuit.com/ai.txt")
    expect(prompt).toContain("## tscircuit Generated Documentation")
    expect(prompt).toContain("Generated docs content for <board />")
  })

  it("keeps creating prompts when the generated docs feed is unavailable", async () => {
    globalThis.fetch = (async (url: RequestInfo | URL) => {
      const urlString = url.toString()

      if (urlString === "https://docs.tscircuit.com/ai.txt") {
        return createTextResponse("Not found", {
          ok: false,
          status: 404,
          statusText: "Not Found",
        })
      }

      return createTextResponse("# Component Types\n\n<resistor /> props doc")
    }) as typeof fetch

    const prompt = await createLocalCircuitPrompt()

    expect(prompt).not.toContain("## tscircuit Generated Documentation")
    expect(prompt).toContain("<resistor /> props doc")
  })
})
