export function getPrimarySourceCodeFromVfs(
  vfs: Record<string, string> | undefined,
): string | undefined {
  let code = undefined
  if (vfs && Object.keys(vfs).length !== 0) {
    // Find all keys that include "final" and get the last one
    const finalKeys = Object.keys(vfs).filter((key) => key.includes("final"))
    if (finalKeys.length > 0) {
      const finalResultKey = finalKeys[finalKeys.length - 1]
      code = vfs[finalResultKey]
    }
  }
  return code
}
