// Create a KV instance that handles missing environment variables gracefully
// In development, allow the app to start without KV (will fail when KV features are used)
const kvRestApiUrl = process.env.KV_REST_API_URL;
const kvRestApiToken = process.env.KV_REST_API_TOKEN;

// Helper function to create a proxy that returns null/empty results instead of throwing
// This allows the app to work in a degraded mode without KV
function createKvFallbackProxy(): any {
  return new Proxy({}, {
    get(_target, prop) {
      // Common KV methods that are used in the codebase
      const kvMethods = ["get", "set", "del", "keys", "exists", "mget", "mset", "hget", "hset", "hgetall", "sadd", "smembers", "srem"];
      if (kvMethods.includes(prop as string)) {
        return async (...args: any[]) => {
          // Return null/empty results instead of throwing errors
          // This allows the app to continue functioning without KV
          console.warn(
            `[kv] KV store is not configured. Operation '${String(prop)}' returned null. ` +
            `Please set KV_REST_API_URL and KV_REST_API_TOKEN in your .env.local file. ` +
            `For local development, use Upstash Redis (free tier at https://upstash.com/)`
          );
          
          // Return appropriate defaults based on method
          if (prop === "get" || prop === "hget") {
            return null;
          }
          if (prop === "keys" || prop === "smembers" || prop === "hgetall") {
            return [];
          }
          if (prop === "exists") {
            return 0;
          }
          // For set/delete operations, return success (no-op)
          return "OK";
        };
      }
      // For any other property access, return another proxy
      return new Proxy({}, {
        get() {
          return async () => {
            console.warn("[kv] KV store is not configured. Please set KV_REST_API_URL and KV_REST_API_TOKEN in your .env.local file.");
            return null;
          };
        },
      });
    },
  });
}

let kvInstance: any;

if (!kvRestApiUrl || !kvRestApiToken) {
  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Missing KV_REST_API_URL or KV_REST_API_TOKEN environment variables. Please set them in your environment."
    );
  }
  // Use fallback proxy for development (returns null instead of throwing)
  kvInstance = createKvFallbackProxy();
} else {
  // Try to import @vercel/kv - it may throw if env vars are invalid
  try {
    // Use require with error handling
    const vercelKv = require("@vercel/kv");
    kvInstance = vercelKv.kv;
  } catch (error) {
    // If import/initialization fails, use the fallback proxy
    console.warn("[kv] Failed to initialize Vercel KV, using fallback proxy:", error instanceof Error ? error.message : String(error));
    kvInstance = createKvFallbackProxy();
  }
}

export { kvInstance as kv };

