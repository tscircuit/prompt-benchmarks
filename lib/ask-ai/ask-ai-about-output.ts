import { openai } from "lib/ai/openai"

export const askAiAboutOutput = async (
  codefence: string,
  question: string,
): Promise<boolean> => {
  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",

    max_tokens: 1024,
    messages: [
      {
        role: "system",
        content: `
Please output YES or NO about the user's question.

<code>
${codefence}
</code>

`.trim(),
      },
      {
        role: "user",
        content: question,
      },
    ],
  })

  const responseText: string = completion.choices[0].message.content || ""
  const result = responseText.toLowerCase().includes("yes")

  return result
}
