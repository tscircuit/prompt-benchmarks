import { runAiWithErrorCorrection } from "./run-ai-with-error-correction"
import { createLocalCircuitPrompt } from "lib/prompt-templates/create-local-circuit-prompt"

export interface AiCoder {
  onStreamedChunk: (chunk: string) => void
  onVfsChanged: () => void
  vfs: { [filepath: string]: string }
  availableOptions: { name: string; options: string[] }[]
  submitPrompt: (
    prompt: string,
    options?: { selectedMicrocontroller?: string },
  ) => Promise<void>
}

export class AiCoderImpl implements AiCoder {
  onStreamedChunk: (chunk: string) => void
  onVfsChanged: () => void
  vfs: { [filepath: string]: string } = {}
  availableOptions = [{ name: "microController", options: ["pico", "esp32"] }]
  anthropicClient: import("@anthropic-ai/sdk").Anthropic | undefined

  constructor(
    onStreamedChunk: (chunk: string) => void,
    onVfsChanged: () => void,
    anthropicClient?: import("@anthropic-ai/sdk").Anthropic,
  ) {
    this.onStreamedChunk = onStreamedChunk
    this.onVfsChanged = onVfsChanged
    this.anthropicClient = anthropicClient
  }

  async submitPrompt(
    prompt: string,
    options?: { selectedMicrocontroller?: string },
  ): Promise<void> {
    const systemPrompt = await createLocalCircuitPrompt()
    const promptNumber = Date.now()
    let currentAttempt = ""
    let streamStarted = false
    const result = await runAiWithErrorCorrection({
      prompt,
      systemPrompt,
      promptNumber,
      maxAttempts: 4,
      previousAttempts: [],
      onVfsChanged: this.onVfsChanged,
      onStream: (chunk: string) => {
        if (!streamStarted) {
          this.onStreamedChunk("Creating a tscircuit local circuit...")
          streamStarted = true
        }
        currentAttempt += chunk
        this.onStreamedChunk(chunk)
      },
      vfs: this.vfs,
    })
    if (result.code) {
      const filepath = `prompt-${promptNumber}-attempt-final.tsx`
      this.vfs[filepath] = result.code
      this.onVfsChanged()
    }
  }
}

export const createAiCoder = (
  onStreamedChunk: (chunk: string) => void,
  onVfsChanged: () => void,
  anthropicClient?: import("@anthropic-ai/sdk").Anthropic,
): AiCoder => {
  return new AiCoderImpl(onStreamedChunk, onVfsChanged, anthropicClient)
}
