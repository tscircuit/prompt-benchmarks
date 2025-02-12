import { CircuitRunner } from "@tscircuit/eval/eval"
import type { CodeRunnerContext } from "./code-runner-context"

export const safeEvaluateCode = async (
  code: string,
  context: CodeRunnerContext,
) => {
  const runner = new CircuitRunner()
  try {
    await runner.execute(code)
    await runner.renderUntilSettled()
    const circuitJson = await runner.getCircuitJson()
    return { success: true, circuitJson }
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      errorStage: "execution",
      hasSyntaxError: error.message.includes("SyntaxError"),
    }
  }
}
