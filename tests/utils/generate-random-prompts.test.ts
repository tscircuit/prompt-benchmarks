import { describe, it, expect } from "bun:test"
import { generateRandomPrompts } from "../../lib/utils/generate-random-prompts"

describe("generateRandomPrompts", () => {
  it("should return an array of prompts", async () => {
    const prompts = await generateRandomPrompts(3)

    expect(Array.isArray(prompts)).toBe(true)
    expect(prompts.length).toBe(3)
  })
})
