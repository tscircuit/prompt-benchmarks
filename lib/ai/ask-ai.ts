import { anthropic } from "lib/ai/anthropic"

export const askAi = async (
  prompt: string,
  systemPrompt: string,
): Promise<string> => {
  const completion = await anthropic.messages.create({
    model: "claude-3-5-haiku-20241022",
    max_tokens: 2048,
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  })

  return (completion as any).content[0]?.text || ""
}
