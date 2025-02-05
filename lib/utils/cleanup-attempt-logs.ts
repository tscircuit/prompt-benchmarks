import fs from "node:fs"

export const cleanupAttemptLogs = (logsDir: string) => {
  if (fs.existsSync(logsDir)) {
    fs.rmSync(logsDir, { recursive: true, force: true })
  }
  fs.mkdirSync(logsDir, { recursive: true })
}
