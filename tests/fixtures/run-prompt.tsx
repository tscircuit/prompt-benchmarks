import Anthropic from "@anthropic-ai/sdk"
import * as React from "react"
import { Circuit } from "@tscircuit/core"
import {evaluateCode} from "./evaluate-code"

const anthropic = new Anthropic()

export const runInitialPrompt = async (
  systemPrompt: string,
  userPrompt: string,
  opts: {
    model?: "claude-3-5-sonnet-20240620" | "claude-3-haiku-20240307"
    type?: "board" | "footprint" | "package" | "model"
  } = {},
) => {
  const type = opts.type ?? "board"
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

  // Run the codefence, detect syntax errors, and evaluate circuit
  const { message, circuitJson } = evaluateCode(codefence, type)

  const hasSyntaxError = message.startsWith("Eval Error:")
  const circuitErrors = circuitJson?.filter(elm => elm.type.includes("error")) || []
  const typescriptErrors = message.startsWith("Render Error:") ? [message] : []

  return { codefence, hasSyntaxError, circuitErrors, typescriptErrors, circuitJson }
}
