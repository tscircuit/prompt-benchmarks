import { expect, test } from "bun:test"
import { runInitialPrompt } from "lib/code-runner/run-prompt"
import { createCircuitBoard2Template } from "lib/prompt-templates/create-circuit-board2"
import { boardSample1 } from "tests/board-samples/sample1"

test("create-circuit-board1-prompt1", async () => {
  const systemPrompt = createCircuitBoard2Template({ currentCode: "" })

  const { success, circuit } = await runInitialPrompt(
    { systemPrompt, userPrompt: boardSample1 },
    {
      model: "claude-3-5-sonnet-20241022",
      outputType: "board",
    },
  )

  expect(success).toBe(true)

  const led = circuit?.selectOne("led")

  expect(led).toBeDefined()
})
