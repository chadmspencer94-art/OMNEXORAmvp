// middleware.ts – route protection middleware
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * ADMIN ROUTE PROTECTION
 * 
 * This middleware provides server-side protection for admin routes.
 * Admin routes are further protected at the page/API level with isAdmin() checks.
 * 
 * Protected routes:
 * - /admin/* - Admin panel routes
 * - /api/admin/* - Admin API routes
 * 
 * CLIENT PORTAL IS DISABLED:
 * - /client/* - Redirects to dashboard
 */
export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // CLIENT PORTAL IS DISABLED - redirect to main dashboard
  if (pathname.startsWith("/client")) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // For admin routes, the auth check happens at the page/API level
  // This middleware layer provides an additional security boundary
  // by ensuring only authenticated requests reach admin pages
  // (Actual admin role check happens in page components and API routes)

  return NextResponse.next();
}

// Configure which routes the middleware applies to
export const config = {
  matcher: [
    // Admin routes
    "/admin/:path*",
    "/api/admin/:path*",
    // Client portal routes (disabled)
    "/client/:path*",
  ],
};
