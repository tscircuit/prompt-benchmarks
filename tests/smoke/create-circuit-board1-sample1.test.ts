import { expect, test } from "bun:test"
import { runInitialPrompt } from "lib/code-runner/run-prompt"
import { createCircuitBoard1Template } from "prompt-templates/create-circuit-board1"
import { boardSample1 } from "tests/board-samples/sample1"
import { askAboutOutput } from "tests/fixtures/ask-about-output"

test("create-circuit-board1-prompt1", async () => {
  const systemPrompt = createCircuitBoard1Template({ currentCode: "" })

  const { success, circuit, codefence } = await runInitialPrompt(
    { systemPrompt, userPrompt: boardSample1 },
    {
      model: "claude-3-haiku-20240307",
      outputType: "board",
    },
  )

  expect(success).toBe(true)

  const led = circuit?.selectOne("led")

  expect(led).toBeDefined()

  const pads = circuit?.selectAll(`.${led?.props.name} > smtpad`)

  expect(pads).toHaveLength(2)

  expect(
    await askAboutOutput(codefence, "does the LED have a footprint prop?"),
  ).toBe(true)

  // expect(
  //   await askAboutOutput(codefence, ""),
  // ).toBe(true)
})
