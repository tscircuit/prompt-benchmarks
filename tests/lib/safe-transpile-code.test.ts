import { expect, test } from "bun:test"
import { safeTranspileCode } from "../../lib/code-runner/transpile-code"

test("safeTranspileCode with valid TypeScript code", () => {
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

  const { success, transpiledCode, error } = safeTranspileCode(testCode)

  expect(success).toBe(true)
  expect(error).toBeUndefined()
  expect(transpiledCode).toBeDefined()
  expect(transpiledCode).not.toContain("interface Props")

  expect(transpiledCode?.trim()).toBe(
    `
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = _interopRequireDefault(require("react"));
function _interopRequireDefault(e) { return e && e.__esModule ? e : { default: e }; }
const Greeting = ({
  name
}) => {
  return /*#__PURE__*/_react.default.createElement("h1", null, "Hello, ", name, "!");
};
var _default = exports.default = Greeting;
`.trim(),
  )
})

test("safeTranspileCode with invalid code", () => {
  const invalidCode = `
    const x = {;
  `

  const { success, transpiledCode, error } = safeTranspileCode(invalidCode)

  expect(success).toBe(false)
  expect(transpiledCode).toBeUndefined()
  expect(error).toBeDefined()
  expect(error).toContain("Unexpected token")
})

test("safeTranspileCode with empty input", () => {
  const { success, transpiledCode, error } = safeTranspileCode("")

  expect(success).toBe(true)
  expect(transpiledCode).toBe("")
  expect(error).toBeUndefined()
})
