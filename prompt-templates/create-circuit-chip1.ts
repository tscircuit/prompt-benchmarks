export const createCircuitBoard1Template = ({
  currentCode = "",
  availableImports,
}: { currentCode?: string; availableImports?: Record<string, string> }) => `
Please create a react component export for a chip circuit board in tscircuit with
the user-provided description.
`
