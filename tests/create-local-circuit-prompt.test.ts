import { describe, expect, test, beforeEach, spyOn, afterEach } from "bun:test"
import {
  createLocalCircuitPrompt,
  resetAiDocsCache,
} from "../lib/prompt-templates/create-local-circuit-prompt"

describe("createLocalCircuitPrompt", () => {
  let originalFetch: typeof global.fetch

  beforeEach(() => {
    resetAiDocsCache()
    originalFetch = global.fetch
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  test("includes ai.txt content when available", async () => {
    global.fetch = async (
      url: string | URL | Request,
      options?: RequestInit,
    ) => {
      const urlStr = url.toString()
      if (urlStr === "https://docs.tscircuit.com/ai.txt") {
        return new Response("MOCKED_AI_DOCS_CONTENT", { status: 200 })
      }
      if (
        urlStr ===
        "https://raw.githubusercontent.com/tscircuit/props/main/generated/COMPONENT_TYPES.md"
      ) {
        return new Response("MOCKED_PROPS_CONTENT", { status: 200 })
      }
      return new Response("Not Found", { status: 404 })
    }

    const prompt = await createLocalCircuitPrompt()
    expect(prompt).toContain("Auto-generated tscircuit docs")
    expect(prompt).toContain("MOCKED_AI_DOCS_CONTENT")
    expect(prompt).toContain("MOCKED_PROPS_CONTENT")
  })

  test("handles fetch failure gracefully for ai.txt", async () => {
    global.fetch = async (
      url: string | URL | Request,
      options?: RequestInit,
    ) => {
      const urlStr = url.toString()
      if (urlStr === "https://docs.tscircuit.com/ai.txt") {
        return new Response("Not Found", { status: 404 })
      }
      if (
        urlStr ===
        "https://raw.githubusercontent.com/tscircuit/props/main/generated/COMPONENT_TYPES.md"
      ) {
        return new Response("MOCKED_PROPS_CONTENT", { status: 200 })
      }
      return new Response("Not Found", { status: 404 })
    }

    const prompt = await createLocalCircuitPrompt()
    expect(prompt).not.toContain("Auto-generated tscircuit docs")
    expect(prompt).not.toContain("MOCKED_AI_DOCS_CONTENT")
    expect(prompt).toContain("MOCKED_PROPS_CONTENT")
  })
})
