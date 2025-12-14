import { NextResponse } from "next/server";
import OpenAI from "openai";

// Force server-side runtime only
export const runtime = "nodejs";

/**
 * GET /api/health/openai
 * 
 * Health check endpoint that validates the OpenAI API key is correctly configured
 * and functional. Makes a minimal auth-validation call to OpenAI's models.list endpoint.
 * 
 * Returns:
 * - 200 { ok: true } - API key is valid and working
 * - 500 { ok: false, error: "..." } - API key is missing or invalid
 */
export async function GET() {
  // Check if API key is present
  const apiKey = process.env.OPENAI_API_KEY;
  
  if (!apiKey) {
    return NextResponse.json(
      { ok: false, error: "OPENAI_API_KEY is missing on server runtime" },
      { status: 500 }
    );
  }

  try {
    // Instantiate OpenAI client with the server-side API key
    const client = new OpenAI({ apiKey });
    
    // Make a minimal auth-validation call
    // models.list() is lightweight and validates the API key
    await client.models.list();
    
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err: unknown) {
    // Extract safe error information without exposing the API key
    let errorMessage = "Unknown error occurred while validating OpenAI API key";
    let statusCode = 500;

    if (err instanceof OpenAI.APIError) {
      // Use OpenAI's typed error for better error handling
      statusCode = err.status ?? 500;
      
      // Provide a safe error message based on status code
      switch (err.status) {
        case 401:
          errorMessage = "Invalid API key. Please check your OPENAI_API_KEY configuration.";
          break;
        case 403:
          errorMessage = "API key does not have permission to access this resource.";
          break;
        case 429:
          errorMessage = "Rate limit exceeded. Please try again later.";
          break;
        case 500:
        case 502:
        case 503:
          errorMessage = "OpenAI service is temporarily unavailable. Please try again later.";
          break;
        default:
          errorMessage = `OpenAI API error: ${err.message}`;
      }
    } else if (err instanceof Error) {
      // Handle network errors or other exceptions
      if (err.message.includes("fetch") || err.message.includes("network")) {
        errorMessage = "Network error: Unable to connect to OpenAI API.";
      } else {
        errorMessage = err.message;
      }
    }

    return NextResponse.json(
      { ok: false, error: errorMessage },
      { status: statusCode }
    );
  }
}
