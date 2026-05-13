import { afterEach, describe, expect, it } from "bun:test"
import { createLocalCircuitPrompt } from "../../lib/prompt-templates/create-local-circuit-prompt"

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe("createLocalCircuitPrompt", () => {
  it("includes generated ai docs when available", async () => {
    globalThis.fetch = (async (url) => {
      const href = url.toString()
      if (href.includes("COMPONENT_TYPES.md")) {
        return new Response("# Components\n\n<resistor />", { status: 200 })
      }
      if (href === "https://docs.tscircuit.com/ai.txt") {
        return new Response("Generated docs: use <smtpad /> carefully.", {
          status: 200,
        })
      }
      throw new Error(`Unexpected fetch URL: ${href}`)
    }) as typeof fetch

    const prompt = await createLocalCircuitPrompt()

    expect(prompt).toContain("## Auto-generated tscircuit docs")
    expect(prompt).toContain("Generated docs: use <smtpad /> carefully.")
  })

  it("still creates a prompt when generated ai docs are unavailable", async () => {
    globalThis.fetch = (async (url) => {
      const href = url.toString()
      if (href.includes("COMPONENT_TYPES.md")) {
        return new Response("# Components\n\n<capacitor />", { status: 200 })
      }
      if (href === "https://docs.tscircuit.com/ai.txt") {
        return new Response("missing", { status: 503, statusText: "Down" })
      }
      throw new Error(`Unexpected fetch URL: ${href}`)
    }) as typeof fetch

    const prompt = await createLocalCircuitPrompt()

    expect(prompt).toContain("## tscircuit API overview")
    expect(prompt).toContain("<capacitor />")
    expect(prompt).not.toContain("## Auto-generated tscircuit docs")
  })
})
