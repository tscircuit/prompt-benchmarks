import { expect, test } from "bun:test"
import { CodeRunner } from "../../lib/code-runner/CodeRunner"
import * as React from "react"

test("CodeRunner with @tsci imports", async () => {
  const runner = new CodeRunner({
    registryApiUrl: "https://registry-api.tscircuit.com",
  })

  const testCode = `
    import CustomComponent from "@tsci/seveibar.red-led"
    
    export default function TestBoard() {
      return (
        <board width="10mm" height="10mm">
          <CustomComponent name="U1" />
        </board>
      )
    }
  `

  const result = await runner.runTsx(testCode)

  console.log(result)

  expect(result.success).toBe(true)
  expect(result.error).toBeUndefined()
  expect(result.circuit).toBeDefined()

  if (result.success) {
    const resistor = result.circuit.selectOne("resistor")
    expect(resistor?.props.name).toBe("U1")
    expect(resistor?.props.resistance).toBe("1k")
  }
})
