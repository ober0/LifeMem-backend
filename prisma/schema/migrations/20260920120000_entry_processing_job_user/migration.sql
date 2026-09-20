-- AlterTable
ALTER TABLE "entry_processing_job" ADD COLUMN "user_id" UUID;

-- CreateIndex
CREATE INDEX "entry_processing_job_user_id_idx" ON "entry_processing_job"("user_id");

-- AddForeignKey
ALTER TABLE "entry_processing_job" ADD CONSTRAINT "entry_processing_job_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
