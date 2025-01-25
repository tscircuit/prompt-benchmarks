import { createScorer } from "evalite"

export const CircuitScorer = createScorer<
  {
    prompt: string
    promptFileName: string
    questions: {
      text: string
      answer: boolean
    }[]
  },
  | {
      results: {
        result: boolean
        expected: boolean
      }[]
      code: string
    }
  | string
>({
  name: "circuit_scorer",
  description: "Evaluates circuit code for presence of key components",
  scorer: ({ input, output }) => {
    if (!output) {
      return { score: 0, metadata: { promptFileName: input.promptFileName } }
    }
    if (typeof output === "string")
      return { score: 0, metadata: { promptFileName: input.promptFileName } }

    const score = output.results.reduce((acc, { result, expected }) => {
      return acc + (result === expected ? 0.25 : 0)
    }, 0)

    return {
      score,
      metadata: {
        ...(output.results.length > 0
          ? input.questions.map((question, index) => ({
              question: question.text,
              expected: question.answer,
              result: output.results[index].result,
            }))
          : { result: "Circuit failed" }),
        promptFileName: input.promptFileName,
      },
    }
  },
})
