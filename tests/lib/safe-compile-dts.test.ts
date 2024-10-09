import { expect, test } from "bun:test"
import { safeCompileDts } from "../../lib/code-runner/safe-compile-dts"

test("safeCompileDts with valid TypeScript code", async () => {
  const testCode = `
    import React from 'react';
    
    interface Props {
      name: string;
    }
    
    const Greeting: React.FC<Props> = ({ name }) => {
      return <h1>Hello, {name}!</h1>;
    };
    
    export default Greeting;
  `

  const { success, dts, error } = await safeCompileDts(testCode)

  expect(error).toBeUndefined()
  expect(success).toBe(true)
  expect(dts).toBeDefined()
  expect(dts).toContain("interface Props")
  expect(dts).toContain("const Greeting: React.FC<Props>")
})
