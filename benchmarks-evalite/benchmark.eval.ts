import fs, { readdirSync } from "node:fs"
import path from "node:path"
import toml from "toml"
import { anthropic } from "../lib/code-runner/anthropic"
import { safeEvaluateCode } from "../lib/code-runner/safe-evaluate-code"
import { createPrompt } from "./prompt"
import { evalite } from "evalite"
import { CircuitScorer } from "./scorers/circuit-scorer"
import { askAboutOutput } from "tests/fixtures/ask-about-output"

const savePrompt = (prompt: string, fileName: string) => {
  const promptsDir = path.join(__dirname, "./prompts")

  if (!fs.existsSync(promptsDir)) {
    fs.mkdirSync(promptsDir, { recursive: true })
  }

  const files = readdirSync(promptsDir)
    .filter((f) => f.startsWith("prompt-"))
    .sort()

  if (files.length >= 10) {
    fs.unlinkSync(path.join(promptsDir, files[0]))
  }

  fs.writeFileSync(path.join(promptsDir, fileName), prompt)
}

interface Problem {
  prompt: string
  title: string
  questions: { text: string; answer: boolean }[]
}

let systemPrompt = ""

const loadProblems = (filePath: string): Problem[] => {
  const tomlContent = fs.readFileSync(filePath, "utf-8")
  const parsedToml = toml.parse(tomlContent)

  return parsedToml.problems.map((problem: any) => ({
    prompt: problem.prompt,
    title: problem.title,
    questions: problem.questions.map((q: any) => ({
      text: q.text,
      answer: q.answer,
    })),
  }))
}

const runAI = async (prompt: string): Promise<string> => {
  const completion = await anthropic.messages.create({
    model: "claude-3-5-haiku-20241022",
    max_tokens: 2048,
    system: systemPrompt,
    messages: [
      {
        role: "assistant",
        content: "You must abide by the rules you have set for yourself",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  })

  return (completion as any).content[0]?.text || ""
}

evalite("Electronics Engineer", {
  data: async () => {
    const problems = loadProblems(path.join(__dirname, "./problems.toml"))
    systemPrompt = await createPrompt()

    const timestamp = new Date().toISOString().replace(/[:.]/g, "-")
    const promptFileName = `prompt-${timestamp}.txt`
    savePrompt(systemPrompt, promptFileName)

    return problems.map((problem) => ({
      input: {
        prompt: problem.prompt,
        promptFileName,
        questions: problem.questions,
      },
    }))
  },
  task: async (input) => {
    const aiResponse = await runAI(input.prompt)
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
