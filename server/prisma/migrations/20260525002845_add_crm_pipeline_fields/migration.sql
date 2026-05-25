-- AlterTable
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "leadStage" TEXT NOT NULL DEFAULT 'NOVO';
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "leadValue" DOUBLE PRECISION NOT NULL DEFAULT 0;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "leadSource" TEXT;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "leadNotes" TEXT;
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "closedAt" TIMESTAMP(3);
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "nextFollowUp" TIMESTAMP(3);
ALTER TABLE "Contact" ADD COLUMN IF NOT EXISTS "tags" TEXT NOT NULL DEFAULT '[]';

-- Set leadSource from existing platformType for all current contacts
UPDATE "Contact" SET "leadSource" = "platformType" WHERE "leadSource" IS NULL;
