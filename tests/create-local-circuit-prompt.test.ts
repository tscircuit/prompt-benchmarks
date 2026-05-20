import { afterEach, describe, expect, test } from "bun:test"
import { createLocalCircuitPrompt } from "lib/prompt-templates/create-local-circuit-prompt"

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

const mockFetch = (handler: (url: string) => Response | Promise<Response>) => {
  globalThis.fetch = ((input: RequestInfo | URL) => {
    const url = input.toString()
    return Promise.resolve(handler(url))
  }) as typeof fetch
}

describe("createLocalCircuitPrompt", () => {
  test("includes generated tscircuit docs when ai.txt is available", async () => {
    mockFetch((url) => {
      if (url === "https://docs.tscircuit.com/ai.txt") {
        return new Response("Generated docs: prefer <chip /> pinLabels", {
          status: 200,
        })
      }

      return new Response("# Components\n\n<resistor />\n", { status: 200 })
    })

    const prompt = await createLocalCircuitPrompt()

    expect(prompt).toContain("### Auto-generated tscircuit docs")
    expect(prompt).toContain("Generated docs: prefer <chip /> pinLabels")
  })

  test("still creates a prompt when generated docs cannot be fetched", async () => {
    mockFetch((url) => {
      if (url === "https://docs.tscircuit.com/ai.txt") {
        return new Response("not found", {
          status: 404,
          statusText: "Not Found",
        })
      }

      return new Response("# Components\n\n<resistor />\n", { status: 200 })
    })

    const prompt = await createLocalCircuitPrompt()

    expect(prompt).toContain("## tscircuit API overview")
    expect(prompt).not.toContain("### Auto-generated tscircuit docs")
  })
})
