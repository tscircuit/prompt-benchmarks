import fs from "node:fs"
import path from "node:path"
import { describe, it, expect, beforeEach, afterEach } from "bun:test"
import { savePrompt } from "../../lib/utils/save-prompt"

describe("savePrompt", () => {
  const testDir = path.join(__dirname, "temp-save-prompt")

  beforeEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
    fs.mkdirSync(testDir, { recursive: true })
  })

  afterEach(() => {
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true, force: true })
    }
  })

  it("should write a prompt to a file", () => {
    const prompt = "Test prompt"
    const fileName = "prompt-1.txt"
    savePrompt(prompt, fileName, testDir)
    const fileContent = fs.readFileSync(path.join(testDir, fileName), "utf8")
    expect(fileContent).toBe(prompt)
  })

  it("should delete the oldest file when ≥10 files exist", () => {
    for (let i = 0; i < 10; i++) {
      fs.writeFileSync(path.join(testDir, `prompt-${i}.txt`), `dummy ${i}`)
    }

    const prompt = "New test prompt"
    const fileName = "prompt-11.txt"
    savePrompt(prompt, fileName, testDir)
    expect(fs.existsSync(path.join(testDir, "prompt-0.txt"))).toBe(false)
    expect(fs.readFileSync(path.join(testDir, fileName), "utf8")).toBe(prompt)
  })
})
