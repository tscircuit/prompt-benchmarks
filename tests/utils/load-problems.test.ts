import fs from "node:fs"
import path from "node:path"
import { describe, it, expect, afterEach } from "bun:test"
import { loadProblems } from "../../lib/utils/load-problems"

describe("loadProblems", () => {
  const testTomlPath = path.join(__dirname, "test-problems.toml")

  afterEach(() => {
    if (fs.existsSync(testTomlPath)) {
      fs.rmSync(testTomlPath)
    }
  })

  it("should load problems from a TOML file", () => {
    const tomlContent = `
problems = [
  { prompt = "Test prompt", title = "Test title", questions = [ { text = "Question 1", answer = true }, { text = "Question 2", answer = false } ] }
]
`
    fs.writeFileSync(testTomlPath, tomlContent)
    const problems = loadProblems(testTomlPath)
    expect(Array.isArray(problems)).toBe(true)
    expect(problems.length).toBe(1)
    expect(problems[0].prompt).toBe("Test prompt")
    expect(problems[0].questions.length).toBe(2)
  })
})
