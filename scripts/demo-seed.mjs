/**
 * Demo seed script - Creates/updates demo users for local development
 * 
 * This script is idempotent - safe to run multiple times.
 * Uses BOTH Prisma (for email verification) AND Vercel KV (for authentication).
 * 
 * Usage: npm run demo:seed
 */

import { PrismaClient } from "@prisma/client";
import { kv } from "@vercel/kv";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

// Default password for demo users (change in production!)
const DEMO_PASSWORD = "demo123";

// Demo users to seed
const DEMO_USERS = [
  {
    email: "chad.omnexora@outlook.com",
    role: "admin",
    planTier: "FOUNDER",
    planStatus: "ACTIVE",
    verificationStatus: "verified",
    accountStatus: "ACTIVE",
    description: "Superadmin (Primary Admin)",
  },
  {
    email: "chadmspencer94@gmail.com",
    role: "admin",
    planTier: "FOUNDER",
    planStatus: "ACTIVE",
    verificationStatus: "verified",
    accountStatus: "ACTIVE",
    description: "Demo user (Full trade/client access)",
  },
];

async function seedDemoUsers() {
  console.log("🌱 Starting demo seed...");
  console.log("");

  try {
    for (const userData of DEMO_USERS) {
      const normalizedEmail = userData.email.toLowerCase().trim();
      
      console.log(`📧 Processing: ${normalizedEmail}`);
      console.log(`   Description: ${userData.description}`);

      // Hash password (same for all demo users)
      const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12);

      // Check if user already exists (for logging purposes)
      const existingUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      // Use upsert for idempotent operation in Prisma
      const user = await prisma.user.upsert({
        where: { email: normalizedEmail },
        update: {
          role: userData.role,
          planTier: userData.planTier,
          planStatus: userData.planStatus,
          verificationStatus: userData.verificationStatus,
          accountStatus: userData.accountStatus,
          isBanned: false,
          verifiedAt: existingUser?.verifiedAt || new Date(),
          passwordHash, // Update password in case it changed
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
      
      console.log(`   ✓ Prisma: ${existingUser ? "Updated" : "Created"} user (ID: ${user.id})`);

      // ALSO update Vercel KV for authentication
      // The auth system uses KV storage, not Prisma
      const kvUserKey = `user:email:${normalizedEmail}`;
      const existingKvUser = await kv.get(kvUserKey);
      
      const kvUserData = {
        id: user.id,
        email: normalizedEmail,
        passwordHash,
        createdAt: existingKvUser?.createdAt || new Date().toISOString(),
        role: userData.role,
        verificationStatus: userData.verificationStatus,
        verifiedAt: existingKvUser?.verifiedAt || new Date().toISOString(),
        isAdmin: userData.role === "admin",
        planTier: userData.planTier,
        planStatus: userData.planStatus,
        accountStatus: userData.accountStatus,
        isBanned: false,
        // Activity tracking
        lastLoginAt: existingKvUser?.lastLoginAt || null,
        lastActivityAt: existingKvUser?.lastActivityAt || null,
        totalJobs: existingKvUser?.totalJobs || 0,
        totalJobPacks: existingKvUser?.totalJobPacks || 0,
      };

      // Update both user:email and user:id keys
      await kv.set(kvUserKey, kvUserData);
      await kv.set(`user:id:${user.id}`, kvUserData);
      
      // Add to users:all index if not already present
      const allUserIds = await kv.lrange("users:all", 0, -1) || [];
      if (!allUserIds.includes(user.id)) {
        await kv.lpush("users:all", user.id);
      }
      
      console.log(`   ✓ KV: ${existingKvUser ? "Updated" : "Created"} user in Vercel KV`);

      console.log(`   Role: ${userData.role}`);
      console.log(`   Plan: ${userData.planTier} (${userData.planStatus})`);
      console.log(`   Status: ${userData.verificationStatus}, ${userData.accountStatus}`);
      console.log("");
    }

    console.log("✅ Demo seed completed successfully!");
    console.log("");
    console.log("📋 Seeded users:");
    console.log("");
    DEMO_USERS.forEach((user) => {
      console.log(`   • ${user.email}`);
      console.log(`     ${user.description}`);
      console.log(`     Password: ${DEMO_PASSWORD}`);
      console.log("");
    });
    console.log("🔐 Note: Change passwords in production!");
  } catch (error) {
    console.error("❌ Error seeding demo users:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run seed
seedDemoUsers()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed script failed:", error);
    process.exit(1);
  });

