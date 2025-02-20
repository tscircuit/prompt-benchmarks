import fs from "node:fs"
import path from "node:path"
import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { saveAttemptLog } from "../../lib/utils/save-attempt"

describe("saveAttemptLog", () => {
  const logsDir = path.join(__dirname, "temp-attempt-logs")

  beforeEach(() => {
    if (fs.existsSync(logsDir)) {
      fs.rmSync(logsDir, { recursive: true, force: true })
    }
  })

  afterEach(() => {
    if (fs.existsSync(logsDir)) {
      fs.rmSync(logsDir, { recursive: true, force: true })
    }
  })

  it("should create logsDir if not exists and write log file", () => {
    const fileName = "attempt-log.md"
    const prompt = "Test prompt"
    const code = "const x = 1;"
    const error = "Test error"

    saveAttemptLog({ fileName, prompt, logsDir, code, error })
    const filePath = path.join(logsDir, fileName)
    expect(fs.existsSync(filePath)).toBe(true)
    const content = fs.readFileSync(filePath, "utf8")
    expect(content).toContain(prompt)
    expect(content).toContain(code)
    expect(content).toContain(error)
  })
})
