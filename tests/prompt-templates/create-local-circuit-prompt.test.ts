import { createLocalCircuitPrompt } from "lib/prompt-templates/create-local-circuit-prompt"
import { expect, test, mock, beforeEach, afterEach } from "bun:test"

const MOCK_AI_TXT = `# tscircuit Auto-Generated Docs\n\nUse <board> as the root component.`
const MOCK_PROPS_DOC = `# Component Types\n\n## resistor\n\nA resistor component.`

beforeEach(() => {
  globalThis.fetch = mock(async (url: string) => {
    if (url === "https://docs.tscircuit.com/ai.txt") {
      return new Response(MOCK_AI_TXT, { status: 200 })
    }
    return new Response(MOCK_PROPS_DOC, { status: 200 })
  }) as any
})

afterEach(() => {
  globalThis.fetch = undefined as any
})

test("createLocalCircuitPrompt includes auto-generated docs when ai.txt is available", async () => {
  const prompt = await createLocalCircuitPrompt()
  expect(prompt).toInclude("Auto-Generated tscircuit Documentation")
  expect(prompt).toInclude(MOCK_AI_TXT)
})

test("createLocalCircuitPrompt still works when ai.txt returns 404", async () => {
  globalThis.fetch = mock(async (url: string) => {
    if (url === "https://docs.tscircuit.com/ai.txt") {
      return new Response("Not Found", { status: 404 })
    }
    return new Response(MOCK_PROPS_DOC, { status: 200 })
  }) as any

  const prompt = await createLocalCircuitPrompt()
  expect(prompt).toInclude("tscircuit API overview")
  expect(prompt).not.toInclude("Auto-Generated tscircuit Documentation")
})

test("createLocalCircuitPrompt still works when ai.txt fetch throws", async () => {
  globalThis.fetch = mock(async (url: string) => {
    if (url === "https://docs.tscircuit.com/ai.txt") {
      throw new Error("Network error")
    }
    return new Response(MOCK_PROPS_DOC, { status: 200 })
  }) as any

  const prompt = await createLocalCircuitPrompt()
  expect(prompt).toInclude("tscircuit API overview")
  expect(prompt).not.toInclude("Auto-Generated tscircuit Documentation")
})

test("createLocalCircuitPrompt places generated docs before API overview section", async () => {
  const prompt = await createLocalCircuitPrompt()
  const generatedDocsIndex = prompt.indexOf("Auto-Generated tscircuit Documentation")
  const apiOverviewIndex = prompt.indexOf("## tscircuit API overview")
  expect(generatedDocsIndex).toBeGreaterThan(-1)
  expect(generatedDocsIndex).toBeLessThan(apiOverviewIndex)
})
