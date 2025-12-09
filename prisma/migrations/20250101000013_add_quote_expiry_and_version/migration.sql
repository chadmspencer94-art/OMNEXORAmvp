-- CreateTable
CREATE TABLE "job_quote_versions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "sentAt" DATETIME NOT NULL,
    "quoteExpiryAt" DATETIME,
    "labourHoursEstimate" REAL,
    "labourSubtotal" REAL,
    "materialsTotal" REAL,
    "subtotal" REAL,
    "gstAmount" REAL,
    "totalInclGst" REAL,
    "summary" TEXT,
    "scopeOfWork" TEXT,
    "inclusions" TEXT,
    "exclusions" TEXT,
    "materialsText" TEXT,
    "clientNotes" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateIndex
CREATE INDEX "job_quote_versions_jobId_idx" ON "job_quote_versions"("jobId");

-- CreateIndex
CREATE INDEX "job_quote_versions_jobId_version_idx" ON "job_quote_versions"("jobId", "version");

