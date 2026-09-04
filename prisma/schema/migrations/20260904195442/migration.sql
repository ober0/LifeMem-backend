-- AlterTable
ALTER TABLE "entry_processing_usage" ADD COLUMN     "provider" TEXT;

-- AlterTable
ALTER TABLE "place" ALTER COLUMN "latitude" DROP NOT NULL,
ALTER COLUMN "longitude" DROP NOT NULL;
