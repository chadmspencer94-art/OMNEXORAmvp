import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { kv } from "@vercel/kv";
import { SESSION_COOKIE_NAME } from "@/lib/auth";

// Routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/jobs",
  "/jobs/new",
  "/billing",
];

// Check if a path matches any protected route (including dynamic routes like /jobs/[id])
function isProtectedRoute(pathname: string): boolean {
  return protectedRoutes.some((route) => {
    // Exact match
    if (pathname === route) return true;
    // Match routes like /jobs/123 (but not /jobs-something)
    if (route === "/jobs" && pathname.startsWith("/jobs/")) return true;
    return false;
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if this is a protected route
  if (isProtectedRoute(pathname)) {
    const sessionCookie = request.cookies.get(SESSION_COOKIE_NAME);

    // If no session cookie, redirect to login
    if (!sessionCookie?.value) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Validate that the session exists in KV
    let session = null;
    try {
      session = await kv.get(`session:${sessionCookie.value}`);
    } catch (error) {
      // KV unavailable - redirect to login for security
      // Log error for debugging but don't expose details to user
      console.error("Failed to validate session in middleware:", error);
      
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete(SESSION_COOKIE_NAME);
      return response;
    }
    
    if (!session) {
      // Session expired or invalid - clear the stale cookie and redirect
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("redirect", pathname);
      
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete(SESSION_COOKIE_NAME);
      return response;
    }
  }

  return NextResponse.next();
}

// Configure which routes the middleware runs on
export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - api routes (handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|_next).*)",
  ],
};
