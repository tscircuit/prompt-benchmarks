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

  await tscircuitCoder.submitPrompt(
    "create a random complicated circuit that does something cool",
  )

  expect(streamedChunks.length).toBeGreaterThan(0)
  const vfsKeys = Object.keys(tscircuitCoder.vfs)
  expect(vfsKeys.length).toBeGreaterThan(0)
  expect(vfsUpdated).toBe(true)
})
