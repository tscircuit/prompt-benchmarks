import { safeEvaluateCode } from "lib/code-runner"
import { askAiWithPreviousAttempts } from "./ask-ai-with-previous-attempts"
import { saveAttemptLog } from "lib/utils/save-attempt"

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
}: {
  attempt?: number
  logsDir: string
  maxAttempts: number
  prompt: string
  systemPrompt: string
  promptNumber: number
  previousAttempts?: AttemptHistory[]
}): Promise<{
  code: string
  codeBlock: string
  error: string
}> => {
  const aiResponse = await askAiWithPreviousAttempts({
    prompt,
    systemPrompt,
    previousAttempts,
  })
  const codeMatch = aiResponse.match(/```tsx\s*([\s\S]*?)\s*```/)
  const code = codeMatch ? codeMatch[1].trim() : ""
  const codeBlockMatch = aiResponse.match(/```tsx[\s\S]*?```/)
  const codeBlock = codeBlockMatch ? codeBlockMatch[0] : ""
  const evaluation = safeEvaluateCode(code, {
    outputType: "board",
    preSuppliedImports: {},
  })

  if (evaluation.success) {
    return { code, codeBlock, error: "" }
  }

  const error = evaluation.error || ""
  attempt++
  previousAttempts.push({ code, error })
  saveAttemptLog({
    fileName: `prompt-${promptNumber}-attempt-${attempt}.md`,
    prompt,
    logsDir,
    code,
    error,
  })

  if (attempt >= maxAttempts) {
    return {
      code,
      codeBlock,
      error: previousAttempts[previousAttempts.length - 1].error || "",
    }
  }
  return await runAiWithErrorCorrection({
    attempt,
    maxAttempts,
    logsDir,
    systemPrompt,
    prompt,
    promptNumber,
    previousAttempts,
  })
}
