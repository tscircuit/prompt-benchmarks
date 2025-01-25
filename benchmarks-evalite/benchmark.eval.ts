import fs from "node:fs"
import path from "node:path"
import toml from "toml"
import { anthropic } from "../lib/code-runner/anthropic"
import { safeEvaluateCode } from "../lib/code-runner/safe-evaluate-code"
import { createPrompt } from "./prompt"
import { evalite } from "evalite"
import { CircuitScorer } from "./scorers/circuit-scorer"
import { askAboutOutput } from "tests/fixtures/ask-about-output"

interface Problem {
  prompt: string
  title: string
  questions: { text: string; answer: boolean }[]
}

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
  const systemPrompt = await createPrompt()
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
  data: () => {
    const problems = loadProblems(path.join(__dirname, "./problems.toml"))

    return problems.map((problem) => ({
      input: {
        prompt: problem.prompt,
        questions: problem.questions,
      },
    }))
  },
  task: async (input) => {
    const aiResponse = await runAI(input.prompt)
    const codeMatch = aiResponse.match(/```tsx\s*([\s\S]*?)\s*```/)
    const code = codeMatch ? codeMatch[1].trim() : ""
    const evaluation = safeEvaluateCode(code, {
      outputType: "board",
      preSuppliedImports: {},
    })

    const output: {
      results: { result: boolean; expected: boolean }[]
      code: string
    } = { results: [], code: "" }

    if (evaluation.success) {
      output.code = code
      for (const question of input.questions) {
        output.results.push({
          result: await askAboutOutput(code, question.text),
          expected: question.answer,
        })
      }
      return output
    }
    return `${evaluation.error}\nCode: ${code}`
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
