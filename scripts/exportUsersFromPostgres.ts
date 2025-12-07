/**
 * Export Users from Postgres Database
 * 
 * This script reads all users from the Postgres database (POSTGRES_DATABASE_URL)
 * and exports them to scripts/users-export.json in a format ready for import.
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

import { Client } from "pg";

const POSTGRES_DATABASE_URL = process.env.POSTGRES_DATABASE_URL;

if (!POSTGRES_DATABASE_URL) {
  console.error("Error: POSTGRES_DATABASE_URL environment variable is not set.");
  console.error("Please set it in your .env.local file.");
  process.exit(1);
}

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
  tradeTypes: string | null; // Will be stored as comma-separated or JSON string
  serviceArea: string | null;
  serviceAreaCity: string | null;
  serviceAreaRadiusKm: number | null;
}

async function exportUsers() {
  // Parse connection string and add SSL if needed for managed Postgres services
  const clientConfig: any = {
    connectionString: POSTGRES_DATABASE_URL,
    // Add SSL support for managed Postgres (Vercel, Supabase, etc.)
    ssl: process.env.POSTGRES_SSL !== "false" ? {
      rejectUnauthorized: false, // Allow self-signed certificates
    } : false,
    // Increase connection timeout
    connectionTimeoutMillis: 30000, // 30 seconds
  };

  const client = new Client(clientConfig);

  try {
    console.log("Connecting to Postgres database...");
    console.log("Note: If connection times out, check:");
    console.log("  1. Your network/VPN connection");
    console.log("  2. Database IP whitelisting");
    console.log("  3. Firewall rules");
    console.log("  4. Connection string in .env.local\n");
    
    await client.connect();
    console.log("Connected successfully.");

    // Query all users from the users table
    const query = `
      SELECT 
        id,
        email,
        "passwordHash",
        "createdAt",
        role,
        "verificationStatus",
        "verifiedAt",
        "planTier",
        "planStatus",
        "trialEndsAt",
        "lastLoginAt",
        "lastActivityAt",
        "totalJobs",
        "totalJobPacks",
        "businessName",
        "tradingName",
        abn,
        "tradeTypes",
        "serviceArea",
        "serviceAreaCity",
        "serviceAreaRadiusKm"
      FROM users
      ORDER BY "createdAt" ASC
    `;

    console.log("Fetching users from Postgres...");
    const result = await client.query(query);

    const users: ExportedUser[] = result.rows.map((row) => {
      // Convert Date objects to ISO strings for JSON serialization
      // Handle tradeTypes - if it's an array, convert to comma-separated string
      let tradeTypes: string | null = null;
      if (row.tradeTypes) {
        if (Array.isArray(row.tradeTypes)) {
          tradeTypes = row.tradeTypes.join(",");
        } else if (typeof row.tradeTypes === "string") {
          tradeTypes = row.tradeTypes;
        }
      }

      return {
        id: row.id,
        email: row.email,
        passwordHash: row.passwordHash,
        createdAt: row.createdAt ? new Date(row.createdAt).toISOString() : new Date().toISOString(),
        role: row.role || "tradie",
        verificationStatus: row.verificationStatus || "unverified",
        verifiedAt: row.verifiedAt ? new Date(row.verifiedAt).toISOString() : null,
        planTier: row.planTier || "FREE",
        planStatus: row.planStatus || "TRIAL",
        trialEndsAt: row.trialEndsAt ? new Date(row.trialEndsAt).toISOString() : null,
        lastLoginAt: row.lastLoginAt ? new Date(row.lastLoginAt).toISOString() : null,
        lastActivityAt: row.lastActivityAt ? new Date(row.lastActivityAt).toISOString() : null,
        totalJobs: row.totalJobs ?? 0,
        totalJobPacks: row.totalJobPacks ?? 0,
        businessName: row.businessName || null,
        tradingName: row.tradingName || null,
        abn: row.abn || null,
        tradeTypes,
        serviceArea: row.serviceArea || null,
        serviceAreaCity: row.serviceAreaCity || null,
        serviceAreaRadiusKm: row.serviceAreaRadiusKm ?? null,
      };
    });

    // Ensure scripts directory exists
    const scriptsDir = path.join(process.cwd(), "scripts");
    if (!fs.existsSync(scriptsDir)) {
      fs.mkdirSync(scriptsDir, { recursive: true });
    }

    // Write to JSON file
    const outputPath = path.join(scriptsDir, "users-export.json");
    fs.writeFileSync(outputPath, JSON.stringify(users, null, 2), "utf-8");

    console.log(`\n✅ Export completed successfully!`);
    console.log(`   Exported ${users.length} users to ${outputPath}`);
  } catch (error) {
    console.error("Error exporting users:", error);
    process.exit(1);
  } finally {
    await client.end();
    console.log("Database connection closed.");
  }
}

// Run the export
exportUsers().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

