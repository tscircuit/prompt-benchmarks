import Anthropic from "@anthropic-ai/sdk"
import * as React from "react"
import { Circuit } from "@tscircuit/core"
import { safeEvaluateCode } from "./safe-evaluate-code"
import { extractCodefence } from "extract-codefence"
import { anthropic } from "./anthropic"
import Debug from "debug"

const debug = Debug("tscircuit:prompt")

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

  const codefence = extractCodefence(responseText)

  if (!codefence) {
    throw new Error("No codefence found in response")
  }

  // Run the codefence, detect syntax errors, and evaluate circuit
  const {
    success,
    error,
    errorStage,
    circuit,
    circuitJson,
    hasSyntaxError,
    syntaxError,
    circuitErrors,
    typescriptErrors,
  } = safeEvaluateCode(codefence, type)

  if (success) {
    debug(`codefence:\n ${codefence}`)
    return {
      success: true as const,
      codefence,
      error,
      hasSyntaxError: false,
      syntaxError: undefined,
      circuitErrors: [],
      typescriptErrors: [],
      circuit,
      circuitJson,
    }
  }

  return {
    success: false as const,
    codefence,
    error,
    errorStage,
    hasSyntaxError,
    syntaxError,
    circuitErrors,
    typescriptErrors,
    circuit,
    circuitJson,
  }
}
