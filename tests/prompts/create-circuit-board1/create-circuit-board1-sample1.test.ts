import { expect, test } from "bun:test"
import { runInitialPrompt } from "tests/fixtures/run-prompt"
import { createCircuitBoard1Template } from "prompt-templates/create-circuit-board1"
import { sample1 } from "tests/samples/sample1"

test("create-circuit-board1-prompt1", async () => {
  const systemPrompt = createCircuitBoard1Template({ currentCode: "" })

  const { success, circuit } = await runInitialPrompt(systemPrompt, sample1, {
    model: "claude-3-haiku-20240307",
    type: "board",
  })

  expect(success).toBe(true)

  const led = circuit?.selectOne("led")

  expect(led).toBeDefined()
})
