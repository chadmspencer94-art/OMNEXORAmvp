-- AlterTable
ALTER TABLE "users" ADD COLUMN "dayRate" INTEGER;
ALTER TABLE "users" ADD COLUMN "gstRegistered" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "defaultMarginPct" DECIMAL;
ALTER TABLE "users" ADD COLUMN "defaultDepositPct" DECIMAL;
ALTER TABLE "users" ADD COLUMN "defaultPaymentTerms" TEXT;
ALTER TABLE "users" ADD COLUMN "tradeRatesJson" TEXT;

