/*
  Warnings:

  - You are about to drop the column `ip` on the `logs` table. All the data in the column will be lost.
  - You are about to drop the column `is_success` on the `logs` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `logs` table. All the data in the column will be lost.
  - You are about to drop the column `url` on the `logs` table. All the data in the column will be lost.
  - Added the required column `code` to the `logs` table without a default value. This is not possible if the table is not empty.
  - Added the required column `path` to the `logs` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "logs_url_method_idx";

-- AlterTable
ALTER TABLE "logs" DROP COLUMN "ip",
DROP COLUMN "is_success",
DROP COLUMN "status",
DROP COLUMN "url",
ADD COLUMN     "code" INTEGER NOT NULL,
ADD COLUMN     "path" TEXT NOT NULL;

-- CreateIndex
CREATE INDEX "logs_path_method_code_idx" ON "logs"("path", "method", "code");
