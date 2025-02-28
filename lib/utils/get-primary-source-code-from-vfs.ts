export function getPrimarySourceCodeFromVfs(
  vfs: Record<string, string> | undefined,
): string | undefined {
  let code = undefined
  if (vfs && Object.keys(vfs).length !== 0) {
    const finalResultKey = Object.keys(vfs)[Object.keys(vfs).length - 1]
    if (finalResultKey.includes("final")) {
      code = vfs[finalResultKey]
    }
  }
  return code
}
