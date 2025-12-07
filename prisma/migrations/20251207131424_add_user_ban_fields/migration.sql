-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "role" TEXT NOT NULL DEFAULT 'tradie',
    "verificationStatus" TEXT NOT NULL DEFAULT 'unverified',
    "verifiedAt" TIMESTAMP(3),
    "isBanned" BOOLEAN NOT NULL DEFAULT false,
    "accountStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
    "planTier" TEXT NOT NULL DEFAULT 'FREE',
    "planStatus" TEXT NOT NULL DEFAULT 'TRIAL',
    "trialEndsAt" TIMESTAMP(3),
    "lastLoginAt" TIMESTAMP(3),
    "lastActivityAt" TIMESTAMP(3),
    "totalJobs" INTEGER NOT NULL DEFAULT 0,
    "totalJobPacks" INTEGER NOT NULL DEFAULT 0,
    "businessName" TEXT,
    "tradingName" TEXT,
    "abn" TEXT,
    "tradeTypes" TEXT,
    "serviceArea" TEXT,
    "serviceAreaCity" TEXT,
    "serviceAreaRadiusKm" INTEGER,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
