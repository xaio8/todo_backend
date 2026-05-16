import OpenAI from "openai";
import { ChatParams } from "../types/index.js";

const client = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.AI_API_KEY,
});

export class OpenRouterService {
  static async chat(params: ChatParams) {
    try {
      const stream = await client.chat.completions.create({
        model: params.model || "openai/gpt-oss-120b:free",
        messages: [{ role: "user", content: params.prompt }],
        stream: false,
      });
      return stream.choices[0]?.message?.content;
    } catch (error) {
      console.error("Error fetching AI: ", error);
      throw new Error("Failed to fetch AI response");
    }
  }
}
