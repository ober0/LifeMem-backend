/*
  Warnings:

  - Added the required column `latitude` to the `place` table without a default value. This is not possible if the table is not empty.
  - Added the required column `longitude` to the `place` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "place" ADD COLUMN     "latitude" DECIMAL(10,7) NOT NULL,
ADD COLUMN     "longitude" DECIMAL(10,7) NOT NULL;
