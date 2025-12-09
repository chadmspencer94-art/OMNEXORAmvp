-- CreateTable
CREATE TABLE "material_items" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT,
    "supplier" TEXT,
    "unitLabel" TEXT NOT NULL,
    "unitCost" DECIMAL,
    "notes" TEXT,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "material_items_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "job_materials" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "jobId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "materialItemId" TEXT,
    "name" TEXT NOT NULL,
    "unitLabel" TEXT NOT NULL,
    "unitCost" DECIMAL,
    "quantity" REAL NOT NULL,
    "markupPercent" REAL,
    "notes" TEXT,
    "lineTotal" DECIMAL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "job_materials_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "job_materials_materialItemId_fkey" FOREIGN KEY ("materialItemId") REFERENCES "material_items" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "material_items_userId_idx" ON "material_items"("userId");

-- CreateIndex
CREATE INDEX "material_items_userId_isArchived_idx" ON "material_items"("userId", "isArchived");

-- CreateIndex
CREATE INDEX "job_materials_jobId_idx" ON "job_materials"("jobId");

-- CreateIndex
CREATE INDEX "job_materials_userId_idx" ON "job_materials"("userId");

-- CreateIndex
CREATE INDEX "job_materials_materialItemId_idx" ON "job_materials"("materialItemId");

