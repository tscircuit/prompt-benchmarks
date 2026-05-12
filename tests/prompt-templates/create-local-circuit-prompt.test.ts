import { afterEach, describe, expect, it } from "bun:test"
import { createLocalCircuitPrompt } from "lib/prompt-templates/create-local-circuit-prompt"

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe("createLocalCircuitPrompt", () => {
  it("includes the generated tscircuit docs in the system prompt", async () => {
    globalThis.fetch = async (url) => {
      const requestedUrl = url.toString()
      if (requestedUrl === "https://docs.tscircuit.com/ai.txt") {
        return {
          ok: true,
          text: async () => "GENERATED_TSCIRCUIT_DOCS",
        } as Response
      }
      if (
        requestedUrl ===
        "https://raw.githubusercontent.com/tscircuit/props/main/generated/COMPONENT_TYPES.md"
      ) {
        return {
          ok: true,
          text: async () => "# Props\n\nPROP_COMPONENT_DOCS",
        } as Response
      }
      throw new Error(`Unexpected fetch URL: ${requestedUrl}`)
    }

    const prompt = await createLocalCircuitPrompt()

    expect(prompt).toContain("## Auto-generated tscircuit docs")
    expect(prompt).toContain("<tscircuit_generated_docs>")
    expect(prompt).toContain("GENERATED_TSCIRCUIT_DOCS")
    expect(prompt).toContain("PROP_COMPONENT_DOCS")
  })

  it("keeps building the prompt if the generated docs endpoint is unavailable", async () => {
    globalThis.fetch = async (url) => {
      const requestedUrl = url.toString()
      if (requestedUrl === "https://docs.tscircuit.com/ai.txt") {
        return {
          ok: false,
          status: 503,
          statusText: "Service Unavailable",
          text: async () => "",
        } as Response
      }
      if (
        requestedUrl ===
        "https://raw.githubusercontent.com/tscircuit/props/main/generated/COMPONENT_TYPES.md"
      ) {
        return {
          ok: true,
          text: async () => "# Props\n\nPROP_COMPONENT_DOCS",
        } as Response
      }
      throw new Error(`Unexpected fetch URL: ${requestedUrl}`)
    }

    const prompt = await createLocalCircuitPrompt()

    expect(prompt).toContain("## Auto-generated tscircuit docs")
    expect(prompt).toContain("<tscircuit_generated_docs>")
    expect(prompt).toContain("</tscircuit_generated_docs>")
    expect(prompt).toContain("PROP_COMPONENT_DOCS")
  })
})
