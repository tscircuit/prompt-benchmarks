import { expect, test } from "bun:test"
import { fp } from "@tscircuit/footprinter"
import { createLocalCircuitPrompt } from "../../lib/prompt-templates/create-local-circuit-prompt"

test("new footprint families do not prevent local prompt generation", async () => {
  const originalFetch = globalThis.fetch
  globalThis.fetch = async () => new Response("Local component documentation")
  try {
    const prompt = await createLocalCircuitPrompt()
    expect(prompt).toContain('"fn":"sot23w"')
    expect(prompt).toContain('"fn":"sod123w"')
    expect(prompt).toContain('"fn":"fpc","defaults_unavailable":')
    expect(prompt).toContain('"fn":"jst","defaults_unavailable":')
    expect(prompt).toContain("Local component documentation")
    for (const footprint of [
      "sot23w_p1.15mm_pw0.8mm_pin1location(rightside,bottom)",
      "sod123w_p3.4mm_pw0.95mm_cathodepin1",
    ]) {
      expect(
        fp
          .string(footprint)
          .circuitJson()
          .some((e) => e.type === "pcb_smtpad"),
      ).toBe(true)
    }
  } finally {
    globalThis.fetch = originalFetch
  }
})
