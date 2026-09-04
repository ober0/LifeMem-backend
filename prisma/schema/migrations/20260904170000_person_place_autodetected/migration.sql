-- AlterTable
ALTER TABLE "person" ADD COLUMN "autodetected" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "place" ADD COLUMN "autodetected" BOOLEAN NOT NULL DEFAULT false;
