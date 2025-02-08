import Anthropic from "@anthropic-ai/sdk"

let apiKey = ""
if (
  typeof process !== "undefined" &&
  process.env &&
  process.env.ANTHROPIC_API_KEY
) {
  import("dotenv").then((dotenv) => dotenv.config())
  apiKey = process.env.ANTHROPIC_API_KEY
}

export const anthropic = new Anthropic({
  apiKey,
  dangerouslyAllowBrowser: true,
})
