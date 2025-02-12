import Anthropic from "@anthropic-ai/sdk"
import * as React from "react"
import { Circuit } from "@tscircuit/core"
import { safeEvaluateCode } from "lib/code-runner/safe-evaluate-code"
import { extractCodefence } from "extract-codefence"
import { anthropic } from "lib/ai/anthropic"
import Debug from "debug"
import type {
  PromptAndRunnerContext,
  PromptContext,
} from "./code-runner-context"

const debug = Debug("tscircuit:prompt")

export const runInitialPrompt = async (
  { systemPrompt, userPrompt }: { systemPrompt: string; userPrompt: string },
  context: PromptAndRunnerContext,
) => {
  const type = context.outputType
  const completion = await anthropic.messages.create({
    model: context.model,
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
  const result = await safeEvaluateCode(`${codefence}`, context)

  if (result.success) {
    return {
      success: true,
      codefence,
      circuitJson: result.circuitJson,
      error: undefined,
      hasSyntaxError: false,
      syntaxError: undefined,
      circuitErrors: [],
      typescriptErrors: [],
    }
  } else {
    return {
      success: false,
      codefence,
      error: result.error,
      errorStage: result.errorStage,
      hasSyntaxError: result.hasSyntaxError,
      syntaxError: result.error,
      circuitErrors: [],
      typescriptErrors: [],
      circuitJson: undefined,
    }
  }
}
