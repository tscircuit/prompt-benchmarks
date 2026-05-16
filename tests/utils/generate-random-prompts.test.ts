import { describe, expect, it } from "bun:test"
import { generateRandomPrompts } from "../../lib/utils/generate-random-prompts"

describe("generateRandomPrompts", () => {
  it("should return an array of prompts", async () => {
    const prompts = await generateRandomPrompts(3, {
      chat: {
        completions: {
          create: async () => ({
            choices: [
              {
                message: {
                  content: [
                    "1. Build a bridge rectifier with filtering",
                    "2. Create a buck converter with current sensing",
                    "3. Design a low-noise op-amp stage",
                  ].join("\n"),
                },
              },
            ],
          }),
        },
      },
    })

    expect(Array.isArray(prompts)).toBe(true)
    expect(prompts.length).toBe(3)
    expect(prompts[0]).toContain("bridge rectifier")
  })
})
