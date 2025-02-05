import fs from "node:fs"
import path from "node:path"

export const savePrompt = (
  prompt: string,
  fileName: string,
  promptsDir: string,
) => {
  if (!fs.existsSync(promptsDir)) {
    fs.mkdirSync(promptsDir, { recursive: true })
  }

  const files = fs
    .readdirSync(promptsDir)
    .filter((f) => f.startsWith("prompt-"))
    .sort()

  if (files.length >= 10) {
    fs.unlinkSync(path.join(promptsDir, files[0]))
  }

  fs.writeFileSync(path.join(promptsDir, fileName), prompt)
}
