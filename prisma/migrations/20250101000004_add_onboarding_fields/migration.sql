-- AlterTable
ALTER TABLE "users" ADD COLUMN "profileCompletedAt" DATETIME;
ALTER TABLE "users" ADD COLUMN "hasSeenOnboarding" BOOLEAN NOT NULL DEFAULT 0;

