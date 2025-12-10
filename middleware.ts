// middleware.ts – minimal pass-through middleware
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export function middleware(_req: NextRequest) {
  // For now, just continue the request pipeline.
  // All auth + onboarding logic is handled in the app routes themselves.
  return NextResponse.next();
}

// If you later want to limit middleware to specific routes, you can use:
//
// export const config = {
//   matcher: ["/dashboard/:path*", "/clients/:path*", "/jobs/:path*"],
// };
