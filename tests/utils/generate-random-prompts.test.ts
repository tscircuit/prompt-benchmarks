import { describe, it, expect } from "bun:test"
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
                  content:
                    "1. Build a pulse generator\n2. Create a sensor board\n3. Design an LED driver",
                },
              },
            ],
          }),
        },
      },
    } as any

    const prompts = await generateRandomPrompts(3, openaiClient)

    expect(Array.isArray(prompts)).toBe(true)
    expect(prompts.length).toBe(3)
    expect(prompts).toEqual([
      "Build a pulse generator",
      "Create a sensor board",
      "Design an LED driver",
    ])
  })
})
