export function getFinalResult(
  vfs: Record<string, string> | undefined,
): string | undefined {
  let previousCode = undefined
  if (vfs && Object.keys(vfs).length !== 0) {
    const finalResultKey = Object.keys(vfs)[Object.keys(vfs).length - 1]
    if (finalResultKey.includes("final")) {
      previousCode = vfs[finalResultKey]
    }
  }
  return previousCode
}
