ALTER TABLE "entry" ADD COLUMN "deleted_at" TIMESTAMP(3);

CREATE INDEX "entry_user_id_deleted_at_idx" ON "entry"("user_id", "deleted_at");
