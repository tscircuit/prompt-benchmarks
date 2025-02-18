import path from "node:path"
import { createLocalCircuitPrompt } from "../lib/prompt-templates/create-local-circuit-prompt"
import { evalite } from "evalite"
import { CircuitScorer } from "./scorers/circuit-scorer"
import { askAboutOutput } from "lib/ai/ask-about-output"
import { cleanupAttemptLogs } from "lib/utils/cleanup-attempt-logs"
import { savePrompt } from "lib/utils/save-prompt"
import { loadProblems } from "lib/utils/load-problems"
import { runAiWithErrorCorrection } from "lib"

const logsDir = path.join(__dirname, "./attempt-logs")
let systemPrompt = ""
let promptNumber = 0

evalite("Reasoning Electronics Engineer", {
  data: async () => {
    cleanupAttemptLogs(logsDir)
    const problems = loadProblems(
      path.join(__dirname, "problem-sets", "problems-2.toml"),
    )
    systemPrompt = await createLocalCircuitPrompt()

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const promptFileName = `prompt-${timestamp}.txt`

    const promptsDir = path.join(__dirname, "./prompt-logs")
    savePrompt(systemPrompt, promptFileName, promptsDir)

    return problems.map((problem) => ({
      input: {
        prompt: problem.prompt,
        promptFileName,
        questions: problem.questions,
      },
    }))
  },
  task: async (input) => {
    const { code, codeBlock, error } = await runAiWithErrorCorrection({
      systemPrompt,
      maxAttempts: 4,
      logsDir,
      prompt: input.prompt,
      promptNumber: ++promptNumber,
    })

    const output: {
      results: { result: boolean; expected: boolean }[]
      code: string
    } = { results: [], code: "" }

    if (!error) {
      output.code = codeBlock
      for (const question of input.questions) {
        output.results.push({
          result: await askAboutOutput(code, question.text),
          expected: question.answer,
        })
      }
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
        value: result.output.code,
      },
      {
        label: "Result",
        value:
          result.output.results.length > 0
            ? "Circuit passed"
            : "Circuit failed",
      },
    ]
  },
  scorers: [CircuitScorer],
})
