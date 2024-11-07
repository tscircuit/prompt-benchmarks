import { expect, test } from "bun:test"
import { CodeRunner } from "../../lib/code-runner/CodeRunner"
import * as React from "react"
import { su } from "@tscircuit/soup-util"

test("CodeRunner with @tsci imports", async () => {
  const runner = new CodeRunner({
    registryApiUrl: "https://registry-api.tscircuit.com",
  })

  const testCode = `
    import { RedLed } from "@tsci/seveibar.red-led"

    export default function TestBoard() {
      return (
        <board width="10mm" height="10mm">
          <RedLed name="LED1" />
        </board>
      )
    }
  `

  const { circuitJson, circuit } = await runner.runSnippet(testCode)

  expect(circuitJson).toBeDefined()
  expect(circuit.db.source_component.list()[0].name).toEqual("LED1")
})
