/**
 * Migration script to update primary admin email from chadmspencer94@gmail.com to chad.omnexora@outlook.com
 * 
 * This script is idempotent - safe to run multiple times.
 * 
 * Usage: npx ts-node --project scripts/tsconfig.json scripts/migrate-primary-admin.ts
 * 
 * What it does:
 * 1. Ensures chad.omnexora@outlook.com exists as a superadmin
 * 2. Keeps chadmspencer94@gmail.com as an admin (but not primary admin)
 * 3. Updates both users to have proper admin privileges
 */

import { kv } from "../lib/kv";
import { updateUser } from "../lib/auth";
import { prisma } from "../lib/prisma";

const OLD_PRIMARY_ADMIN = "chadmspencer94@gmail.com";
const NEW_PRIMARY_ADMIN = "chad.omnexora@outlook.com";

async function migratePrimaryAdmin() {
  console.log("Starting primary admin migration...");
  console.log(`Old primary admin: ${OLD_PRIMARY_ADMIN}`);
  console.log(`New primary admin: ${NEW_PRIMARY_ADMIN}`);
  console.log("");

  // ========================================================================
  // Update NEW primary admin (chad.omnexora@outlook.com)
  // ========================================================================
  console.log(`[1] Ensuring ${NEW_PRIMARY_ADMIN} is a superadmin...`);
  
  try {
    const newAdminKV = await kv.get<any>(`user:email:${NEW_PRIMARY_ADMIN.toLowerCase()}`);
    
    if (newAdminKV && newAdminKV.id) {
      // Update existing user to be superadmin
      await updateUser(newAdminKV.id, {
        role: "admin",
        isAdmin: true,
        verificationStatus: "verified",
        verifiedAt: newAdminKV.verifiedAt || new Date().toISOString(),
        planTier: "FOUNDER",
        planStatus: "ACTIVE",
      });
      console.log(`  ✓ Updated ${NEW_PRIMARY_ADMIN} in KV store (ID: ${newAdminKV.id})`);
    } else {
      console.log(`  ⚠ ${NEW_PRIMARY_ADMIN} not found in KV store - user needs to register first`);
    }
    
    // Update in Prisma if exists
    try {
      const newAdminPrisma = await prisma.user.findUnique({
        where: { email: NEW_PRIMARY_ADMIN.toLowerCase() },
      });
      
      if (newAdminPrisma) {
        await prisma.user.update({
          where: { id: newAdminPrisma.id },
          data: {
            role: "admin",
            planTier: "FOUNDER",
            planStatus: "ACTIVE",
          },
        });
        console.log(`  ✓ Updated ${NEW_PRIMARY_ADMIN} in Prisma database`);
      }
    } catch (prismaError: any) {
      console.warn(`  ⚠ Could not update Prisma (non-critical):`, prismaError.message);
    }
  } catch (error: any) {
    console.error(`  ✗ Error updating ${NEW_PRIMARY_ADMIN}:`, error.message);
  }

  console.log("");

  // ========================================================================
  // Keep OLD primary admin as regular admin (chadmspencer94@gmail.com)
  // ========================================================================
  console.log(`[2] Ensuring ${OLD_PRIMARY_ADMIN} remains as admin...`);
  
  try {
    const oldAdminKV = await kv.get<any>(`user:email:${OLD_PRIMARY_ADMIN.toLowerCase()}`);
    
    if (oldAdminKV && oldAdminKV.id) {
      // Keep as admin but not primary admin
      await updateUser(oldAdminKV.id, {
        role: "admin",
        isAdmin: true,
        verificationStatus: "verified",
        verifiedAt: oldAdminKV.verifiedAt || new Date().toISOString(),
        planTier: "FOUNDER",
        planStatus: "ACTIVE",
      });
      console.log(`  ✓ Updated ${OLD_PRIMARY_ADMIN} in KV store (ID: ${oldAdminKV.id})`);
      console.log(`  ℹ ${OLD_PRIMARY_ADMIN} is now a regular admin (not primary admin)`);
    } else {
      console.log(`  ⚠ ${OLD_PRIMARY_ADMIN} not found in KV store`);
    }
    
    // Update in Prisma if exists
    try {
      const oldAdminPrisma = await prisma.user.findUnique({
        where: { email: OLD_PRIMARY_ADMIN.toLowerCase() },
      });
      
      if (oldAdminPrisma) {
        await prisma.user.update({
          where: { id: oldAdminPrisma.id },
          data: {
            role: "admin",
            planTier: "FOUNDER",
            planStatus: "ACTIVE",
          },
        });
        console.log(`  ✓ Updated ${OLD_PRIMARY_ADMIN} in Prisma database`);
      }
    } catch (prismaError: any) {
      console.warn(`  ⚠ Could not update Prisma (non-critical):`, prismaError.message);
    }
  } catch (error: any) {
    console.error(`  ✗ Error updating ${OLD_PRIMARY_ADMIN}:`, error.message);
  }

  console.log("");
  console.log("Migration complete!");
  console.log("");
  console.log("Summary:");
  console.log(`  - Primary admin: ${NEW_PRIMARY_ADMIN}`);
  console.log(`  - Regular admin: ${OLD_PRIMARY_ADMIN}`);
  console.log("");
  console.log("Note: Both emails are in ADMIN_EMAILS and FOUNDER_EMAILS arrays in lib/auth.ts");
}

// Run migration
migratePrimaryAdmin()
  .then(() => {
    console.log("Migration script finished successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Migration script failed:", error);
    process.exit(1);
  });

