import {
  createSystem,
  createVirtualTypeScriptEnvironment,
} from "@typescript/vfs"
import ts from "typescript"
import { setupTypeAcquisition, type ATABootstrapConfig } from "@typescript/ata"

// Note: Ensure that 'fetch' is available in your environment.
// In Node.js 18 and above, 'fetch' is available globally.
// For earlier versions, you may need to install 'node-fetch' or 'undici'.

export async function safeCompileDts(code: string): Promise<{
  success: boolean
  error?: Error
  dts: string
}> {
  try {
    const fileName = "index.ts" // Changed from "index.tsx" to "index.ts"
    const fsMap = new Map<string, string>()
    fsMap.set(fileName, code)

    const system = createSystem(fsMap)
    const env = createVirtualTypeScriptEnvironment(system, [fileName], ts, {
      jsx: ts.JsxEmit.ReactJSX,
      declaration: true,
    })

    const ataConfig: ATABootstrapConfig = {
      projectName: "my-project",
      typescript: ts,
      logger: console,
      fetcher: (input: RequestInfo | URL, init?: RequestInit) => {
        // We'll need to override the fetch to get packages from the tscircuit
        // registry, this is implemented in the snippets library
        return fetch(input, init)
      },
      delegate: {
        receivedFile: (code: string, path: string) => {
          fsMap.set(path, code)
          env.createFile(path, code)
        },
      },
    }

    const ata = setupTypeAcquisition(ataConfig)
    await ata(`
import React from "@types/react/jsx-runtime"
import { Circuit } from "@tscircuit/core"
${code}
`)

    const { outputFiles } = env.languageService.getEmitOutput(fileName, true)

    const indexDts = outputFiles.find((file) => file.name === "index.d.ts")

    if (indexDts?.text) {
      return { success: true, dts: indexDts.text }
    }
    return {
      success: false,
      error: new Error("No index.d.ts generated"),
      dts: "",
    }
  } catch (error) {
    console.error("Error in safeCompileDts:", error)
    return { success: false, error: error as Error, dts: "" }
  }
}
