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
    const fsMap = new Map<string, string>()
    fsMap.set("index.tsx", code)

    const system = createSystem(fsMap)
    const env = createVirtualTypeScriptEnvironment(system, [], ts, {
      jsx: ts.JsxEmit.ReactJSX,
      declaration: true,
    })

    const ataConfig: ATABootstrapConfig = {
      projectName: "my-project",
      typescript: ts,
      logger: console,
      fetcher: (input: RequestInfo | URL, init?: RequestInit) => {
        // For simplicity, we'll use the default fetch.
        // Note: In a Node.js environment, ensure 'fetch' is available.
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

    const { outputFiles } = env.languageService.getEmitOutput("index.tsx", true)

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
    return { success: false, error: error as Error, dts: "" }
  }
}
