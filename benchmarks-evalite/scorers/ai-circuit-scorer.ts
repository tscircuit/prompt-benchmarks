import { createScorer } from "evalite"
import { anthropic } from "lib/code-runner/anthropic"

const getAiScore = async (prompt: string, code: string): Promise<number> => {
  const scoringPrompt = `You are an electronics expert. Please evaluate this circuit code and give it a score from 0 to 100 based on:       
 - Correctness of implementation
 - Proper use of components
 - Circuit complexity
 - Code quality
 Return only a number between 0 and 1. 
 So that 0 meaning it's very bad, 1 meaning it's a perfect circuit.

 Original prompt: ${prompt}

 Circuit code:
 ${code}`

  try {
    const completion = await anthropic.messages.create({
      model: "claude-3-5-haiku-20241022",
      max_tokens: 1024,
      messages: [
        {
          role: "user",
          content: scoringPrompt,
        },
      ],
    })

    const scoreText = (completion as any).content[0]?.text || "0"
    const result = Math.min(1, Math.max(0, parseFloat(scoreText) || 0))

    return result
  } catch (error) {
    return 0
  }
}

export const AiCircuitScorer = createScorer<
  {
    prompt: string
    promptFileName: string
  },
  | {
      code: string
      codeBlock: string
    }
  | string
>({
  name: "ai_circuit_scorer",
  description: "Evaluates circuit code for presence of key components",
  scorer: async ({ input, output }) => {
    if (!output) {
      return { score: 0, metadata: { promptFileName: input.promptFileName } }
    }
    if (typeof output === "string")
      return { score: 0, metadata: { promptFileName: input.promptFileName } }

    let score = 0
    try {
      score = await getAiScore(input.prompt, output.code)
    } catch (error) {
      console.error(error)
    }

    return {
      score,
      metadata: {
        promptFileName: input.promptFileName,
      },
    }
  },
})
