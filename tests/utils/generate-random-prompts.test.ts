import { describe, expect, it } from "bun:test"
import { generateRandomPrompts } from "../../lib/utils/generate-random-prompts"

const openAiIt = process.env.OPENAI_API_KEY ? it : it.skip

describe("generateRandomPrompts", () => {
  openAiIt("should return an array of prompts", async () => {
    const prompts = await generateRandomPrompts(3)

    expect(Array.isArray(prompts)).toBe(true)
    expect(prompts.length).toBe(3)
  })
})
