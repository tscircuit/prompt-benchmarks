import * as tscircuitCore from "@tscircuit/core"
import { safeEvaluateCode } from "./safe-evaluate-code"
import { getImportsFromCode } from "../code-runner-utils/get-imports-from-code"
import { pullSnippetCompiledJs } from "./pull-snippet-import"
import type { OutputType } from "./code-runner-context"

const REGISTRY_PREFIXES = [
  "https://data.jsdelivr.com/v1/package/resolve/npm/@tsci/",
  "https://data.jsdelivr.com/v1/package/npm/@tsci/",
  "https://cdn.jsdelivr.net/npm/@tsci/",
]

/**
 * This class is used to run tsx code. By default, it will add required
 * imports to build basic circuits in tscircuit like @tscircuit/core
 */
export class CodeRunner {
  imports: Record<string, any> = {}
  registryApiUrl: string

  constructor({
    registryApiUrl,
  }: {
    registryApiUrl?: string
  } = {}) {
    this.registryApiUrl = registryApiUrl || "https://registry-api.tscircuit.com"
    this.addImportByValue("@tscircuit/core", tscircuitCore)
  }

  async addImportByName(importName: string) {
    if (importName.startsWith("@tsci/")) {
      // Handle @tsci imports differently using pullSnippetCompiledJs
      const compiledJs = await pullSnippetCompiledJs(importName)
      // Execute the compiled JS in a new context with access to this.imports
      const context = { ...this.imports }
      const fn = new Function("exports", "require", compiledJs)
      const exports = {}
      fn(exports, (name: string) => this.imports[name])
      this.imports[importName] = exports
    } else {
      // Dynamically import the module via jsdelivr
      // Check if this is a jsdelivr URL
      const isJsdelivrUrl = REGISTRY_PREFIXES.some((prefix) =>
        importName.startsWith(prefix),
      )

      if (isJsdelivrUrl) {
        // Extract package info from jsdelivr URL
        const fullPackageName = REGISTRY_PREFIXES.reduce(
          (name, prefix) => name.replace(prefix, ""),
          importName,
        )
        const packageName = fullPackageName.split("/")[0].replace(/\./, "/")
        const pathInPackage = fullPackageName.split("/").slice(1).join("/")
        const jsdelivrPath = `${packageName}${pathInPackage ? `/${pathInPackage}` : ""}`

        // Call registry API with appropriate parameters
        const response = await fetch(
          `${this.registryApiUrl}/snippets/download?` +
            `jsdelivr_resolve=${importName.includes("/resolve/")}&` +
            `jsdelivr_path=${encodeURIComponent(jsdelivrPath)}`,
        )

        const module = await response.json()
        this.imports[importName] = module
      } else {
        // Default behavior for non-jsdelivr imports
        const url = `https://cdn.jsdelivr.net/npm/${importName}`
        const module = await import(url)
        this.imports[importName] = module
      }
    }
  }

  async addImportByValue(importName: string, importValue: any) {
    this.imports[importName] = importValue
  }

  async runTsx(code: string, outputType: OutputType = "board") {
    // Get all imports from code
    const imports = getImportsFromCode(code)

    // Load any missing imports
    for (const importName of imports) {
      if (!this.imports[importName]) {
        await this.addImportByName(importName)
      }
    }

    // Evaluate the code with the collected imports
    const result = safeEvaluateCode(code, {
      outputType,
      preSuppliedImports: this.imports,
    })

    return result
  }
}
