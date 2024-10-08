import * as Babel from "@babel/standalone"

export const safeTranspileCode = (
  code: string,
):
  | { success: true; transpiledCode: string; error: undefined }
  | { success: false; error: string; transpiledCode: undefined } => {
  if (!code) return { success: true, transpiledCode: "", error: undefined }
  try {
    const result = Babel.transform(code, {
      presets: ["react", "typescript"],
      plugins: ["transform-modules-commonjs"],
      filename: "index.tsx",
    })
    return {
      success: true,
      transpiledCode: result.code || "",
      error: undefined,
    }
  } catch (error: any) {
    console.error("Babel compilation error:", error)
    return { success: false, error: error.message, transpiledCode: undefined }
  }
}
