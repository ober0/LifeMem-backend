/*
  Warnings:

  - Added the required column `type` to the `entry_media` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "entry_media" ADD COLUMN     "first_frame_id" UUID,
ADD COLUMN     "type" "FileType" NOT NULL;

-- AddForeignKey
ALTER TABLE "entry_media" ADD CONSTRAINT "entry_media_first_frame_id_fkey" FOREIGN KEY ("first_frame_id") REFERENCES "file"("id") ON DELETE SET NULL ON UPDATE CASCADE;
