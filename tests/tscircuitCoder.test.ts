import { expect, test } from "bun:test"
import { createTscircuitCoder } from "lib/tscircuit-coder/tscircuitCoder"
import { getPrimarySourceCodeFromVfs } from "lib/utils/get-primary-source-code-from-vfs"

const circuitForPrompt = (prompt: string) => {
  const includeTransistor = /transistor|tssop20/i.test(prompt)
  const includeChip = /tssop20/i.test(prompt)

  return `
export const GeneratedCircuit = () => (
  <board width="50mm" height="40mm">
    <chip footprint="soic8" name="U1" pinLabels={{
      1: "V+",
      2: "V-",
      3: "Ref",
      4: "In+",
      5: "In-",
      6: "Out",
      7: "Gain",
      8: "GND",
    }} pcbX="10mm" pcbY="10mm" />
    <resistor name="R1" resistance="1k" footprint="0402" pcbX="12mm" pcbY="10mm" />
    <resistor name="R2" resistance="1k" footprint="0402" pcbX="10mm" pcbY="12mm" />
    ${
      includeTransistor
        ? '<resistor name="transistor_bias" resistance="10k" footprint="0402" pcbX="8mm" pcbY="12mm" />'
        : ""
    }
    ${
      includeChip
        ? '<chip name="U2" footprint="tssop20" pcbX="20mm" pcbY="10mm" />'
        : ""
    }
    <trace from=".U1 > .pin4" to=".R1 > .pin1" />
    <trace from=".U1 > .pin5" to=".R2 > .pin1" />
    <trace from=".R1 > .pin2" to=".R2 > .pin2" />
  </board>
)
`.trim()
}

const createMockOpenAi = () => ({
  chat: {
    completions: {
      create: async function* ({
        messages,
      }: { messages: { content: string }[] }) {
        const prompt = messages[1]?.content ?? ""
        const response = `\`\`\`tsx\n${circuitForPrompt(prompt)}\n\`\`\``
        yield { choices: [{ delta: { content: response } }] }
      },
    },
  },
})

test("TscircuitCoder submitPrompt streams and updates vfs", async () => {
  const streamedChunks: string[] = []
  let vfsUpdated = false
  const tscircuitCoder = createTscircuitCoder(createMockOpenAi() as any)
  tscircuitCoder.on("streamedChunk", (chunk: string) => {
    streamedChunks.push(chunk)
  })
  tscircuitCoder.on("vfsChanged", () => {
    vfsUpdated = true
  })

  await tscircuitCoder.submitPrompt({
    prompt: "create bridge rectifier circuit",
  })

  await tscircuitCoder.submitPrompt({
    prompt: "add a transistor component",
  })

  const codeWithTransistor = getPrimarySourceCodeFromVfs(tscircuitCoder.vfs)
  expect(codeWithTransistor).toInclude("transistor")

  await tscircuitCoder.submitPrompt({
    prompt: "add a tssop20 chip",
  })

  const codeWithChip = getPrimarySourceCodeFromVfs(tscircuitCoder.vfs)
  expect(codeWithChip).toInclude("tssop20")
  expect(codeWithChip).toInclude("transistor")

  expect(streamedChunks.length).toBeGreaterThan(0)
  const vfsKeys = Object.keys(tscircuitCoder.vfs)
  expect(vfsKeys.length).toBeGreaterThan(0)
  expect(vfsUpdated).toBe(true)
})
