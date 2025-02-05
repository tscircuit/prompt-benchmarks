import { expect, test } from "bun:test"
import { runInitialPrompt } from "lib/code-runner/run-prompt"
import { createCircuitBoard1Template } from "lib/prompt-templates/create-circuit-board1"
import { boardSample1 } from "tests/board-samples/sample1"

test("create-circuit-board1-prompt1", async () => {
  const systemPrompt = createCircuitBoard1Template({ currentCode: "" })

  const { success, circuit } = await runInitialPrompt(
    { systemPrompt, userPrompt: boardSample1 },
    {
      model: "claude-3-haiku-20240307",
      outputType: "board",
    },
  )

  expect(success).toBe(true)

  const led = circuit?.selectOne("led")

  expect(led).toBeDefined()
})
