

-- CreateEnum
CREATE TYPE "UploadStatus" AS ENUM ('CREATED', 'UPLOADING', 'UPLOADED', 'PROCESSING', 'READY', 'FAILED', 'EXPIRED');

-- DropIndex
DROP INDEX "file_key_idx";

-- DropIndex
DROP INDEX "person_name_trgm_idx";

-- DropIndex
DROP INDEX "place_full_name_trgm_idx";

-- DropIndex
DROP INDEX "place_name_trgm_idx";

-- AlterTable
ALTER TABLE "file" ADD COLUMN     "userId" UUID NOT NULL;

-- CreateTable
CREATE TABLE "upload_file_process" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "filename" TEXT,
    "declared_size" BIGINT,
    "actual_size" BIGINT,
    "declared_mime_type" TEXT,
    "actual_mime_type" TEXT,
    "type" "FileType" NOT NULL,
    "status" "UploadStatus" NOT NULL,
    "partSizeBytes" INTEGER NOT NULL,
    "totalParts" INTEGER NOT NULL,
    "is_multipart" BOOLEAN NOT NULL DEFAULT false,
    "multipart_upload_id" TEXT,
    "fileId" UUID,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "upload_file_process_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "upload_file_process_fileId_key" ON "upload_file_process"("fileId");

-- CreateIndex
CREATE INDEX "upload_file_process_userId_status_idx" ON "upload_file_process"("userId", "status");

-- CreateIndex
CREATE INDEX "file_userId_idx" ON "file"("userId");

-- AddForeignKey
ALTER TABLE "file" ADD CONSTRAINT "file_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upload_file_process" ADD CONSTRAINT "upload_file_process_userId_fkey" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "upload_file_process" ADD CONSTRAINT "upload_file_process_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "file"("id") ON DELETE SET NULL ON UPDATE CASCADE;
