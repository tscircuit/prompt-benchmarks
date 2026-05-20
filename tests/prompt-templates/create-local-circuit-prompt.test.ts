import { afterEach, describe, expect, it } from "bun:test"
import { createLocalCircuitPrompt } from "../../lib/prompt-templates/create-local-circuit-prompt"

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe("createLocalCircuitPrompt", () => {
  it("includes generated AI docs in the system prompt", async () => {
    const fetchCalls: string[] = []

    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input)
      fetchCalls.push(url)

      if (url === "https://docs.tscircuit.com/ai.txt") {
        return new Response(
          "# AI docs\nUse <jumper /> for intentional removable connections.",
        )
      }

      return new Response(
        "# Component Types\n<resistor /> accepts resistance and footprint props.",
      )
    }) as typeof fetch

    const prompt = await createLocalCircuitPrompt()

    expect(fetchCalls).toContain("https://docs.tscircuit.com/ai.txt")
    expect(fetchCalls).toContain(
      "https://raw.githubusercontent.com/tscircuit/props/main/generated/COMPONENT_TYPES.md",
    )
    expect(prompt).toContain("## Auto-generated tscircuit docs")
    expect(prompt).toContain(
      "Use <jumper /> for intentional removable connections.",
    )
    expect(prompt).toContain(
      "<resistor /> accepts resistance and footprint props.",
    )
  })

  it("falls back when generated AI docs cannot be fetched", async () => {
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      const url = String(input)

      if (url === "https://docs.tscircuit.com/ai.txt") {
        return new Response("not found", {
          status: 404,
          statusText: "Not Found",
        })
      }

      return new Response("# Component Types\n<capacitor /> is supported.")
    }) as typeof fetch

    const prompt = await createLocalCircuitPrompt()

    expect(prompt).not.toContain("## Auto-generated tscircuit docs")
    expect(prompt).toContain("<capacitor /> is supported.")
    expect(prompt).toContain("## tscircuit API overview")
  })
})
