/*
  Warnings:

  - The values [Uploaded,Transcribing,VisionProcessing,Enriching,Vectorizing,Ready] on the enum `entry_processing_status` will be removed.
  - You are about to drop the `entry_processing` table.
  - You are about to drop the `entry_processing_stage` table.
*/

-- CreateEnum
CREATE TYPE "entry_processing_type" AS ENUM (
    'Stt',
    'Vision',
    'LocationConnect',
    'LocationAndPeopleDetect',
    'EmbedText',
    'EmbedTitle',
    'EmbedImage'
);

-- DropForeignKey
ALTER TABLE "entry_processing"
DROP CONSTRAINT "entry_processing_entry_id_fkey";

-- DropForeignKey
ALTER TABLE "entry_processing_stage"
DROP CONSTRAINT "entry_processing_stage_processing_id_fkey";

-- DropTable
DROP TABLE "entry_processing";

-- DropTable
DROP TABLE "entry_processing_stage";

-- DropEnum
DROP TYPE "entry_processing_stage_kind";

-- Drop old status enum
DROP TYPE "entry_processing_status";

-- Create new status enum
CREATE TYPE "entry_processing_status" AS ENUM (
    'Pending',
    'Running',
    'Done',
    'Failed'
);

-- CreateTable
CREATE TABLE "entry_processing_job" (
                                        "id" UUID NOT NULL,
                                        "entry_id" UUID NOT NULL,
                                        "type" "entry_processing_type" NOT NULL,
                                        "status" "entry_processing_status" NOT NULL DEFAULT 'Pending',
                                        "error_message" TEXT,
                                        "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                        "updated_at" TIMESTAMP(3) NOT NULL,

                                        CONSTRAINT "entry_processing_job_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entry_processing_usage" (
                                          "id" UUID NOT NULL,
                                          "job_id" UUID NOT NULL,
                                          "model" TEXT,
                                          "input_tokens" INTEGER,
                                          "output_tokens" INTEGER,
                                          "price" DECIMAL(12,6),
                                          "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                                          "updated_at" TIMESTAMP(3) NOT NULL,

                                          CONSTRAINT "entry_processing_usage_pkey" PRIMARY KEY ("id")
);

-- AddColumn
ALTER TABLE "entry"
    ADD COLUMN "entryProcessingJobId" UUID;

-- CreateIndex
CREATE INDEX "entry_processing_job_entry_id_status_idx"
    ON "entry_processing_job"("entry_id", "status");

-- CreateIndex
CREATE UNIQUE INDEX "entry_processing_job_entry_id_type_key"
    ON "entry_processing_job"("entry_id", "type");

-- CreateIndex
CREATE UNIQUE INDEX "entry_processing_usage_job_id_key"
    ON "entry_processing_usage"("job_id");

-- AddForeignKey
ALTER TABLE "entry_processing_job"
    ADD CONSTRAINT "entry_processing_job_entry_id_fkey"
        FOREIGN KEY ("entry_id")
            REFERENCES "entry"("id")
            ON DELETE CASCADE
            ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_processing_usage"
    ADD CONSTRAINT "entry_processing_usage_job_id_fkey"
        FOREIGN KEY ("job_id")
            REFERENCES "entry_processing_job"("id")
            ON DELETE CASCADE
            ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry"
    ADD CONSTRAINT "entry_entryProcessingJobId_fkey"
        FOREIGN KEY ("entryProcessingJobId")
            REFERENCES "entry_processing_job"("id")
            ON DELETE SET NULL
            ON UPDATE CASCADE;