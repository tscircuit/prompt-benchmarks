import Anthropic from "@anthropic-ai/sdk"
import * as React from "react"
import { Circuit } from "@tscircuit/core"
import { safeTranspileCode } from "./transpile-code"
import Debug from "debug"
import type { CodeRunnerContext } from "./code-runner-context"

const debug = Debug("tscircuit:prompt")

export const safeEvaluateCode = (
  code: string,
  context: CodeRunnerContext,
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

  const { preSuppliedImports = {}, outputType } = context

  // Add pre-supplied imports to the global scope
  for (const [key, value] of Object.entries(preSuppliedImports)) {
    ;(globalThis as any)[key] = value
  }

  const { success, error, transpiledCode } = safeTranspileCode(code)

  debug({ transpiledCode, error })

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

  const __tscircuit_require = (name: string) => {
    if (!preSuppliedImports[name]) {
      throw new Error(`Import "${name}" not found`)
    }
    return preSuppliedImports[name]
  }
  ;(globalThis as any).__tscircuit_require = __tscircuit_require

  const functionBody = `
    var exports = {};
    var module = { exports };
    var require = globalThis.__tscircuit_require;
    ${transpiledCode}
    return module;
  `
  let module: any
  try {
    module = Function(functionBody).call(globalThis)
  } catch (error: any) {
    debug({
      errorStage: "evaluation",
      error,
    })
    return {
      success: false,
      error: error.message,
      errorStage: "evaluation",
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
    debug({
      errorStage: "react-tree-construction",
      error,
    })
    return {
      success: false,
      errorStage: "react-tree-construction",
      error: error.toString(),
      hasSyntaxError: true,
    }
  }

  const circuit = new Circuit()
  try {
    if (outputType === "board") {
      circuit.add(<UserElm />)
    } else if (outputType === "package") {
      circuit.add(
        <board width="10mm" height="10mm">
          <UserElm name="U1" />
        </board>,
      )
    } else if (outputType === "footprint") {
      circuit.add(
        <board width="10mm" height="10mm">
          <chip name="U1" footprint={<UserElm />} />
        </board>,
      )
    } else if (outputType === "model") {
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
    debug({
      errorStage: "circuit-rendering",
      error,
    })
    return {
      success: false,
      error: error.toString(),
      errorStage: "circuit-rendering",
      hasSyntaxError: false,
    }
  }
}
