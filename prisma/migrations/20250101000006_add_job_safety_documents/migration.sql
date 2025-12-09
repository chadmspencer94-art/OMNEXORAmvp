-- CreateTable
CREATE TABLE "job_safety_documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT "draft",
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE INDEX "job_safety_documents_jobId_idx" ON "job_safety_documents"("jobId");
CREATE INDEX "job_safety_documents_jobId_type_idx" ON "job_safety_documents"("jobId", "type");

