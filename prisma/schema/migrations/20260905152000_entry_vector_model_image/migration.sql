-- DropIndex
DROP INDEX "entry_vector_entry_id_kind_key";

-- AlterTable
ALTER TABLE "entry_vector" DROP COLUMN "model",
ADD COLUMN     "ai_model_id" UUID NOT NULL,
ADD COLUMN     "image_id" UUID;

-- CreateIndex
CREATE INDEX "entry_vector_ai_model_id_idx" ON "entry_vector"("ai_model_id");

-- CreateIndex
CREATE UNIQUE INDEX "entry_vector_image_id_key" ON "entry_vector"("image_id");

-- AddForeignKey
ALTER TABLE "entry_vector" ADD CONSTRAINT "entry_vector_ai_model_id_fkey" FOREIGN KEY ("ai_model_id") REFERENCES "ai_model"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "entry_vector" ADD CONSTRAINT "entry_vector_image_id_fkey" FOREIGN KEY ("image_id") REFERENCES "entry_image"("id") ON DELETE CASCADE ON UPDATE CASCADE;
