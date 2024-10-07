import { expect, test } from "bun:test"
import { safeEvaluateCode } from "../../lib/code-runner/safe-evaluate-code"
import * as React from "react"

test("safeEvaluateCode with preSuppliedImports", () => {
  const MyCustomComponent = ({ name }: { name: string }) => (
    <resistor name={name} resistance="1k" />
  )

  const testCode = `
import CustomComponent from "@tsci/seveibar.custom-component"

export default function TestComponent() {
  return <board width="10mm" height="10mm"><CustomComponent name="R1" /></board>
}
  `

  const result = safeEvaluateCode(testCode, {
    outputType: "board",
    preSuppliedImports: {
      "@tsci/seveibar.custom-component": MyCustomComponent,
    },
  })

  expect(result.success).toBe(true)
  expect(result.error).toBeUndefined()
  expect(result.circuit).toBeDefined()

  if (result.success) {
    const customComponentInstance = result.circuit.selectOne("resistor")
    expect(customComponentInstance?.props.name).toBe("R1")
  }
})
