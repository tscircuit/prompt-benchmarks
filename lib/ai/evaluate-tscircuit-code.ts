import { CircuitRunner } from "@tscircuit/eval/eval"

export const evaluateTscircuitCode = async (
  code: string,
): Promise<{ success: boolean; error?: string }> => {
  const circuitRunner = new CircuitRunner()
  try {
    await circuitRunner.execute(addBoardToRootCircuit(code))
    await circuitRunner.renderUntilSettled()
    return { success: true }
  } catch (e) {
    return { success: false, error: e as string }
  }
}

export const addBoardToRootCircuit = (code: string): string => {
  const circuitAddStart = `circuit.add(\n`
  const circuitAddEnd = `\n)`

  const transformedCode = code
    .replace(/export const \w+ = \(\) => \(/, circuitAddStart)
    .replace(/\n\)$/, circuitAddEnd)

  return transformedCode
}
