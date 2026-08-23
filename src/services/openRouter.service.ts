import OpenAI from "openai";
import { ChatParams } from "../types/index.js";

const client = new OpenAI({
  baseURL: process.env.BASE_URL,
  apiKey: process.env.AI_API_KEY,
});

export class OpenRouterService {
  static async chat(params: ChatParams) {
    try {
      const stream = await client.chat.completions.create({
        model: params.model || (process.env.FREE_DEFAULT_MODEL as string),
        messages: [{ role: "user", content: params.prompt }],
        stream: false,
      });
      return stream.choices[0]?.message?.content;
    } catch (error) {
      console.error("Error fetching AI: ", error);
      throw new Error("Failed to fetch AI response");
    }
  }

  // static async analysisWithAI(params: ChatParams) {
  //   try {
  //     const stream = await client.chat.completions.create({
  //       model: params.model || (process.env.FREE_DEFAULT_MODEL as string),
  //       messages: [{ role: "user", content: params.prompt }],
  //       stream: false,
  //     });
  //     return stream.choices[0]?.message?.content;
  //   } catch (error) {
  //     console.error("Error fetching AI analysis: ", error);
  //     throw new Error("Failed to fetch AI analysis");
  //   }
  // }
}
