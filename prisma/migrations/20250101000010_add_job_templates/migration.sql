-- CreateTable
CREATE TABLE "job_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tradeType" TEXT NOT NULL,
    "propertyType" TEXT NOT NULL,
    "addressLine1" TEXT,
    "suburb" TEXT,
    "state" TEXT,
    "postcode" TEXT,
    "notes" TEXT,
    "defaultClientNotes" TEXT,
    "defaultMaterialsNotes" TEXT,
    "includeSwms" BOOLEAN NOT NULL DEFAULT 0,
    "includeVariationDoc" BOOLEAN NOT NULL DEFAULT 0,
    "includeEotDoc" BOOLEAN NOT NULL DEFAULT 0,
    "includeProgressClaim" BOOLEAN NOT NULL DEFAULT 0,
    "includeHandoverChecklist" BOOLEAN NOT NULL DEFAULT 0,
    "includeMaintenanceGuide" BOOLEAN NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "job_templates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "job_templates_userId_idx" ON "job_templates"("userId");

