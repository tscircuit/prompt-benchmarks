import { afterEach, beforeEach, expect, test } from "bun:test"
import { createLocalCircuitPrompt } from "lib/prompt-templates/create-local-circuit-prompt"

// Issue #45: createLocalCircuitPrompt must include the auto-generated docs
// served at https://docs.tscircuit.com/ai.txt in the system prompt, and must
// remain resilient if that optional fetch fails.

const PROPS_DOC_URL =
  "https://raw.githubusercontent.com/tscircuit/props/main/generated/COMPONENT_TYPES.md"
const AI_DOC_URL = "https://docs.tscircuit.com/ai.txt"

const STUB_PROPS_DOC = `# Components

resistor: a passive resistor
capacitor: a passive capacitor
`

const STUB_AI_DOC =
  "<file_summary>auto-generated tscircuit docs for AI</file_summary>\nsentinel-marker-for-issue-45"

type FetchFn = typeof fetch
let originalFetch: FetchFn

beforeEach(() => {
  originalFetch = globalThis.fetch
})

afterEach(() => {
  globalThis.fetch = originalFetch
})

test("includes generated docs from docs.tscircuit.com/ai.txt when fetch succeeds", async () => {
  const calls: string[] = []
  globalThis.fetch = (async (input: any) => {
    const url = typeof input === "string" ? input : input.url
    calls.push(url)
    if (url === AI_DOC_URL) {
      return new Response(STUB_AI_DOC, { status: 200 })
    }
    if (url === PROPS_DOC_URL) {
      return new Response(STUB_PROPS_DOC, { status: 200 })
    }
    return new Response("", { status: 404 })
  }) as unknown as FetchFn

  const prompt = await createLocalCircuitPrompt()

  expect(calls).toContain(AI_DOC_URL)
  expect(calls).toContain(PROPS_DOC_URL)
  expect(prompt).toInclude("sentinel-marker-for-issue-45")
  // The generated docs section should sit ahead of the handwritten overview.
  expect(prompt.indexOf("sentinel-marker-for-issue-45")).toBeLessThan(
    prompt.indexOf("## tscircuit API overview"),
  )
})

test("falls back gracefully when the generated-docs fetch fails", async () => {
  globalThis.fetch = (async (input: any) => {
    const url = typeof input === "string" ? input : input.url
    if (url === AI_DOC_URL) {
      return new Response("not found", { status: 404 })
    }
    if (url === PROPS_DOC_URL) {
      return new Response(STUB_PROPS_DOC, { status: 200 })
    }
    return new Response("", { status: 404 })
  }) as unknown as FetchFn

  const prompt = await createLocalCircuitPrompt()

  expect(prompt).not.toInclude("sentinel-marker-for-issue-45")
  // The rest of the prompt is still produced.
  expect(prompt).toInclude("## tscircuit API overview")
  expect(prompt).toInclude("### RULES")
})

test("falls back gracefully when the generated-docs fetch throws", async () => {
  globalThis.fetch = (async (input: any) => {
    const url = typeof input === "string" ? input : input.url
    if (url === AI_DOC_URL) {
      throw new Error("network unreachable")
    }
    if (url === PROPS_DOC_URL) {
      return new Response(STUB_PROPS_DOC, { status: 200 })
    }
    return new Response("", { status: 404 })
  }) as unknown as FetchFn

  const prompt = await createLocalCircuitPrompt()

  expect(prompt).not.toInclude("sentinel-marker-for-issue-45")
  expect(prompt).toInclude("## tscircuit API overview")
})
