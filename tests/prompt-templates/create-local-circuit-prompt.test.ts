import { afterEach, expect, mock, test } from "bun:test"

mock.module("@tscircuit/footprinter", () => ({
  getFootprintNamesByType: () => ({
    normalFootprintNames: ["0402"],
  }),
  getFootprintSizes: () => [{ imperial: "0402" }],
  fp: {
    string: () => ({
      json: () => ({ footprint: "0402" }),
    }),
  },
}))

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

function mockFetchByUrl(responses: Record<string, Response>) {
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const response = responses[String(input)]
    if (response) return response
    return new Response("Not found", { status: 404, statusText: "Not Found" })
  }) as typeof fetch
}

test("createLocalCircuitPrompt includes generated tscircuit docs", async () => {
  const { createLocalCircuitPrompt } = await import(
    "lib/prompt-templates/create-local-circuit-prompt"
  )

  mockFetchByUrl({
    "https://raw.githubusercontent.com/tscircuit/props/main/generated/COMPONENT_TYPES.md":
      new Response("# Components\nprops docs content"),
    "https://docs.tscircuit.com/ai.txt": new Response("generated docs content"),
  })

  const prompt = await createLocalCircuitPrompt()

  expect(prompt).toContain("## Generated tscircuit docs")
  expect(prompt).toContain("generated docs content")
  expect(prompt).toContain("props docs content")
})

test("createLocalCircuitPrompt continues when generated docs are unavailable", async () => {
  const { createLocalCircuitPrompt } = await import(
    "lib/prompt-templates/create-local-circuit-prompt"
  )

  mockFetchByUrl({
    "https://raw.githubusercontent.com/tscircuit/props/main/generated/COMPONENT_TYPES.md":
      new Response("# Components\nprops docs content"),
    "https://docs.tscircuit.com/ai.txt": new Response("Unavailable", {
      status: 503,
      statusText: "Service Unavailable",
    }),
  })

  const prompt = await createLocalCircuitPrompt()

  expect(prompt).not.toContain("## Generated tscircuit docs")
  expect(prompt).toContain("props docs content")
})
