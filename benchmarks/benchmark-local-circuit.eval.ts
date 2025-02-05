import path from "node:path"
import { safeEvaluateCode } from "../lib/code-runner/safe-evaluate-code"
import { createLocalCircuitPrompt } from "../lib/prompt-templates/create-local-circuit-prompt"
import { evalite } from "evalite"
import { CircuitScorer } from "./scorers/circuit-scorer"
import { askAboutOutput } from "tests/fixtures/ask-about-output"
import { savePrompt } from "lib/utils/save-prompt"
import { loadProblems } from "lib/utils/load-problems"
import { askAi } from "lib/ai/ask-ai"

let systemPrompt = ""

evalite.experimental_skip("Electronics Engineer", {
  data: async () => {
    const problems = loadProblems(
      path.join(__dirname, "..", "problem-sets", "problems-1.toml"),
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
    const evaluation = safeEvaluateCode(code, {
      outputType: "board",
      preSuppliedImports: {},
    })

    const output: {
      results: { result: boolean; expected: boolean }[]
      code: string
    } = { results: [], code: "" }

    if (evaluation.success) {
      output.code = codeBlock
      for (const question of input.questions) {
        output.results.push({
          result: await askAboutOutput(code, question.text),
          expected: question.answer,
        })
      }
      return output
    }
    return `${evaluation.error}. Code:\n${codeBlock}`
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
