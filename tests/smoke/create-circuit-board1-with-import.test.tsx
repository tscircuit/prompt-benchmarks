import { expect, test } from "bun:test"
import { runInitialPrompt } from "lib/code-runner/run-prompt"
import { createCircuitBoard1Template } from "prompt-templates/create-circuit-board1"
import { sample1 } from "tests/samples/sample1"
import { askAboutOutput } from "tests/fixtures/ask-about-output"

test("create-circuit-board1-prompt1", async () => {
  const systemPrompt = createCircuitBoard1Template({ currentCode: "" })

  const MicroUsb = (name: string) => (
    <chip
      name={name}
      footprint="dip8"
      pinLabels={{
        1: "VCC",
        2: "GND",
        3: "ID",
        4: "D+",
        5: "D-",
      }}
    />
  )
  const { success, circuit, codefence, error } = await runInitialPrompt(
    systemPrompt,
    "an led with an 0402 footprint",
    {
      model: "claude-3-haiku-20240307",
      type: "board",
      availableImports: {
        "@tsci/seveibar.micro-usb": `
        
If no power supply is specified, MicroUSB can be a good power supply.

Example usage:

\`\`\`
import MicroUsb from "@tsci/seveibar.micro-usb"

<MicroUsb
  name="U1"
  vbus="..."
  gnd="..."
  idPin="..."
  dataPlus="..."
  dataMinus="..."
/>
\`\`\` 
        `.trim(),
      },
      preSuppliedImports: {
        "@tsci/seveibar.micro-usb": MicroUsb,
      },
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
