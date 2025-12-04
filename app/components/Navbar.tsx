import { getCurrentUser } from "@/lib/auth";
import NavbarClient from "./NavbarClient";

export default async function Navbar() {
  let user = null;
  
  try {
    user = await getCurrentUser();
  } catch (error) {
    // Log the error but don't crash - show logged-out state instead
    console.error("Failed to get current user:", error);
  }

  return (
    <NavbarClient
      user={user ? { email: user.email } : null}
    />
  );
}
