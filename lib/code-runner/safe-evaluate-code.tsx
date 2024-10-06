import Anthropic from "@anthropic-ai/sdk"
import * as React from "react"
import { Circuit } from "@tscircuit/core"
import { safeTranspileCode } from "./transpile-code"

export const safeEvaluateCode = (
  code: string,
  type: "board" | "footprint" | "package" | "model" = "board",
):
  | {
      success: true
      circuit: Circuit
      circuitJson: any
      errorStage?: undefined
      error?: undefined
      hasSyntaxError?: undefined
      syntaxError?: undefined
      circuitErrors?: undefined
      typescriptErrors?: undefined
    }
  | {
      success: false
      error: string
      errorStage: string
      hasSyntaxError: boolean
      syntaxError?: string
      circuitErrors?: any[]
      typescriptErrors?: string[]
      circuit?: undefined
      circuitJson?: undefined
    } => {
  globalThis.React = React

  const { success, error, transpiledCode } = safeTranspileCode(code)

  if (error) {
    return {
      success: false,
      error: error,
      errorStage: "transpilation",
      hasSyntaxError: true,
      syntaxError: error,
      circuitErrors: [],
      typescriptErrors: [],
    }
  }

  const functionBody = `var exports = {}; var module = { exports }; ${transpiledCode}; return module;`
  let module: any
  try {
    module = Function(functionBody).call(globalThis)
  } catch (error: any) {
    return {
      success: false,
      error: error.message,
      errorStage: "transpilation",
      hasSyntaxError: false,
    }
  }

  if (Object.keys(module.exports).length > 1) {
    return {
      success: false,
      error: `Too many exports, only export one thing. You exported: ${JSON.stringify(Object.keys(module.exports))}`,
      errorStage: "generation-result",
      hasSyntaxError: false,
    }
  }

  const primaryKey = Object.keys(module.exports)[0]
  const UserElm = (props: any) =>
    React.createElement(module.exports[primaryKey], props)

  // Construct React tree
  try {
    const tree = <UserElm />
  } catch (error: any) {
    return {
      success: false,
      errorStage: "react-tree-construction",
      error: error.toString(),
      hasSyntaxError: true,
    }
  }

  const circuit = new Circuit()
  try {
    if (type === "board") {
      circuit.add(<UserElm />)
    } else if (type === "package") {
      circuit.add(
        <board width="10mm" height="10mm">
          <UserElm name="U1" />
        </board>,
      )
    } else if (type === "footprint") {
      circuit.add(
        <board width="10mm" height="10mm">
          <chip name="U1" footprint={<UserElm />} />
        </board>,
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
        </board>,
      )
    }

    circuit.render()
    const circuitJson = circuit.getCircuitJson()

    return { success: true, circuitJson, circuit }
  } catch (error: any) {
    return {
      success: false,
      error: error.toString(),
      errorStage: "circuit-rendering",
      hasSyntaxError: false,
    }
  }
}
