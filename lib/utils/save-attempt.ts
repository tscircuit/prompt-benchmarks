import path from "node:path"
import fs from "node:fs"

export const saveAttemptLog = ({
  fileName,
  prompt,
  logsDir,
  code,
  error,
}: {
  fileName: string
  prompt: string
  logsDir: string
  code: string
  error: string
}) => {
  if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true })
  }

  const content = `# Attempt Log

## Prompt
${prompt}

## Error
\`\`\`
${error}
\`\`\`

## Code
\`\`\`tsx
${code}
\`\`\`
`

  fs.writeFileSync(path.join(logsDir, fileName), content)
}
