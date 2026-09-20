/*
  Warnings:

  - The values [EmbedImage] on the enum `entry_processing_type` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "entry_processing_type_new" AS ENUM ('Stt', 'Vision', 'LocationConnect', 'LocationAndPeopleDetect', 'EmbedText', 'EmbedTitle', 'EmbedMedia', 'SlicePreview');
ALTER TABLE "entry_processing_job" ALTER COLUMN "type" TYPE "entry_processing_type_new" USING ("type"::text::"entry_processing_type_new");
ALTER TYPE "entry_processing_type" RENAME TO "entry_processing_type_old";
ALTER TYPE "entry_processing_type_new" RENAME TO "entry_processing_type";
DROP TYPE "public"."entry_processing_type_old";
COMMIT;
