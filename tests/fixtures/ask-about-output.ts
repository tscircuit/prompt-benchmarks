import { anthropic } from "lib/code-runner/anthropic"

export const askAboutOutput = async (
  codefence: string,
  question: string,
): Promise<boolean> => {
  const completion = await anthropic.messages.create({
    model: "claude-3-5-haiku-20241022",
    max_tokens: 1024,
    system: `
Please output YES or NO about the user's question.

<code>
${codefence}
</code>

`.trim(),
    messages: [
      {
        role: "user",
        content: question,
      },
    ],
  })

  const responseText: string = (completion as any).content[0]?.text

  const result = responseText.toLowerCase().includes("yes")

  return result
}
