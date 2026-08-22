/*
  Warnings:

  - You are about to drop the column `aiTranscription` on the `entry_image` table. All the data in the column will be lost.
  - You are about to drop the column `entryId` on the `entry_image` table. All the data in the column will be lost.
  - You are about to drop the column `fileId` on the `entry_image` table. All the data in the column will be lost.
  - You are about to drop the column `aiTranscription` on the `entry_voice` table. All the data in the column will be lost.
  - You are about to drop the column `description` on the `entry_voice` table. All the data in the column will be lost.
  - You are about to drop the column `entryId` on the `entry_voice` table. All the data in the column will be lost.
  - You are about to drop the column `fileId` on the `entry_voice` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[entry_id]` on the table `entry_voice` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `entry_id` to the `entry_image` table without a default value. This is not possible if the table is not empty.
  - Added the required column `file_id` to the `entry_image` table without a default value. This is not possible if the table is not empty.
  - Added the required column `entry_id` to the `entry_voice` table without a default value. This is not possible if the table is not empty.
  - Added the required column `file_id` to the `entry_voice` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "entry_image" DROP CONSTRAINT "entry_image_entryId_fkey";

-- DropForeignKey
ALTER TABLE "entry_image" DROP CONSTRAINT "entry_image_fileId_fkey";

-- DropForeignKey
ALTER TABLE "entry_voice" DROP CONSTRAINT "entry_voice_entryId_fkey";

-- DropForeignKey
ALTER TABLE "entry_voice" DROP CONSTRAINT "entry_voice_fileId_fkey";

-- DropIndex
DROP INDEX "entry_vector_embedding_hnsw_idx";

-- DropIndex
DROP INDEX "entry_voice_entryId_key";

-- AlterTable
ALTER TABLE "entry_image" DROP COLUMN "aiTranscription",
DROP COLUMN "entryId",
DROP COLUMN "fileId",
ADD COLUMN     "ai_transcription" TEXT,
ADD COLUMN     "entry_id" UUID NOT NULL,
ADD COLUMN     "file_id" UUID NOT NULL;

-- AlterTable
ALTER TABLE "entry_voice" DROP COLUMN "aiTranscription",
DROP COLUMN "description",
DROP COLUMN "entryId",
DROP COLUMN "fileId",
ADD COLUMN     "entry_id" UUID NOT NULL,
ADD COLUMN     "file_id" UUID NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "entry_voice_entry_id_key" ON "entry_voice"("entry_id");

-- AddForeignKey
ALTER TABLE "entry_image" ADD CONSTRAINT "entry_image_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_image" ADD CONSTRAINT "entry_image_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "file"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_voice" ADD CONSTRAINT "entry_voice_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_voice" ADD CONSTRAINT "entry_voice_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "file"("id") ON DELETE CASCADE ON UPDATE CASCADE;
