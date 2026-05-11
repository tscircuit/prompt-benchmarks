import { afterEach, expect, it } from "bun:test"
import { createLocalCircuitPrompt } from "../../lib/prompt-templates/create-local-circuit-prompt"

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

it("includes generated tscircuit docs in the local circuit system prompt", async () => {
  const generatedDocs =
    "AUTO GENERATED TSCIRCUIT DOCS\nUse generated trace docs here."
  const propsDoc = '# Component Types\n\n<resistor resistance="1k" />'

  globalThis.fetch = async (input: RequestInfo | URL) => {
    const url = input.toString()

    if (url === "https://docs.tscircuit.com/ai.txt") {
      return new Response(generatedDocs)
    }

    if (
      url ===
      "https://raw.githubusercontent.com/tscircuit/props/main/generated/COMPONENT_TYPES.md"
    ) {
      return new Response(propsDoc)
    }

    throw new Error(`Unexpected fetch URL: ${url}`)
  }

  const prompt = await createLocalCircuitPrompt()

  expect(prompt).toContain("## Generated tscircuit docs")
  expect(prompt).toContain(generatedDocs)
  expect(prompt).toContain("## Hand-written tscircuit API overview")
  expect(prompt).toContain('<resistor resistance="1k" />')
})

it("keeps the local circuit prompt usable when generated docs are unavailable", async () => {
  const propsDoc = '# Component Types\n\n<resistor resistance="1k" />'

  globalThis.fetch = async (input: RequestInfo | URL) => {
    const url = input.toString()

    if (url === "https://docs.tscircuit.com/ai.txt") {
      return new Response("Not found", { status: 404 })
    }

    if (
      url ===
      "https://raw.githubusercontent.com/tscircuit/props/main/generated/COMPONENT_TYPES.md"
    ) {
      return new Response(propsDoc)
    }

    throw new Error(`Unexpected fetch URL: ${url}`)
  }

  const prompt = await createLocalCircuitPrompt()

  expect(prompt).not.toContain("## Generated tscircuit docs")
  expect(prompt).toContain("## tscircuit API overview")
  expect(prompt).toContain('<resistor resistance="1k" />')
})
