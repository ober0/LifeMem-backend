-- AlterTable
ALTER TABLE "entry_processing_job" ALTER COLUMN "error_messages" SET DEFAULT ARRAY[]::TEXT[];
