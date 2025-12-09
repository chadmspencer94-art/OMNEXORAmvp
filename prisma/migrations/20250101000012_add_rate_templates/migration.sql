-- CreateTable
CREATE TABLE "rate_templates" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tradeType" TEXT,
    "propertyType" TEXT,
    "hourlyRate" INTEGER,
    "helperHourlyRate" INTEGER,
    "dayRate" INTEGER,
    "calloutFee" INTEGER,
    "minCharge" INTEGER,
    "ratePerM2Interior" INTEGER,
    "ratePerM2Exterior" INTEGER,
    "ratePerLmTrim" INTEGER,
    "materialMarkupPercent" REAL,
    "isDefault" BOOLEAN NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "rate_templates_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "rate_templates_userId_idx" ON "rate_templates"("userId");

-- CreateIndex
CREATE INDEX "rate_templates_userId_isDefault_idx" ON "rate_templates"("userId", "isDefault");

