import { createTscircuitCoder } from "lib/tscircuit-coder/tscircuitCoder"
import { expect, test } from "bun:test"
import { getPrimarySourceCodeFromVfs } from "lib/utils/get-primary-source-code-from-vfs"

test("TscircuitCoder submitPrompt streams and updates vfs", async () => {
  const streamedChunks: string[] = []
  let vfsUpdated = false
  const tscircuitCoder = createTscircuitCoder()
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
