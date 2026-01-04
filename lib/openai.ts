import OpenAI from "openai";

// Create and export a single OpenAI client instance
// In development, allow the app to start without API key (will fail when AI features are used)
const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey && process.env.NODE_ENV === "production") {
  throw new Error(
    "Missing OPENAI_API_KEY environment variable. Please add it to your .env.local file."
  );
}

// Create a proxy that throws a helpful error if OpenAI is used without an API key
const createOpenAIProxy = (): OpenAI => {
  if (!apiKey) {
    // Return a proxy that throws helpful errors when methods are accessed
    return new Proxy({} as OpenAI, {
      get(_target, prop) {
        if (prop === "chat") {
          return new Proxy({}, {
            get(_target2, prop2) {
              if (prop2 === "completions") {
                return {
                  create: async () => {
                    throw new Error(
                      "OpenAI API key is not configured. Please set OPENAI_API_KEY in your .env.local file to use AI features."
                    );
                  },
                };
              }
              throw new Error(
                "OpenAI API key is not configured. Please set OPENAI_API_KEY in your .env.local file."
              );
            },
          });
        }
        throw new Error(
          "OpenAI API key is not configured. Please set OPENAI_API_KEY in your .env.local file."
        );
      },
    });
  }
  return new OpenAI({ apiKey });
};

export const openai = createOpenAIProxy();

// Helper to check if OpenAI is available
export function isOpenAIAvailable(): boolean {
  return !!apiKey;
}

