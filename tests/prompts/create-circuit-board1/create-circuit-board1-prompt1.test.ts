import { expect, test } from "bun:test"
import { runInitialPrompt } from "tests/fixtures/run-prompt"
import { createCircuitBoard1Template } from "prompt-templates/create-circuit-board1"
import { sample1 } from "tests/samples/sample1"

test("create-circuit-board1-prompt1", async () => {
  const systemPrompt = createCircuitBoard1Template({ currentCode: "" })

  const code = await runInitialPrompt(systemPrompt, sample1)

  console.log(code)
  expect(code).toBeDefined()
})
