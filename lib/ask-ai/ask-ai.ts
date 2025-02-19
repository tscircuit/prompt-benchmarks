import { openai } from "lib/ai/openai"

export const askAi = async (
  prompt: string,
  systemPrompt: string,
): Promise<string> => {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",

    max_tokens: 2048,
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content: prompt,
      },
    ],
  })
  return completion.choices[0].message.content || ""
}
