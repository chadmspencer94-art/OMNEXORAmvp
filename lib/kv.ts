import { kv } from "@vercel/kv";

// Re-export the kv instance for use throughout the application
// Assumes KV_REST_API_URL and KV_REST_API_TOKEN are set in environment variables
export { kv };

