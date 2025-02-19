import path from "node:path"
import { createLocalCircuitPrompt } from "../lib/prompt-templates/create-local-circuit-prompt"
import { evalite } from "evalite"
import { CircuitScorer } from "./scorers/circuit-scorer"
import { askAiAboutOutput } from "lib/ask-ai/ask-ai-about-output"
import { savePrompt } from "lib/utils/save-prompt"
import { loadProblems } from "lib/utils/load-problems"
import { askAi } from "lib/ask-ai/ask-ai"
import { evaluateTscircuitCode } from "lib/utils/evaluate-tscircuit-code"

let systemPrompt = ""

evalite("Electronics Engineer", {
  data: async () => {
    const problems = loadProblems(
      path.join(__dirname, "problem-sets", "problems-1.toml"),
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
    const aiResponse = await askAi(input.prompt, systemPrompt)
    const codeMatch = aiResponse.match(/```tsx\s*([\s\S]*?)\s*```/)
    const code = codeMatch ? codeMatch[1].trim() : ""
    const codeBlockMatch = aiResponse.match(/```tsx[\s\S]*?```/)
    const codeBlock = codeBlockMatch ? codeBlockMatch[0] : ""
    const { success, error: evaluationError } =
      await evaluateTscircuitCode(code)

    const output: {
      results: { result: boolean; expected: boolean }[]
      code: string
    } = { results: [], code: "" }

    if (success) {
      output.code = codeBlock
      for (const question of input.questions) {
        output.results.push({
          result: await askAiAboutOutput(code, question.text),
          expected: question.answer,
        })
      }
      return output
    }
    return `${evaluationError}. Code:\n${codeBlock}`
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
