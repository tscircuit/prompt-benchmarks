import fs from "node:fs"
import path from "node:path"
import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { cleanupAttemptLogs } from "../../lib/utils/cleanup-attempt-logs"

describe("cleanupAttemptLogs", () => {
  const logsDir = path.join(__dirname, "temp-cleanup-logs")

  beforeEach(() => {
    if (fs.existsSync(logsDir)) {
      fs.rmSync(logsDir, { recursive: true, force: true })
    }
    fs.mkdirSync(logsDir, { recursive: true })
    fs.writeFileSync(path.join(logsDir, "dummy.txt"), "dummy content")
  })

  afterEach(() => {
    if (fs.existsSync(logsDir)) {
      fs.rmSync(logsDir, { recursive: true, force: true })
    }
  })

  it("should remove existing logs and recreate empty directory", () => {
    cleanupAttemptLogs(logsDir)
    expect(fs.existsSync(logsDir)).toBe(true)
    const files = fs.readdirSync(logsDir)
    expect(files.length).toBe(0)
  })
})
