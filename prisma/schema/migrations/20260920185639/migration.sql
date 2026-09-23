/*
  Warnings:

  - A unique constraint covering the columns `[asc_id]` on the table `asc_usage` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "asc_usage" ADD COLUMN     "asc_id" UUID;

-- CreateIndex
CREATE UNIQUE INDEX "asc_usage_asc_id_key" ON "asc_usage"("asc_id");

-- AddForeignKey
ALTER TABLE "asc_usage" ADD CONSTRAINT "asc_usage_asc_id_fkey" FOREIGN KEY ("asc_id") REFERENCES "asc"("id") ON DELETE SET NULL ON UPDATE CASCADE;
