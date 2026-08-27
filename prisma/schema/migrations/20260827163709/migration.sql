/*
  Warnings:

  - You are about to drop the column `latitude` on the `entry` table. All the data in the column will be lost.
  - You are about to drop the column `location_label` on the `entry` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `entry` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "entry" DROP COLUMN "latitude",
DROP COLUMN "location_label",
DROP COLUMN "longitude";

-- AlterTable
ALTER TABLE "place" ADD COLUMN     "data" JSONB,
ADD COLUMN     "full_name" TEXT;
