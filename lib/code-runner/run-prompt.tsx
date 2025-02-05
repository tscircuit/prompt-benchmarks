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
  debug({ codefence })

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
  } = safeEvaluateCode(codefence, {
    outputType: context.outputType,
    preSuppliedImports: context.preSuppliedImports,
  })

  if (success) {
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
