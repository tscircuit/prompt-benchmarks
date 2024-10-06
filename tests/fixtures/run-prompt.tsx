import Anthropic from "@anthropic-ai/sdk"

const anthropic = new Anthropic()

export const runInitialPrompt = async (
  systemPrompt: string,
  userPrompt: string,
  opts: {
    model?: "claude-3-5-sonnet-20240620" | "claude-3-haiku-20240307"
  } = {},
) => {
  const completion = await anthropic.messages.create({
    model: opts.model ?? "claude-3-5-sonnet-20240620",
    system: systemPrompt,
    messages: [
      {
        role: "user",
        content: userPrompt,
      },
    ],
    max_tokens: 4096,
  })

  const responseText: string = (completion as any).content[0]?.text

  const codefence = responseText.match(
    /```(ts|tsx|typescript)([\s\S]*?)```/,
  )?.[2]

  if (!codefence) {
    throw new Error("No codefence found in response")
  }

  // TODO run the codefence, detect syntax errors

  // TODO render the circuit, get the errors with circuitJson.filter(elm => elm.type === "error")

  // TODO evaluate the code for typescript errors

  return { codefence, hasSyntaxError, circuitErrors, typescriptErrors }
}
