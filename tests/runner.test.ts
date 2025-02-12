import { expect, test, describe } from "bun:test"
import { CodeRunner } from "lib/code-runner"

describe("CodeRunner", () => {
  test("should evaluate basic circuit code", async () => {
    const runner = new CodeRunner()

    const testCode = `
      circuit.add(
        <board width="100mm" height="100mm">
          <resistor name="R1" resistance="10k" />
        </board>
      )
    `

    const result = await runner.runSnippet(testCode)

    // Verify board was created
    const board = result.circuitJson.find((el) => el.type === "pcb_board")
    expect(board).toBeTruthy()
    expect(board?.width).toBe(100)
    expect(board?.height).toBe(100)

    // Verify resistor was added
    const resistor: any = result.circuitJson.find((el: any) => el.name === "R1")
    expect(resistor).toBeTruthy()
    expect(resistor?.ftype).toBe("simple_resistor")
    expect(resistor?.resistance).toBe(10000)
  })

  test("should handle @tsci imports", async () => {
    const runner = new CodeRunner()

    const testCode = `
      import { RedLed } from "@tsci/seveibar.red-led"
      
      circuit.add(
        <board width="50mm" height="50mm">
          <RedLed name="LED1" />
        </board>
      )
    `

    const result = await runner.runSnippet(testCode)

    // Verify LED was added
    const led: any = result.circuitJson.find((el: any) => el.name === "LED1")
    expect(led).toBeTruthy()
    expect(led?.ftype).toBe("simple_diode")
  })

  test("should handle syntax errors gracefully", async () => {
    const runner = new CodeRunner()

    const testCode = `
      circuit.add(
        <board width="100mm"  // missing closing >
    `

    expect(runner.runSnippet(testCode)).rejects.toThrow("Failed to run snippet")
  })
})
