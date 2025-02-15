import { EventEmitter } from "node:events"
import type { OpenAI } from "openai"
import { runAiWithErrorCorrection } from "./run-ai-with-error-correction"
import { createLocalCircuitPrompt } from "lib/prompt-templates/create-local-circuit-prompt"

export interface AiCoderEvents {
  streamedChunk: string
  vfsChanged: undefined
}

export interface AiCoder {
  vfs: { [filepath: string]: string }
  availableOptions: { name: string; options: string[] }[]
  submitPrompt: (
    prompt: string,
    options?: { selectedMicrocontroller?: string },
  ) => Promise<void>
  on<K extends keyof AiCoderEvents>(
    event: K,
    listener: (payload: AiCoderEvents[K]) => void,
  ): this
}

export class AiCoderImpl extends EventEmitter implements AiCoder {
  vfs: { [filepath: string]: string } = {}
  availableOptions = [{ name: "microController", options: ["pico", "esp32"] }]
  openaiClient: OpenAI | undefined

  constructor({
    openaiClient,
  }: {
    openaiClient?: OpenAI
  }) {
    super()
    this.openaiClient = openaiClient
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
      onStream: (chunk: string) => {
        if (!streamStarted) {
          this.emit("streamedChunk", "Creating a tscircuit local circuit...")
          streamStarted = true
        }
        currentAttempt += chunk
        this.emit("streamedChunk", chunk)
      },
      onVfsChanged: () => {
        this.emit("vfsChanged")
      },
      vfs: this.vfs,
    })
    if (result.code) {
      const filepath = `prompt-${promptNumber}-attempt-final.tsx`
      this.vfs[filepath] = result.code
      this.emit("vfsChanged")
    }
  }
}

export const createAiCoder = (openaiClient?: OpenAI): AiCoder => {
  return new AiCoderImpl({ openaiClient })
}
