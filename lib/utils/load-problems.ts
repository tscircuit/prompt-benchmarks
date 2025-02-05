import fs from "node:fs"
import toml from "toml"

interface Problem {
  prompt: string
  title: string
  questions: { text: string; answer: boolean }[]
}

export const loadProblems = (tomlFilePath: string): Problem[] => {
  const tomlContent = fs.readFileSync(tomlFilePath, "utf-8")
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
