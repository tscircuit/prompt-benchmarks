import { expect, test } from "bun:test"
import { getImportsFromCode } from "../../lib/code-runner-utils/get-imports-from-code"

test("getImportsFromCode with various import styles", () => {
  const testCode = `
    import React from 'react'
    import { useState, useEffect } from 'react'
    import axios from 'axios'
    import * as utils from './utils'
    import type { User } from './types'
    import './styles.css'
    
    const Component = () => {
      // Component code here
    }
  `

  const imports = getImportsFromCode(testCode)

  expect(imports).toEqual([
    "react",
    "react",
    "axios",
    "./utils",
    "./types",
    "./styles.css",
  ])
})

test("getImportsFromCode with no imports", () => {
  const testCode = `
    const x = 5
    function test() {
      return x * 2
    }
  `

  const imports = getImportsFromCode(testCode)

  expect(imports).toEqual([])
})

test("getImportsFromCode with mixed quotes", () => {
  const testCode = `
    import React from "react"
    import { useState } from 'react'
    import axios from "axios"
  `

  const imports = getImportsFromCode(testCode)

  expect(imports).toEqual(["react", "react", "axios"])
})

test("getImportsFromCode with side-effect imports", () => {
  const testCode = `
    import 'dotenv/config'
    import './polyfills'
  `

  const imports = getImportsFromCode(testCode)

  expect(imports).toEqual(["dotenv/config", "./polyfills"])
})
