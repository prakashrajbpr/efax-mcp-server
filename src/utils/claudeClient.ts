// src/utils/claudeClient.ts
import axios from "axios";

// Optional: load .env file manually if not already done in main app
import dotenv from "dotenv";
dotenv.config();

export const ClaudeAPI = {
  async sendPrompt(prompt: string): Promise<string> {
    const anthropicApiKey = process.env.ANTHROPIC_API_KEY!;
    if (!anthropicApiKey) {
      throw new Error("ANTHROPIC_API_KEY not set in environment variables.");
    }

    const response = await axios.post(
      "https://api.anthropic.com/v1/messages",
      {
        model: "claude-3-haiku-20240307",
        max_tokens: 1024,
        temperature: 0.2,
        messages: [{ role: "user", content: prompt }],
      },
      {
        headers: {
          "x-api-key": anthropicApiKey,
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
      }
    );

    return response.data?.content?.[0]?.text || "{}";
  },
};
