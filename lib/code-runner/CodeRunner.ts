import { CircuitRunner } from "@tscircuit/eval/eval"
import type { OutputType } from "./code-runner-context"

export class CodeRunner {
  private circuitRunner: CircuitRunner

  constructor() {
    this.circuitRunner = new CircuitRunner()
  }

  async runSnippet(code: string, outputType: OutputType = "board") {
    try {
      await this.circuitRunner.execute(code)
      await this.circuitRunner.renderUntilSettled()
      const circuitJson = await this.circuitRunner.getCircuitJson()
      return { circuitJson }
    } catch (error: any) {
      throw new Error(`Failed to run snippet: ${error.message}`)
    }
  }
}
