/*
  Warnings:

  - You are about to drop the column `error_message` on the `entry_processing_job` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "entry_processing_job" DROP COLUMN "error_message",
ADD COLUMN     "error_messages" TEXT[];

-- CreateIndex
CREATE INDEX "entry_processing_job_entry_id_type_status_idx" ON "entry_processing_job"("entry_id", "type", "status");
