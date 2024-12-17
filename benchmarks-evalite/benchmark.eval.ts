import fs from "fs"
import path from "path"
import toml from "toml"
import { anthropic } from "../lib/code-runner/anthropic"
import { safeEvaluateCode } from "../lib/code-runner/safe-evaluate-code"
import { askAboutOutput } from "../tests/fixtures/ask-about-output"
import { createPrompt } from "./prompt"
import { evalite } from "evalite"
import { ExactMatch } from "autoevals"

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
  const initialPrompt = createPrompt({ requestedCircuit: prompt })
  const completion = await anthropic.messages.create({
    model: "claude-3-5-haiku-20241022",
    max_tokens: 1024,
    system: "You are an expert in electronic circuit design and tscircuit.",
    messages: [
      {
        role: "user",
        content: initialPrompt,
      },
    ],
  })

  return (completion as any).content[0]?.text || ""
}

const problems = loadProblems(path.join(__dirname, "./problems.toml"))
let problemNumber = 0
for (const problem of problems) {
  problemNumber++
  evalite(problem.title, {
    data: async () => {
      const aiResponse = await runAI(problem.prompt)
      const codeMatch = aiResponse.match(/```tsx\s*([\s\S]*?)\s*```/)
      const code = codeMatch ? codeMatch[1].trim() : ""
      const evaluation = safeEvaluateCode(code, {
        outputType: "board",
        preSuppliedImports: {},
      })
      return problem.questions.map((question) => ({
        input: {
          code: evaluation.success ? code : null,
          question: question.text,
        },
        expected: question.answer.toString(),
      }))
    },
    task: async (input) => {
      if (!input.code) return ""
      const answer = await askAboutOutput(input.code, input.question)
      return answer.toString()
    },
    experimental_customColumns: async (result) => {
      return [
        {
          label: "Question",
          value: result.input.question,
        },
        {
          label: "Output",
          value: result.output,
        },
        {
          label: "Expected",
          value: result.expected,
        },
      ]
    },
    scorers: [ExactMatch],
  })
}
