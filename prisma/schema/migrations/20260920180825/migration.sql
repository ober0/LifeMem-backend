-- DropForeignKey
ALTER TABLE "entry_processing_job" DROP CONSTRAINT "entry_processing_job_entry_id_fkey";

-- DropForeignKey
ALTER TABLE "entry_processing_usage" DROP CONSTRAINT "entry_processing_usage_job_id_fkey";

-- AlterTable
ALTER TABLE "entry_processing_job" ALTER COLUMN "entry_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "entry_processing_usage" ALTER COLUMN "job_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "entry_processing_job" ADD CONSTRAINT "entry_processing_job_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "entry"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_processing_usage" ADD CONSTRAINT "entry_processing_usage_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "entry_processing_job"("id") ON DELETE SET NULL ON UPDATE CASCADE;
