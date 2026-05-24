import { describe, expect, it } from "bun:test"
import { generateRandomPrompts } from "../../lib/utils/generate-random-prompts"

const itIfOpenAiApiKey = process.env.OPENAI_API_KEY ? it : it.skip

describe("generateRandomPrompts", () => {
  itIfOpenAiApiKey("should return an array of prompts", async () => {
    const prompts = await generateRandomPrompts(3)

    expect(Array.isArray(prompts)).toBe(true)
    expect(prompts.length).toBe(3)
  })
})
