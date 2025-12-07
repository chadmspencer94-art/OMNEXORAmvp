-- CreateTable
CREATE TABLE "job_document_signatures" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "signedById" TEXT,
    "signedName" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "docType" TEXT NOT NULL,
    "docKey" TEXT,
    "signatureImage" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "signedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "job_document_signatures_signedById_fkey" FOREIGN KEY ("signedById") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "job_document_signatures_jobId_docType_docKey_idx" ON "job_document_signatures"("jobId", "docType", "docKey");

