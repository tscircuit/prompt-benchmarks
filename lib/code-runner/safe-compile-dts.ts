import {
  createDefaultMapFromCDN,
  createDefaultMapFromNodeModules,
  createSystem,
  createVirtualTypeScriptEnvironment,
} from "@typescript/vfs"
import ts from "typescript"
import { setupTypeAcquisition, type ATABootstrapConfig } from "@typescript/ata"

// Custom storage implementation that works in both browser and Node.js
const customStorage = {
  _data: new Map<string, string>(),
  getItem: (key: string) => customStorage._data.get(key) ?? null,
  setItem: (key: string, value: string) => customStorage._data.set(key, value),
  removeItem: (key: string) => customStorage._data.delete(key),
  clear: () => customStorage._data.clear(),
}

// Custom function to create a map of default library files
async function createCustomDefaultMap(
  options: ts.CompilerOptions,
  tsVersion: string,
): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  const libs = [
    "lib.es5.d.ts",
    // "lib.dom.d.ts",
    "lib.es2015.d.ts",
  ]

  for (const lib of libs) {
    const url = `https://typescript.azureedge.net/cdn/${tsVersion}/typescript/lib/${lib}`
    const response = await fetch(url)
    const text = await response.text()
    map.set(`/${lib}`, text)
  }

  return map
}

export async function safeCompileDts(
  code: string,
  opts: {
    importMapMethod?: "node_modules" | "cdn" | "custom" | "none"
  } = {},
): Promise<{
  success: boolean
  error?: Error
  dts: string
}> {
  opts.importMapMethod ??= "cdn"
  try {
    const fileName = "index.ts"
    let fsMap: Map<string, string>
    const compilerOptions = { target: ts.ScriptTarget.ES2015, lib: ["es2015"] }
    if (opts.importMapMethod === "custom") {
      fsMap = await createCustomDefaultMap(compilerOptions, ts.version)
    } else if (opts.importMapMethod === "node_modules") {
      fsMap = await createDefaultMapFromNodeModules(compilerOptions, ts)
    } else if (opts.importMapMethod === "cdn") {
      if (!globalThis.localStorage) {
        globalThis.localStorage = customStorage as any
      }
      if (!globalThis.fetch) {
        throw new Error(
          "Fetch is not available in the global scope, can't use CDN",
        )
      }
      fsMap = await createDefaultMapFromCDN(
        compilerOptions,
        ts.version,
        true,
        ts,
      )
    } else {
      fsMap = new Map()
    }

    fsMap.set(fileName, code)

    const system = createSystem(fsMap)
    const env = createVirtualTypeScriptEnvironment(system, [fileName], ts, {
      target: ts.ScriptTarget.ES2015,
      jsx: ts.JsxEmit.ReactJSX,
      declaration: true,
      lib: ["es2015"],
    })

    const ataConfig: ATABootstrapConfig = {
      projectName: "my-project",
      typescript: ts,
      fetcher: (input: RequestInfo | URL, init?: RequestInit) => {
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
