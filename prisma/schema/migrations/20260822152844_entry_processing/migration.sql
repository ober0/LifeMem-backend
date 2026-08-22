-- CreateEnum
CREATE TYPE "entry_processing_status" AS ENUM ('Uploaded', 'Transcribing', 'VisionProcessing', 'Enriching', 'Vectorizing', 'Ready', 'Failed');

-- CreateEnum
CREATE TYPE "entry_processing_stage_kind" AS ENUM ('Upload', 'SttTranscription', 'VisionCaption', 'TextEnrichment', 'EmbeddingText', 'EmbeddingTitle', 'EmbeddingImage');

-- AlterTable
ALTER TABLE "entry" ADD COLUMN     "isReady" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "entry_processing" (
    "id" UUID NOT NULL,
    "entry_id" UUID NOT NULL,
    "status" "entry_processing_status" NOT NULL DEFAULT 'Uploaded',
    "error_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entry_processing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "entry_processing_stage" (
    "id" UUID NOT NULL,
    "processing_id" UUID NOT NULL,
    "stage" "entry_processing_stage_kind" NOT NULL,
    "model" TEXT,
    "input_tokens" INTEGER,
    "output_tokens" INTEGER,
    "price" DECIMAL(12,6),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entry_processing_stage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "entry_processing_entry_id_key" ON "entry_processing"("entry_id");

-- CreateIndex
CREATE INDEX "entry_processing_stage_processing_id_created_at_idx" ON "entry_processing_stage"("processing_id", "created_at");

-- AddForeignKey
ALTER TABLE "entry_processing" ADD CONSTRAINT "entry_processing_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_processing_stage" ADD CONSTRAINT "entry_processing_stage_processing_id_fkey" FOREIGN KEY ("processing_id") REFERENCES "entry_processing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
