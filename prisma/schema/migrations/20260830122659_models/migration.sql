/*
  Warnings:

  - You are about to drop the column `model` on the `entry_processing_usage` table. All the data in the column will be lost.
  - Added the required column `aiModelId` to the `entry_processing_usage` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "model_type" AS ENUM ('ImageToText', 'TextToText', 'Embedding');

-- AlterTable
ALTER TABLE "entry_processing_usage" DROP COLUMN "model",
ADD COLUMN     "aiModelId" UUID NOT NULL;

-- CreateTable
CREATE TABLE "ai_model" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "model_type" NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_model_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "entry_processing_usage" ADD CONSTRAINT "entry_processing_usage_aiModelId_fkey" FOREIGN KEY ("aiModelId") REFERENCES "ai_model"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
