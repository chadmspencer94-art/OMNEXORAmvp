-- CreateTable
CREATE TABLE "client_notes" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "clientKey" TEXT NOT NULL,
    "note" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "client_notes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "client_notes_userId_clientKey_idx" ON "client_notes"("userId", "clientKey");

-- CreateUniqueIndex
CREATE UNIQUE INDEX "client_notes_userId_clientKey_key" ON "client_notes"("userId", "clientKey");

