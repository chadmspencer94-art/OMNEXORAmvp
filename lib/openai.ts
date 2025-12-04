import OpenAI from "openai";

// Validate API key at startup
if (!process.env.OPENAI_API_KEY) {
  throw new Error(
    "Missing OPENAI_API_KEY environment variable. Please add it to your .env.local file."
  );
}

// Create and export a single OpenAI client instance
export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

