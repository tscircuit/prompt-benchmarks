import { OpenAI } from "openai"
import dotenv from "dotenv"

let apiKey = ""

if (typeof process !== "undefined") {
  dotenv.config()
  apiKey = process.env.OPENAI_API_KEY || ""
}

export const openai = new OpenAI({ apiKey })
