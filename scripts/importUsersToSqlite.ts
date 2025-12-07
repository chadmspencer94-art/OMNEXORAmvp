/**
 * Import Users to SQLite Database
 * 
 * This script reads users from scripts/users-export.json and imports them
 * into the SQLite database using Prisma Client (configured via DATABASE_URL).
 * Uses upsert by id, so it's safe to run multiple times.
 */

// Load environment variables from .env.local
import * as fs from "fs";
import * as path from "path";
import { config } from "dotenv";

// Load .env.local file
const envPath = path.join(process.cwd(), ".env.local");
if (fs.existsSync(envPath)) {
  config({ path: envPath });
} else {
  // Also try .env as fallback
  config();
}

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface ExportedUser {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  role: string;
  verificationStatus: string;
  verifiedAt: string | null;
  planTier: string;
  planStatus: string;
  trialEndsAt: string | null;
  lastLoginAt: string | null;
  lastActivityAt: string | null;
  totalJobs: number;
  totalJobPacks: number;
  businessName: string | null;
  tradingName: string | null;
  abn: string | null;
  tradeTypes: string | null;
  serviceArea: string | null;
  serviceAreaCity: string | null;
  serviceAreaRadiusKm: number | null;
}

function parseDate(dateString: string | null): Date | null {
  if (!dateString) return null;
  try {
    return new Date(dateString);
  } catch {
    return null;
  }
}

async function importUsers() {
  try {
    const exportPath = path.join(process.cwd(), "scripts", "users-export.json");

    if (!fs.existsSync(exportPath)) {
      console.error(`Error: Export file not found at ${exportPath}`);
      console.error("Please run 'npm run export:users' first to create the export file.");
      process.exit(1);
    }

    console.log(`Reading users from ${exportPath}...`);
    const fileContent = fs.readFileSync(exportPath, "utf-8");
    const users: ExportedUser[] = JSON.parse(fileContent);

    if (users.length === 0) {
      console.warn("Warning: No users found in export file.");
      return;
    }

    console.log(`Found ${users.length} users to import.`);
    console.log("Importing users (upserting by id)...\n");

    let imported = 0;
    let updated = 0;
    let errors = 0;

    for (const user of users) {
      try {
        // Convert date strings to Date objects, handling nulls
        const createdAt = parseDate(user.createdAt) || new Date();
        const verifiedAt = parseDate(user.verifiedAt);
        const trialEndsAt = parseDate(user.trialEndsAt);
        const lastLoginAt = parseDate(user.lastLoginAt);
        const lastActivityAt = parseDate(user.lastActivityAt);

        // Use upsert to create or update by id
        const result = await prisma.user.upsert({
          where: { id: user.id },
          update: {
            email: user.email,
            passwordHash: user.passwordHash,
            createdAt,
            role: user.role || "tradie",
            verificationStatus: user.verificationStatus || "unverified",
            verifiedAt,
            planTier: user.planTier || "FREE",
            planStatus: user.planStatus || "TRIAL",
            trialEndsAt,
            lastLoginAt,
            lastActivityAt,
            totalJobs: user.totalJobs ?? 0,
            totalJobPacks: user.totalJobPacks ?? 0,
            businessName: user.businessName,
            tradingName: user.tradingName,
            abn: user.abn,
            tradeTypes: user.tradeTypes, // Store as string (comma-separated or JSON)
            serviceArea: user.serviceArea,
            serviceAreaCity: user.serviceAreaCity,
            serviceAreaRadiusKm: user.serviceAreaRadiusKm,
          },
          create: {
            id: user.id,
            email: user.email,
            passwordHash: user.passwordHash,
            createdAt,
            role: user.role || "tradie",
            verificationStatus: user.verificationStatus || "unverified",
            verifiedAt,
            planTier: user.planTier || "FREE",
            planStatus: user.planStatus || "TRIAL",
            trialEndsAt,
            lastLoginAt,
            lastActivityAt,
            totalJobs: user.totalJobs ?? 0,
            totalJobPacks: user.totalJobPacks ?? 0,
            businessName: user.businessName,
            tradingName: user.tradingName,
            abn: user.abn,
            tradeTypes: user.tradeTypes,
            serviceArea: user.serviceArea,
            serviceAreaCity: user.serviceAreaCity,
            serviceAreaRadiusKm: user.serviceAreaRadiusKm,
          },
        });

        // Check if it was created or updated by querying if createdAt matches
        // (Simpler approach: assume first run = create, subsequent = update)
        // For better tracking, we could check existence first, but upsert handles both
        // Let's just track total processed
        if (result) {
          // Check if user existed before (rough check by comparing createdAt in DB vs export)
          // Actually, simpler: just count all as processed
          imported++;
        }
      } catch (error) {
        errors++;
        console.error(`❌ Error importing user ${user.email} (${user.id}):`, error);
      }
    }

    console.log("\n✅ Import completed!");
    console.log(`   Processed: ${imported} users`);
    if (errors > 0) {
      console.log(`   Errors: ${errors} users failed to import`);
    }
    console.log(
      "\nNote: Upsert was used, so existing users were updated and new users were created."
    );
  } catch (error) {
    console.error("Fatal error during import:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log("\nDatabase connection closed.");
  }
}

// Run the import
importUsers().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

