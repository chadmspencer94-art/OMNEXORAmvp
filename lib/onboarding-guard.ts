import { redirect } from "next/navigation";
import { getCurrentUser } from "./auth";
import { getPrisma } from "./prisma";
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
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      console.log("[onboarding] requireCompleteProfile: no user found, redirecting to login");
      redirect("/login?reason=unauthorised");
      return null as never;
    }

    console.log("[onboarding] requireCompleteProfile: checking profile for user", user.id);

    // Clients don't need onboarding
    const prisma = getPrisma();
    if (user.role === "client") {
      // Return a minimal user object for clients
      try {
        const prismaUser = await prisma.user.findUnique({
          where: { email: user.email },
        });
        if (!prismaUser) {
          console.log("[onboarding] requireCompleteProfile: client user not found in Prisma, redirecting to login");
          redirect("/login?reason=unauthorised");
          return null as never;
        }
        return prismaUser;
      } catch (error) {
        // If database query fails, redirect to login for safety
        console.error("[onboarding] Failed to fetch client user from Prisma:", error);
        redirect("/login?reason=unauthorised");
        return null as never;
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
      console.error("[onboarding] Failed to fetch user from Prisma:", error);
      redirect("/login?reason=unauthorised");
      return null as never;
    }

    if (!prismaUser) {
      console.log("[onboarding] requireCompleteProfile: user not found in Prisma, redirecting to login");
      redirect("/login?reason=unauthorised");
      return null as never;
    }

    // Skip onboarding check for these paths
    const skipPaths = ["/onboarding", "/logout", "/settings", "/api"];
    const shouldSkip = currentPath && skipPaths.some(path => currentPath.startsWith(path));
    
    if (shouldSkip) {
      return prismaUser;
    }

    // Check if user needs onboarding
    let needsOnboardingCheck = false;
    try {
      needsOnboardingCheck = needsOnboarding(prismaUser);
    } catch (onboardingError) {
      // If check fails, assume user needs onboarding (safe default)
      console.error("[onboarding] Error checking onboarding status:", onboardingError);
      needsOnboardingCheck = true;
    }

    if (needsOnboardingCheck) {
      console.log("[onboarding] requireCompleteProfile: user needs onboarding, redirecting");
      redirect("/onboarding");
      return null as never;
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
        console.error("[onboarding] Failed to update profileCompletedAt:", error);
        return prismaUser;
      }
    }

    return prismaUser;
  } catch (error) {
    // Catch any unexpected errors and redirect to login
    console.error("[onboarding] requireCompleteProfile: unexpected error", error);
    redirect("/login?reason=unauthorised");
    return null as never;
  }
}

