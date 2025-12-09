import { redirect } from "next/navigation";
import { getCurrentUser } from "./auth";
import { prisma } from "./prisma";
import { needsOnboarding, isBusinessProfileComplete } from "./onboarding";

/**
 * Server-side guard that redirects users to onboarding if their profile is incomplete.
 * Call this at the top of protected pages for tradie/business users.
 * 
 * @param currentPath - The current pathname (to avoid redirect loops)
 * @returns The Prisma user object (never null, redirects if needed)
 */
export async function requireCompleteProfile(currentPath?: string): Promise<{
  id: string;
  email: string;
  role: string;
  profileCompletedAt: Date | null;
  [key: string]: any;
}> {
  const user = await getCurrentUser();
  
  if (!user) {
    redirect("/login");
  }

  // Clients don't need onboarding
  if (user.role === "client") {
    // Return a minimal user object for clients
    try {
      const prismaUser = await prisma.user.findUnique({
        where: { email: user.email },
      });
      if (!prismaUser) {
        redirect("/login");
      }
      return prismaUser;
    } catch (error) {
      // If database query fails, redirect to login for safety
      console.error("Failed to fetch client user from Prisma:", error);
      redirect("/login");
    }
  }

  // Fetch full user from Prisma to check onboarding status
  let prismaUser;
  try {
    prismaUser = await prisma.user.findUnique({
      where: { email: user.email },
    });
  } catch (error) {
    // If database query fails, redirect to login for safety
    console.error("Failed to fetch user from Prisma:", error);
    redirect("/login");
  }

  if (!prismaUser) {
    redirect("/login");
  }

  // Skip onboarding check for these paths
  const skipPaths = ["/onboarding", "/logout", "/settings", "/api"];
  const shouldSkip = currentPath && skipPaths.some(path => currentPath.startsWith(path));
  
  if (shouldSkip) {
    return prismaUser;
  }

  // Check if user needs onboarding
  if (needsOnboarding(prismaUser)) {
    redirect("/onboarding");
  }

  // Auto-complete for legacy users who already have complete profiles
  if (!prismaUser.profileCompletedAt && isBusinessProfileComplete(prismaUser)) {
    // Silently mark as complete (don't redirect, just update)
    try {
      await prisma.user.update({
        where: { id: prismaUser.id },
        data: { profileCompletedAt: new Date() },
      });
      // Return updated user
      return {
        ...prismaUser,
        profileCompletedAt: new Date(),
      };
    } catch (error) {
      // If update fails, just return the existing user without the update
      console.error("Failed to update profileCompletedAt:", error);
      return prismaUser;
    }
  }

  return prismaUser;
}

