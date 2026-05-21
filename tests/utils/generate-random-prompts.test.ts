import { describe, expect, it } from "bun:test"
import { generateRandomPrompts } from "../../lib/utils/generate-random-prompts"

describe("generateRandomPrompts", () => {
  it("should return an array of prompts", async () => {
    const openaiClient = {
      chat: {
        completions: {
          create: async () => ({
            choices: [
              {
                message: {
                  content: [
                    "1. Create a bridge rectifier with smoothing capacitor",
                    "2. Design a low-pass RC filter",
                    "3. Build a transistor switch for an LED",
                  ].join("\n"),
                },
              },
            ],
          }),
        },
      },
    }

    const prompts = await generateRandomPrompts(3, openaiClient as any)

    expect(Array.isArray(prompts)).toBe(true)
    expect(prompts.length).toBe(3)
  })
})
