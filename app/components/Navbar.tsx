import { getCurrentUser } from "@/lib/auth";
import NavbarClient from "./NavbarClient";

export default async function Navbar() {
  const user = await getCurrentUser();

  return (
    <NavbarClient
      user={user ? { email: user.email } : null}
    />
  );
}
