import { afterEach, describe, expect, it } from "bun:test"
import { createLocalCircuitPrompt } from "../../lib/prompt-templates/create-local-circuit-prompt"

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

describe("createLocalCircuitPrompt", () => {
  it("includes auto-generated docs when ai.txt is available", async () => {
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

    expect(prompt).toContain("Auto-Generated tscircuit Documentation")
    expect(prompt).toContain("Generated docs: use <smtpad /> carefully.")
  })

  it("still creates a prompt when ai.txt returns 404", async () => {
    globalThis.fetch = (async (url) => {
      const href = url.toString()
      if (href.includes("COMPONENT_TYPES.md")) {
        return new Response("# Components\n\n<capacitor />", { status: 200 })
      }
      if (href === "https://docs.tscircuit.com/ai.txt") {
        return new Response("Not Found", { status: 404, statusText: "Not Found" })
      }
      throw new Error(`Unexpected fetch URL: ${href}`)
    }) as typeof fetch

    const prompt = await createLocalCircuitPrompt()

    expect(prompt).toContain("## tscircuit API overview")
    expect(prompt).not.toContain("Auto-Generated tscircuit Documentation")
  })

  it("still creates a prompt when ai.txt fetch throws", async () => {
    globalThis.fetch = (async (url) => {
      const href = url.toString()
      if (href.includes("COMPONENT_TYPES.md")) {
        return new Response("# Components\n\n<capacitor />", { status: 200 })
      }
      if (href === "https://docs.tscircuit.com/ai.txt") {
        throw new Error("Network error")
      }
      throw new Error(`Unexpected fetch URL: ${href}`)
    }) as typeof fetch

    const prompt = await createLocalCircuitPrompt()

    expect(prompt).toContain("## tscircuit API overview")
    expect(prompt).not.toContain("Auto-Generated tscircuit Documentation")
  })

  it("places generated docs before the API overview section", async () => {
    globalThis.fetch = (async (url) => {
      const href = url.toString()
      if (href.includes("COMPONENT_TYPES.md")) {
        return new Response("# Components\n\n<resistor />", { status: 200 })
      }
      if (href === "https://docs.tscircuit.com/ai.txt") {
        return new Response("Docs content here.", { status: 200 })
      }
      throw new Error(`Unexpected fetch URL: ${href}`)
    }) as typeof fetch

    const prompt = await createLocalCircuitPrompt()

    const generatedDocsIndex = prompt.indexOf("Auto-Generated tscircuit Documentation")
    const apiOverviewIndex = prompt.indexOf("## tscircuit API overview")
    expect(generatedDocsIndex).toBeGreaterThan(-1)
    expect(generatedDocsIndex).toBeLessThan(apiOverviewIndex)
  })
})
