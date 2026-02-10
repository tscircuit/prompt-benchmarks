export function getPrimarySourceCodeFromVfs(
  vfs: Record<string, string> | undefined,
): string | undefined {
  if (!vfs || Object.keys(vfs).length === 0) {
    return undefined
  }

  const finalKeys = Object.keys(vfs).filter((key) => key.includes("final"))

  if (finalKeys.length === 0) {
    return undefined
  }

  const parsePromptId = (key: string): number => {
    const match = key.match(/prompt-(\d+)-attempt-final/)
    return match ? parseInt(match[1], 10) : 0
  }

  finalKeys.sort((a, b) => {
    const idA = parsePromptId(a)
    const idB = parsePromptId(b)
    return idB - idA
  })

  return vfs[finalKeys[0]]
}
