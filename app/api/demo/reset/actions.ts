"use server";

import { getCurrentUser, isAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const bcrypt = require("bcryptjs");

const DEMO_PASSWORD = "demo123";

const DEMO_USERS = [
  {
    email: "chad.omnexora@outlook.com",
    role: "admin",
    planTier: "FOUNDER",
    planStatus: "ACTIVE",
    verificationStatus: "verified",
    accountStatus: "ACTIVE",
  },
  {
    email: "chadmspencer94@gmail.com",
    role: "admin",
    planTier: "FOUNDER",
    planStatus: "ACTIVE",
    verificationStatus: "verified",
    accountStatus: "ACTIVE",
  },
];

/**
 * Reset demo data by re-running demo:seed logic (idempotent)
 * Only accessible to superadmins when DEMO_MODE=true
 */
export async function resetDemoData(): Promise<{ success: boolean; message?: string; error?: string }> {
  // Only allow in demo mode
  if (process.env.DEMO_MODE !== "true") {
    return {
      success: false,
      error: "Demo mode is not enabled",
    };
  }

  try {
    // Check authentication and authorization
    const user = await getCurrentUser();
    if (!user) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    // Only superadmins can reset demo data
    if (!isAdmin(user)) {
      return {
        success: false,
        error: "Not authorized. Only superadmins can reset demo data.",
      };
    }

    // Re-run demo seed logic (idempotent)
    for (const userData of DEMO_USERS) {
      const normalizedEmail = userData.email.toLowerCase().trim();
      
      // Hash password
      const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      // Use upsert for idempotent operation
      await prisma.user.upsert({
        where: { email: normalizedEmail },
        update: {
          role: userData.role,
          planTier: userData.planTier,
          planStatus: userData.planStatus,
          verificationStatus: userData.verificationStatus,
          accountStatus: userData.accountStatus,
          isBanned: false,
          verifiedAt: existingUser?.verifiedAt || new Date(),
          passwordHash, // Update password
        },
        create: {
          email: normalizedEmail,
          passwordHash,
          role: userData.role,
          planTier: userData.planTier,
          planStatus: userData.planStatus,
          verificationStatus: userData.verificationStatus,
          accountStatus: userData.accountStatus,
          isBanned: false,
          verifiedAt: new Date(),
        },
      });
    }

    // Revalidate relevant pages
    revalidatePath("/dashboard");
    revalidatePath("/admin/dashboard");
    revalidatePath("/");

    return {
      success: true,
      message: "Demo data reset successfully",
    };
  } catch (error: any) {
    console.error("[demo/reset] Error resetting demo data:", error);
    return {
      success: false,
      error: error.message || "Failed to reset demo data",
    };
  }
}

