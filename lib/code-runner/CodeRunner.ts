import * as tscircuitCore from "@tscircuit/core"
/**
 * This class is used to run tsx code. By default, it will add required
 * imports to build basic circuits in tscircuit like @tscircuit/core
 */
export class CodeRunner {
  imports: Record<string, any> = {}

  constructor() {
    this.addImportByValue("@tscircuit/core", tscircuitCore)
  }

  async addImportByName(importName: string) {
    // Dynamically import the module via jsdelivr
    const url = `https://cdn.jsdelivr.net/npm/${importName}`
    const module = await import(url)
    this.imports[importName] = module
  }

  async addImportByValue(importName: string, importValue: any) {
    this.imports[importName] = importValue
  }

  async runTsx(code: string) {}
}
