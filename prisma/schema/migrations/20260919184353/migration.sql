/*
  Warnings:

  - The values [Image] on the enum `entry_vector_kind` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `image_id` on the `entry_vector` table. All the data in the column will be lost.
  - You are about to drop the `entry_image` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[media_id]` on the table `entry_vector` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "entry_vector_kind_new" AS ENUM ('Text', 'Title', 'Media');
ALTER TABLE "public"."entry_vector" ALTER COLUMN "kind" DROP DEFAULT;
ALTER TABLE "entry_vector" ALTER COLUMN "kind" TYPE "entry_vector_kind_new" USING ("kind"::text::"entry_vector_kind_new");
ALTER TYPE "entry_vector_kind" RENAME TO "entry_vector_kind_old";
ALTER TYPE "entry_vector_kind_new" RENAME TO "entry_vector_kind";
DROP TYPE "public"."entry_vector_kind_old";
ALTER TABLE "entry_vector" ALTER COLUMN "kind" SET DEFAULT 'Text';
COMMIT;

-- DropForeignKey
ALTER TABLE "entry_image" DROP CONSTRAINT "entry_image_entry_id_fkey";

-- DropForeignKey
ALTER TABLE "entry_image" DROP CONSTRAINT "entry_image_file_id_fkey";

-- DropForeignKey
ALTER TABLE "entry_vector" DROP CONSTRAINT "entry_vector_image_id_fkey";

-- DropIndex
DROP INDEX "entry_vector_image_id_key";

-- AlterTable
ALTER TABLE "entry_vector" DROP COLUMN "image_id",
ADD COLUMN     "media_id" UUID;

-- DropTable
DROP TABLE "entry_image";

-- CreateTable
CREATE TABLE "entry_media" (
    "id" UUID NOT NULL,
    "entry_id" UUID NOT NULL,
    "file_id" UUID NOT NULL,
    "ai_transcription" TEXT,
    "ai_metadata" JSONB,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "entry_media_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "entry_vector_media_id_key" ON "entry_vector"("media_id");

-- AddForeignKey
ALTER TABLE "entry_media" ADD CONSTRAINT "entry_media_entry_id_fkey" FOREIGN KEY ("entry_id") REFERENCES "entry"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_media" ADD CONSTRAINT "entry_media_file_id_fkey" FOREIGN KEY ("file_id") REFERENCES "file"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_vector" ADD CONSTRAINT "entry_vector_media_id_fkey" FOREIGN KEY ("media_id") REFERENCES "entry_media"("id") ON DELETE CASCADE ON UPDATE CASCADE;
