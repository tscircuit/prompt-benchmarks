export const getImportsFromCode = (code: string): string[] => {
  const importRegex = /import\s+["'](.*?)["']/g
  const imports = []
  let match: any
  // biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
  while ((match = importRegex.exec(code))) {
    imports.push(match[1])
  }
  return imports
}
