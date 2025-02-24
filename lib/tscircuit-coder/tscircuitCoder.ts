import { EventEmitter } from "node:events"
import type { OpenAI } from "openai"
import { runAiWithErrorCorrection } from "./run-ai-with-error-correction"
import { createLocalCircuitPrompt } from "lib/prompt-templates/create-local-circuit-prompt"

export interface TscircuitCoderEvents {
  streamedChunk: string
  vfsChanged: undefined
}

export interface TscircuitCoder {
  vfs: { [filepath: string]: string }
  availableOptions: { name: string; options: string[] }[]
  submitPrompt: ({
    prompt,
    options,
    previousCode,
  }: {
    prompt: string
    options?: { selectedMicrocontroller?: string }
    previousCode?: string
  }) => Promise<void>
  on<K extends keyof TscircuitCoderEvents>(
    event: K,
    listener: (payload: TscircuitCoderEvents[K]) => void,
  ): this
}

export class TscircuitCoderImpl extends EventEmitter implements TscircuitCoder {
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

  async submitPrompt({
    prompt,
    previousCode,
    options,
  }: {
    prompt: string
    previousCode?: string
    options?: { selectedMicrocontroller?: string }
  }): Promise<void> {
    this.vfs = {}
    const systemPrompt = await createLocalCircuitPrompt()
    const promptNumber = Date.now()
    let currentAttempt = ""
    let streamStarted = false
    const onStream = (chunk: string) => {
      if (!streamStarted) {
        this.emit("streamedChunk", "Creating a tscircuit local circuit...")
        streamStarted = true
      }
      currentAttempt += chunk
      this.emit("streamedChunk", chunk)
    }
    const onVfsChanged = () => {
      this.emit("vfsChanged")
    }

    const result = await runAiWithErrorCorrection({
      prompt,
      systemPrompt,
      promptNumber,
      previousCode,
      maxAttempts: 4,
      previousAttempts: [],
      onStream,
      onVfsChanged,
      vfs: this.vfs,
    })
    if (result.code) {
      const filepath = `prompt-${promptNumber}-attempt-final.tsx`
      this.vfs[filepath] = result.code
      this.emit("vfsChanged")
    }
  }
}

export const createTscircuitCoder = (openaiClient?: OpenAI): TscircuitCoder => {
  return new TscircuitCoderImpl({ openaiClient })
}
