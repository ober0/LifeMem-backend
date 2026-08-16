/*
  Warnings:

  - You are about to drop the column `body` on the `logs` table. All the data in the column will be lost.
  - Changed the type of `method` on the `logs` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "http_method" AS ENUM ('Post', 'Patch', 'Put', 'Delete', 'Get');

-- DropIndex
DROP INDEX "logs_created_at_idx";

-- DropIndex
DROP INDEX "logs_user_id_created_at_idx";

-- DropIndex
DROP INDEX "logs_user_id_idx";

-- AlterTable
ALTER TABLE "logs" DROP COLUMN "body",
DROP COLUMN "method",
ADD COLUMN     "method" "http_method" NOT NULL;

-- CreateIndex
CREATE INDEX "logs_url_method_idx" ON "logs"("url", "method");
