import { expect, test } from "bun:test"
import { createTscircuitCoder } from "lib/tscircuit-coder/tscircuitCoder"
import { getPrimarySourceCodeFromVfs } from "lib/utils/get-primary-source-code-from-vfs"

const circuitTemplate = (marker: string) => `
export const StrainGaugeAmplifier = () => (
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
    <resistor name="R3" resistance="1k" footprint="0402" pcbX="10mm" pcbY="8mm" />
    <capacitor name="C1" capacitance="100nF" footprint="0603" pcbX="10mm" pcbY="14mm" />

    <trace from=".U1 > .pin4" to=".R1 > .pin1" />
    <trace from=".U1 > .pin5" to=".R2 > .pin1" />
    <trace from=".R1 > .pin2" to=".R2 > .pin2" />
    <trace from=".U1 > .pin6" to=".R3 > .pin1" />
    <trace from=".R3 > .pin2" to=".U1 > .GND" />
    <trace from=".R3 > .pin2" to=".C1 > .pin1" />
    <trace from=".C1 > .pin2" to=".U1 > .pin3" />

    <net name="VCC" />
    <net name="GND" />
    {/* ${marker} */}
  </board>
)
`

const baseCircuitCode = circuitTemplate("bridge rectifier")
const transistorCircuitCode = circuitTemplate("transistor")
const tssop20CircuitCode = circuitTemplate("transistor tssop20")

const createMockOpenaiClient = () =>
  ({
    chat: {
      completions: {
        create: async ({ messages, stream }: any) => {
          const promptText =
            messages?.find((message: any) => message.role === "user")?.content || ""
          const normalizedPrompt = String(promptText).toLowerCase()

          let code = baseCircuitCode
          if (normalizedPrompt.includes("tssop20")) {
            code = tssop20CircuitCode
          } else if (normalizedPrompt.includes("transistor")) {
            code = transistorCircuitCode
          }

          const content = `\`\`\`tsx\n${code}\n\`\`\``

          if (!stream) {
            return {
              choices: [{ message: { content } }],
            }
          }

          return (async function* () {
            yield { choices: [{ delta: { content } }] }
          })()
        },
      },
    },
  }) as any

test("TscircuitCoder submitPrompt streams and updates vfs", async () => {
  const streamedChunks: string[] = []
  let vfsUpdated = false
  const tscircuitCoder = createTscircuitCoder(createMockOpenaiClient())
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
