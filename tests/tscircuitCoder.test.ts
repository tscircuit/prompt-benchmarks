import { createTscircuitCoder } from "lib/tscircuit-coder/tscircuitCoder"
import { expect, test } from "bun:test"
import { getPrimarySourceCodeFromVfs } from "lib/utils/get-primary-source-code-from-vfs"

const createMockOpenaiClient = () => ({
  chat: {
    completions: {
      create: async ({
        messages,
      }: {
        messages: { role: string; content: string }[]
      }) => {
        const prompt =
          messages.find((message) => message.role === "user")?.content ?? ""
        let code = `
export const MockCircuit = () => (
  <board width="20mm" height="20mm">
    <resistor name="R1" resistance="1k" footprint="0402" pcbX="0mm" pcbY="0mm" />
  </board>
)
`

        if (prompt.includes("transistor")) {
          code = `
export const MockCircuit = () => (
  <board width="20mm" height="20mm">
    <resistor name="transistor_marker" resistance="1k" footprint="0402" pcbX="0mm" pcbY="0mm" />
  </board>
)
`
        }

        if (prompt.includes("tssop20")) {
          code = `
export const MockCircuit = () => (
  <board width="20mm" height="20mm">
    <resistor name="transistor_marker" resistance="1k" footprint="0402" pcbX="0mm" pcbY="0mm" />
    <chip name="U1" footprint="tssop20_w6.5mm_p0.65mm" pcbX="5mm" pcbY="0mm" />
  </board>
)
`
        }

        return (async function* () {
          yield {
            choices: [{ delta: { content: `\`\`\`tsx\n${code}\n\`\`\`` } }],
          }
        })()
      },
    },
  },
})

test("TscircuitCoder submitPrompt streams and updates vfs", async () => {
  const streamedChunks: string[] = []
  let vfsUpdated = false
  const tscircuitCoder = createTscircuitCoder(createMockOpenaiClient() as any)
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

  let codeWithTransistor = getPrimarySourceCodeFromVfs(tscircuitCoder.vfs)
  expect(codeWithTransistor).toInclude("transistor")

  await tscircuitCoder.submitPrompt({
    prompt: "add a tssop20 chip",
  })

  let codeWithChip = getPrimarySourceCodeFromVfs(tscircuitCoder.vfs)
  expect(codeWithChip).toInclude("tssop20")
  expect(codeWithChip).toInclude("transistor")

  expect(streamedChunks.length).toBeGreaterThan(0)
  const vfsKeys = Object.keys(tscircuitCoder.vfs)
  expect(vfsKeys.length).toBeGreaterThan(0)
  expect(vfsUpdated).toBe(true)
})
