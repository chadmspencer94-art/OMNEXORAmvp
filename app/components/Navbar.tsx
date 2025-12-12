import { getCurrentUser } from "@/lib/auth";
import { unstable_noStore as noStore } from "next/cache";
import NavbarClient from "./NavbarClient";

// Force dynamic rendering to prevent static caching of auth state
// This ensures the navbar always shows current user info
export const dynamic = "force-dynamic";

export default async function Navbar() {
  // Prevent static caching - always fetch fresh user data
  noStore();
  
  let user = null;
  
  try {
    user = await getCurrentUser();
  } catch (error: any) {
    // Handle DYNAMIC_SERVER_USAGE errors silently (expected during build/static generation)
    // Swallow these errors - do NOT log them
    if (
      error &&
      typeof error === "object" &&
      "digest" in error &&
      (error as any).digest === "DYNAMIC_SERVER_USAGE"
    ) {
      user = null;
    } else if (error?.message?.includes("Dynamic server usage") || error?.message?.includes("couldn't be rendered statically")) {
      user = null;
    } else {
      // For other errors, log but don't crash - show logged-out state instead
      console.error("Failed to get current user:", error);
    }
  }

  const isDemoMode = process.env.DEMO_MODE === "true";

  return (
    <NavbarClient
      user={user ? { 
        email: user.email,
        role: user.role || "tradie",
        verificationStatus: user.verificationStatus || "unverified",
        verifiedAt: user.verifiedAt ?? null,
        isAdmin: user.isAdmin ?? false,
      } : null}
      isDemoMode={isDemoMode}
    />
  );
}
