import OpenAI from "openai";
import { ChatParams } from "../types/index.js";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.AI_API_KEY,
});

export class OpenRouterService {
  static async chat(params: ChatParams) {
    const stream = await client.chat.completions.create({
      model: params.model || "openai/gpt-oss-120b:free",
      messages: [{ role: "user", content: params.prompt }],
      stream: true,
    });
    return stream;
  }
}
