import path from "node:path"
import { createLocalCircuitPrompt } from "../lib/prompt-templates/create-local-circuit-prompt"
import { evalite } from "evalite"
import { AiCircuitScorer } from "./scorers/ai-circuit-scorer"
import { cleanupAttemptLogs } from "lib/utils/cleanup-attempt-logs"
import { savePrompt } from "lib/utils/save-prompt"
import { runAiWithErrorCorrection } from "lib/tscircuit-coder/run-ai-with-error-correction"
import { generateRandomPrompts } from "lib/utils/generate-random-prompts"

const logsDir = path.join(__dirname, "./attempt-logs")
let systemPrompt = ""
let promptNumber = 0

evalite.experimental_skip("Electronics Engineer Making Random Circuits", {
  data: async () => {
    cleanupAttemptLogs(logsDir)
    const problems = await generateRandomPrompts(10)
    systemPrompt = await createLocalCircuitPrompt()

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const promptFileName = `prompt-${timestamp}.txt`
    const promptsDir = path.join(__dirname, "./prompt-logs")
    savePrompt(systemPrompt, promptFileName, promptsDir)

    return problems.map((problem) => ({
      input: {
        prompt: problem,
        promptFileName,
      },
    }))
  },
  task: async (input) => {
    const { code, codeBlock, error } = await runAiWithErrorCorrection({
      prompt: input.prompt,
      systemPrompt,
      logsDir,
      maxAttempts: 4,
      promptNumber: ++promptNumber,
    })

    const output: {
      code: string
      codeBlock: string
    } = { code: "", codeBlock: "" }

    if (!error) {
      output.code = code
      output.codeBlock = codeBlock
      return output
    }

    return `${error}. Code:\n${codeBlock}`
  },
  experimental_customColumns: async (result) => {
    if (typeof result.output === "string")
      return [
        {
          label: "Prompt",
          value: result.input.prompt,
        },
        {
          label: "Code",
          value: result.output,
        },
        {
          label: "Result",
          value: "Circuit failed",
        },
      ]
    return [
      {
        label: "Prompt",
        value: result.input.prompt,
      },
      {
        label: "Code",
        value: result.output.codeBlock,
      },
      {
        label: "Result",
        value:
          !result.output || typeof result.output === "string"
            ? "Circuit failed"
            : "Circuit passed",
      },
    ]
  },
  scorers: [AiCircuitScorer],
})
