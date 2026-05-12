import { afterEach, describe, expect, it } from "bun:test"
import { createLocalCircuitPrompt } from "../../lib/prompt-templates/create-local-circuit-prompt"

describe("createLocalCircuitPrompt", () => {
  const originalFetch = globalThis.fetch

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it("includes generated tscircuit docs in the system prompt", async () => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = input.toString()

      if (url === "https://docs.tscircuit.com/ai.txt") {
        return new Response("Generated docs marker", { status: 200 })
      }

      if (
        url ===
        "https://raw.githubusercontent.com/tscircuit/props/main/generated/COMPONENT_TYPES.md"
      ) {
        return new Response("# Components\n\n<resistor />", { status: 200 })
      }

      throw new Error(`Unexpected URL: ${url}`)
    }) as typeof fetch

    const prompt = await createLocalCircuitPrompt()

    expect(prompt).toContain("## Generated tscircuit documentation")
    expect(prompt).toContain("Generated docs marker")
  })

  it("still creates a prompt when generated docs are unavailable", async () => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = input.toString()

      if (url === "https://docs.tscircuit.com/ai.txt") {
        return new Response("Unavailable", {
          status: 503,
          statusText: "Service Unavailable",
        })
      }

      if (
        url ===
        "https://raw.githubusercontent.com/tscircuit/props/main/generated/COMPONENT_TYPES.md"
      ) {
        return new Response("# Components\n\n<resistor />", { status: 200 })
      }

      throw new Error(`Unexpected URL: ${url}`)
    }) as typeof fetch

    const prompt = await createLocalCircuitPrompt()

    expect(prompt).toContain("## Generated tscircuit documentation")
    expect(prompt).toContain("## tscircuit API overview")
  })
})
