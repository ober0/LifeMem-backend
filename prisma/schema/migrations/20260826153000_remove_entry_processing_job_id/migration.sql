-- DropForeignKey
ALTER TABLE "entry" DROP CONSTRAINT IF EXISTS "entry_entryProcessingJobId_fkey";

-- DropColumn
ALTER TABLE "entry" DROP COLUMN IF EXISTS "entryProcessingJobId";
