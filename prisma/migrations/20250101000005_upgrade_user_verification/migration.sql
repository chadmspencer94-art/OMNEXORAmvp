-- CreateTable
CREATE TABLE "user_verifications" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'unverified',
    "updatedAt" DATETIME NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "businessName" TEXT,
    "abn" TEXT,
    "primaryTrade" TEXT,
    "workTypes" TEXT,
    "licenceNumber" TEXT,
    "licenceType" TEXT,
    "licenceExpiry" DATETIME,
    "insuranceProvider" TEXT,
    "insurancePolicyNumber" TEXT,
    "insuranceExpiry" DATETIME,
    "insuranceCoverageNotes" TEXT,
    "abnEvidenceUrl" TEXT,
    "licenceEvidenceUrl" TEXT,
    "insuranceEvidenceUrl" TEXT,
    "adminNotes" TEXT,
    "rejectionReason" TEXT,
    "reviewedByAdminId" TEXT,
    CONSTRAINT "user_verifications_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "user_verifications_userId_key" ON "user_verifications"("userId");
CREATE INDEX "user_verifications_status_idx" ON "user_verifications"("status");
CREATE INDEX "user_verifications_createdAt_idx" ON "user_verifications"("createdAt");

