import { expect, test } from "bun:test"
import { createLocalCircuitPrompt } from "../lib/prompt-templates/create-local-circuit-prompt"

test("includes optional generated tscircuit docs in local circuit prompt", async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = ((url: string) => {
    if (url === "https://docs.tscircuit.com/ai.txt") {
      return Promise.resolve(new Response("GENERATED_DOCS_SENTINEL", { status: 200 }))
    }

    return Promise.resolve(new Response("# Props\n<board width=\"10mm\" height=\"10mm\" />", { status: 200 }))
  }) as typeof fetch

  try {
    const prompt = await createLocalCircuitPrompt()
    expect(prompt).toContain("## Generated tscircuit docs")
    expect(prompt).toContain("GENERATED_DOCS_SENTINEL")
  } finally {
    globalThis.fetch = originalFetch
  }
})

test("falls back when generated tscircuit docs are unavailable", async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = ((url: string) => {
    if (url === "https://docs.tscircuit.com/ai.txt") {
      return Promise.resolve(new Response("not found", { status: 404, statusText: "Not Found" }))
    }

    return Promise.resolve(new Response("# Props\n<board width=\"10mm\" height=\"10mm\" />", { status: 200 }))
  }) as typeof fetch

  try {
    const prompt = await createLocalCircuitPrompt()
    expect(prompt).toContain("Generated docs were unavailable")
  } finally {
    globalThis.fetch = originalFetch
  }
})
