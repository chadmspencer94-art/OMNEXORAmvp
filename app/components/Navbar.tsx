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
  } catch (error) {
    // Log the error but don't crash - show logged-out state instead
    console.error("Failed to get current user:", error);
  }

  return (
    <NavbarClient
      user={user ? { 
        email: user.email,
        role: user.role || "tradie",
        verificationStatus: user.verificationStatus || "unverified",
        verifiedAt: user.verifiedAt ?? null,
        isAdmin: user.isAdmin ?? false,
      } : null}
    />
  );
}
