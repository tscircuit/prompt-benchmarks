import { anthropic } from "lib/ai/anthropic"

interface AttemptHistory {
  code: string
  error: string
}

export const askAiWithPreviousAttempts = async ({
  prompt,
  systemPrompt,
  previousAttempts,
}: {
  prompt: string
  systemPrompt: string
  previousAttempts?: AttemptHistory[]
}): Promise<string> => {
  const messages: { role: "assistant" | "user"; content: string }[] = [
    { role: "user", content: prompt },
  ]

  if (previousAttempts?.length) {
    messages.push({
      role: "user",
      content: "Previous attempts failed. Here are the details:",
    })

    previousAttempts.forEach((attempt, index) => {
      messages.push(
        { role: "assistant", content: attempt.code },
        {
          role: "user",
          content: `Attempt ${index + 1} error: ${attempt.error}`,
        },
      )
    })

    messages.push({
      role: "user",
      content:
        "Please provide a new solution that addresses these errors. Avoid approaches that led to previous failures.",
    })
  }

  let result = ""

  try {
    const completion = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 2048,
      system: systemPrompt,
      messages: messages,
    })
    result = (completion as any).content[0]?.text
  } catch {
    result = "Error in AI API request"
  }

  return result
}
