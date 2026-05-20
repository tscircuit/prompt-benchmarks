import { openai } from "lib/ai/openai"

type OpenAIClient = Pick<typeof openai, "chat">

export const generateRandomPrompts = async (
  numberOfPrompts: number,
  openaiClient: OpenAIClient = openai,
): Promise<string[]> => {
  const completion = await openaiClient.chat.completions.create({
    model: "gpt-4o-mini",

    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: `Generate ${numberOfPrompts} different prompts for creating electronic circuits. Each prompt should describe a unique circuit with specific requirements and constraints. Return the prompts as a numbered list.`,
      },
    ],
  })

  const response = completion.choices[0].message.content || ""

  return response
    .split("\n")
    .filter((line: string) => /^\d+\./.test(line))
    .map((line: string) => line.replace(/^\d+\.\s*/, "").trim())
    .slice(0, 10)
}
