import { createTscircuitCoder } from "lib/tscircuit-coder/tscircuitCoder"
import { expect, test } from "bun:test"

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

  const rectifierCircuitCode = Object.values(tscircuitCoder.vfs)[
    Object.keys(tscircuitCoder.vfs).length - 1
  ]

  await tscircuitCoder.submitPrompt({
    previousCode: rectifierCircuitCode,
    prompt: "add a sot23 transistor",
  })

  const codeWithTransistor = Object.values(tscircuitCoder.vfs)[
    Object.keys(tscircuitCoder.vfs).length - 1
  ]
  expect(codeWithTransistor).toInclude("sot23")

  await tscircuitCoder.submitPrompt({
    previousCode: codeWithTransistor,
    prompt: "add a tssop20 chip",
  })
  const codeWithChip = Object.values(tscircuitCoder.vfs)[
    Object.keys(tscircuitCoder.vfs).length - 1
  ]
  expect(codeWithChip).toInclude("tssop20")

  expect(streamedChunks.length).toBeGreaterThan(0)
  const vfsKeys = Object.keys(tscircuitCoder.vfs)
  expect(vfsKeys.length).toBeGreaterThan(0)
  expect(vfsUpdated).toBe(true)
})
