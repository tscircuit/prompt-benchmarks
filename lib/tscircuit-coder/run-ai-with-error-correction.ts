import { askAiWithPreviousAttempts } from "../ask-ai/ask-ai-with-previous-attempts"
import { saveAttemptLog } from "lib/utils/save-attempt"
import type OpenAI from "openai"
import { evaluateTscircuitCode } from "../utils/evaluate-tscircuit-code"
import { getFinalResult } from "lib/utils/get-final-result"

const createAttemptFile = ({
  fileName,
  prompt,
  code,
  error,
}: {
  fileName: string
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
  attempt = 1,
  maxAttempts,
  logsDir,
  systemPrompt,
  prompt,
  promptNumber,
  previousAttempts = [],
  onStream,
  onVfsChanged,
  vfs,
  openaiClient,
}: {
  attempt?: number
  logsDir?: string
  maxAttempts: number
  prompt: string
  systemPrompt: string
  promptNumber: number
  previousAttempts?: AttemptHistory[]
  onStream?: (chunk: string) => void
  onVfsChanged?: () => void
  vfs?: Record<string, string>
  openaiClient?: OpenAI
}): Promise<{
  code: string
  codeBlock: string
  error: string
}> => {
  let previousCode = getFinalResult(vfs)

  const aiResponse = await askAiWithPreviousAttempts({
    prompt,
    systemPrompt,
    previousCode,
    previousAttempts,
    onStream,
    openaiClient,
  })
  const codeMatch = aiResponse.match(/```tsx\s*([\s\S]*?)\s*```/)
  const code = codeMatch ? codeMatch[1].trim() : ""
  const codeBlockMatch = aiResponse.match(/```tsx[\s\S]*?```/)
  const codeBlock = codeBlockMatch ? codeBlockMatch[0] : ""

  const { success, error: evaluationError } = await evaluateTscircuitCode(code)

  if (success) {
    if (onStream) onStream("Local tscircuit circuit created")
    return { code, codeBlock, error: "" }
  }

  const error = evaluationError || ""
  previousAttempts.push({ code, error })
  const attemptFileName = `prompt-${promptNumber}-attempt-${attempt}.md`
  if (logsDir)
    saveAttemptLog({
      fileName: `prompt-${promptNumber}-attempt-${attempt}.md`,
      prompt,
      logsDir,
      code,
      error,
    })
  if (vfs) {
    const attemptFileContent = createAttemptFile({
      fileName: attemptFileName,
      prompt,
      code,
      error,
    })
    vfs[attemptFileName] = attemptFileContent
  }
  attempt++
  if (onVfsChanged) onVfsChanged()

  if (attempt >= maxAttempts) {
    if (onStream)
      onStream(
        `Maximum attempts reached, Latest attempt circuit evalution error: ${previousAttempts[previousAttempts.length - 1].error || ""}`,
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
  return await runAiWithErrorCorrection({
    attempt,
    onStream,
    onVfsChanged,
    maxAttempts,
    logsDir,
    systemPrompt,
    prompt,
    promptNumber,
    previousAttempts,
    vfs,
  })
}
