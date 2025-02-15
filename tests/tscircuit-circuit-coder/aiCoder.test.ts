import { createAiCoder } from "lib/ai/aiCoder"
import { expect, test } from "bun:test"

test("AiCoder submitPrompt streams and updates vfs", async () => {
  const streamedChunks: string[] = []
  let vfsUpdated = false
  const aiCoder = createAiCoder()
  aiCoder.on("streamedChunk", (chunk: string) => {
    streamedChunks.push(chunk)
  })
  aiCoder.on("vfsChanged", () => {
    vfsUpdated = true
  })

  await aiCoder.submitPrompt(
    "create a random complicated circuit that does something cool",
  )

  expect(streamedChunks.length).toBeGreaterThan(0)
  const vfsKeys = Object.keys(aiCoder.vfs)
  expect(vfsKeys.length).toBeGreaterThan(0)
  expect(vfsUpdated).toBe(true)
})
