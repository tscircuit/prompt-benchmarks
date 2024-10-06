import Anthropic from "@anthropic-ai/sdk"
import * as React from "react"
import { Circuit } from "@tscircuit/core"

export const evaluateCode = (code: string, type: "board" | "footprint" | "package" | "model" = "board") => {
  try {
    globalThis.React = React

    const functionBody = `var exports = {}; var module = { exports }; ${code}; return module;`
    const module = Function(functionBody).call(globalThis)

    try {
      const circuit = new Circuit()

      if (Object.keys(module.exports).length > 1) {
        throw new Error(
          `Too many exports, only export one thing. You exported: ${JSON.stringify(Object.keys(module.exports))}`
        )
      }

      const primaryKey = Object.keys(module.exports)[0]
      const UserElm = (props: any) => React.createElement(module.exports[primaryKey], props)

      if (type === "board") {
        circuit.add(<UserElm />)
      } else if (type === "package") {
        circuit.add(
          <board width="10mm" height="10mm">
            <UserElm name="U1" />
          </board>
        )
      } else if (type === "footprint") {
        circuit.add(
          <board width="10mm" height="10mm">
            <chip name="U1" footprint={<UserElm />} />
          </board>
        )
      } else if (type === "model") {
        // Note: This part might need adjustment as we don't have access to jscad-related imports
        // const jscadGeoms: any[] = []
        // const { createJSCADRoot } = createJSCADRenderer(jscadPlanner as any)
        // const jscadRoot = createJSCADRoot(jscadGeoms)
        // jscadRoot.render(<UserElm />)
        circuit.add(
          <board width="10mm" height="10mm">
            {/* <chip name="U1" cadModel={{}} /> */}
          </board>
        )
      }

      circuit.render()
      const circuitJson = circuit.getCircuitJson()

      return { message: "", circuitJson }
    } catch (error: any) {
      return { message: `Render Error: ${error.message}`, circuitJson: null }
    }
  } catch (error: any) {
    return { message: `Eval Error: ${error.message}\n\n${error.stack}`, circuitJson: null }
  }
}