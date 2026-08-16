/*
  Warnings:

  - A unique constraint covering the columns `[code,user_id]` on the table `confirm_code` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "confirm_code_code_user_id_key" ON "confirm_code"("code", "user_id");
