import { anthropic } from "lib/ai/anthropic"

export const generateRandomPrompts = async (
  numberOfPrompts: number,
): Promise<string[]> => {
  const completion = await anthropic.messages.create({
    model: "claude-3-5-haiku-20241022",
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Generate ${numberOfPrompts} different prompts for creating electronic circuits. Each prompt should describe a unique circuit with specific requirements and constraints. Return the prompts as a numbered list.`,
      },
    ],
  })

  const response = (completion as any).content[0]?.text || ""
  return response
    .split("\n")
    .filter((line: string) => /^\d+\./.test(line))
    .map((line: string) => line.replace(/^\d+\.\s*/, "").trim())
    .slice(0, 10)
}
