import { OpenAI } from "openai"

export type Model = OpenAI.Completion["model"]
export type OutputType = "board" | "footprint" | "package" | "model"

export interface PromptContext {
  /**
   * Imports available to the AI
   */
  availableImports?: Record<string, string>

  model: Model

  outputType: OutputType
}

export interface CodeRunnerContext {
  /**
   * Imports that are accessible when running the code with their imported
   * values.
   */
  preSuppliedImports?: Record<string, any>

  /**
   * The type of output to generate.
   */
  outputType: OutputType
}

export interface PromptAndRunnerContext
  extends PromptContext,
    CodeRunnerContext {}
