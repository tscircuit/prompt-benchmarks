import { anthropic } from "lib/ai/anthropic"

interface AttemptHistory {
  code: string
  error: string
}

export const askAiWithPreviousAttempts = async ({
  prompt,
  systemPrompt,
  previousAttempts,
  onStream,
  anthropicClient,
}: {
  prompt: string
  systemPrompt: string
  previousAttempts?: AttemptHistory[]
  onStream?: (chunk: string) => void
  anthropicClient?: typeof anthropic
}): Promise<string> => {
  const client = anthropicClient || anthropic
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
    if (onStream)
      onStream(
        `Start streaming AI response, attempt: ${(previousAttempts?.length || 0) + 1}`,
      )
    const completionStream = await client.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 2048,
      system: systemPrompt,
      messages: messages,
      stream: true,
    })
    for await (const chunk of completionStream) {
      const delta = (chunk as any).delta
      let textChunk = ""
      if (
        typeof chunk === "object" &&
        delta &&
        typeof delta.text === "string"
      ) {
        textChunk = delta.text
      } else if (typeof chunk === "string") {
        textChunk = chunk
      }
      if (onStream) onStream(textChunk)
      result += textChunk
    }
  } catch {
    result = "Error in AI API request"
  }

  return result
}
