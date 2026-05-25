-- AlterTable: Add CRM conversation fields for ChatVolt parity
ALTER TABLE "InboxConversation" ADD COLUMN IF NOT EXISTS "priority" TEXT NOT NULL DEFAULT 'MEDIA';
ALTER TABLE "InboxConversation" ADD COLUMN IF NOT EXISTS "tags" TEXT NOT NULL DEFAULT '[]';
ALTER TABLE "InboxConversation" ADD COLUMN IF NOT EXISTS "isRead" BOOLEAN NOT NULL DEFAULT false;
