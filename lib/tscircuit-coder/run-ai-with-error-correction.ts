import { askAiWithPreviousAttempts } from "../ask-ai/ask-ai-with-previous-attempts"
import { saveAttemptLog } from "lib/utils/save-attempt"
import type OpenAI from "openai"
import { evaluateTscircuitCode } from "../utils/evaluate-tscircuit-code"

const createAttemptFile = ({
  prompt,
  code,
  error,
}: {
  prompt: string
  code: string
  error: string
}) => {
  return `# Attempt Log

## Prompt
${prompt}

## Error
\`\`\`
${error}
\`\`\`

## Code
\`\`\`tsx
${code}
\`\`\`
`
}

interface AttemptHistory {
  code: string
  error: string
}

export const runAiWithErrorCorrection = async ({
  maxAttempts,
  promptId,
  logsDir,
  prompt,
  systemPrompt,
  onStream,
  onVfsChanged,
  vfs,
  openaiClient,
}: {
  maxAttempts: number
  promptId: string
  logsDir?: string
  prompt: string
  systemPrompt: string
  onStream?: (chunk: string) => void
  onVfsChanged?: () => void
  vfs?: Record<string, string>
  openaiClient?: OpenAI
}): Promise<{
  code: string
  codeBlock: string
  error: string
}> => {
  const attempt = async (
    attemptNumber: number,
    previousAttempts: AttemptHistory[],
  ): Promise<{
    code: string
    codeBlock: string
    error: string
  }> => {
    const aiResponse = await askAiWithPreviousAttempts({
      prompt,
      systemPrompt,
      previousAttempts,
      onStream,
      vfs,
      openaiClient,
    })
    const codeMatch = aiResponse.match(/```tsx\s*([\s\S]*?)\s*```/)
    const code = codeMatch ? codeMatch[1].trim() : ""
    const codeBlockMatch = aiResponse.match(/```tsx[\s\S]*?```/)
    const codeBlock = codeBlockMatch ? codeBlockMatch[0] : ""

    const { success, error: evaluationError } =
      await evaluateTscircuitCode(code)

    if (success) {
      if (onStream) onStream("Local tscircuit circuit created")
      return { code, codeBlock, error: "" }
    }

    const error = evaluationError || ""
    previousAttempts.push({ code, error })
    const attemptFileName = `prompt-${promptId}-attempt-${attemptNumber}.md`
    if (logsDir)
      saveAttemptLog({
        fileName: attemptFileName,
        prompt,
        logsDir,
        code,
        error,
      })
    if (vfs) {
      const attemptFileContent = createAttemptFile({
        prompt,
        code,
        error,
      })
      vfs[attemptFileName] = attemptFileContent
    }
    if (onVfsChanged) onVfsChanged()

    if (attemptNumber >= maxAttempts) {
      if (onStream)
        onStream(
          `Maximum attempts reached, Latest attempt circuit evaluation error: ${previousAttempts[previousAttempts.length - 1].error || ""}`,
        )
      return {
        code,
        codeBlock,
        error: previousAttempts[previousAttempts.length - 1].error || "",
      }
    }
    if (onStream)
      onStream(
        `Circuit evaluation error: ${previousAttempts[previousAttempts.length - 1].error || ""}`,
      )
    return await attempt(attemptNumber + 1, previousAttempts)
  }

  return attempt(1, [])
}
