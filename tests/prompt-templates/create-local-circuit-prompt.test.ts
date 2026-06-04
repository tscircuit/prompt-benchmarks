import { afterEach, expect, test } from "bun:test"
import {
  GENERATED_PROPS_DOC_URL,
  GENERATED_PROPS_OVERVIEW_URL,
  cleanGeneratedDoc,
  createLocalCircuitPrompt,
} from "../../lib/prompt-templates/create-local-circuit-prompt"

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

test("cleanGeneratedDoc strips markdown headings and collapses blank lines", () => {
  expect(cleanGeneratedDoc("# Heading\n\nbody\n\n\n## Subheading\nvalue")).toBe(
    "body\n\nvalue",
  )
})

test("createLocalCircuitPrompt includes generated props overview and component docs", async () => {
  const fetchedUrls: string[] = []

  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input)
    fetchedUrls.push(url)

    if (url === GENERATED_PROPS_OVERVIEW_URL) {
      return new Response("# Props Overview\n\nUse pcbX for placement.")
    }

    if (url === GENERATED_PROPS_DOC_URL) {
      return new Response("# Component Types\n\n<resistor resistance=\"1k\" />")
    }

    return new Response("not found", { status: 404 })
  }) as typeof fetch

  const prompt = await createLocalCircuitPrompt()

  expect(fetchedUrls).toContain(GENERATED_PROPS_OVERVIEW_URL)
  expect(fetchedUrls).toContain(GENERATED_PROPS_DOC_URL)
  expect(prompt).toContain("Use pcbX for placement.")
  expect(prompt).toContain('<resistor resistance="1k" />')
  expect(prompt).toContain("auto-generated props overview")
  expect(prompt).toContain("auto-generated documentation")
})
