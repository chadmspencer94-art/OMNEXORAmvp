/**
 * One-off script to make a user an admin
 * Usage: npx ts-node --project scripts/tsconfig.json scripts/make-admin.ts <email>
 * 
 * NOTE: This is a dev-only script. Do not use in production.
 * For production, use the /admin/users UI or API.
 */

import { getPrisma } from "../lib/prisma";
import { updateUser } from "../lib/auth";
import { kv } from "../lib/kv";

async function makeAdmin(email: string) {
  const normalizedEmail = email.toLowerCase().trim();
  
  console.log(`Making ${normalizedEmail} an admin...`);
  const prisma = getPrisma();
  
  try {
    // First, try to find user in KV store (primary source)
    const kvUser = (await kv.get(`user:email:${normalizedEmail}`)) as any;
    
    if (kvUser && kvUser.id) {
      // Update in KV store (primary)
      await updateUser(kvUser.id, {
        isAdmin: true,
        role: "admin",
        verificationStatus: "verified",
        verifiedAt: new Date().toISOString(),
      });
      console.log(`✓ Updated user in KV store`);
      console.log(`  User ID: ${kvUser.id}`);
      console.log(`  Email: ${kvUser.email}`);
      console.log(`  Role: admin`);
      console.log(`  isAdmin: true`);
    } else {
      console.log(`⚠ User not found in KV store, checking Prisma...`);
    }
    
    // Also update in Prisma if user exists there
    try {
      const prismaUser = await prisma.user.findUnique({
        where: { email: normalizedEmail },
      });
      
      if (prismaUser) {
        await prisma.user.update({
          where: { id: prismaUser.id },
          data: {
            role: "admin",
          },
        });
        console.log(`✓ Updated user in Prisma database`);
        console.log(`  Prisma User ID: ${prismaUser.id}`);
        console.log(`  Role: admin`);
      } else {
        console.log(`⚠ User not found in Prisma database`);
      }
    } catch (prismaError: any) {
      console.warn(`⚠ Could not update Prisma (non-critical):`, prismaError.message);
    }
    
    if (!kvUser || !kvUser.id) {
      console.error(`✗ User with email ${normalizedEmail} not found in KV store`);
      console.error(`  Make sure the user has signed up and created an account first.`);
      process.exit(1);
    }
    
    console.log(`\n✓ Successfully made ${normalizedEmail} an admin`);
    console.log(`  The user can now access /admin pages and has full admin privileges.`);
  } catch (error: any) {
    console.error(`✗ Error: ${error.message}`);
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

const email = process.argv[2];
if (!email) {
  console.error("Usage: npx ts-node --project scripts/tsconfig.json scripts/make-admin.ts <email>");
  console.error("Example: npx ts-node --project scripts/tsconfig.json scripts/make-admin.ts sarahkison5@gmail.com");
  process.exit(1);
}

makeAdmin(email);

