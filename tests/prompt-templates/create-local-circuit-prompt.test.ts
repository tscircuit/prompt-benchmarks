import { afterEach, expect, test } from "bun:test"
import { createLocalCircuitPrompt } from "../../lib/prompt-templates/create-local-circuit-prompt"

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

test("includes generated tscircuit docs in the local circuit prompt", async () => {
  const fetchedUrls: string[] = []

  globalThis.fetch = (async (url: string | URL | Request) => {
    const urlString = String(url)
    fetchedUrls.push(urlString)

    if (urlString === "https://docs.tscircuit.com/ai.txt") {
      return new Response("Generated docs: use schematic-only examples")
    }

    if (
      urlString ===
      "https://raw.githubusercontent.com/tscircuit/props/main/generated/COMPONENT_TYPES.md"
    ) {
      return new Response('# Component Types\n<resistor resistance="1k" />')
    }

    return new Response("Not found", { status: 404, statusText: "Not Found" })
  }) as typeof fetch

  const prompt = await createLocalCircuitPrompt()

  expect(fetchedUrls).toContain("https://docs.tscircuit.com/ai.txt")
  expect(prompt).toContain("### Generated tscircuit docs")
  expect(prompt).toContain("Generated docs: use schematic-only examples")
})

test("still creates the local circuit prompt when generated docs are unavailable", async () => {
  globalThis.fetch = (async (url: string | URL | Request) => {
    const urlString = String(url)

    if (urlString === "https://docs.tscircuit.com/ai.txt") {
      return new Response("Temporarily unavailable", {
        status: 503,
        statusText: "Service Unavailable",
      })
    }

    if (
      urlString ===
      "https://raw.githubusercontent.com/tscircuit/props/main/generated/COMPONENT_TYPES.md"
    ) {
      return new Response('# Component Types\n<capacitor capacitance="1uF" />')
    }

    return new Response("Not found", { status: 404, statusText: "Not Found" })
  }) as typeof fetch

  const prompt = await createLocalCircuitPrompt()

  expect(prompt).toContain("You are an expert in electronic circuit design")
  expect(prompt).toContain('<capacitor capacitance="1uF" />')
  expect(prompt).not.toContain("Temporarily unavailable")
})
