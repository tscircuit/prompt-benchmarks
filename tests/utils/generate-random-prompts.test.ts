import { describe, expect, test } from "bun:test"
import { generateRandomPrompts } from "../../lib/utils/generate-random-prompts"

const testWithOpenAI = process.env.OPENAI_API_KEY ? test : test.skip

describe("generateRandomPrompts", () => {
  testWithOpenAI("should return an array of prompts", async () => {
    const prompts = await generateRandomPrompts(3)

    expect(Array.isArray(prompts)).toBe(true)
    expect(prompts.length).toBe(3)
  })
})
