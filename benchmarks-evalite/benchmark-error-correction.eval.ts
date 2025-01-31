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

interface AttemptHistory {
  code: string
  error: string
}

const runAI = async ({
  prompt,
  previousAttempts,
}: {
  prompt: string
  previousAttempts?: AttemptHistory[]
}): Promise<string> => {
  const messages: { role: "assistant" | "user"; content: string }[] = [
    { role: "user", content: prompt },
  ]

  if (previousAttempts?.length) {
    messages.push({
      role: "user",
      content: "Previous attempts failed. Here are the details:",
    })

    previousAttempts.forEach((attempt, index) => {
      messages.push(
        { role: "assistant", content: attempt.code },
        {
          role: "user",
          content: `Attempt ${index + 1} error: ${attempt.error}`,
        },
      )
    })

    messages.push({
      role: "user",
      content:
        "Please provide a new solution that addresses these errors. Avoid approaches that led to previous failures.",
    })
  }

  let result = ""

  try {
    const completion = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 2048,
      system: systemPrompt,
      messages: messages,
    })
    result = (completion as any).content[0]?.text
  } catch {
    result = "Error in AI API request"
  }

  return result
}

const errorCorrection = async ({
  attempts = 0,
  prompt,
  previousAttempts = [],
}: {
  attempts?: number
  prompt: string
  previousAttempts?: AttemptHistory[]
}): Promise<{
  code: string
  codeBlock: string
  error: string
}> => {
  const aiResponse = await runAI({ prompt, previousAttempts })
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
  attempts++
  previousAttempts.push({ code, error })

  if (attempts > 3) {
    return {
      code,
      codeBlock,
      error: previousAttempts[previousAttempts.length - 1].error || "",
    }
  }
  return await errorCorrection({
    attempts,
    prompt,
    previousAttempts,
  })
}

evalite("Reasoning Electronics Engineer", {
  data: async () => {
    const problems = loadProblems(path.join(__dirname, "./problems-1.toml"))
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
    const { code, codeBlock, error } = await errorCorrection({
      prompt: input.prompt,
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
